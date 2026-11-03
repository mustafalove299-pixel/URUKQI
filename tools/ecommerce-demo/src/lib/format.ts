import images from "@/data/images.gen.json";

// Numbers are isolated left-to-right (U+2066…U+2069) so they read correctly inside Arabic text.
const ltr = (s: string) => `⁦${s}⁩`;
export const iqd = (n: number) => `${ltr(Math.round(n).toLocaleString("en-US"))} د.ع`;
export const pct = (n: number) => ltr(`${n}%`);
export const discountPct = (price: number, old?: number) => (old && old > price ? Math.round((1 - price / old) * 100) : 0);
export const totalStock = (stock: Record<string, number>) => Object.values(stock).reduce((a, b) => a + b, 0);

export const dateTime = (ms: number) => ltr(dateTimeRaw(ms));
const dateTimeRaw = (ms: number) =>
  new Date(ms).toLocaleString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });
export const dateOnly = (ms: number) => ltr(new Date(ms).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }));

type Shot = { src: string; widths: number[]; color: string };
const PRODUCT_IMAGES = images.products as Record<string, Shot[]>;
export const IMAGE_KEYS = Object.keys(PRODUCT_IMAGES);

const toSet = (s: Shot) => s.widths.map(w => `./img/${s.src}-${w}.webp ${w}w`).join(", ");
const toSrc = (s: Shot, target = 960) => `./img/${s.src}-${s.widths.find(w => w >= target) ?? s.widths[s.widths.length - 1]}.webp`;

export function gallery(key: string) {
  const shots = PRODUCT_IMAGES[key] ?? PRODUCT_IMAGES[IMAGE_KEYS[0]];
  return shots.map(s => ({ srcSet: toSet(s), src: toSrc(s), large: toSrc(s, 1400), color: s.color }));
}

export function banner(name: "hero" | "atelier" | "rack") {
  const b = (images.banners as Record<string, Shot>)[name];
  return { srcSet: toSet(b), src: toSrc(b, 1200), color: b.color };
}

// Arabic-aware search: alef forms, taa marbuta, alef maqsura and diacritics are treated as equal.
export const normalize = (s: string) =>
  s.toLowerCase().replace(/[إأآٱ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/[ً-ْـ]/g, "").replace(/\s+/g, " ").trim();
