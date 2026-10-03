#!/usr/bin/env node
/* ================================================================
   URUKQI static page builder (no dependencies).

   Source of truth: assets/js/catalog-data.js
   Shared markup:   assets/js/catalog-render.js

   Run after editing the catalog, the header/footer, or this file:
       node tools/build-pages.js

   It (1) refreshes the generated regions inside index.html, marked
   <!-- build:NAME --> … <!-- /build:NAME -->, and (2) writes
   solutions/, sectors/, sectors/<slug>/, automation/ and trade/
   (the last two wrap tools/partials/*.html), plus sitemap.xml when
   SITE_URL is set.
   All links are relative so the site works under the GitHub Pages
   sub-path (/URUKQI/) as well as on a root domain.
   ================================================================ */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
// Official public address (owner decision): used for canonical, og:url, structured
// data and sitemap.xml. GitHub Pages may serve a mirror but is never canonical.
// Must end with "/". If emptied, no canonical / og:url / sitemap is emitted.
const SITE_URL = "https://urukqi.pages.dev/";
const catalog = require(path.join(ROOT, "assets/js/catalog-data.js"));
const R = require(path.join(ROOT, "assets/js/catalog-render.js"));
const idx = R.index(catalog);
const { esc } = R;

const WA = `https://wa.me/${catalog.contact.whatsapp}`;

// Social preview (1200x630) and browser icons, shared by every page.
const OG_IMAGE = "assets/brand/og-urukqi.jpg";
const OG_IMAGE_ALT = "URUKQI — مهما كان نشاطك، نبني النظام الذي يناسب طريقة عملك.";

function iconLinks(base) {
  return `<link rel="icon" href="${base}favicon.ico" sizes="any">
  <link rel="icon" type="image/png" sizes="32x32" href="${base}assets/brand/favicon-32.png">
  <link rel="apple-touch-icon" href="${base}assets/brand/apple-touch-icon.png">`;
}

function socialMeta(title, description) {
  if (!SITE_URL) return "";
  return [
    `  <meta property="og:image" content="${SITE_URL}${OG_IMAGE}">`,
    '  <meta property="og:image:type" content="image/jpeg">',
    '  <meta property="og:image:width" content="1200">',
    '  <meta property="og:image:height" content="630">',
    `  <meta property="og:image:alt" content="${esc(OG_IMAGE_ALT)}">`,
    '  <meta name="twitter:card" content="summary_large_image">',
    `  <meta name="twitter:title" content="${esc(title)}">`,
    `  <meta name="twitter:description" content="${esc(description)}">`,
    `  <meta name="twitter:image" content="${SITE_URL}${OG_IMAGE}">`
  ].join("\n");
}
const pageSectors = catalog.sectors.filter(s => s.page);

/* ---------------- shared chrome ---------------- */

function linker(base, isHome) {
  return anchor => (isHome ? `#${anchor}` : `${base}index.html#${anchor}`);
}

const solutionMenu = [
  { anchor: "systems", title: "الأنظمة", sub: "إدارة · مبيعات · مخزون · موارد بشرية — Windows وWeb" },
  { anchor: "web", title: "المواقع وأنظمة الويب", sub: "مواقع · متاجر · حجوزات · بوابات" },
  { anchor: "apps", title: "التطبيقات", sub: "تطبيقات العملاء والموظفين والمندوبين" },
  { anchor: "automation", title: "الأتمتة والذكاء الاصطناعي", sub: "WhatsApp · تنبيهات · تكامل · مساعدات AI", href: "automation/" }
];

function header(base, isHome) {
  const link = linker(base, isHome);
  const home = isHome ? "#home" : `${base}index.html`;
  const solLinks = solutionMenu.map(m =>
    `<a href="${base}${m.href || `solutions/#${m.anchor}`}"><b>${esc(m.title)}</b><small>${esc(m.sub)}</small></a>`).join("\n          ");
  const sectorLinks = pageSectors.map(s =>
    `<a href="${base}sectors/${s.slug}/">${esc(s.name)}</a>`).join("\n          ");
  const mobileSol = solutionMenu.map(m => `<a href="${base}${m.href || `solutions/#${m.anchor}`}">${esc(m.title)}</a>`).join("\n        ");
  const mobileSectors = pageSectors.map(s => `<a href="${base}sectors/${s.slug}/">${esc(s.name)}</a>`).join("\n        ");

  return `<header class="header" id="header">
    <div class="container header-inner">

      <a href="${home}" class="brand">
        <span class="brand-mark">𒀀</span>
        <span class="brand-name">URUKQI</span>
      </a>

      <nav class="nav" aria-label="القائمة الرئيسية">
        <div class="nav-group">
          <button type="button" class="nav-trigger" aria-expanded="false" aria-controls="navSolutions">الحلول <span aria-hidden="true">▾</span></button>
          <div class="nav-drop" id="navSolutions">
          ${solLinks}
          <a href="${base}automation/#plans"><b>باقات الأتمتة</b><small>START · GROWTH · CUSTOM — لخدمات الأتمتة فقط</small></a>
          <a class="nav-drop-all" href="${base}solutions/">كل الحلول <span aria-hidden="true">←</span></a>
          </div>
        </div>
        <div class="nav-group">
          <button type="button" class="nav-trigger" aria-expanded="false" aria-controls="navSectors">القطاعات <span aria-hidden="true">▾</span></button>
          <div class="nav-drop nav-mega" id="navSectors">
          ${sectorLinks}
          <a class="nav-drop-all" href="${base}sectors/">كل القطاعات <span aria-hidden="true">←</span></a>
          </div>
        </div>
        <a href="${link("finder")}">حسب المشكلة</a>
        <a href="${link("products")}">منتجات URUKQI</a>
        <a href="${link("process")}">كيف نعمل</a>
        <a href="${link("contact")}">تواصل معنا</a>
      </nav>

      <a href="${link("request")}" class="header-cta">
        اطلب نظامك
      </a>

      <button class="mobile-menu" id="mobileMenu" type="button" aria-label="فتح القائمة" aria-expanded="false" aria-controls="mobileNav">
        ☰
      </button>

    </div>

    <div class="mobile-nav" id="mobileNav">
      <a href="${home}">الرئيسية</a>
      <details>
        <summary>الحلول</summary>
        ${mobileSol}
        <a href="${base}automation/#plans">باقات الأتمتة</a>
        <a href="${base}solutions/">كل الحلول</a>
      </details>
      <details>
        <summary>القطاعات</summary>
        ${mobileSectors}
        <a href="${base}sectors/">كل القطاعات</a>
      </details>
      <a href="${link("finder")}">ما المشكلة التي تريد حلها؟</a>
      <a href="${link("products")}">منتجات URUKQI</a>
      <a href="${link("process")}">كيف نعمل</a>
      <a href="${link("request")}">اطلب نظامك</a>
      <a href="${link("contact")}">تواصل معنا</a>
    </div>
  </header>`;
}

function footer(base, isHome) {
  const link = linker(base, isHome);
  return `<footer>

    <div class="container footer-inner">

      <div class="footer-brand">

        <div class="brand">
          <span class="brand-mark">𒀀</span>
          <span class="brand-name">URUKQI</span>
        </div>

        <p>
          أنظمة برمجية وحلول رقمية للأعمال.
        </p>

      </div>


      <div class="footer-links">

        <a href="${base}solutions/">الحلول</a>
        <a href="${base}sectors/">القطاعات</a>
        <a href="${base}automation/">الأتمتة</a>
        <a href="${link("request")}">اطلب نظامك</a>
        <a href="${base}privacy.html">سياسة الخصوصية</a>
        <a href="${base}terms.html">شروط الخدمة</a>
        <a href="${base}support.html">سياسة الدعم</a>
        <a href="${link("contact")}">تواصل معنا</a>

      </div>


      <div class="copyright">
        © 2026 URUKQI
      </div>

    </div>

  </footer>`;
}

const ANALYTICS = `<!-- Cloudflare Web Analytics --><script type='module' src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{"token": "9511bfb5abc0432ba56cabd568b63f39"}'></script><!-- End Cloudflare Web Analytics -->`;

function page({ base, urlPath, title, description, breadcrumb, body, scripts, styles }) {
  const canonical = SITE_URL ? SITE_URL + urlPath : "";
  const crumbs = breadcrumb && SITE_URL ? `
  <script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumb.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: SITE_URL + c.path }))
  })}</script>` : "";
  const js = ["script.js"].concat(scripts || []).map(src => `  <script src="${base}${src}" defer></script>`).join("\n");

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
${canonical ? `  <link rel="canonical" href="${canonical}">\n` : ""}  <meta property="og:type" content="website">
  <meta property="og:site_name" content="URUKQI">
  <meta property="og:locale" content="ar_IQ">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
${canonical ? `  <meta property="og:url" content="${canonical}">\n` : ""}
${socialMeta(title, description)}
  ${iconLinks(base)}
  <link rel="stylesheet" href="${base}style.css">
  <link rel="stylesheet" href="${base}mission15.css">
  <link rel="stylesheet" href="${base}catalog.css">${(styles || []).map(css => `\n  <link rel="stylesheet" href="${base}${css}">`).join("")}${crumbs}
</head>

<body class="subpage">

  <!-- Generated by tools/build-pages.js from assets/js/catalog-data.js — edit the data, not this file. -->

  ${header(base, false)}

  <main>
${body}
  </main>

  ${footer(base, false)}

${js}

${ANALYTICS}
</body>
</html>
`;
}

function breadcrumbNav(base, trail) {
  return `<nav class="breadcrumb" aria-label="مسار الصفحة">${trail.map((c, i) =>
    i === trail.length - 1
      ? `<span aria-current="page">${esc(c.name)}</span>`
      : `<a href="${base}${c.href}">${esc(c.name)}</a><span aria-hidden="true">/</span>`).join("")}</nav>`;
}

const processStrip = `
    <section class="section page-process">
      <div class="container">
        <div class="section-heading centered">
          <div class="section-kicker">HOW WE WORK</div>
          <h2>ندرس عملك أولًا. <span>ثم نبني.</span></h2>
          <p>قبل أي تنفيذ نقدم لك عرضًا واضحًا بالنطاق والمدة والتكلفة.</p>
        </div>
        <div class="process-line"><span>نحلل</span><b>←</b><span>نبني / نركّب</span><b>←</b><span>نختبر</span><b>←</b><span>ندرّب</span><b>←</b><span>نشغّل</span><b>←</b><span>نتابع</span></div>
      </div>
    </section>`;

function finalCta(base, params, text) {
  return `
    <section class="final-cta page-cta">
      <div class="final-grid"></div>
      <div class="container">
        <div class="final-content">
          <div class="section-kicker">YOUR BUSINESS · YOUR PROBLEM · YOUR SYSTEM</div>
          <h2>لم تجد ما تحتاجه؟ <span>أخبرنا كيف يعمل نشاطك.</span></h2>
          <p>${esc(text || "لكل عمل طريقة مختلفة. أخبرنا بالمشكلة أو العملية التي تريد تنظيمها، وسندرسها ونقترح النظام المناسب لها.")}</p>
          <div class="final-actions">
            <a href="${R.requestHref(base, params || {})}" class="btn btn-primary">اطلب نظامك <span aria-hidden="true">←</span></a>
            <a href="${WA}" target="_blank" rel="noopener" class="btn btn-secondary">تحدث معنا عبر WhatsApp</a>
          </div>
          <small>لا تحتاج إلى معرفة أي مصطلح تقني. فقط أخبرنا بالمشكلة.</small>
        </div>
      </div>
    </section>`;
}

const customNote = `<p class="custom-note">هذه حلول نبنيها أو نخصصها بعد دراسة طريقة عملك، وليست برامج جاهزة للتنزيل. منتجات URUKQI الحالية موضحة في قسم <a href="{{base}}index.html#products">منتجات URUKQI</a>.</p>`;

/* ---------------- sector page ---------------- */

function sectorPage(sector) {
  const base = "../../";
  const cards = sector.solutions.map(sol => R.solutionCard(idx.solutions[sol.id],
    { base, idx, showOwner: false, ownerLink: false, headingTag: "h3" })).join("\n");
  const examples = sector.examples
    ? `<div class="page-examples"><span>أمثلة على الأنشطة:</span><ul class="sector-examples">${sector.examples.map(e => `<li>${esc(e)}</li>`).join("")}</ul></div>` : "";
  const note = sector.note ? `<p class="sector-note">${esc(sector.note)}</p>` : "";
  const others = pageSectors.filter(s => s.slug !== sector.slug);
  const start = others.findIndex(s => pageSectors.indexOf(s) > pageSectors.indexOf(sector));
  const related = others.slice(Math.max(start, 0)).concat(others).slice(0, 4);

  const body = `
    <section class="page-hero">
      <div class="container">
        ${breadcrumbNav(base, [{ name: "الرئيسية", href: "index.html" }, { name: "القطاعات", href: "sectors/" }, { name: sector.name }])}
        <div class="section-kicker">${esc(sector.en)}</div>
        <h1>أنظمة ${esc(sector.name)} <span>تُبنى حسب طريقة عملك.</span></h1>
        <p class="page-lead">${esc(sector.intro)}</p>
        ${examples}
        ${note}
        <div class="hero-actions">
          <a href="${R.requestHref(base, { sector: sector.slug })}" class="btn btn-primary">اطلب نظامًا لنشاطك <span aria-hidden="true">←</span></a>
          <a href="#sector-solutions" class="btn btn-secondary">شاهد الحلول</a>
        </div>
      </div>
    </section>

    <section class="section page-section" id="sector-solutions">
      <div class="container">
        <div class="section-heading">
          <div class="section-kicker">SOLUTIONS</div>
          <h2>ماذا يمكن أن نبني لقطاع ${esc(sector.name)}؟</h2>
          <p>اختر الحل الأقرب لعملك واضغط «أريد هذا الحل»، وسيُفتح لك نموذج الطلب واختيارك معبأ مسبقًا.</p>
        </div>
        <div class="sol-grid">
${cards}
        </div>
        ${customNote.replace("{{base}}", base)}
      </div>
    </section>
${processStrip}

    <section class="section page-related">
      <div class="container">
        <div class="section-heading">
          <div class="section-kicker">MORE SECTORS</div>
          <h2>قطاعات أخرى</h2>
        </div>
        <div class="sector-grid-x">
${related.map(s => R.sectorTile(s, pageSectors.indexOf(s) + 1, base)).join("\n")}
        </div>
        <p class="page-more"><a href="${base}sectors/">كل القطاعات <span aria-hidden="true">←</span></a></p>
      </div>
    </section>
${finalCta(base, { sector: sector.slug })}`;

  return page({
    base,
    urlPath: `sectors/${sector.slug}/`,
    title: sector.seoTitle,
    description: sector.seoDesc,
    breadcrumb: [{ name: "الرئيسية", path: "" }, { name: "القطاعات", path: "sectors/" }, { name: sector.name, path: `sectors/${sector.slug}/` }],
    body
  });
}

/* ---------------- sectors index ---------------- */

function sectorsIndex() {
  const base = "../";
  const tiles = catalog.sectors.map((s, i) => R.sectorTile(s, i + 1, base)).join("\n");
  const body = `
    <section class="page-hero">
      <div class="container">
        ${breadcrumbNav(base, [{ name: "الرئيسية", href: "index.html" }, { name: "القطاعات" }])}
        <div class="section-kicker">SOLUTIONS BY SECTOR</div>
        <h1>اختر قطاعك. <span>وشاهد ما يمكن أن نبنيه لك.</span></h1>
        <p class="page-lead">لكل قطاع عملياته الخاصة. اختر نشاطك لتشاهد الأنظمة والمواقع والتطبيقات والأتمتة التي يمكن أن نبنيها أو نخصصها له — وإن لم تجد نشاطك، أخبرنا عنه.</p>
      </div>
    </section>

    <section class="section page-section">
      <div class="container">
        <div class="sector-grid-x">
${tiles}
        </div>
        <p class="page-more"><a href="${base}solutions/">أو ابحث في كل الحلول <span aria-hidden="true">←</span></a> · <a href="${base}index.html#finder">أو ابدأ من المشكلة التي تريد حلها <span aria-hidden="true">←</span></a></p>
      </div>
    </section>
${processStrip}
${finalCta(base, {})}`;

  return page({
    base,
    urlPath: "sectors/",
    title: "حلول برمجية حسب القطاع — تجارة، توزيع، مطاعم، عيادات، مدارس، مقاولات | URUKQI",
    description: "اختر قطاع عملك وشاهد الأنظمة والمواقع والتطبيقات والأتمتة التي تبنيها URUKQI للأعمال في العراق: التجارة، التوزيع، المطاعم، الصحة، التعليم، المقاولات، العقارات، الخدمات وغيرها.",
    breadcrumb: [{ name: "الرئيسية", path: "" }, { name: "القطاعات", path: "sectors/" }],
    body
  });
}

/* ---------------- solutions index ---------------- */

function serviceCards(slug, base) {
  const service = catalog.services.find(s => s.slug === slug);
  return service.solutions.map(sol => R.solutionCard(idx.solutions[sol.id],
    { base, idx, showOwner: false, ownerLink: false })).join("\n");
}

function solutionsIndex() {
  const base = "../";
  const service = slug => catalog.services.find(s => s.slug === slug);
  const chips = [`<button type="button" class="cat-chip" data-cat-filter="all" aria-pressed="true">الكل</button>`]
    .concat(catalog.categories.map(c => `<button type="button" class="cat-chip" data-cat-filter="${c.id}" aria-pressed="false">${esc(c.name)}</button>`))
    .join("\n            ");
  const sectorTiles = pageSectors.map((s, i) => R.sectorTile(s, i + 1, base)).join("\n");

  const block = (id, kicker, title, span, intro, inner) => `
        <section class="solutions-block" id="${id}" aria-labelledby="${id}-title">
          <div class="section-heading">
            <div class="section-kicker">${kicker}</div>
            <h2 id="${id}-title">${title} <span>${span}</span></h2>
            <p>${intro}</p>
          </div>
${inner}
        </section>`;

  const body = `
    <section class="page-hero">
      <div class="container">
        ${breadcrumbNav(base, [{ name: "الرئيسية", href: "index.html" }, { name: "الحلول" }])}
        <div class="section-kicker">ALL SOLUTIONS</div>
        <h1>كل ما يمكن أن نبنيه <span>لعملك في مكان واحد.</span></h1>
        <p class="page-lead">أنظمة أعمال، برامج مكتبية، أنظمة ويب، تطبيقات، مواقع ومتاجر، أتمتة وذكاء اصطناعي. ابحث بكلمة أو تصفح حسب النوع.</p>
        <nav class="cat-jump" aria-label="أنواع الحلول">${solutionMenu.map(m => `<a href="#${m.anchor}">${esc(m.title)}</a>`).join("")}<a href="${base}sectors/">حسب القطاع</a><a href="${base}index.html#finder">حسب المشكلة</a></nav>
      </div>
    </section>

    <section class="section page-section explorer" data-explorer data-base="${base}">
      <div class="container">
        <form class="explorer-search" role="search" data-explorer-form>
          <label for="catalogSearch">ابحث عن حل</label>
          <div class="explorer-field">
            <input id="catalogSearch" type="search" placeholder="مثال: مخزون، مطعم، مدرسة، مندوب، حجوزات، ديون، توصيل…" autocomplete="off" data-explorer-input>
            <button type="submit" class="btn btn-primary btn-sm">بحث</button>
          </div>
          <div class="cat-chips" role="group" aria-label="تصفية حسب نوع الحل">
            ${chips}
          </div>
        </form>

        <div class="explorer-results" data-explorer-results aria-live="polite" hidden></div>

        <div data-explorer-browse>
${block("systems", "BUSINESS SYSTEMS", "الأنظمة", "إدارة عملك من الداخل.",
  "نبني الأنظمة كبرامج Windows مكتبية تعمل محليًا، أو أنظمة ويب سحابية تعمل من أي مكان، أو الاثنين معًا — حسب طبيعة عملك. هذه أنظمة الموارد البشرية التي تناسب أي نشاط، وأنظمة كل قطاع موجودة في صفحته.",
  `          <h3 class="block-sub">${esc(service("hr").name)}</h3>
          <div class="sol-grid">
${serviceCards("hr", base)}
          </div>
          <h3 class="block-sub">أنظمة حسب القطاع</h3>
          <div class="sector-grid-x">
${sectorTiles}
          </div>`)}
${block("web", "WEBSITES & WEB SYSTEMS", "المواقع وأنظمة الويب", "مرتبطة بعملك الفعلي.", esc(service("web").intro),
  `          <div class="sol-grid">
${serviceCards("web", base)}
          </div>`)}
${block("apps", "MOBILE APPLICATIONS", "التطبيقات", "لعملائك وفريقك وإدارتك.", esc(service("apps").intro),
  `          <div class="sol-grid">
${serviceCards("apps", base)}
          </div>`)}
${block("automation", "AUTOMATION & AI", "الأتمتة والذكاء الاصطناعي", "نتيجة عملية، لا سحر.", esc(service("automation").intro),
  `          <div class="sol-grid">
${serviceCards("automation", base)}
          </div>
          <p class="page-more"><a href="${base}automation/">صفحة الأتمتة: أمثلة المنظومة وطريقة عملها <span aria-hidden="true">←</span></a> · <a href="${base}automation/#plans">باقات الأتمتة (لخدمات الأتمتة فقط) <span aria-hidden="true">←</span></a></p>`)}
          ${customNote.replace("{{base}}", base)}
        </div>
      </div>
    </section>
${processStrip}
${finalCta(base, {})}`;

  return page({
    base,
    urlPath: "solutions/",
    title: "حلول URUKQI — أنظمة أعمال، مواقع، تطبيقات، أتمتة وذكاء اصطناعي",
    description: "كتالوج حلول URUKQI للأعمال في العراق: أنظمة إدارة ومبيعات ومخزون وموارد بشرية، برامج Windows وأنظمة ويب، مواقع ومتاجر وبوابات، تطبيقات موبايل، أتمتة WhatsApp والتكامل والذكاء الاصطناعي.",
    breadcrumb: [{ name: "الرئيسية", path: "" }, { name: "الحلول", path: "solutions/" }],
    body,
    scripts: ["assets/js/catalog-data.js", "assets/js/catalog-render.js", "assets/js/catalog.js"]
  });
}

/* ---------------- pages built from moved homepage sections ---------------- */

// Partials were moved verbatim from the homepage. Rebase their relative links:
// assets/… and legal pages get the base prefix; #anchors that do not exist in
// the partial point back to the homepage.
function rebase(html, base) {
  const own = new Set([...html.matchAll(/ id="([^"]+)"/g)].map(m => m[1]));
  return html
    .replace(/^<!--[^\n]*-->\n/, "")
    .replace(/(src|href)="(assets\/|privacy\.html|terms\.html|support\.html)/g, (_, a, p) => `${a}="${base}${p}`)
    .replace(/href="#([^"]+)"/g, (m, id) => (own.has(id) ? m : `href="${base}index.html#${id}"`));
}

function partial(name, base) {
  return rebase(fs.readFileSync(path.join(__dirname, "partials", name), "utf8"), base);
}

function automationPage() {
  const base = "../";
  const automation = catalog.services.find(s => s.slug === "automation");
  const cards = automation.solutions.map(sol => R.solutionCard(idx.solutions[sol.id],
    { base, idx, showOwner: false, ownerLink: false })).join("\n");
  const body = `
    <section class="page-hero">
      <div class="container">
        ${breadcrumbNav(base, [{ name: "الرئيسية", href: "index.html" }, { name: "الحلول", href: "solutions/" }, { name: "الأتمتة والذكاء الاصطناعي" }])}
        <div class="section-kicker">AUTOMATION &amp; AI</div>
        <h1>الأتمتة والذكاء الاصطناعي <span>أقل عمل يدوي، ومتابعة لا تضيع.</span></h1>
        <p class="page-lead">${esc(automation.intro)}</p>
        <nav class="cat-jump" aria-label="في هذه الصفحة"><a href="#automation-solutions">الحلول</a><a href="#demo">شاهد المنظومة</a><a href="#workflow">كيف تعمل</a><a href="#plans">باقات الأتمتة</a><a href="#automation-faq">أسئلة</a></nav>
        <div class="hero-actions">
          <a href="${R.requestHref(base, { need: "automation" })}" class="btn btn-primary">أريد حل أتمتة <span aria-hidden="true">←</span></a>
          <a href="#plans" class="btn btn-secondary">باقات الأتمتة</a>
        </div>
      </div>
    </section>

    <section class="section page-section" id="automation-solutions">
      <div class="container">
        <div class="section-heading">
          <div class="section-kicker">SOLUTIONS</div>
          <h2>ماذا يمكن أن نؤتمت لك؟</h2>
          <p>اختر الحل الأقرب لعملك واضغط «أريد هذا الحل»، وسيُفتح لك نموذج الطلب واختيارك معبأ مسبقًا.</p>
        </div>
        <div class="sol-grid">
${cards}
        </div>
      </div>
    </section>

${partial("automation.html", base)}
${finalCta(base, { need: "automation" }, "أخبرنا بالعمل الذي يتكرر يوميًا ويستهلك وقت فريقك، وسندرس إن كان من الممكن تحويله إلى مسار تلقائي.")}`;

  return page({
    base,
    urlPath: "automation/",
    title: "الأتمتة والذكاء الاصطناعي — أتمتة WhatsApp وخدمة العملاء والتقارير | URUKQI",
    description: "حلول الأتمتة والذكاء الاصطناعي من URUKQI: أتمتة WhatsApp وخدمة العملاء، متابعة العملاء المحتملين، الفواتير والتذكيرات والتنبيهات، ربط الأنظمة، ومساعدات ذكية تجيب من معلومات نشاطك. مع باقات الأتمتة.",
    breadcrumb: [{ name: "الرئيسية", path: "" }, { name: "الحلول", path: "solutions/" }, { name: "الأتمتة والذكاء الاصطناعي", path: "automation/" }],
    body
  });
}

function tradePage() {
  const base = "../";
  const body = `
    <section class="page-crumbs">
      <div class="container">
        ${breadcrumbNav(base, [{ name: "الرئيسية", href: "index.html" }, { name: "منتجات URUKQI", href: "index.html#products" }, { name: "URUKQI Trade" }])}
      </div>
    </section>

${partial("trade.html", base)}
${finalCta(base, { sector: "retail" }, "تحتاج نظامًا مختلفًا عن URUKQI Trade أو مخصصًا لطريقة عملك؟ أخبرنا وسندرس احتياجك.")}`;

  return page({
    base,
    urlPath: "trade/",
    title: "URUKQI Trade — برنامج إدارة التجارة والمخزون والديون (قيد التطوير) | URUKQI",
    description: "URUKQI Trade برنامج Windows قيد التطوير لإدارة التجارة: المبيعات والفواتير، المخزون والجرد، ديون العملاء والموردين، المصروفات والأرباح، ومنظومة استيراد الصين. شراء مرة واحدة، والأسعار تُعلن عند الإطلاق.",
    breadcrumb: [{ name: "الرئيسية", path: "" }, { name: "URUKQI Trade", path: "trade/" }],
    body,
    styles: ["trade.css"]
  });
}

/* ---------------- index.html generated regions ---------------- */

function homeRegions(html) {
  const base = "";
  const meta = name => ((html.match(new RegExp(`<meta property="og:${name}" content="([^"]*)"`)) || [])[1] || "");
  const unesc = v => v.replace(/&quot;/g, '"').replace(/&amp;/g, "&");
  const automation = catalog.services.find(s => s.slug === "automation");
  return {
    "canonical": [
      SITE_URL ? `  <link rel="canonical" href="${SITE_URL}">\n  <meta property="og:url" content="${SITE_URL}">` : "",
      socialMeta(unesc(meta("title")), unesc(meta("description"))),
      `  ${iconLinks(base)}`,
      `  <script type="application/ld+json">${JSON.stringify(Object.assign({ "@context": "https://schema.org", "@type": "Organization", name: "URUKQI" },
        SITE_URL ? { url: SITE_URL } : {},
        { email: catalog.contact.email, telephone: "+" + catalog.contact.whatsapp, areaServed: "IQ",
          description: "أنظمة برمجية وحلول رقمية للأعمال: أنظمة إدارة، برامج مكتبية، أنظمة ويب، تطبيقات، مواقع ومتاجر، أتمتة وذكاء اصطناعي." }))}</script>`
    ].filter(Boolean).join("\n"),
    "site-header": header(base, true),
    "site-footer": footer(base, true),
    "sector-tiles": catalog.sectors.map((s, i) => R.sectorTile(s, i + 1, base)).join("\n"),
    "problem-cards": catalog.problems.map((p, i) => R.problemCard(p, i + 1, base)).join("\n"),
    "request-sector-options": ['<option value="">اختر نشاطك</option>']
      .concat(catalog.sectors.map(s => `<option value="${s.slug}">${esc(s.name)}</option>`)).join("\n"),
    "product-cards": catalog.products.map(p => `<article class="product-card">
  <span class="product-status is-${p.statusKind}">${esc(p.status)}</span>
  <h4>${esc(p.name)}</h4>
  <p>${esc(p.desc)}</p>
  <a href="${p.href}">${esc(p.linkText)} <span aria-hidden="true">←</span></a>
</article>`).join("\n"),
    // Homepage preview: the two headline capabilities of each automation group (full list on automation/).
    "automation-chips": automation.solutions.flatMap(sol => sol.items.slice(0, 2)).map(item => `<li>${esc(item)}</li>`).join("")
  };
}

function injectRegions(html, regions) {
  for (const [name, content] of Object.entries(regions)) {
    const re = new RegExp(`(<!-- build:${name} -->)[\\s\\S]*?(<!-- /build:${name} -->)`);
    if (!re.test(html)) throw new Error(`index.html is missing the build:${name} region`);
    html = html.replace(re, (_, open, close) => `${open}\n${content}\n${close}`);
  }
  return html;
}

/* ---------------- write ---------------- */

function write(rel, content) {
  const file = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, "utf8");
  return rel;
}

function checkCatalog() {
  const ids = new Set();
  const all = catalog.sectors.concat(catalog.services);
  all.forEach(owner => owner.solutions.forEach(sol => {
    if (ids.has(sol.id)) throw new Error(`duplicate solution id ${sol.id}`);
    if (!idx.categories[sol.cat]) throw new Error(`unknown category ${sol.cat} on ${sol.id}`);
    ids.add(sol.id);
  }));
  catalog.problems.forEach(p => p.solutions.forEach(id => {
    if (!ids.has(id)) throw new Error(`problem ${p.id} references unknown solution ${id}`);
  }));
}

function main() {
  checkCatalog();
  const written = [];

  const indexFile = path.join(ROOT, "index.html");
  const html = fs.readFileSync(indexFile, "utf8");
  fs.writeFileSync(indexFile, injectRegions(html, homeRegions(html)), "utf8");
  written.push("index.html (generated regions)");

  written.push(write("sectors/index.html", sectorsIndex()));
  pageSectors.forEach(s => written.push(write(`sectors/${s.slug}/index.html`, sectorPage(s))));
  written.push(write("solutions/index.html", solutionsIndex()));
  written.push(write("automation/index.html", automationPage()));
  written.push(write("trade/index.html", tradePage()));

  const sitemapFile = path.join(ROOT, "sitemap.xml");
  if (!SITE_URL) {
    if (fs.existsSync(sitemapFile)) fs.unlinkSync(sitemapFile);
    written.push("(sitemap.xml skipped — SITE_URL not set)");
    console.log(`Built ${written.length} outputs:\n  ` + written.join("\n  "));
    return;
  }
  const today = new Date().toISOString().slice(0, 10);
  const urls = ["", "solutions/", "sectors/", "automation/", "trade/"].concat(pageSectors.map(s => `sectors/${s.slug}/`));
  written.push(write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${SITE_URL}${u}</loc><lastmod>${today}</lastmod></url>`).join("\n")}
</urlset>
`));

  console.log(`Built ${written.length} outputs:\n  ` + written.join("\n  "));
}

main();
