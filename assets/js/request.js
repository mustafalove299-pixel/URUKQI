/* ================================================================
   URUKQI request form — pre-fills the selected sector / solution /
   problem and prepares a structured WhatsApp message (or e-mail).
   There is no backend: nothing is "sent" until the visitor presses
   send inside WhatsApp or their mail app, and the UI says so.
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

  form.addEventListener("submit", e => {
    e.preventDefault();
    const invalid = validate();
    if (invalid) {
      status.className = "request-status is-error";
      status.textContent = "أكمل الحقول المطلوبة المشار إليها.";
      status.hidden = false;
      invalid.focus();
      return;
    }
    const message = buildMessage();
    const waUrl = `https://wa.me/${catalog.contact.whatsapp}?text=${encodeURIComponent(message)}`;
    const mailUrl = `mailto:${catalog.contact.email}?subject=${encodeURIComponent("طلب نظام — موقع URUKQI")}&body=${encodeURIComponent(message)}`;

    window.open(waUrl, "_blank", "noopener");

    status.className = "request-status is-ready";
    status.innerHTML = `<strong>جهّزنا رسالتك في WhatsApp.</strong>
<p>أكمل الإرسال من نافذة WhatsApp — لن يصلنا طلبك قبل أن تضغط «إرسال» هناك. يمكنك بعدها إرفاق لقطات الشاشة أو ملفات Excel أو نماذج الفواتير داخل نفس المحادثة.</p>
<div class="request-status-actions"><a class="btn btn-primary btn-sm" href="${R.esc(waUrl)}" target="_blank" rel="noopener">افتح WhatsApp مرة أخرى</a><a class="btn btn-secondary btn-sm" href="${R.esc(mailUrl)}">أرسل عبر البريد بدلًا من ذلك</a></div>`;
    status.hidden = false;
    status.focus({ preventScroll: false });
  });

  /* ---------------- initial state from the URL ---------------- */

  const params = new URLSearchParams(location.search);
  const initial = { sector: params.get("sector"), solution: params.get("solution"), problem: params.get("problem"), need: params.get("need") };
  if (initial.sector || initial.solution || initial.problem || initial.need) prefill(initial, { scroll: location.hash === "#request", instant: true });

  window.URUKQI_REQUEST = { prefill };
})();
