// One-off: builds photo-sources.json (internal licence record) and src/data/credits.json from the review ledger.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const HERE = path.dirname(fileURLToPath(import.meta.url));
const [ledgerFile] = process.argv.slice(2);
const ledger = Object.fromEntries(fs.readFileSync(ledgerFile, "utf8").trim().split(/\r?\n/).slice(1).map(l => l.split("\t")).map(r => [r[0], { cdn: r[2], by: r[3] }]));
const cfg = JSON.parse(fs.readFileSync(path.join(HERE, "photos.json"), "utf8"));
const names = Object.fromEntries([...fs.readFileSync(path.join(HERE, "../src/data/catalog.ts"), "utf8").matchAll(/slug: "([^"]+)", name: "([^"]+)"/g)].map(m => [m[1], m[2]]));
const BANNER = { hero: "صورة الواجهة الرئيسية", atelier: "قسم «صُنعت لتبقى معك»", rack: "قسم المنزل والهدايا" };
const rows = [];
for (const [slug, p] of Object.entries(cfg.products)) p.photo.forEach(id => rows.push({ id, use: names[slug] ?? slug }));
for (const [k, b] of Object.entries(cfg.banners)) rows.push({ id: b.photo, use: BANNER[k] });
const sources = rows.map(r => ({ ...r, by: ledger[r.id].by, page: `https://unsplash.com/photos/${r.id}`, file: `https://images.unsplash.com/${ledger[r.id].cdn}`, license: "Unsplash License (checked on the photo page: \"Free to use under the Unsplash License\")" }));
fs.writeFileSync(path.join(HERE, "photo-sources.json"), JSON.stringify({ checked: "2026-11-03", note: "Every photo page was opened and showed the free Unsplash License (not Unsplash+). Unsplash+ results were excluded. Photos with visible third-party logos were excluded.", photos: sources }, null, 1) + "\n");
fs.writeFileSync(path.join(HERE, "../src/data/credits.json"), JSON.stringify(sources.map(s => ({ id: s.id, by: s.by, use: s.use })), null, 1) + "\n");
console.log(sources.length, "credits");
