#!/usr/bin/env node
/* ================================================================
   Clean Cloudflare Pages deployment artifact and preflight (no dependencies).

       node tools/make-deploy-artifact.js [commit] [outDir]

   commit  default HEAD. Files are read from this COMMIT with git, never
           from the working tree, so untracked/ignored files (design
           references, scratch files, .wrangler, secrets) cannot leak in.
   outDir  default ../URUKQI-deploy/<short-sha> (outside the repository).

   Output:
     <outDir>/public/      static site only (no tools/, no functions source)
     <outDir>/functions/   Pages Functions (lead API + 404 guards)
     <outDir>/MANIFEST.txt sha256 + size of every file, and the checks run

   Deploy (only after owner approval), from <outDir>:
       npx wrangler pages deploy public --project-name <PROJECT> --branch <BRANCH>
   Wrangler picks up ./functions from the directory it is run in.

   The script aborts (exit 1) when a forbidden file type is present, a
   local link/image in the artifact is broken, or prohibited copy appears.

   Prohibited copy = PUBLIC_RULES below + owner-maintained local rules read
   from a file OUTSIDE the repository (one regular expression per line,
   "#" starts a comment). It is located by $URUKQI_PRIVATE_RULES or, by
   default, ../URUKQI-private/deploy-prohibited-terms.txt. This preflight
   fails closed when that file is missing or empty, refuses a rules file
   inside the repository, and reports matches by rule number only.
   tools/build-pages.js does not use it: normal site builds need no rules file.
   ================================================================ */
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const git = (args, enc) => execFileSync("git", args, { cwd: ROOT, encoding: enc === undefined ? "utf8" : enc, maxBuffer: 256 * 1024 * 1024 });

function fail(msg) { console.error("ABORT: " + msg); process.exit(1); }

const commit = git(["rev-parse", "--verify", (process.argv[2] || "HEAD") + "^{commit}"]).trim();
const short = commit.slice(0, 7);
const outDir = path.resolve(process.argv[3] || path.join(ROOT, "..", "URUKQI-deploy", short));

// Never shipped as static files.
const EXCLUDE_PREFIX = ["tools/", "functions/", "design-references/", ".wrangler/"];
const EXCLUDE_FILE = new Set([".gitignore", ".dev.vars"]);
// Never allowed anywhere in the artifact (installers, licences, data, documents, keys).
const FORBIDDEN_EXT = /\.(exe|msi|msix|zip|7z|rar|dll|sqlite3?|db|lic|license|pem|key|p12|pfx|env|pdf|docx?|xlsx?|md|psd|ai|urukqi-backup|bundle)$/i;
// Public product rule: URUKQI Trade pages must not present China imports as a Trade module.
const PUBLIC_RULES = [/منظومة استيراد الصين/];
const COPY_SKIP = /^public\/demos\//; // NASAQ demo store: fictional catalogue, unrelated

// Owner-maintained local rules (kept outside Git). Fail closed.
const rulesFile = path.resolve(process.env.URUKQI_PRIVATE_RULES || path.join(ROOT, "..", "URUKQI-private", "deploy-prohibited-terms.txt"));
const relRules = path.relative(ROOT, rulesFile);
if (!relRules.startsWith("..") && !path.isAbsolute(relRules)) fail("the local rules file must live outside the repository.");
if (!fs.existsSync(rulesFile)) fail("local prohibited-copy rules file not found (set URUKQI_PRIVATE_RULES). Preflight fails closed.");
const LOCAL_RULES = fs.readFileSync(rulesFile, "utf8").split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith("#"))
  .map((l, i) => { try { return new RegExp(l, "iu"); } catch (e) { return fail(`local rule #${i + 1} is not a valid regular expression.`); } });
if (!LOCAL_RULES.length) fail("local prohibited-copy rules file is empty. Preflight fails closed.");

if (fs.existsSync(outDir) && fs.readdirSync(outDir).length) fail(`${outDir} already exists and is not empty — choose another outDir.`);

const tracked = git(["ls-tree", "-r", "--name-only", commit]).split("\n").filter(Boolean);
const files = [];
for (const f of tracked) {
  if (EXCLUDE_FILE.has(f)) continue;
  let dest;
  if (f.startsWith("functions/")) dest = f;                       // Pages Functions source
  else if (EXCLUDE_PREFIX.some(p => f.startsWith(p))) continue;
  else dest = "public/" + f;
  if (FORBIDDEN_EXT.test(f)) fail(`forbidden file type in commit ${short}: ${f}`);
  files.push({ src: f, dest });
}

for (const { src, dest } of files) {
  const target = path.join(outDir, dest);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, git(["show", `${commit}:${src}`], "buffer"));
}

/* ---------- checks inside the artifact ---------- */
const pub = path.join(outDir, "public");
const html = files.filter(f => f.dest.startsWith("public/") && f.dest.endsWith(".html"));
let links = 0;
const broken = [];
const referenced = new Set();
for (const { dest } of html) {
  const file = path.join(outDir, dest);
  const text = fs.readFileSync(file, "utf8");
  for (const m of text.matchAll(/(?:href|src)="([^"]+)"|srcset="([^"]+)"/g)) {
    const vals = m[1] ? [m[1]] : m[2].split(",").map(s => s.trim().split(/\s+/)[0]);
    for (let u of vals) {
      if (/^(https?:|mailto:|tel:|#|data:|javascript:)/.test(u)) continue;
      u = u.split("#")[0].split("?")[0];
      if (!u) continue;
      let p = u.startsWith("/") ? path.join(pub, u) : path.join(path.dirname(file), u);
      if (u.endsWith("/") || (fs.existsSync(p) && fs.statSync(p).isDirectory())) p = path.join(p, "index.html");
      links++;
      if (u.startsWith("/api/")) continue; // served by functions/api
      if (!fs.existsSync(p)) broken.push(`${dest} -> ${u}`);
      else referenced.add(path.relative(pub, p).split(path.sep).join("/"));
    }
  }
}
if (broken.length) fail("broken local links:\n  " + broken.join("\n  "));

const copyHits = [];
for (const { dest } of files) {
  if (COPY_SKIP.test(dest) || !/\.(html|js|css|xml|txt|json)$/.test(dest)) continue;
  const text = fs.readFileSync(path.join(outDir, dest), "utf8");
  PUBLIC_RULES.forEach((re, i) => { if (re.test(text)) copyHits.push(`${dest}: public rule #${i + 1}`); });
  LOCAL_RULES.forEach((re, i) => { if (re.test(text)) copyHits.push(`${dest}: local rule #${i + 1}`); });
}
if (copyHits.length) fail("prohibited copy found:\n  " + copyHits.join("\n  "));

/* ---------- manifest ---------- */
const rows = files.map(({ dest }) => {
  const buf = fs.readFileSync(path.join(outDir, dest));
  return `${crypto.createHash("sha256").update(buf).digest("hex")}  ${String(buf.length).padStart(9)}  ${dest}`;
}).sort((a, b) => a.slice(77).localeCompare(b.slice(77)));
const total = files.reduce((n, { dest }) => n + fs.statSync(path.join(outDir, dest)).size, 0);
const pubFiles = files.filter(f => f.dest.startsWith("public/"));
const unreferencedImages = pubFiles.map(f => f.dest.slice(7))
  .filter(f => /\.(webp|png|jpe?g|svg|gif)$/i.test(f) && !referenced.has(f) && !f.startsWith("demos/"));

fs.writeFileSync(path.join(outDir, "MANIFEST.txt"), [
  `URUKQI Cloudflare Pages artifact`,
  `commit   ${commit}`,
  `created  ${new Date().toISOString()}`,
  `files    ${files.length} (${pubFiles.length} public, ${files.length - pubFiles.length} functions), ${total} bytes`,
  `checks   ${html.length} HTML pages, ${links} local links/images, 0 broken; forbidden types: none; prohibited copy: none (${PUBLIC_RULES.length} public + ${LOCAL_RULES.length} local rules)`,
  `excluded ${EXCLUDE_PREFIX.filter(p => p !== "functions/").join(" ")} ${[...EXCLUDE_FILE].join(" ")} + all untracked/ignored files; functions/ shipped separately`,
  `images not referenced by any HTML page (still public; CSS/JS may use them):`,
  ...unreferencedImages.map(f => `  ${f}`),
  ``,
  `sha256                                                            bytes  path`,
  ...rows,
  ``
].join("\n"), "utf8");

console.log(`Artifact for ${short} written to ${outDir}`);
console.log(`  ${pubFiles.length} public files, ${files.length - pubFiles.length} function files, ${total} bytes`);
console.log(`  ${html.length} pages, ${links} local links/images checked, 0 broken, no forbidden types, no prohibited copy`);
if (unreferencedImages.length) console.log(`  images not referenced by HTML: ${unreferencedImages.join(", ")}`);
