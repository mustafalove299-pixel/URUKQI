#!/usr/bin/env node
/* ================================================================
   URUKQI static page builder (no dependencies).

   Source of truth: assets/js/catalog-data.js
   Shared markup:   assets/js/catalog-render.js

   Run after editing the catalog, the header/footer, or this file:
       node tools/build-pages.js

   It (1) refreshes the generated regions inside index.html, marked
   <!-- build:NAME --> … <!-- /build:NAME -->, and (2) writes
   solutions/, products/, contact/, sectors/, sectors/<slug>/,
   automation/ and trade/ (the last two wrap tools/partials/*.html),
   re-wraps the legal pages, plus sitemap.xml when SITE_URL is set.
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
const ICONS = require(path.join(__dirname, "art/icons.js"));
const idx = R.index(catalog);
const { esc } = R;

const WA = `https://wa.me/${catalog.contact.whatsapp}`;
const MAIL = `mailto:${catalog.contact.email}?subject=${encodeURIComponent("استفسار عن URUKQI")}`;
const TEL = `tel:+${catalog.contact.whatsapp}`;

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
const solutionCount = Object.keys(idx.solutions).length;

/* ---------------- small helpers ---------------- */

function ico(name, cls) {
  return `<svg class="ico${cls ? " " + cls : ""}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${ICONS[name]}"/></svg>`;
}

const ARROW = ico("arrow", "ico-arrow");

// Responsive image: the largest file has no width suffix (see tools/art/render.js).
function art(base, name, widths, opts) {
  const o = opts || {};
  const [largest] = widths;
  const file = w => `${base}assets/art/${name}${w === largest ? "" : "-" + w}.webp`;
  const srcset = widths.length > 1 ? ` srcset="${widths.map(w => `${file(w)} ${w}w`).join(", ")}" sizes="${o.sizes || "100vw"}"` : "";
  const fallback = widths[Math.min(1, widths.length - 1)];
  return `<img src="${file(fallback)}"${srcset} width="${o.w || largest}" height="${o.h || Math.round(largest * 9 / 16)}" alt="${esc(o.alt || "")}"${o.eager ? ' fetchpriority="high"' : ' loading="lazy"'} decoding="async"${o.attrs ? " " + o.attrs : ""}>`;
}

const HERO_WIDTHS = [2560, 1600, 960];

function linker(base, isHome) {
  return anchor => (isHome ? `#${anchor}` : `${base}index.html#${anchor}`);
}

const solutionMenu = [
  { anchor: "systems", title: "الأنظمة", sub: "إدارة · مبيعات · مخزون · موارد بشرية — Windows وWeb" },
  { anchor: "web", title: "المواقع وأنظمة الويب", sub: "مواقع · متاجر · حجوزات · بوابات" },
  { anchor: "apps", title: "التطبيقات", sub: "تطبيقات العملاء والموظفين والمندوبين" },
  { anchor: "automation", title: "الأتمتة والذكاء الاصطناعي", sub: "WhatsApp · تنبيهات · تكامل · مساعدات AI", href: "automation/" }
];

// The six real service lines, each with its own cinematic panel.
const SERVICE_PANELS = [
  { art: "svc-systems", icon: "systems", en: "BUSINESS SYSTEMS", title: "أنظمة الأعمال والإدارة", text: "مبيعات، مخزون، حسابات وديون، موارد بشرية، ERP وCRM.", href: "solutions/#systems" },
  { art: "svc-desktop", icon: "desktop", en: "DESKTOP SOFTWARE", title: "برامج مكتبية Windows", text: "برامج تعمل على أجهزتك محليًا، مع إمكانية الربط عند الحاجة.", href: "solutions/#systems" },
  { art: "svc-web", icon: "web", en: "WEB SYSTEMS", title: "أنظمة الويب والبوابات", text: "أنظمة سحابية تعمل من أي مكان، وبوابات للعملاء والموظفين والموردين.", href: "solutions/#web" },
  { art: "svc-apps", icon: "apps", en: "MOBILE APPS", title: "تطبيقات الموبايل", text: "تطبيقات لعملائك، ولمندوبيك وفنييك وسائقيك، وللإدارة.", href: "solutions/#apps" },
  { art: "svc-stores", icon: "stores", en: "WEBSITES & STORES", title: "المواقع والمتاجر", text: "مواقع ومتاجر وحجوزات مرتبطة بنظام عملك، لا صفحات تعريفية فقط.", href: "solutions/#web" },
  { art: "svc-automation", icon: "automation", en: "AUTOMATION & AI", title: "الأتمتة والذكاء الاصطناعي", text: "WhatsApp، تنبيهات وتقارير تلقائية، ربط الأنظمة، ومساعدات ذكية.", href: "automation/" }
];

// The real six stages of the URUKQI process.
const STEPS = [
  { icon: "doc", title: "نحلل", text: "نفهم طريقة عملك والمشكلة على أرض الواقع، ونحدد ما يحتاجه النظام فعلًا.", gets: "عرض واضح بالنطاق والمدة والتكلفة قبل أي تنفيذ." },
  { icon: "code", title: "نبني / نركّب", text: "نبني النظام أو نخصصه، ونجهزه على Web أو Windows أو Mobile ونربطه بما تحتاجه.", gets: "نظام مبني حول طريقة عملك، لا العكس." },
  { icon: "calendar", title: "نختبر", text: "نختبر الحالات الطبيعية وحالات الخطأ ببياناتك قبل الاعتماد على النظام.", gets: "ثقة بأن النظام يعمل قبل دخوله العمل اليومي." },
  { icon: "users", title: "ندرّب", text: "ندرب فريقك على الاستخدام اليومي حتى يعمل بثقة.", gets: "فريق يستخدم النظام بدل أن يتجنبه." },
  { icon: "rocket", title: "نشغّل", text: "نضع النظام في العمل الفعلي ونراقب سلوكه ونتائجه في البداية.", gets: "انتقال منظم إلى العمل الفعلي مع مراقبة في البداية." },
  { icon: "headset", title: "نتابع", text: "دعم ومتابعة بعد التشغيل، وتطوير عندما يتغير احتياج العمل.", gets: "نظام يتطور عندما تتغير طريقة عملك." }
];

function journey(idBase) {
  const tabs = STEPS.map((s, i) => `<li>
            <button type="button" class="journey-step" role="tab" id="${idBase}-tab-${i}" aria-controls="${idBase}-panel" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-step="${i}">
              <span class="journey-num">${i + 1}</span>
              <span class="journey-icon">${ico(s.icon)}</span>
              <b>${esc(s.title)}</b>
            </button>
          </li>`).join("\n          ");
  const payload = esc(JSON.stringify(STEPS.map(s => ({ title: s.title, text: s.text, gets: s.gets }))));
  return `<div class="journey" data-journey="${payload}">
        <ol class="journey-track" role="tablist" aria-label="مراحل تنفيذ المشروع">
          ${tabs}
        </ol>
        <div class="journey-panel" id="${idBase}-panel" role="tabpanel" aria-labelledby="${idBase}-tab-0" tabindex="0" aria-live="polite">
          <div><small data-journey-count>المرحلة 1 من ${STEPS.length}</small><h3 data-journey-title>${esc(STEPS[0].title)}</h3><p data-journey-text>${esc(STEPS[0].text)}</p></div>
          <p class="journey-gets"><span>ماذا تحصل عليه</span><strong data-journey-gets>${esc(STEPS[0].gets)}</strong></p>
        </div>
      </div>`;
}

function servicePanels(base) {
  return SERVICE_PANELS.map(p => `<a class="svc-card" href="${base}${p.href}">
            <span class="svc-art">${art(base, p.art, [960, 560], { sizes: "(max-width:760px) 92vw, (max-width:1200px) 45vw, 30vw", w: 960, h: 540 })}<span class="svc-badge">${ico(p.icon)}</span></span>
            <span class="svc-body"><small>${esc(p.en)}</small><strong>${esc(p.title)}</strong><span>${esc(p.text)}</span><i class="round-arrow">${ARROW}</i></span>
          </a>`).join("\n          ");
}

/* ---------------- shared chrome ---------------- */

const LOGO = `<span class="logo-mark" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>`;

function header(base, isHome, active) {
  const link = linker(base, isHome);
  const home = isHome ? "#home" : `${base}index.html`;
  const on = key => (active === key ? ' aria-current="page"' : "");
  const solLinks = solutionMenu.map(m =>
    `<a href="${base}${m.href || `solutions/#${m.anchor}`}"><b>${esc(m.title)}</b><small>${esc(m.sub)}</small></a>`).join("\n          ");
  const sectorLinks = pageSectors.map(s =>
    `<a href="${base}sectors/${s.slug}/">${esc(s.name)}</a>`).join("\n          ");
  const mobileSol = solutionMenu.map(m => `<a href="${base}${m.href || `solutions/#${m.anchor}`}">${esc(m.title)}</a>`).join("\n        ");
  const mobileSectors = pageSectors.map(s => `<a href="${base}sectors/${s.slug}/">${esc(s.name)}</a>`).join("\n        ");
  const resources = `<a href="${link("faq")}"><b>الأسئلة الشائعة</b><small>قبل أن تبدأ مشروعك</small></a>
          <a href="${link("privacy")}"><b>حماية البيانات</b><small>المبادئ التي نبني عليها كل نظام</small></a>
          <a href="${base}support.html"><b>سياسة الدعم</b><small>ما يشمله الدعم وكيف نتابع</small></a>
          <a href="${base}privacy.html"><b>سياسة الخصوصية</b><small>كيف نتعامل مع بياناتك</small></a>
          <a href="${base}terms.html"><b>شروط الخدمة</b><small>نطاق الخدمات والمسؤوليات</small></a>`;

  return `<a class="skip-link" href="#main">تخطَّ إلى المحتوى</a>
  <header class="header" id="header">
    <div class="container header-inner">

      <a href="${home}" class="brand" aria-label="URUKQI — الرئيسية">
        ${LOGO}
        <span class="brand-name">URUKQI</span>
      </a>

      <nav class="nav" aria-label="القائمة الرئيسية">
        <a href="${home}"${on("home")}>الرئيسية</a>
        <a href="${link("about")}">من نحن</a>
        <div class="nav-group">
          <button type="button" class="nav-trigger${active === "solutions" ? " is-current" : ""}" aria-expanded="false" aria-controls="navSolutions">الحلول ${ico("chevron")}</button>
          <div class="nav-drop" id="navSolutions">
          ${solLinks}
          <a href="${base}automation/#plans"><b>باقات الأتمتة</b><small>START · GROWTH · CUSTOM — لخدمات الأتمتة فقط</small></a>
          <a class="nav-drop-all" href="${base}solutions/">كل الحلول <span aria-hidden="true">←</span></a>
          </div>
        </div>
        <a href="${base}products/"${on("products")}>المنتجات</a>
        <div class="nav-group">
          <button type="button" class="nav-trigger${active === "sectors" ? " is-current" : ""}" aria-expanded="false" aria-controls="navSectors">القطاعات ${ico("chevron")}</button>
          <div class="nav-drop nav-mega" id="navSectors">
          ${sectorLinks}
          <a class="nav-drop-all" href="${base}sectors/">كل القطاعات <span aria-hidden="true">←</span></a>
          </div>
        </div>
        <a href="${base}solutions/#journey">رحلتنا</a>
        <div class="nav-group">
          <button type="button" class="nav-trigger" aria-expanded="false" aria-controls="navResources">الموارد ${ico("chevron")}</button>
          <div class="nav-drop" id="navResources">
          ${resources}
          </div>
        </div>
      </nav>

      <a href="${base}contact/" class="header-cta"${on("contact")}>
        تواصل معنا ${ARROW}
      </a>

      <button class="mobile-menu" id="mobileMenu" type="button" aria-label="فتح القائمة" aria-expanded="false" aria-controls="mobileNav">
        ${ico("menu")}
      </button>

    </div>

    <div class="mobile-nav" id="mobileNav">
      <a href="${home}">الرئيسية</a>
      <a href="${link("about")}">من نحن</a>
      <details>
        <summary>الحلول</summary>
        ${mobileSol}
        <a href="${base}automation/#plans">باقات الأتمتة</a>
        <a href="${base}solutions/">كل الحلول</a>
      </details>
      <a href="${base}products/">المنتجات</a>
      <details>
        <summary>القطاعات</summary>
        ${mobileSectors}
        <a href="${base}sectors/">كل القطاعات</a>
      </details>
      <a href="${link("finder")}">ما المشكلة التي تريد حلها؟</a>
      <a href="${base}solutions/#journey">رحلتنا</a>
      <details>
        <summary>الموارد</summary>
        <a href="${link("faq")}">الأسئلة الشائعة</a>
        <a href="${link("privacy")}">حماية البيانات</a>
        <a href="${base}support.html">سياسة الدعم</a>
        <a href="${base}privacy.html">سياسة الخصوصية</a>
        <a href="${base}terms.html">شروط الخدمة</a>
      </details>
      <a href="${base}contact/#request">اطلب نظامك</a>
      <a href="${base}contact/">تواصل معنا</a>
    </div>
  </header>`;
}

function footer(base, isHome) {
  const link = linker(base, isHome);
  return `<footer>

    <div class="container footer-inner">

      <div class="footer-brand">

        <div class="brand">
          ${LOGO}
          <span class="brand-name">URUKQI</span>
        </div>

        <p>
          أنظمة برمجية وحلول رقمية للأعمال.
        </p>

      </div>


      <div class="footer-links">

        <a href="${base}solutions/">الحلول</a>
        <a href="${base}products/">المنتجات</a>
        <a href="${base}sectors/">القطاعات</a>
        <a href="${base}automation/">الأتمتة</a>
        <a href="${link("faq")}">الأسئلة الشائعة</a>
        <a href="${base}contact/#request">اطلب نظامك</a>
        <a href="${base}privacy.html">سياسة الخصوصية</a>
        <a href="${base}terms.html">شروط الخدمة</a>
        <a href="${base}support.html">سياسة الدعم</a>
        <a href="${base}contact/">تواصل معنا</a>

      </div>


      <div class="copyright">
        © 2026 URUKQI
      </div>

    </div>

  </footer>`;
}

// Always-reachable contact on phones; carries the page's selection into the form.
function mobileBar(base, params) {
  return `<div class="mobile-bar" role="navigation" aria-label="تواصل سريع">
    <a class="mobile-bar-wa" href="${WA}" target="_blank" rel="noopener">${ico("whatsapp")} واتساب</a>
    <a class="mobile-bar-go" href="${R.requestHref(base, params || {})}">اطلب نظامك ${ARROW}</a>
  </div>`;
}

const ANALYTICS = `<!-- Cloudflare Web Analytics --><script type='module' src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{"token": "9511bfb5abc0432ba56cabd568b63f39"}'></script><!-- End Cloudflare Web Analytics -->`;

function styleLinks(base, extra) {
  return [`style.css`, `mission15.css`, `catalog.css`, `assets/css/foundation.css`].concat(extra || [], [`assets/css/cinematic.css`])
    .map(css => `  <link rel="stylesheet" href="${base}${css}">`).join("\n");
}

function page({ base, urlPath, title, description, breadcrumb, body, scripts, styles, active, bodyClass, rawMain, request, noBar }) {
  const canonical = SITE_URL ? SITE_URL + urlPath : "";
  const crumbs = breadcrumb && SITE_URL ? `
  <script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumb.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: SITE_URL + c.path }))
  })}</script>` : "";
  const js = ["script.js", "assets/js/site.js"].concat(scripts || []).map(src => `  <script src="${base}${src}" defer></script>`).join("\n");

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="theme-color" content="#050d1a">
  <style>@media (prefers-reduced-motion: no-preference) { @view-transition { navigation: auto; } }</style>

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
  <link rel="preload" href="${base}assets/fonts/cairo-arabic-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
${styleLinks(base, styles)}${crumbs}
</head>

<body class="subpage${bodyClass ? " " + bodyClass : ""}">

  <!-- Generated by tools/build-pages.js from assets/js/catalog-data.js — edit the data, not this file. -->

  ${header(base, false, active)}

  ${rawMain || `<main id="main">\n${body}\n  </main>`}

  ${footer(base, false)}

  ${noBar ? "" : mobileBar(base, request)}

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

function statStrip(items) {
  return `<ul class="stat-strip">${items.map(s => `<li>${ico(s.icon)}<span><b>${esc(s.value)}</b><small>${esc(s.label)}</small></span></li>`).join("")}</ul>`;
}

// Verifiable facts about the catalog and process only — never customer claims.
const FACTS = [
  { icon: "layers", value: String(pageSectors.length), label: "قطاعًا له صفحة حلول" },
  { icon: "systems", value: String(solutionCount), label: "حلًا في الكتالوج" },
  { icon: "calendar", value: String(STEPS.length), label: "مراحل من التحليل إلى المتابعة" }
];

/* Full-bleed cinematic hero. `scene` is an art name; content aligns to the RTL start. */
function cineHero(base, { scene, widths, alt, crumbs, eyebrow, titleHtml, lead, actions, extra, cls, side }) {
  return `
    <section class="cine-hero${cls ? " " + cls : ""}">
      <div class="cine-hero-art" data-parallax>${art(base, scene, widths || HERO_WIDTHS, { eager: true, alt, sizes: "100vw", w: (widths || HERO_WIDTHS)[0], h: Math.round((widths || HERO_WIDTHS)[0] * 0.43) })}</div>
      <div class="container cine-hero-inner">
        <div class="cine-hero-copy">
          ${crumbs || ""}
          ${eyebrow ? `<p class="eyebrow">${esc(eyebrow)}</p>` : ""}
          <h1>${titleHtml}</h1>
          ${lead ? `<p class="cine-lead">${lead}</p>` : ""}
          ${actions ? `<div class="hero-actions">${actions}</div>` : ""}
          ${extra || ""}
        </div>
        ${side || ""}
      </div>
    </section>`;
}

function closingBand(base, params, text) {
  return `
    <section class="closing-band" data-reveal>
      <div class="container">
        <div class="closing-card">
          ${art(base, "globe", [1800, 1000], { sizes: "(max-width:760px) 100vw, 60vw", w: 1800, h: 900, attrs: 'class="closing-art"' })}
          <div class="closing-copy">
            <p class="eyebrow">YOUR BUSINESS · YOUR PROBLEM · YOUR SYSTEM</p>
            <h2>لم تجد ما تحتاجه؟ <span class="gold">أخبرنا كيف يعمل نشاطك.</span></h2>
            <p>${esc(text || "لكل عمل طريقة مختلفة. أخبرنا بالمشكلة أو العملية التي تريد تنظيمها، وسندرسها ونقترح النظام المناسب لها.")}</p>
            <div class="hero-actions">
              <a href="${R.requestHref(base, params || {})}" class="btn btn-primary">اطلب نظامك ${ARROW}</a>
              <a href="${WA}" target="_blank" rel="noopener" class="btn btn-secondary">${ico("whatsapp")} تحدث معنا عبر WhatsApp</a>
            </div>
            <small>لا تحتاج إلى معرفة أي مصطلح تقني. فقط أخبرنا بالمشكلة.</small>
          </div>
        </div>
      </div>
    </section>`;
}

function headingBlock(kicker, titleHtml, intro, cls) {
  return `<div class="cine-heading${cls ? " " + cls : ""}" data-reveal>
          <p class="eyebrow">${esc(kicker)}</p>
          <h2>${titleHtml}</h2>
          ${intro ? `<p>${esc(intro)}</p>` : ""}
        </div>`;
}

const customNote = `<p class="custom-note">هذه حلول نبنيها أو نخصصها بعد دراسة طريقة عملك، وليست برامج جاهزة للتنزيل. منتجات URUKQI الحالية موضحة في <a href="{{base}}products/">صفحة المنتجات</a>.</p>`;

function journeySection(base, id) {
  return `
    <section class="section cine-section" id="${id}">
      <div class="container">
        ${headingBlock("HOW WE WORK", 'ندرس عملك أولًا. <span class="gold">ثم نبني.</span>', "قبل أي تنفيذ نقدم لك عرضًا واضحًا بالنطاق والمدة والتكلفة. اضغط أي مرحلة لتعرف ما يحدث فيها.")}
        ${journey(`${id}-j`)}
      </div>
    </section>`;
}

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

  const body = `${cineHero(base, {
    scene: "hero-palace", alt: "", cls: "is-compact",
    crumbs: breadcrumbNav(base, [{ name: "الرئيسية", href: "index.html" }, { name: "القطاعات", href: "sectors/" }, { name: sector.name }]),
    eyebrow: sector.en,
    titleHtml: `أنظمة ${esc(sector.name)} <span class="gold">تُبنى حسب طريقة عملك.</span>`,
    lead: esc(sector.intro),
    actions: `<a href="${R.requestHref(base, { sector: sector.slug })}" class="btn btn-primary">اطلب نظامًا لنشاطك ${ARROW}</a>
          <a href="#sector-solutions" class="btn btn-secondary">شاهد الحلول</a>`,
    extra: examples + note,
    side: `<figure class="hero-emblem">${art(base, `sector-${sector.slug}`, [800], { w: 800, h: 450, eager: true })}</figure>`
  })}

    <section class="section cine-section" id="sector-solutions">
      <div class="container">
        ${headingBlock("SOLUTIONS", `ماذا يمكن أن نبني لقطاع <span class="gold">${esc(sector.name)}</span>؟`, "اختر الحل الأقرب لعملك واضغط «أريد هذا الحل»، وسيُفتح لك نموذج الطلب واختيارك معبأ مسبقًا.")}
        <div class="sol-grid">
${cards}
        </div>
        ${customNote.replace("{{base}}", base)}
      </div>
    </section>
${journeySection(base, "sector-journey")}

    <section class="section cine-section page-related">
      <div class="container">
        ${headingBlock("MORE SECTORS", "قطاعات أخرى")}
        <div class="sector-gallery">
${related.map(s => R.sectorTile(s, pageSectors.indexOf(s) + 1, base)).join("\n")}
        </div>
        <p class="page-more"><a href="${base}sectors/">كل القطاعات <span aria-hidden="true">←</span></a></p>
      </div>
    </section>
${closingBand(base, { sector: sector.slug })}`;

  return page({
    base,
    urlPath: `sectors/${sector.slug}/`,
    title: sector.seoTitle,
    description: sector.seoDesc,
    breadcrumb: [{ name: "الرئيسية", path: "" }, { name: "القطاعات", path: "sectors/" }, { name: sector.name, path: `sectors/${sector.slug}/` }],
    body,
    active: "sectors",
    request: { sector: sector.slug }
  });
}

/* ---------------- sectors index ---------------- */

function sectorsIndex() {
  const base = "../";
  const tiles = catalog.sectors.map((s, i) => R.sectorTile(s, i + 1, base)).join("\n");
  const body = `${cineHero(base, {
    scene: "hero-palace", alt: "", cls: "is-compact",
    crumbs: breadcrumbNav(base, [{ name: "الرئيسية", href: "index.html" }, { name: "القطاعات" }]),
    eyebrow: "SOLUTIONS BY SECTOR",
    titleHtml: `اختر قطاعك. <span class="gold">وشاهد ما يمكن أن نبنيه لك.</span>`,
    lead: "لكل قطاع عملياته الخاصة. اختر نشاطك لتشاهد الأنظمة والمواقع والتطبيقات والأتمتة التي يمكن أن نبنيها أو نخصصها له — وإن لم تجد نشاطك، أخبرنا عنه."
  })}

    <section class="section cine-section">
      <div class="container">
        <div class="sector-gallery">
${tiles}
        </div>
        <p class="page-more"><a href="${base}solutions/">أو ابحث في كل الحلول <span aria-hidden="true">←</span></a> · <a href="${base}index.html#finder">أو ابدأ من المشكلة التي تريد حلها <span aria-hidden="true">←</span></a></p>
      </div>
    </section>
${journeySection(base, "sectors-journey")}
${closingBand(base, {})}`;

  return page({
    base,
    urlPath: "sectors/",
    title: "حلول برمجية حسب القطاع — تجارة، توزيع، مطاعم، عيادات، مدارس، مقاولات | URUKQI",
    description: "اختر قطاع عملك وشاهد الأنظمة والمواقع والتطبيقات والأتمتة التي تبنيها URUKQI للأعمال في العراق: التجارة، التوزيع، المطاعم، الصحة، التعليم، المقاولات، العقارات، الخدمات وغيرها.",
    breadcrumb: [{ name: "الرئيسية", path: "" }, { name: "القطاعات", path: "sectors/" }],
    body,
    active: "sectors"
  });
}

/* ---------------- solutions index ---------------- */

function serviceCards(slug, base) {
  const service = catalog.services.find(s => s.slug === slug);
  return service.solutions.map(sol => R.solutionCard(idx.solutions[sol.id],
    { base, idx, showOwner: false, ownerLink: false })).join("\n");
}

// Interactive «challenge → solution» explorer. Before/after copy lives in the catalog.
function challengeExplorer(base) {
  const tabs = catalog.challenges.map((c, i) => `<button type="button" role="tab" class="challenge-tab" id="ch-tab-${i}" aria-controls="ch-panel-${i}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${ico(c.icon)}<span>${esc(c.title)}</span></button>`).join("\n          ");
  const panels = catalog.challenges.map((c, i) => {
    const problem = idx.problems[c.problem];
    const sols = problem.solutions.map(id => idx.solutions[id]).filter(Boolean).slice(0, 3);
    return `<div class="challenge-panel" role="tabpanel" id="ch-panel-${i}" aria-labelledby="ch-tab-${i}" tabindex="0"${i === 0 ? "" : " hidden"}>
            <div class="flow-col is-before">
              <h3>${ico("alert")} الوضع الآن</h3>
              <ul>${c.before.map(t => `<li>${ico("x")}<span>${esc(t)}</span></li>`).join("")}</ul>
            </div>
            <div class="flow-arrow" aria-hidden="true">${ARROW}</div>
            <div class="flow-col is-after">
              <h3>${ico("bulb")} بعد تطبيق النظام</h3>
              <ul>${c.after.map(t => `<li>${ico("check")}<span>${esc(t)}</span></li>`).join("")}</ul>
            </div>
            <div class="flow-foot">
              <p><span>حلول مرتبطة:</span> ${sols.map(e => `<a href="${R.requestHref(base, R.requestParams(e, c.problem))}">${esc(e.sol.title)}</a>`).join("")}</p>
              <a class="btn btn-primary btn-sm" href="${R.requestHref(base, { problem: c.problem })}">اطلب حلًا لهذه المشكلة ${ARROW}</a>
            </div>
          </div>`;
  }).join("\n          ");
  return `<div class="challenges" data-tabs>
        <div class="challenge-tabs" role="tablist" aria-label="تحديات الأعمال">
          ${tabs}
        </div>
        <div class="challenge-panels">
          ${panels}
        </div>
      </div>`;
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
          <div class="cine-heading">
            <p class="eyebrow">${kicker}</p>
            <h2 id="${id}-title">${title} <span class="gold">${span}</span></h2>
            <p>${intro}</p>
          </div>
${inner}
        </section>`;

  const body = `${cineHero(base, {
    scene: "hero-palace",
    alt: "قصر بواجهة ذهبية مزخرفة إلى جانب مدينة مستقبلية ليلًا",
    crumbs: breadcrumbNav(base, [{ name: "الرئيسية", href: "index.html" }, { name: "الحلول" }]),
    eyebrow: "ALL SOLUTIONS",
    titleHtml: `كل ما يمكن أن نبنيه <span class="gold">لعملك في مكان واحد.</span>`,
    lead: "أنظمة أعمال، برامج مكتبية، أنظمة ويب، تطبيقات، مواقع ومتاجر، أتمتة وذكاء اصطناعي. ابحث بكلمة أو تصفح حسب النوع.",
    actions: `<a href="${R.requestHref(base, {})}" class="btn btn-primary">اطلب نظامك ${ARROW}</a>
          <a href="${WA}" target="_blank" rel="noopener" class="btn btn-secondary">${ico("whatsapp")} تحدث إلى فريقنا</a>`,
    extra: statStrip(FACTS)
  })}

    <section class="section cine-section" id="service-lines">
      <div class="container">
        ${headingBlock("SOLUTION LINES", 'مجموعة <span class="gold">متكاملة</span> من الحلول حول طريقة عملك', "نبني أنظمة وبرامج ومواقع وتطبيقات للأعمال، ونربطها ونؤتمتها — بعد أن نفهم كيف يعمل نشاطك.", "is-center")}
        <div class="svc-grid">
          ${servicePanels(base)}
        </div>
      </div>
    </section>

    <section class="section cine-section" id="challenges">
      <div class="container">
        ${headingBlock("FROM CHALLENGE TO SOLUTION", 'من التحديات <span class="gold">إلى الحلول</span>', "اختر التحدي الأقرب لواقعك، وشاهد كيف يتغير العمل اليومي وما الحلول المرتبطة به.")}
        ${challengeExplorer(base)}
      </div>
    </section>
${journeySection(base, "journey")}

    <section class="section cine-section explorer" data-explorer data-base="${base}" id="catalog">
      <div class="container">
        ${headingBlock("THE FULL CATALOG", 'الكتالوج <span class="gold">الكامل</span>', "ابحث في كل الحلول، أو صفِّها حسب النوع.")}
        <nav class="cat-jump" aria-label="أنواع الحلول">${solutionMenu.map(m => `<a href="#${m.anchor}">${esc(m.title)}</a>`).join("")}<a href="${base}sectors/">حسب القطاع</a><a href="${base}index.html#finder">حسب المشكلة</a></nav>
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
          <div class="sector-gallery">
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
${closingBand(base, {})}`;

  return page({
    base,
    urlPath: "solutions/",
    title: "حلول URUKQI — أنظمة أعمال، مواقع، تطبيقات، أتمتة وذكاء اصطناعي",
    description: "كتالوج حلول URUKQI للأعمال في العراق: أنظمة إدارة ومبيعات ومخزون وموارد بشرية، برامج Windows وأنظمة ويب، مواقع ومتاجر وبوابات، تطبيقات موبايل، أتمتة WhatsApp والتكامل والذكاء الاصطناعي.",
    breadcrumb: [{ name: "الرئيسية", path: "" }, { name: "الحلول", path: "solutions/" }],
    body,
    scripts: ["assets/js/catalog-data.js", "assets/js/catalog-render.js", "assets/js/catalog.js"],
    active: "solutions"
  });
}

/* ---------------- products ---------------- */

const STATUS_KEY = [
  { kind: "live", label: "متاح", text: "جاهز للشراء أو التشغيل الآن." },
  { kind: "demo", label: "نسخة تجريبية", text: "يمكن عرضه وتجربته، والتشغيل الفعلي يُحدد بعد الفحص." },
  { kind: "soon", label: "قيد التطوير", text: "يُبنى الآن، ويُعلن عنه وعن سعره عند الإطلاق." },
  { kind: "custom", label: "يُبنى حسب الطلب", text: "ليس برنامجًا جاهزًا؛ نبنيه أو نخصصه بعد دراسة عملك." }
];

const PRODUCT_ART = {
  "smart-customer-service": { src: "assets/demo-distribution.webp", w: 780, h: 1688, alt: "شاشة عرض توضيحية لمنظومة خدمة العملاء عبر WhatsApp", cap: "شاشة عرض توضيحية من النسخة التجريبية", fit: "is-phone" },
  "urukqi-trade": { src: "assets/urukqi-trade-dashboard.webp", w: 1672, h: 941, alt: "واجهة URUKQI Trade — النسخة قيد التطوير", cap: "واجهة URUKQI Trade — النسخة قيد التطوير", fit: "" }
};

function productFeature(base, p) {
  const a = PRODUCT_ART[p.id];
  return `<article class="product-feature" data-reveal>
          <figure class="product-shot ${a.fit}"><img src="${base}${a.src}" width="${a.w}" height="${a.h}" alt="${esc(a.alt)}" loading="lazy" decoding="async"><figcaption>${esc(a.cap)}</figcaption></figure>
          <div class="product-feature-body">
            <span class="product-status is-${p.statusKind}">${esc(p.status)}</span>
            <h3 dir="auto">${esc(p.name)}</h3>
            <p>${esc(p.desc)}</p>
            <div class="hero-actions">
              <a class="btn btn-primary btn-sm" href="${base}${p.href}">${esc(p.linkText)} ${ARROW}</a>
              <a class="btn btn-secondary btn-sm" href="${R.requestHref(base, p.id === "urukqi-trade" ? { sector: "retail" } : { need: "automation" })}">اسأل عنه</a>
            </div>
          </div>
        </article>`;
}

function productsPage() {
  const base = "../";
  const counts = kind => (kind === "custom" ? "حسب الطلب" : String(catalog.products.filter(p => p.statusKind === kind).length));
  const trade = catalog.products.find(p => p.id === "urukqi-trade");
  const featuredSectors = ["retail", "healthcare", "distribution", "business"].map(slug => idx.sectors[slug]);
  const customLines = SERVICE_PANELS.slice(0, 5).concat(SERVICE_PANELS[5]);

  const body = `${cineHero(base, {
    scene: "hero-products", cls: "is-products",
    alt: "مكتب مطل على مدينة مستقبلية ليلًا",
    crumbs: breadcrumbNav(base, [{ name: "الرئيسية", href: "index.html" }, { name: "المنتجات والقطاعات" }]),
    eyebrow: "المنتجات والقطاعات",
    titleHtml: `حلول ذكية لكل قطاع <span class="gold">تدير أعمالك للمستقبل.</span>`,
    lead: "من منتجات URUKQI إلى الأنظمة التي نبنيها لقطاعك: نوضح بصراحة ما هو جاهز، وما هو قيد التطوير، وما يُبنى حسب طلبك.",
    actions: `<a href="#products-list" class="btn btn-primary">استعرض المنتجات ${ARROW}</a>
          <a href="${WA}" target="_blank" rel="noopener" class="btn btn-secondary">${ico("whatsapp")} تحدث مع فريقنا</a>`,
    side: `<figure class="hero-monitor">
          <div class="monitor-screen"><img src="${base}assets/urukqi-trade-dashboard.webp" width="1672" height="941" alt="${esc(PRODUCT_ART["urukqi-trade"].alt)}" fetchpriority="high" decoding="async"></div>
          <figcaption>${esc(trade.name)} — النسخة قيد التطوير</figcaption>
        </figure>`
  })}

    <section class="section cine-section" id="products-list">
      <div class="container">
        <div class="section-row" data-reveal>
          <div class="cine-heading">
            <p class="eyebrow">PRODUCTS</p>
            <h2>منتجاتنا <span class="gold">بحالتها الفعلية.</span></h2>
            <p>نوضح الفرق بصراحة: لمنتجاتنا حالة معلنة، وبقية الحلول تُبنى أو تُخصص حسب طلبك.</p>
          </div>
        </div>
        <ul class="status-key" data-reveal>
          ${STATUS_KEY.map(s => `<li><span class="product-status is-${s.kind}">${esc(s.label)}</span><b>${esc(counts(s.kind))}</b><small>${esc(s.text)}</small></li>`).join("\n          ")}
        </ul>
        <div class="product-features">
        ${catalog.products.slice().reverse().map(p => productFeature(base, p)).join("\n        ")}
        </div>
      </div>
    </section>

    <section class="section cine-section" id="custom-built">
      <div class="container">
        <div class="section-row" data-reveal>
          ${headingBlock("CUSTOM-BUILT", 'حلول <span class="gold">نبنيها لعملك.</span>', "اختر الحل الذي تحتاجه، ونقوم بتحليل طريقة عملك وتصميم النظام بما يناسب مشروعك.")}
          <a class="btn btn-secondary btn-sm" href="${base}solutions/">جميع الحلول ${ARROW}</a>
        </div>
        <div class="custom-grid">
          ${customLines.map(p => `<a class="custom-card" href="${base}${p.href}" data-reveal>
            <span class="custom-card-art">${art(base, p.art, [960, 560], { sizes: "(max-width:760px) 92vw, 30vw", w: 960, h: 540 })}</span>
            <span class="custom-card-body"><span class="product-status is-custom">يُبنى حسب الطلب</span><strong>${esc(p.title)}</strong><span>${esc(p.text)}</span><b>اكتشف ${ARROW}</b></span>
          </a>`).join("\n          ")}
        </div>
      </div>
    </section>

    <section class="section cine-section" id="sectors">
      <div class="container">
        <div class="section-row" data-reveal>
          ${headingBlock("SECTORS", 'القطاعات <span class="gold">التي نبني لها.</span>', "لكل قطاع عملياته الخاصة، ولكل منها صفحة بالحلول التي يمكن بناؤها له.")}
          <a class="btn btn-secondary btn-sm" href="${base}sectors/">جميع القطاعات (${pageSectors.length}) ${ARROW}</a>
        </div>
        <div class="sector-gallery">
${featuredSectors.map(s => R.sectorTile(s, pageSectors.indexOf(s) + 1, base)).join("\n")}
        </div>
      </div>
    </section>
${closingBand(base, {})}`;

  return page({
    base,
    urlPath: "products/",
    title: "منتجات URUKQI والقطاعات — URUKQI Trade وخدمة العملاء الذكية | URUKQI",
    description: "منتجات URUKQI بحالتها الفعلية: URUKQI Trade قيد التطوير، وSmart Customer Service كنسخة تجريبية، مع الأنظمة التي نبنيها حسب الطلب وقطاعات الأعمال في العراق.",
    breadcrumb: [{ name: "الرئيسية", path: "" }, { name: "المنتجات", path: "products/" }],
    body,
    active: "products"
  });
}

/* ---------------- contact + project request ---------------- */

function requestForm(base) {
  const options = ['<option value="">اختر نشاطك</option>']
    .concat(catalog.sectors.map(s => `<option value="${s.slug}">${esc(s.name)}</option>`)).join("\n                ");
  return fs.readFileSync(path.join(__dirname, "partials/request-form.html"), "utf8")
    .replace("{{sectorOptions}}", options)
    .replace(/\{\{base\}\}/g, base)
    .replace("{{sendIcon}}", ico("send"))
    .replace("{{lockIcon}}", ico("lock"));
}

function contactPage() {
  const base = "../";
  const channel = (icon, cls, title, text, href, label, external) => `<li class="channel-card">
              <span class="channel-icon ${cls}">${ico(icon)}</span>
              <strong>${esc(title)}</strong>
              <small>${esc(text)}</small>
              <a class="btn btn-primary btn-sm" href="${href}"${external ? ' target="_blank" rel="noopener"' : ""}>${esc(label)} ${ARROW}</a>
            </li>`;
  const body = `
    <section class="contact-stage">
      <div class="contact-art" data-parallax>${art(base, "hero-contact", [1600, 1000, 640], { eager: true, sizes: "(max-width:980px) 100vw, 60vw", w: 1600, h: 1300, alt: "بوابة بابل مضاءة بالذهب ليلًا في مدينة مستقبلية" })}</div>
      <div class="container contact-layout">

        <div class="contact-aside">
          ${breadcrumbNav(base, [{ name: "الرئيسية", href: "index.html" }, { name: "تواصل معنا" }])}
          <p class="eyebrow">حوّل فكرتك إلى واقع</p>
          <h1><span class="gold">لنبنِ معًا</span> مستقبل أعمالك</h1>
          <p class="cine-lead">لكل عمل طريقة مختلفة. أخبرنا بالمشكلة أو العملية التي تريد تنظيمها، وسندرسها ونقترح النظام المناسب لها.</p>
          <ol class="request-steps">
            <li><b>1</b><span>املأ ما تعرفه — الحقول المطلوبة أربعة فقط.</span></li>
            <li><b>2</b><span>نستلم طلبك مباشرة عبر الموقع، ويمكنك بعدها متابعته معنا عبر WhatsApp.</span></li>
            <li><b>3</b><span>نراجع طلبك ونتواصل معك لفهم التفاصيل قبل أي عرض.</span></li>
          </ol>

          <div class="channels-box" id="contact">
            <h2>تواصل معنا مباشرة</h2>
            <p>اختر الطريقة الأنسب لك.</p>
            <ul class="channels">
            ${channel("whatsapp", "is-wa", "واتساب", "تحدث مع فريقنا مباشرة، وأرفق لقطات الشاشة أو ملفات Excel.", WA, "فتح واتساب", true)}
            ${channel("mail", "is-mail", "البريد الإلكتروني", catalog.contact.email, MAIL, "إرسال بريد")}
            ${channel("phone", "is-tel", "اتصال هاتفي", "\u200E+" + catalog.contact.whatsapp, TEL, "اتصل الآن")}
            </ul>
          </div>
        </div>

        <div class="request-card" id="request">
          ${requestForm(base)}
        </div>

      </div>
    </section>

    <section class="section cine-section contact-promise">
      <div class="container">
        <div class="closing-card is-short" data-reveal>
          ${art(base, "globe", [1800, 1000], { sizes: "(max-width:760px) 100vw, 60vw", w: 1800, h: 900, attrs: 'class="closing-art"' })}
          <div class="closing-copy">
            <h2>أنت تعرف تجارتك. <span class="gold">نحن نعرف كيف نحول عملياتها إلى أنظمة.</span></h2>
            <p>لا نطلب منك أن تصبح خبيرًا في البرمجة أو الذكاء الاصطناعي أو الأتمتة. أخبرنا فقط بما يتكرر في عملك، وما الذي يضيع وقتك، وما الذي تريد أن يصبح أسهل.</p>
          </div>
        </div>
      </div>
    </section>`;

  return page({
    base,
    urlPath: "contact/",
    title: "تواصل معنا واطلب نظامك | URUKQI",
    description: "أخبر URUKQI عن مشروعك: نموذج طلب نظام، وتواصل مباشر عبر WhatsApp أو البريد الإلكتروني أو الهاتف. أنظمة برمجية وحلول رقمية للأعمال في العراق.",
    breadcrumb: [{ name: "الرئيسية", path: "" }, { name: "تواصل معنا", path: "contact/" }],
    body,
    scripts: ["assets/js/catalog-data.js", "assets/js/catalog-render.js", "assets/js/catalog.js", "assets/js/request.js"],
    active: "contact",
    bodyClass: "contact-page",
    noBar: true
  });
}

/* ---------------- pages built from moved homepage sections ---------------- */

// Partials were moved verbatim from the homepage. Rebase their relative links:
// assets/… and legal pages get the base prefix; #anchors that do not exist in
// the partial point back to the homepage (the request form lives on contact/).
function rebase(html, base) {
  const own = new Set([...html.matchAll(/ id="([^"]+)"/g)].map(m => m[1]));
  const onContact = new Set(["request", "contact"]);
  return html
    .replace(/^<!--[^\n]*-->\n/, "")
    .replace(/(src|href)="(assets\/|privacy\.html|terms\.html|support\.html)/g, (_, a, p) => `${a}="${base}${p}`)
    .replace(/href="#([^"]+)"/g, (m, id) => {
      if (own.has(id)) return m;
      return onContact.has(id) ? `href="${base}contact/#${id}"` : `href="${base}index.html#${id}"`;
    });
}

function partial(name, base) {
  return rebase(fs.readFileSync(path.join(__dirname, "partials", name), "utf8"), base);
}

function automationPage() {
  const base = "../";
  const automation = catalog.services.find(s => s.slug === "automation");
  const cards = automation.solutions.map(sol => R.solutionCard(idx.solutions[sol.id],
    { base, idx, showOwner: false, ownerLink: false })).join("\n");
  const body = `${cineHero(base, {
    scene: "hero-palace", alt: "", cls: "is-compact",
    crumbs: breadcrumbNav(base, [{ name: "الرئيسية", href: "index.html" }, { name: "الحلول", href: "solutions/" }, { name: "الأتمتة والذكاء الاصطناعي" }]),
    eyebrow: "AUTOMATION & AI",
    titleHtml: `الأتمتة والذكاء الاصطناعي <span class="gold">أقل عمل يدوي، ومتابعة لا تضيع.</span>`,
    lead: esc(automation.intro),
    actions: `<a href="${R.requestHref(base, { need: "automation" })}" class="btn btn-primary">أريد حل أتمتة ${ARROW}</a>
          <a href="#plans" class="btn btn-secondary">باقات الأتمتة</a>`,
    extra: `<nav class="cat-jump" aria-label="في هذه الصفحة"><a href="#automation-solutions">الحلول</a><a href="#demo">شاهد المنظومة</a><a href="#workflow">كيف تعمل</a><a href="#plans">باقات الأتمتة</a><a href="#automation-faq">أسئلة</a></nav>`,
    side: `<figure class="hero-emblem">${art(base, "svc-ai", [960, 560], { sizes: "(max-width:760px) 92vw, 34vw", w: 960, h: 540, eager: true })}</figure>`
  })}

    <section class="section cine-section" id="automation-solutions">
      <div class="container">
        ${headingBlock("SOLUTIONS", "ماذا يمكن أن نؤتمت لك؟", "اختر الحل الأقرب لعملك واضغط «أريد هذا الحل»، وسيُفتح لك نموذج الطلب واختيارك معبأ مسبقًا.")}
        <div class="sol-grid">
${cards}
        </div>
      </div>
    </section>

${partial("automation.html", base)}
${closingBand(base, { need: "automation" }, "أخبرنا بالعمل الذي يتكرر يوميًا ويستهلك وقت فريقك، وسندرس إن كان من الممكن تحويله إلى مسار تلقائي.")}`;

  return page({
    base,
    urlPath: "automation/",
    title: "الأتمتة والذكاء الاصطناعي — أتمتة WhatsApp وخدمة العملاء والتقارير | URUKQI",
    description: "حلول الأتمتة والذكاء الاصطناعي من URUKQI: أتمتة WhatsApp وخدمة العملاء، متابعة العملاء المحتملين، الفواتير والتذكيرات والتنبيهات، ربط الأنظمة، ومساعدات ذكية تجيب من معلومات نشاطك. مع باقات الأتمتة.",
    breadcrumb: [{ name: "الرئيسية", path: "" }, { name: "الحلول", path: "solutions/" }, { name: "الأتمتة والذكاء الاصطناعي", path: "automation/" }],
    body,
    active: "solutions",
    bodyClass: "legacy-sections",
    request: { need: "automation" }
  });
}

function tradePage() {
  const base = "../";
  const body = `
    <section class="page-crumbs">
      <div class="container">
        ${breadcrumbNav(base, [{ name: "الرئيسية", href: "index.html" }, { name: "المنتجات", href: "products/" }, { name: "URUKQI Trade" }])}
      </div>
    </section>

${partial("trade.html", base)}
${closingBand(base, { sector: "retail" }, "تحتاج نظامًا مختلفًا عن URUKQI Trade أو مخصصًا لطريقة عملك؟ أخبرنا وسندرس احتياجك.")}`;

  return page({
    base,
    urlPath: "trade/",
    title: "URUKQI Trade — برنامج إدارة التجارة والمخزون والديون (قيد التطوير) | URUKQI",
    description: "URUKQI Trade برنامج Windows قيد التطوير لإدارة التجارة: المبيعات والفواتير، المخزون والجرد، ديون العملاء والموردين، المصروفات والأرباح، ومنظومة استيراد الصين. شراء مرة واحدة، والأسعار تُعلن عند الإطلاق.",
    breadcrumb: [{ name: "الرئيسية", path: "" }, { name: "URUKQI Trade", path: "trade/" }],
    body,
    styles: ["trade.css"],
    active: "products",
    bodyClass: "legacy-sections",
    request: { sector: "retail" }
  });
}

/* ---------------- 404 page ---------------- */

// Cloudflare Pages serves this at whatever URL was missing, so links must be root-absolute.
function notFoundPage() {
  const base = "/";
  const body = cineHero(base, {
    scene: "hero-palace",
    alt: "",
    eyebrow: "404",
    titleHtml: `هذه الصفحة <span class="gold">غير موجودة.</span>`,
    lead: "ربما تغيّر الرابط أو لم يعد متاحًا. يمكنك العودة إلى الرئيسية أو تصفح حلولنا.",
    actions: `<a href="${base}" class="btn btn-primary">العودة إلى الرئيسية ${ARROW}</a>
            <a href="${base}solutions/" class="btn btn-secondary">تصفح الحلول</a>`
  });
  return page({
    base,
    urlPath: "404.html",
    title: "الصفحة غير موجودة | URUKQI",
    description: "الصفحة المطلوبة غير موجودة على موقع URUKQI.",
    body
  }).replace(/\n\s*<link rel="canonical"[^>]*>/, "")
    .replace(/\n\s*<meta property="og:url"[^>]*>/, "")
    .replace("</title>", '</title>\n  <meta name="robots" content="noindex">');
}

/* ---------------- legal pages (content stays in the file, chrome is shared) ---------------- */

function legalPage(file) {
  const html = fs.readFileSync(path.join(ROOT, file), "utf8");
  const title = (html.match(/<title>([\s\S]*?)<\/title>/) || [])[1];
  const description = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1];
  const main = (html.match(/<main[^>]*class="legal-page"[^>]*>[\s\S]*<\/main>/) || [])[0];
  if (!title || !main) throw new Error(`${file}: could not read the legal content`);
  const unesc = v => v.replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&#39;/g, "'");
  return page({
    base: "",
    urlPath: file,
    title: unesc(title),
    description: unesc(description || ""),
    rawMain: main.replace(/<main[^>]*>/, '<main id="main" class="legal-page">')
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
    "site-header": header(base, true, "home"),
    "site-footer": footer(base, true),
    "mobile-bar": mobileBar(base, {}),
    "hero-facts": statStrip(FACTS),
    "sector-tiles": catalog.sectors.map((s, i) => R.sectorTile(s, i + 1, base)).join("\n"),
    "problem-cards": catalog.problems.map((p, i) => R.problemCard(p, i + 1, base)).join("\n"),
    "service-panels": servicePanels(base),
    "journey": journey("home-j"),
    "product-cards": catalog.products.slice().reverse().map(p => productFeature(base, p)).join("\n"),
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
  catalog.challenges.forEach(c => {
    if (!idx.problems[c.problem]) throw new Error(`challenge ${c.id} references unknown problem ${c.problem}`);
    if (!ICONS[c.icon]) throw new Error(`challenge ${c.id} references unknown icon ${c.icon}`);
  });
  catalog.sectors.forEach(s => {
    if (!ICONS[s.slug]) throw new Error(`sector ${s.slug} has no icon`);
    if (!fs.existsSync(path.join(ROOT, `assets/art/sector-${s.slug}.webp`))) throw new Error(`sector ${s.slug} has no artwork`);
  });
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
  written.push(write("products/index.html", productsPage()));
  written.push(write("contact/index.html", contactPage()));
  written.push(write("automation/index.html", automationPage()));
  written.push(write("trade/index.html", tradePage()));
  ["privacy.html", "terms.html", "support.html"].forEach(f => written.push(write(f, legalPage(f))));
  written.push(write("404.html", notFoundPage()));

  const sitemapFile = path.join(ROOT, "sitemap.xml");
  if (!SITE_URL) {
    if (fs.existsSync(sitemapFile)) fs.unlinkSync(sitemapFile);
    written.push("(sitemap.xml skipped — SITE_URL not set)");
    console.log(`Built ${written.length} outputs:\n  ` + written.join("\n  "));
    return;
  }
  const today = new Date().toISOString().slice(0, 10);
  const urls = ["", "solutions/", "products/", "contact/", "sectors/", "automation/", "trade/"].concat(pageSectors.map(s => `sectors/${s.slug}/`));
  written.push(write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${SITE_URL}${u}</loc><lastmod>${today}</lastmod></url>`).join("\n")}
</urlset>
`));

  console.log(`Built ${written.length} outputs:\n  ` + written.join("\n  "));
}

main();
