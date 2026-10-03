/* ================================================================
   POST /api/lead — captures a system request from the website form.

   Runs as a Cloudflare Pages Function (deployed automatically from
   /functions). No secrets live in this file; everything comes from the
   Pages project environment:

     LEADS_DB         D1 database binding — durable storage of every lead
     RESEND_API_KEY   (secret, optional) e-mail notification via Resend
     LEAD_NOTIFY_TO   (optional) inbox that receives the notification
     LEAD_NOTIFY_FROM (optional) sender, default "URUKQI Leads <onboarding@resend.dev>"
     ALLOWED_ORIGINS  (optional) comma-separated extra origins allowed to post

   A lead counts as captured only if it was stored in D1 or accepted by the
   e-mail provider. Otherwise the endpoint says so and the page falls back to
   WhatsApp — it never tells the visitor "received" without a real capture.
   ================================================================ */

const MAX_BODY = 16 * 1024;           // bytes
const MIN_FILL_MS = 1500;             // faster than this is stored but flagged as a suspected bot
const RATE_WINDOW_MIN = 10;           // per-IP limit window
const RATE_MAX = 5;                   // submissions per window per IP

const DEFAULT_ORIGINS = ["https://urukqi.pages.dev"];
const PREVIEW_ORIGIN = /^https:\/\/[a-z0-9-]+\.urukqi\.pages\.dev$/;
const LOCAL_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

const USERS = ["", "1", "2-5", "6-20", "21-50", "50+"];
const BRANCHES = ["", "1", "2-3", "4-10", "10+"];
const EXISTING = ["", "none", "excel", "system", "unsure"];
const NEEDS = ["Web", "Windows / Desktop", "تطبيق Mobile", "ربط WhatsApp", "أتمتة"];

const SCHEMA = `CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  name TEXT NOT NULL,
  company TEXT,
  phone TEXT NOT NULL,
  sector TEXT NOT NULL,
  sector_label TEXT,
  solution_id TEXT,
  solution TEXT,
  problem_id TEXT,
  problem_label TEXT,
  problem TEXT NOT NULL,
  current_process TEXT,
  users TEXT,
  branches TEXT,
  existing_system TEXT,
  needs TEXT,
  details TEXT,
  source_page TEXT,
  ip_hash TEXT,
  spam_flag TEXT,
  email_status TEXT
)`;

const json = (status, body, extra) => new Response(JSON.stringify(body), {
  status,
  headers: Object.assign({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  }, extra || {})
});

const toLatinDigits = s => String(s).replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 0x0660))
  .replace(/[۰-۹]/g, d => String(d.charCodeAt(0) - 0x06F0));

// Trimmed single-line or multi-line text, length-checked; control characters removed.
function text(value, max, { required = false, min = 0, multiline = false } = {}) {
  if (value == null) value = "";
  if (typeof value !== "string") return { error: true };
  let v = value.replace(multiline ? /[\u0000-\u0009\u000B-\u001F\u007F]/g : /[\u0000-\u001F\u007F]/g, " ").trim();
  if (multiline) v = v.replace(/\n{3,}/g, "\n\n");
  if (required && v.length < Math.max(min, 1)) return { error: true };
  if (v.length > max) return { error: true };
  return { value: v };
}

function originAllowed(origin, env) {
  if (!origin) return false;
  const extra = String(env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean);
  return DEFAULT_ORIGINS.includes(origin) || extra.includes(origin) || PREVIEW_ORIGIN.test(origin) || LOCAL_ORIGIN.test(origin);
}

async function sha256(input) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}

function validate(raw) {
  const errors = {};
  const out = {};
  const field = (key, max, opts) => {
    const r = text(raw[key], max, opts);
    if (r.error) errors[key] = true; else out[key] = r.value;
  };
  field("name", 80, { required: true, min: 2 });
  field("company", 100);
  field("sector", 40, { required: true });
  field("sectorLabel", 80);
  field("solutionId", 40);
  field("solution", 140);
  field("problemId", 40);
  field("problemLabel", 120);
  field("problem", 600, { required: true, min: 3, multiline: true });
  field("current", 400, { multiline: true });
  field("details", 600, { multiline: true });
  field("sourcePage", 200);

  const phone = toLatinDigits(typeof raw.phone === "string" ? raw.phone : "").replace(/[^\d+]/g, "");
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) errors.phone = true; else out.phone = phone;

  if (out.sector !== undefined && !/^[a-z0-9-]{2,40}$/.test(out.sector)) errors.sector = true;
  ["solutionId", "problemId"].forEach(k => { if (out[k] && !/^[a-z0-9-]{2,40}$/.test(out[k])) errors[k] = true; });
  if (out.sourcePage && !out.sourcePage.startsWith("/")) errors.sourcePage = true;

  out.users = USERS.includes(raw.users || "") ? raw.users || "" : (errors.users = true, "");
  out.branches = BRANCHES.includes(raw.branches || "") ? raw.branches || "" : (errors.branches = true, "");
  out.existing = EXISTING.includes(raw.existing || "") ? raw.existing || "" : (errors.existing = true, "");
  const needs = Array.isArray(raw.needs) ? raw.needs : [];
  if (needs.length > NEEDS.length || needs.some(n => !NEEDS.includes(n))) errors.needs = true;
  out.needs = [...new Set(needs.filter(n => NEEDS.includes(n)))];

  return { lead: out, errors: Object.keys(errors) };
}

function emailText(lead, id, createdAt) {
  const line = (label, value) => (value ? `${label}: ${value}\n` : "");
  return "طلب نظام جديد من موقع URUKQI\n\n" +
    line("رقم الطلب", id.slice(0, 8).toUpperCase()) +
    line("الوقت (UTC)", createdAt) +
    line("الاسم", lead.name) +
    line("المشروع / الشركة", lead.company) +
    line("الهاتف / WhatsApp", lead.phone) +
    line("نوع النشاط", lead.sectorLabel || lead.sector) +
    line("الحل المطلوب", lead.solution) +
    line("المشكلة المختارة", lead.problemLabel) +
    line("المشكلة", lead.problem) +
    line("الطريقة الحالية", lead.current) +
    line("عدد المستخدمين", lead.users) +
    line("عدد الفروع", lead.branches) +
    line("النظام الحالي", lead.existing) +
    line("يحتاج", lead.needs.join("، ")) +
    line("تفاصيل إضافية", lead.details) +
    line("صفحة المصدر", lead.sourcePage);
}

async function sendEmail(env, lead, id, createdAt, spamFlag) {
  if (!env.RESEND_API_KEY || !env.LEAD_NOTIFY_TO) return "not_configured";
  try {
    const res = await fetch(env.RESEND_API_URL || "https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: env.LEAD_NOTIFY_FROM || "URUKQI Leads <onboarding@resend.dev>",
        to: String(env.LEAD_NOTIFY_TO).split(",").map(s => s.trim()).filter(Boolean),
        subject: `${spamFlag ? "[للمراجعة: إرسال سريع جدًا] " : ""}طلب نظام جديد — ${lead.name}${lead.sectorLabel ? " — " + lead.sectorLabel : ""}`,
        text: emailText(lead, id, createdAt)
      })
    });
    return res.ok ? "sent" : `failed_${res.status}`;
  } catch (err) {
    return "failed_network";
  }
}

export async function onRequestPost({ request, env }) {
  // Same-origin only: browsers always send Origin on POST fetches.
  if (!originAllowed(request.headers.get("Origin"), env)) return json(403, { ok: false, error: "origin" });
  if (!/^application\/json\b/i.test(request.headers.get("Content-Type") || "")) return json(415, { ok: false, error: "content_type" });
  if (Number(request.headers.get("Content-Length") || 0) > MAX_BODY) return json(413, { ok: false, error: "too_large" });

  const body = await request.text();
  if (body.length > MAX_BODY) return json(413, { ok: false, error: "too_large" });
  let raw;
  try { raw = JSON.parse(body); } catch (err) { return json(400, { ok: false, error: "invalid_json" }); }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return json(400, { ok: false, error: "invalid_json" });

  // Honeypot (a hidden field people never see or fill): answer like a success, store nothing.
  if (typeof raw.website === "string" && raw.website.trim()) return json(200, { ok: true, ref: "--------" });
  // Implausibly fast submissions are kept (never lose a possible lead) but flagged for review.
  const spamFlag = Number(raw.elapsedMs) > 0 && Number(raw.elapsedMs) < MIN_FILL_MS ? "fast" : null;

  const { lead, errors } = validate(raw);
  if (errors.length) return json(400, { ok: false, error: "validation", fields: errors });

  const db = env.LEADS_DB;
  const emailConfigured = Boolean(env.RESEND_API_KEY && env.LEAD_NOTIFY_TO);
  if (!db && !emailConfigured) return json(503, { ok: false, error: "capture_unavailable" });

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const ip = request.headers.get("CF-Connecting-IP") || "";
  const ipHash = ip ? (await sha256(`${ip}|${env.IP_HASH_SALT || "urukqi-leads"}`)).slice(0, 32) : null;

  let stored = false;
  if (db) {
    try {
      await db.prepare(SCHEMA).run();
      if (ipHash) {
        const since = new Date(Date.now() - RATE_WINDOW_MIN * 60000).toISOString();
        const row = await db.prepare("SELECT COUNT(*) AS n FROM leads WHERE ip_hash = ? AND created_at > ?").bind(ipHash, since).first();
        if (row && row.n >= RATE_MAX) return json(429, { ok: false, error: "rate_limited" }, { "Retry-After": String(RATE_WINDOW_MIN * 60) });
      }
      await db.prepare(`INSERT INTO leads (id, created_at, name, company, phone, sector, sector_label, solution_id, solution,
          problem_id, problem_label, problem, current_process, users, branches, existing_system, needs, details, source_page, ip_hash, spam_flag, email_status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(id, createdAt, lead.name, lead.company || null, lead.phone, lead.sector, lead.sectorLabel || null,
          lead.solutionId || null, lead.solution || null, lead.problemId || null, lead.problemLabel || null, lead.problem,
          lead.current || null, lead.users || null, lead.branches || null, lead.existing || null,
          lead.needs.length ? JSON.stringify(lead.needs) : null, lead.details || null, lead.sourcePage || null, ipHash, spamFlag, "pending")
        .run();
      stored = true;
    } catch (err) {
      stored = false;
    }
  }

  const emailStatus = await sendEmail(env, lead, id, createdAt, spamFlag);
  if (stored) {
    try { await db.prepare("UPDATE leads SET email_status = ? WHERE id = ?").bind(emailStatus, id).run(); } catch (err) { /* lead is already safe */ }
  }

  if (!stored && emailStatus !== "sent") return json(502, { ok: false, error: "capture_failed" });
  return json(201, { ok: true, ref: id.slice(0, 8).toUpperCase() });
}

export function onRequest({ request }) {
  return json(405, { ok: false, error: "method_not_allowed" }, { Allow: "POST" });
}
