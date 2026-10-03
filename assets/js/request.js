/* ================================================================
   URUKQI request form — pre-fills the selected sector / solution /
   problem, submits the request to /api/lead (Cloudflare Pages Function)
   and only after the server confirms capture says «تم استلام طلبك»,
   then offers WhatsApp as the next step. If capture fails, the form
   keeps its contents, allows retry and offers WhatsApp as a fallback.
   Requires catalog-data.js and catalog-render.js.
   ================================================================ */
(function () {
  const form = document.getElementById("requestForm");
  const catalog = window.URUKQI_CATALOG;
  const R = window.URUKQI_RENDER;
  if (!form || !catalog || !R) return;

  const idx = R.index(catalog);
  const $ = id => document.getElementById(id);
  const fields = {
    name: $("rq-name"), company: $("rq-company"), phone: $("rq-phone"), sector: $("rq-sector"),
    solution: $("rq-solution"), problem: $("rq-problem"), current: $("rq-current"),
    users: $("rq-users"), branches: $("rq-branches"), existing: $("rq-existing"), details: $("rq-details")
  };
  const selection = $("requestSelection");
  const status = $("requestStatus");
  const required = ["name", "phone", "sector", "problem"];
  let chosenProblem = null;   // problem picked on the site, kept even if the visitor rewrites the text
  let chosenSolutionId = null;
  const openedAt = Date.now();
  const submitBtn = form.querySelector('button[type="submit"]');
  const submitLabel = submitBtn ? submitBtn.innerHTML : "";
  const ENDPOINT = "api/lead";

  const toLatinDigits = s => String(s || "").replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, d => String(d.charCodeAt(0) - 0x06F0));

  /* ---------------- prefill ---------------- */

  function prefill(params, opts) {
    params = params || {};
    const chips = [];
    const entry = params.solution && idx.solutions[params.solution];
    let sectorSlug = params.sector;
    if (!sectorSlug && entry && entry.ownerType === "sector") sectorSlug = entry.owner.slug;
    const sector = sectorSlug && idx.sectors[sectorSlug];
    const problem = params.problem && idx.problems[params.problem];
    chosenProblem = problem || null;
    chosenSolutionId = entry ? entry.sol.id : null;

    if (sector) {
      fields.sector.value = sector.slug;
      chips.push(["القطاع", sector.name]);
    }
    if (entry) {
      fields.solution.value = entry.sol.title + (entry.ownerType === "sector" ? "" : ` (${entry.owner.name})`);
      chips.push(["الحل", entry.sol.title]);
    }
    if (problem) {
      chips.push(["المشكلة", problem.title]);
      if (problem.solutions.length && !fields.problem.value.trim()) fields.problem.value = problem.title + ". ";
    }
    const needBox = params.need && form.querySelector(`input[data-need="${CSS.escape(params.need)}"]`);
    if (needBox) {
      needBox.checked = true;
      chips.push(["الاحتياج", needBox.value]);
    }
    if (entry && entry.sol.cat === "automation") {
      const box = form.querySelector('input[data-need="automation"]');
      if (box) box.checked = true;
    }

    if (selection) {
      if (chips.length) {
        selection.innerHTML = `<span>اخترت:</span>${chips.map(([k, v]) => `<b>${R.esc(k)}: ${R.esc(v)}</b>`).join("")}<button type="button" data-clear-selection>تغيير</button>`;
        selection.hidden = false;
      } else {
        selection.hidden = true;
      }
    }

    if (opts && opts.scroll) {
      const target = document.getElementById("request");
      const qs = Object.keys(params).filter(k => params[k]).map(k => `${k}=${encodeURIComponent(params[k])}`).join("&");
      try { history.replaceState(null, "", `${location.pathname}${qs ? "?" + qs : ""}#request`); } catch (e) { /* file:// etc. */ }
      const instant = opts.instant || reduceDelay() === 0;
      if (target) target.scrollIntoView({ behavior: instant ? "instant" : "smooth", block: "start" });
      const firstEmpty = required.map(k => fields[k]).find(f => !f.value.trim()) || fields.name;
      setTimeout(() => firstEmpty.focus({ preventScroll: true }), instant ? 0 : reduceDelay());
    }
  }

  function reduceDelay() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 450;
  }

  if (selection) {
    selection.addEventListener("click", e => {
      if (!e.target.closest("[data-clear-selection]")) return;
      selection.hidden = true;
      fields.solution.value = "";
      chosenProblem = null;
      chosenSolutionId = null;
      fields.sector.focus();
    });
  }

  /* ---------------- validation ---------------- */

  function setError(key, message) {
    const field = fields[key];
    const err = $(`${field.id}-error`);
    field.setAttribute("aria-invalid", message ? "true" : "false");
    if (err) { err.textContent = message || ""; err.hidden = !message; }
  }

  function validate() {
    let first = null;
    const messages = {
      name: "اكتب اسمك.",
      phone: "اكتب رقم هاتف أو WhatsApp صحيح.",
      sector: "اختر نوع النشاط.",
      problem: "اكتب باختصار المشكلة أو العملية التي تريد تنظيمها."
    };
    required.forEach(key => {
      let ok = fields[key].value.trim().length > 0;
      if (key === "phone") {
        const digits = toLatinDigits(fields.phone.value).replace(/\D/g, "");
        ok = digits.length >= 7 && digits.length <= 15;
      }
      setError(key, ok ? "" : messages[key]);
      if (!ok && !first) first = fields[key];
    });
    return first;
  }

  required.forEach(key => fields[key].addEventListener("input", () => {
    if (fields[key].getAttribute("aria-invalid") === "true") setError(key, "");
  }));

  /* ---------------- message ---------------- */

  function selectedText(select) {
    const opt = select.options[select.selectedIndex];
    return opt && opt.value ? opt.textContent.trim() : "";
  }

  function buildMessage() {
    const needs = Array.from(form.querySelectorAll('input[name="needs"]:checked')).map(c => c.value);
    const lines = [
      `الاسم: ${fields.name.value.trim()}`,
      fields.company.value.trim() && `المشروع / الشركة: ${fields.company.value.trim()}`,
      `الهاتف / WhatsApp: ${toLatinDigits(fields.phone.value.trim())}`,
      `نوع النشاط: ${selectedText(fields.sector)}`,
      fields.solution.value.trim() && `الحل المطلوب: ${fields.solution.value.trim()}`,
      chosenProblem && !fields.problem.value.includes(chosenProblem.title) && `المشكلة المختارة من الموقع: ${chosenProblem.title}`,
      `المشكلة: ${fields.problem.value.trim()}`,
      fields.current.value.trim() && `الطريقة الحالية: ${fields.current.value.trim()}`,
      selectedText(fields.users) && `عدد المستخدمين / الموظفين: ${selectedText(fields.users)}`,
      selectedText(fields.branches) && `عدد الفروع: ${selectedText(fields.branches)}`,
      selectedText(fields.existing) && `النظام الحالي: ${selectedText(fields.existing)}`,
      needs.length && `يحتاج: ${needs.join("، ")}`,
      fields.details.value.trim() && `تفاصيل إضافية: ${fields.details.value.trim()}`
    ];
    return toLatinDigits(["طلب نظام — موقع URUKQI", ""].concat(lines.filter(Boolean)).join("\n"));
  }

  // Only business-request information is sent — no tracking or device data.
  function payload() {
    return {
      name: fields.name.value.trim(),
      company: fields.company.value.trim(),
      phone: toLatinDigits(fields.phone.value.trim()),
      sector: fields.sector.value,
      sectorLabel: selectedText(fields.sector),
      solutionId: chosenSolutionId || "",
      solution: fields.solution.value.trim(),
      problemId: chosenProblem ? chosenProblem.id : "",
      problemLabel: chosenProblem ? chosenProblem.title : "",
      problem: fields.problem.value.trim(),
      current: fields.current.value.trim(),
      users: fields.users.value,
      branches: fields.branches.value,
      existing: fields.existing.value,
      needs: Array.from(form.querySelectorAll('input[name="needs"]:checked')).map(c => c.value),
      details: fields.details.value.trim(),
      sourcePage: location.pathname,
      website: (form.querySelector('[name="website"]') || {}).value || "",
      elapsedMs: Date.now() - openedAt
    };
  }

  function links(ref) {
    const message = buildMessage() + (ref ? `\nرقم الطلب: ${ref}` : "");
    return {
      wa: `https://wa.me/${catalog.contact.whatsapp}?text=${encodeURIComponent(message)}`,
      mail: `mailto:${catalog.contact.email}?subject=${encodeURIComponent("طلب نظام — موقع URUKQI")}&body=${encodeURIComponent(message)}`
    };
  }

  function setBusy(busy) {
    if (!submitBtn) return;
    submitBtn.disabled = busy;
    submitBtn.setAttribute("aria-busy", String(busy));
    submitBtn.innerHTML = busy ? "جارٍ إرسال طلبك…" : submitLabel;
  }

  function showStatus(kind, html) {
    status.className = `request-status is-${kind}`;
    status.innerHTML = html;
    status.hidden = false;
    status.focus({ preventScroll: false });
  }

  const failText = {
    rate_limited: "أرسلت عدة طلبات خلال وقت قصير. انتظر بضع دقائق ثم حاول مرة أخرى، أو تابع معنا عبر WhatsApp.",
    validation: "بعض البيانات غير صالحة. راجع الحقول ثم حاول مرة أخرى.",
    default: "تعذّر إرسال طلبك الآن. بياناتك ما زالت في النموذج — حاول مرة أخرى، أو تابع معنا عبر WhatsApp."
  };

  let sending = false;
  form.addEventListener("submit", async e => {
    e.preventDefault();
    if (sending) return;
    const invalid = validate();
    if (invalid) {
      showStatus("error", "أكمل الحقول المطلوبة المشار إليها.");
      invalid.focus();
      return;
    }

    sending = true;
    setBusy(true);
    status.hidden = true;
    let result = null;
    let errorCode = "default";
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 15000);
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload()),
        credentials: "same-origin",
        signal: ctrl.signal
      });
      clearTimeout(timer);
      const data = await res.json().catch(() => null);
      if (res.ok && data && data.ok) result = data;
      else if (data && (data.error === "rate_limited" || data.error === "validation")) errorCode = data.error;
    } catch (err) {
      result = null;
    }
    sending = false;
    setBusy(false);

    if (result) {
      const l = links(result.ref);
      showStatus("ready", `<strong>تم استلام طلبك بنجاح.</strong>
<p>رقم الطلب: <b dir="ltr">${R.esc(result.ref)}</b>. سنراجع طلبك ونتواصل معك على الرقم الذي أدخلته. يمكنك الآن متابعة المحادثة معنا عبر WhatsApp وإرفاق لقطات الشاشة أو ملفات Excel أو نماذج الفواتير.</p>
<div class="request-status-actions"><a class="btn btn-primary btn-sm" href="${R.esc(l.wa)}" target="_blank" rel="noopener">متابعة عبر واتساب</a></div>`);
      return;
    }

    const l = links("");
    showStatus("error", `<strong>${R.esc(failText[errorCode] || failText.default)}</strong>
<p>لم يصلنا الطلب بعد. لن يُعتبر مُرسلًا عبر WhatsApp إلا بعد أن تضغط «إرسال» هناك.</p>
<div class="request-status-actions"><button type="submit" class="btn btn-primary btn-sm">حاول مرة أخرى</button><a class="btn btn-secondary btn-sm" href="${R.esc(l.wa)}" target="_blank" rel="noopener">المتابعة عبر WhatsApp</a><a class="btn btn-secondary btn-sm" href="${R.esc(l.mail)}">أرسل عبر البريد</a></div>`);
  });

  /* ---------------- initial state from the URL ---------------- */

  const params = new URLSearchParams(location.search);
  const initial = { sector: params.get("sector"), solution: params.get("solution"), problem: params.get("problem"), need: params.get("need") };
  if (initial.sector || initial.solution || initial.problem || initial.need) prefill(initial, { scroll: location.hash === "#request", instant: true });

  window.URUKQI_REQUEST = { prefill };
})();
