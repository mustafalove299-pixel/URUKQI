/* ================================================================
   URUKQI catalog markup — shared by tools/build-pages.js (static
   pages) and assets/js/catalog.js (search results / panels), so a
   card looks the same whether it was generated or rendered live.
   ================================================================ */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.URUKQI_RENDER = api;
})(typeof self !== "undefined" ? self : this, function () {

  const esc = value => String(value == null ? "" : value)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

  const pad = n => String(n).padStart(2, "0");

  // Build lookup maps once per catalog.
  function index(catalog) {
    const solutions = {};
    const sectors = {};
    const problems = {};
    const categories = {};
    catalog.categories.forEach(c => { categories[c.id] = c; });
    catalog.sectors.forEach(s => {
      sectors[s.slug] = s;
      s.solutions.forEach(sol => { solutions[sol.id] = { sol, owner: s, ownerType: "sector" }; });
    });
    catalog.services.forEach(s => {
      s.solutions.forEach(sol => { solutions[sol.id] = { sol, owner: s, ownerType: "service" }; });
    });
    catalog.problems.forEach(p => { problems[p.id] = p; });
    return { solutions, sectors, problems, categories };
  }

  // Link into the request form on the home page with the selection pre-filled.
  function requestHref(base, params) {
    const qs = Object.keys(params || {})
      .filter(key => params[key])
      .map(key => `${key}=${encodeURIComponent(params[key])}`)
      .join("&");
    return `${base}index.html${qs ? "?" + qs : ""}#request`;
  }

  function sectorHref(base, sector) {
    return sector.page ? `${base}sectors/${sector.slug}/` : requestHref(base, { sector: sector.slug });
  }

  function requestParams(entry, problemId) {
    const params = {};
    if (entry.ownerType === "sector") params.sector = entry.owner.slug;
    params.solution = entry.sol.id;
    if (problemId) params.problem = problemId;
    return params;
  }

  /* ctx: { base, idx, showOwner, ownerLink, problem, headingTag } */
  function solutionCard(entry, ctx) {
    const { sol, owner, ownerType } = entry;
    const base = ctx.base || "";
    const tag = ctx.headingTag || "h3";
    const cat = ctx.idx.categories[sol.cat];
    const items = (sol.items || []).map(item => `<li>${esc(item)}</li>`).join("");
    const params = requestParams(entry, ctx.problem);
    const ownerLink = ctx.ownerLink && ownerType === "sector" && owner.page
      ? `<a class="sol-link" href="${sectorHref(base, owner)}">كل حلول ${esc(owner.name)}</a>`
      : "";

    return `<article class="sol-card" data-solution="${esc(sol.id)}">
  <div class="sol-meta"><span class="sol-cat">${esc(cat ? cat.en : "")}</span>${ctx.showOwner ? `<span class="sol-owner">${esc(owner.name)}</span>` : ""}</div>
  <${tag}>${esc(sol.title)}</${tag}>
  <p>${esc(sol.desc)}</p>
  ${items ? `<ul class="sol-items">${items}</ul>` : ""}
  <div class="sol-actions"><a class="btn btn-primary btn-sm" href="${requestHref(base, params)}" data-request="${esc(JSON.stringify(params))}">أريد هذا الحل <span aria-hidden="true">←</span></a>${ownerLink}</div>
</article>`;
  }

  // Sectors with a page open it (or an inline panel on the home page). The one
  // without a page ("قطاع مخصص / نشاط آخر") goes straight to the request form.
  function sectorTile(sector, n, base) {
    const request = sector.page ? "" : ` data-request="${esc(JSON.stringify({ sector: sector.slug }))}"`;
    return `<a class="sector-tile${sector.page ? "" : " is-custom"}" href="${sectorHref(base, sector)}" data-sector="${esc(sector.slug)}"${request}>
  <span class="sector-num">${pad(n)}</span>
  <strong>${esc(sector.name)}</strong>
  <small>${esc(sector.short)}</small>
</a>`;
  }

  function problemCard(problem, n, base) {
    return `<a class="problem-pick" href="${requestHref(base, { problem: problem.id })}" data-problem="${esc(problem.id)}">
  <span>${pad(n)}</span>
  <strong>${esc(problem.title)}</strong>
</a>`;
  }

  return { esc, pad, index, requestHref, sectorHref, requestParams, solutionCard, sectorTile, problemCard };
});
