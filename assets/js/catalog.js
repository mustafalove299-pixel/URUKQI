/* ================================================================
   URUKQI solution discovery — search, category filters, sector and
   problem panels. Static markup (tiles, cards) is generated from the
   same catalog by tools/build-pages.js; this file only enhances it.
   Requires catalog-data.js and catalog-render.js.
   ================================================================ */
(function () {
  const catalog = window.URUKQI_CATALOG;
  const R = window.URUKQI_RENDER;
  if (!catalog || !R) return;

  const idx = R.index(catalog);
  const PAGE_SIZE = 9;

  /* ---------------- Arabic-friendly normalization ---------------- */

  function normalize(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[ً-ٰٟـ]/g, "")      // diacritics, tatweel
      .replace(/[أإآٱ]/g, "ا")
      .replace(/ى/g, "ي")
      .replace(/ة/g, "ه")
      .replace(/ؤ/g, "و")
      .replace(/ئ/g, "ي")
      .replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 0x0660))
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  // Light stemming: drop the article and common plural/feminine endings.
  function stem(token) {
    let t = token;
    if (t.length > 4 && t.startsWith("ال")) t = t.slice(2);
    if (t.length > 4 && /(ات|ين|ون|يه)$/.test(t)) t = t.slice(0, -2);
    else if (t.length > 3 && /[ه]$/.test(t)) t = t.slice(0, -1);
    return t;
  }

  // Colloquial / spelling variants → what the catalog actually says. Keys and
  // values are already normalized. Kept deliberately small and explicit.
  const PHRASES = [[/واتس اب|وتس اب|واتز اب|whats app/g, "واتساب"], [/نقطه بيع|نقاط بيع/g, "pos"]];
  const ALIASES = {
    "واتساب": ["whatsapp", "واتساب"], "واتسب": ["whatsapp", "واتساب"], "وتساب": ["whatsapp", "واتساب"],
    "واتس": ["whatsapp", "واتساب"], "whatsapp": ["whatsapp", "واتساب"],
    "بوس": ["pos", "كاشير"], "pos": ["pos", "كاشير"], "كاشير": ["pos", "كاشير"],
    "زباين": ["عملاء", "عميل", "زباين"], "زبون": ["عملاء", "عميل", "زبون"],
    "دين": ["دين", "ديون"], "ديون": ["دين", "ديون"],
    "مناديب": ["مندوب"], "مندوبين": ["مندوب"],
    "مخزن": ["مخزن", "مخازن", "مستودع"], "مخازن": ["مخزن", "مخازن", "مستودع"],
    "راتب": ["راتب", "رواتب"], "رواتب": ["راتب", "رواتب"],
    "حجز": ["حجز", "حجوز"], "حجوزات": ["حجز", "حجوز"],
    "قسط": ["قسط", "اقساط"], "اقساط": ["قسط", "اقساط"],
    "فاتوره": ["فاتوره", "فواتير"], "فواتير": ["فاتوره", "فواتير"],
    "يدوي": ["يدوي", "يدويا"], "يدويا": ["يدوي", "يدويا"]
  };
  // Words that carry no meaning for matching ("أريد نظام لإدارة …").
  const STOP = new Set(["اريد", "نريد", "احتاج", "نحتاج", "ابي", "ابغي", "عندي", "لدي", "لدينا", "عندنا", "نظام", "انظمه",
    "برنامج", "برامج", "اداره", "لاداره", "تنظيم", "في", "من", "على", "الى", "او", "مع", "عن", "كل", "هذا", "هذه", "انا",
    "حل", "حلول", "و", "ال", "لل"]);

  // Each query term becomes a list of alternatives; a term matches if any alternative is found.
  // Attached prefixes ("وديون", "بالمخزون", "للمطاعم") are tried as extra
  // alternatives; the original word is always kept too.
  const PREFIXES = [["وال", 3], ["بال", 3], ["فال", 3], ["كال", 3], ["لل", 3], ["ال", 3], ["و", 4], ["ب", 4], ["ل", 4]];

  function alternatives(t) {
    const forms = [t];
    PREFIXES.forEach(([p, min]) => { if (t.startsWith(p) && t.length - p.length >= min) forms.push(t.slice(p.length)); });
    const out = new Set();
    forms.forEach(f => (ALIASES[f] || ALIASES[stem(f)] || [f, stem(f)]).forEach(a => out.add(a)));
    return [...out];
  }

  // Short terms (≤ 3 letters, e.g. "عمل", "دين", "pos") must match a whole word,
  // optionally with an attached article/prefix, so "عمل" does not match "عملاء".
  const wordRe = {};
  function matches(text, alt) {
    if (alt.length > 3) return text.includes(alt);
    if (!wordRe[alt]) wordRe[alt] = new RegExp(`(^|\\s)(ال|وال|بال|لل|و|ب|ل)?${alt}(\\s|$)`);
    return wordRe[alt].test(text);
  }

  /* "موقع" means a website, but also a construction/work site or a GPS location.
     Without place context ("تقارير موقع المشروع", "صور الموقع", "موقع العمل") it is
     read as website: then it only counts for web solutions. */
  const PLACE_CONTEXT = new Set(["مشروع", "مشاريع", "عمل", "تقرير", "تقارير", "صور", "بناء", "انشاءات", "مقاول",
    "مقاولات", "ورشه", "ميداني", "ميدانيين", "gps", "حضور", "عمال"]);

  function tokens(query) {
    let q = normalize(query);
    PHRASES.forEach(([re, to]) => { q = q.replace(re, to); });
    const terms = q.split(" ")
      .filter(t => t.length > 1 && !STOP.has(t))
      .map(alternatives);
    terms.forEach(t => { t.site = t.includes("موقع"); });
    if (terms.some(t => t.site)) {
      terms.siteSense = terms.some(t => !t.site && t.some(a => PLACE_CONTEXT.has(a))) ? "place" : "web";
    }
    return terms;
  }

  // Website sense: "موقع" only counts for web solutions (and for no sector).
  // Place sense: it never counts for web solutions.
  const siteSkips = (terms, term, cat) => term.site &&
    ((terms.siteSense === "web" && cat !== "web") || (terms.siteSense === "place" && cat === "web"));

  const has = (text, alts) => alts.some(a => matches(text, a));

  /* ---------------- search index ---------------- */

  const entries = Object.keys(idx.solutions).map(id => {
    const entry = idx.solutions[id];
    const { sol, owner } = entry;
    return {
      entry,
      title: normalize(sol.title),
      items: normalize((sol.items || []).join(" ")),
      owner: normalize([owner.name, owner.en, (owner.keywords || []).join(" ")].join(" ")),
      desc: normalize(sol.desc)
    };
  });

  const sectorEntries = catalog.sectors.map(s => ({
    sector: s,
    text: normalize([s.name, s.en, s.short, (s.keywords || []).join(" ")].join(" "))
  }));

  const problemEntries = catalog.problems.filter(p => p.solutions.length).map(p => ({
    problem: p,
    text: normalize([p.title, (p.keywords || []).join(" ")].join(" "))
  }));

  // Problems whose wording matches the query: all terms, or else at least half
  // of them (so a long sentence still finds its problem without loose matches).
  function searchProblems(query) {
    const terms = tokens(query);
    if (!terms.length) return [];
    const scored = problemEntries.map(pe => ({ pe, n: terms.filter(t => has(pe.text, t)).length }));
    const all = scored.filter(s => s.n === terms.length);
    const need = Math.max(1, Math.ceil(terms.length / 2));
    const list = all.length ? all : scored.filter(s => s.n >= need).sort((a, b) => b.n - a.n);
    return list.map(s => s.pe.problem);
  }

  // { matched: number of query terms found, score: weighted by where they were found }
  function scoreEntry(e, terms) {
    let score = 0; let matched = 0;
    for (const term of terms) {
      if (siteSkips(terms, term, e.entry.sol.cat)) continue;
      let s = 0;
      if (has(e.title, term)) s += 6;
      if (has(e.items, term)) s += 4;
      if (has(e.owner, term)) s += 3;
      if (has(e.desc, term)) s += 1;
      if (s) matched++;
      score += s;
    }
    return { matched, score: matched * 10 + score };
  }

  /* Returns the matching solutions, best first.
     1. Solutions matching every term (plus solutions of a problem the query matches).
     2. Then, for multi-word queries, solutions matching at least half of the terms,
        ranked by how many terms they match — appended after the exact matches.
     result.partial = true when nothing matched every term, so the UI can say so. */
  function searchSolutions(query, cat) {
    const terms = tokens(query);
    // A website query ("موقع شركة", "موقع الكتروني") is answered with website solutions only.
    const inCat = e => (cat === "all" || e.entry.sol.cat === cat) && (terms.siteSense !== "web" || e.entry.sol.cat === "web");
    if (!terms.length) {
      const list = query.trim() ? [] : entries.filter(inCat).map(e => e.entry);
      list.partial = false;
      return list;
    }
    const boost = {};
    searchProblems(query).forEach(p => p.solutions.forEach(id => { boost[id] = (boost[id] || 0) + 5; }));
    const need = Math.max(1, Math.ceil(terms.length / 2));
    const scored = entries.filter(inCat).map(e => {
      const r = scoreEntry(e, terms);
      const b = boost[e.entry.sol.id] || 0;
      return { entry: e.entry, exact: r.matched === terms.length || (b > 0 && r.matched >= need), matched: r.matched, score: r.score + b };
    });
    const byRank = (a, b) => b.matched - a.matched || b.score - a.score;
    const exact = scored.filter(r => r.exact).sort(byRank);
    const near = terms.length > 1 ? scored.filter(r => !r.exact && r.matched >= need).sort(byRank) : [];
    // Same-sector companions: a visitor asking for two things ("مخزون وديون") should
    // also see the sibling solution that covers the other need.
    const owners = new Set(exact.concat(near).filter(r => r.entry.ownerType === "sector").map(r => r.entry.owner.slug));
    const taken = new Set(exact.concat(near));
    const companions = scored.filter(r => !taken.has(r) && r.matched >= 1 && r.entry.ownerType === "sector" && owners.has(r.entry.owner.slug)).sort(byRank);
    const problemOnly = scored.filter(r => !r.exact && r.matched < need && boost[r.entry.sol.id] && !companions.includes(r)).sort(byRank);
    const list = exact.concat(near, companions, exact.length ? [] : problemOnly).map(r => r.entry);
    list.partial = !exact.length && list.length > 0;
    return list;
  }

  function searchSectors(query) {
    const terms = tokens(query);
    if (!terms.length) return [];
    if (terms.siteSense === "web") return [];
    const useful = terms.filter(t => !siteSkips(terms, t, null));
    if (!useful.length) return [];
    return sectorEntries
      .filter(se => se.sector.page && useful.every(t => has(se.text, t)))
      .map(se => se.sector);
  }

  /* ---------------- helpers ---------------- */

  const cardCtx = (base, extra) => Object.assign({ base, idx, showOwner: true, ownerLink: true }, extra);

  function renderCards(list, base, extra) {
    return list.map(entry => R.solutionCard(entry, cardCtx(base, extra))).join("");
  }

  function scrollToEl(el) {
    if (!el) return;
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "instant" : "smooth", block: "start" });
  }

  /* ---------------- explorer (search + filters + sector panel) ---------------- */

  function mountExplorer(root) {
    const base = root.getAttribute("data-base") || "";
    const input = root.querySelector("[data-explorer-input]");
    const form = root.querySelector("[data-explorer-form]");
    const chips = Array.from(root.querySelectorAll("[data-cat-filter]"));
    const results = root.querySelector("[data-explorer-results]");
    const browse = root.querySelector("[data-explorer-browse]");
    if (!input || !results) return;

    let cat = "all";
    let shown = PAGE_SIZE;
    let timer = null;

    function showBrowse(show) {
      if (browse) browse.hidden = !show;
    }

    function clearSelectedTiles() {
      root.querySelectorAll(".sector-tile[aria-current]").forEach(t => t.removeAttribute("aria-current"));
    }

    function reset() {
      results.innerHTML = "";
      results.hidden = true;
      showBrowse(true);
    }

    function render() {
      const query = input.value.trim();
      clearSelectedTiles();
      if (!query && cat === "all") { reset(); return; }

      const found = searchSolutions(query, cat);
      const sectors = cat === "all" ? searchSectors(query) : [];
      const problems = cat === "all" && query ? searchProblems(query).slice(0, 3) : [];
      const catName = cat === "all" ? "" : idx.categories[cat].name;
      const label = query ? `«${R.esc(query)}»` : R.esc(catName);
      const noun = found.partial ? "نتيجة قريبة" : (found.length === 1 ? "حل مطابق" : "حلًا مطابقًا");

      let html = `<div class="explorer-head"><p role="status"><strong>${found.length}</strong> ${noun} ${label ? "لـ " + label : ""}${query && catName ? " في " + R.esc(catName) : ""}</p><button type="button" class="explorer-clear" data-explorer-clear>مسح البحث</button></div>`;

      if (sectors.length) {
        html += `<div class="explorer-sectors"><span>قطاعات مرتبطة:</span>${sectors.map(s =>
          `<a href="${R.sectorHref(base, s)}" data-sector="${R.esc(s.slug)}">${R.esc(s.name)}</a>`).join("")}</div>`;
      }
      if (problems.length) {
        html += `<div class="explorer-sectors"><span>مشكلات مشابهة:</span>${problems.map(p =>
          `<a href="${R.requestHref(base, { problem: p.id })}" data-request="${R.esc(JSON.stringify({ problem: p.id }))}">${R.esc(p.title)}</a>`).join("")}</div>`;
      }
      if (found.partial) {
        html += `<p class="explorer-partial">لم نجد حلًا يطابق كل الكلمات، فهذه أقرب النتائج. إن لم تجد ما تقصده، <a href="${R.requestHref(base, {})}" data-request="{}">أخبرنا بمشكلتك مباشرة</a>.</p>`;
      }

      if (found.length) {
        html += `<div class="sol-grid">${renderCards(found.slice(0, shown), base)}</div>`;
        if (found.length > shown) {
          html += `<button type="button" class="btn btn-secondary explorer-more" data-explorer-more>عرض المزيد (${found.length - shown})</button>`;
        }
      } else {
        html += `<div class="explorer-empty"><strong>لم نجد حلًا بهذا الاسم في الكتالوج.</strong><p>هذا لا يعني أننا لا نستطيع بناءه — أخبرنا بما تحتاجه وسندرسه.</p><a class="btn btn-primary btn-sm" href="${R.requestHref(base, {})}" data-request="{}">اطلب نظامًا مخصصًا <span aria-hidden="true">←</span></a></div>`;
      }

      results.innerHTML = html;
      results.hidden = false;
      showBrowse(false);
    }

    function openSector(slug, focusPanel) {
      const sector = idx.sectors[slug];
      if (!sector) return false;
      input.value = "";
      setCat("all", false);
      shown = PAGE_SIZE;
      const list = sector.solutions.map(sol => idx.solutions[sol.id]);
      const examples = sector.examples
        ? `<ul class="sector-examples">${sector.examples.map(e => `<li>${R.esc(e)}</li>`).join("")}</ul>` : "";
      const note = sector.note ? `<p class="sector-note">${R.esc(sector.note)}</p>` : "";
      results.innerHTML = `<div class="sector-panel" tabindex="-1" aria-labelledby="sector-panel-title">
  <div class="explorer-head"><div><div class="section-kicker">${R.esc(sector.en)}</div><h3 id="sector-panel-title">${R.esc(sector.name)}</h3></div><button type="button" class="explorer-clear" data-explorer-clear>كل القطاعات</button></div>
  <p class="sector-intro">${R.esc(sector.intro)}</p>${examples}${note}
  <div class="sol-grid">${renderCards(list, base, { showOwner: false, ownerLink: false })}</div>
  <div class="sector-panel-foot">${sector.page ? `<a class="btn btn-secondary btn-sm" href="${R.sectorHref(base, sector)}">صفحة ${R.esc(sector.name)} الكاملة</a>` : ""}<a class="btn btn-primary btn-sm" href="${R.requestHref(base, { sector: sector.slug })}" data-request="${R.esc(JSON.stringify({ sector: sector.slug }))}">اطلب نظامًا لنشاطك <span aria-hidden="true">←</span></a></div>
</div>`;
      results.hidden = false;
      showBrowse(true);
      clearSelectedTiles();
      const tile = root.querySelector(`.sector-tile[data-sector="${CSS.escape(slug)}"]`);
      if (tile) tile.setAttribute("aria-current", "true");
      const panel = results.querySelector(".sector-panel");
      if (focusPanel && panel) { panel.focus({ preventScroll: true }); scrollToEl(panel); }
      return true;
    }

    function setCat(next, rerender) {
      cat = next;
      chips.forEach(c => c.setAttribute("aria-pressed", String(c.getAttribute("data-cat-filter") === cat)));
      if (rerender !== false) { shown = PAGE_SIZE; render(); }
    }

    input.addEventListener("input", () => {
      clearTimeout(timer);
      timer = setTimeout(() => { shown = PAGE_SIZE; render(); }, 160);
    });
    if (form) form.addEventListener("submit", e => { e.preventDefault(); shown = PAGE_SIZE; render(); scrollToEl(results); });
    chips.forEach(chip => chip.addEventListener("click", () => setCat(chip.getAttribute("data-cat-filter"))));

    root.addEventListener("click", e => {
      const more = e.target.closest("[data-explorer-more]");
      if (more) { shown += PAGE_SIZE; render(); return; }
      if (e.target.closest("[data-explorer-clear]")) { input.value = ""; setCat("all", false); reset(); input.focus(); return; }
      const sectorLink = e.target.closest("a[data-sector]");
      if (sectorLink && root.hasAttribute("data-sector-panel")) {
        const slug = sectorLink.getAttribute("data-sector");
        if (idx.sectors[slug] && idx.sectors[slug].page) {
          e.preventDefault();
          openSector(slug, true);
        }
      }
    });

    // Optional deep link: ?q=term or ?cat=web
    const params = new URLSearchParams(location.search);
    if (params.get("q")) input.value = params.get("q");
    const startCat = params.get("cat");
    if (startCat && idx.categories[startCat]) setCat(startCat, false);
    if (input.value || cat !== "all") render();
  }

  /* ---------------- problem finder ---------------- */

  function mountProblems(root) {
    const base = root.getAttribute("data-base") || "";
    const panel = root.querySelector("[data-problem-panel]");
    const more = root.querySelector("[data-problems-more]");
    const cards = Array.from(root.querySelectorAll(".problem-pick"));
    const visible = parseInt(root.getAttribute("data-visible") || "12", 10);
    // "لدي مشكلة مختلفة" stays visible so the custom route is always one click away.
    const extra = cards.filter(c => c.getAttribute("data-problem") !== "other").slice(visible);

    if (more && extra.length) {
      extra.forEach(c => { c.hidden = true; });
      more.hidden = false;
      more.textContent = `عرض كل المشكلات (${cards.length})`;
      more.addEventListener("click", () => {
        const expanded = more.getAttribute("aria-expanded") === "true";
        extra.forEach(c => { c.hidden = expanded; });
        more.setAttribute("aria-expanded", String(!expanded));
        more.textContent = expanded ? `عرض كل المشكلات (${cards.length})` : "عرض أقل";
      });
    }

    root.addEventListener("click", e => {
      const card = e.target.closest(".problem-pick");
      if (!card || !panel) return;
      const problem = idx.problems[card.getAttribute("data-problem")];
      if (!problem || !problem.solutions.length) return;   // "other" → default link to the request form
      e.preventDefault();
      cards.forEach(c => c.removeAttribute("aria-current"));
      card.setAttribute("aria-current", "true");
      const list = problem.solutions.map(id => idx.solutions[id]).filter(Boolean);
      panel.innerHTML = `<div class="problem-panel" tabindex="-1" aria-labelledby="problem-panel-title">
  <div class="explorer-head"><div><div class="section-kicker">SUGGESTED SOLUTIONS</div><h3 id="problem-panel-title">${R.esc(problem.title)}</h3></div></div>
  <p class="sector-intro">حلول يمكن أن نبنيها أو نخصصها لهذه المشكلة. اختر الأقرب لعملك، أو اطلب دراسة مشكلتك مباشرة.</p>
  <div class="sol-grid">${renderCards(list, base, { problem: problem.id })}</div>
  <div class="sector-panel-foot"><a class="btn btn-primary btn-sm" href="${R.requestHref(base, { problem: problem.id })}" data-request="${R.esc(JSON.stringify({ problem: problem.id }))}">اطلب حلًا لهذه المشكلة <span aria-hidden="true">←</span></a></div>
</div>`;
      panel.hidden = false;
      const box = panel.querySelector(".problem-panel");
      box.focus({ preventScroll: true });
      scrollToEl(box);
    });
  }

  /* ---------------- same-page request links ---------------- */

  document.addEventListener("click", e => {
    const link = e.target.closest("a[data-request], a.problem-pick");
    if (!link || e.defaultPrevented || !window.URUKQI_REQUEST || !document.getElementById("request")) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
    let params = {};
    if (link.hasAttribute("data-request")) {
      try { params = JSON.parse(link.getAttribute("data-request")) || {}; } catch (err) { params = {}; }
    } else {
      params = { problem: link.getAttribute("data-problem") };
    }
    e.preventDefault();
    window.URUKQI_REQUEST.prefill(params, { scroll: true });
  });

  document.querySelectorAll("[data-explorer]").forEach(mountExplorer);
  document.querySelectorAll("[data-problems]").forEach(mountProblems);

  window.URUKQI_SEARCH = { normalize, tokens, searchSolutions, searchSectors, searchProblems };
})();
