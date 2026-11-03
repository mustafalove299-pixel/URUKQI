// Builds the store's WebP images from the licensed source photos (kept outside the repository).
//   PHOTO_SOURCE=<folder of <unsplash-id>.jpg> node scripts/build-images.mjs
// Writes ../../demos/ecommerce/img/{p,b}/ and src/data/images.gen.json. Never upscales.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = process.env.PHOTO_SOURCE || "C:\\Users\\musta\\Desktop\\URUKQI-ecommerce-photo-source";
const OUT = path.resolve(HERE, "../../../demos/ecommerce/img");
const cfg = JSON.parse(fs.readFileSync(path.join(HERE, "photos.json"), "utf8"));
const RATIO = 4 / 5;
const SIZES = [480, 960, 1400];
const DETAIL_MIN = 620;

// Largest 4:5 crop, scaled by zoom, centred on the focus and kept inside the photo.
function crop(meta, focus, zoom) {
  let w = meta.width / meta.height > RATIO ? meta.height * RATIO : meta.width;
  let h = w / RATIO;
  w = Math.round(w * zoom); h = Math.round(h * zoom);
  const left = Math.round(Math.min(Math.max(meta.width * focus[0] - w / 2, 0), meta.width - w));
  const top = Math.round(Math.min(Math.max(meta.height * focus[1] - h / 2, 0), meta.height - h));
  return { left, top, width: w, height: h };
}

async function variants(file, box, base, sizes) {
  const out = [];
  for (const target of sizes) {
    const w = Math.min(target, box.width);
    if (out.includes(w)) continue;
    await sharp(file).extract(box).resize(w, Math.round(w / RATIO)).webp({ quality: target >= 1400 ? 74 : 72, effort: 6 })
      .toFile(path.join(OUT, `${base}-${w}.webp`));
    out.push(w);
  }
  return out;
}

const dominant = async (file, box) => {
  const { dominant: d } = await sharp(file).extract(box).stats();
  return `#${[d.r, d.g, d.b].map(v => v.toString(16).padStart(2, "0")).join("")}`;
};

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, "p"), { recursive: true });
fs.mkdirSync(path.join(OUT, "b"), { recursive: true });
const manifest = { products: {}, banners: {} };

for (const [slug, p] of Object.entries(cfg.products)) {
  const gallery = [];
  const file = id => path.join(SRC, `${id}.jpg`);
  const meta = await sharp(file(p.photo[0])).metadata();
  const main = crop(meta, p.focus, p.zoom);
  const shots = [{ id: p.photo[0], box: main, sizes: SIZES }];
  if (p.photo[1]) {
    const m2 = await sharp(file(p.photo[1])).metadata();
    shots.push({ id: p.photo[1], box: crop(m2, p.focus, p.zoom), sizes: SIZES.slice(0, 2) });
  } else if (p.zoom < 0.9) {
    shots.push({ id: p.photo[0], box: crop(meta, p.focus, 1), sizes: SIZES.slice(0, 2) });
  }
  const detail = crop(meta, p.focus, p.zoom * 0.5);
  if (detail.width >= DETAIL_MIN) shots.push({ id: p.photo[0], box: detail, sizes: SIZES.slice(0, 2) });
  for (const [i, s] of shots.entries()) {
    const widths = await variants(file(s.id), s.box, `p/${slug}-${i + 1}`, s.sizes);
    gallery.push({ src: `p/${slug}-${i + 1}`, widths, color: await dominant(file(s.id), s.box) });
  }
  manifest.products[slug] = gallery;
}

for (const [name, b] of Object.entries(cfg.banners)) {
  const f = path.join(SRC, `${b.photo}.jpg`);
  const meta = await sharp(f).metadata();
  const box = crop(meta, b.focus, 1);
  const widths = await variants(f, box, `b/${name}`, [720, 1200]);
  manifest.banners[name] = { src: `b/${name}`, widths, color: await dominant(f, box) };
}

fs.writeFileSync(path.resolve(HERE, "../src/data/images.gen.json"), JSON.stringify(manifest, null, 1) + "\n");
const files = fs.readdirSync(path.join(OUT, "p")).length + fs.readdirSync(path.join(OUT, "b")).length;
const bytes = ["p", "b"].flatMap(d => fs.readdirSync(path.join(OUT, d)).map(f => fs.statSync(path.join(OUT, d, f)).size)).reduce((a, b) => a + b, 0);
console.log(`${Object.keys(manifest.products).length} products, ${files} files, ${(bytes / 1048576).toFixed(1)} MB`);
