import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { SearchX, SlidersHorizontal, X } from "lucide-react";
import { CATEGORIES, COLORS, type CategoryId, type ColorId, type Product } from "@/data/catalog";
import { discountPct, iqd, normalize, totalStock } from "@/lib/format";
import { useStore } from "@/store/store";
import { Empty, ProductCard } from "@/components/store-ui";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const PAGE = 12;
const SORTS = { featured: "المميز", new: "الأحدث", best: "الأكثر مبيعًا", "price-asc": "السعر: من الأقل", "price-desc": "السعر: من الأعلى", discount: "أعلى خصم" } as const;
type Sort = keyof typeof SORTS;

function sortBy(list: Product[], sort: Sort) {
  const l = [...list];
  if (sort === "new") return l.sort((a, b) => Number(b.tags.includes("new")) - Number(a.tags.includes("new")) || b.rank - a.rank);
  if (sort === "best") return l.sort((a, b) => b.sold - a.sold);
  if (sort === "price-asc") return l.sort((a, b) => a.price - b.price);
  if (sort === "price-desc") return l.sort((a, b) => b.price - a.price);
  if (sort === "discount") return l.sort((a, b) => discountPct(b.price, b.oldPrice) - discountPct(a.price, a.oldPrice) || b.sold - a.sold);
  return l.sort((a, b) => b.rank - a.rank);
}

export function Shop() {
  const [params, setParams] = useSearchParams();
  const all = useStore(s => s.products);
  const products = useMemo(() => all.filter(p => p.enabled), [all]);
  const maxPrice = useMemo(() => Math.ceil(Math.max(...products.map(p => p.price), 1000) / 5000) * 5000, [products]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [visible, setVisible] = useState(PAGE);

  const q = params.get("q") ?? "";
  const cat = (params.get("cat") as CategoryId) || "";
  const sort = ((params.get("sort") as Sort) in SORTS ? params.get("sort") : "featured") as Sort;
  const sizes = params.getAll("size");
  const colors = params.getAll("color") as ColorId[];
  const inStock = params.get("stock") === "1";
  const min = Number(params.get("min") ?? 0);
  const max = Math.min(Number(params.get("max") ?? maxPrice), maxPrice);

  const update = (fn: (p: URLSearchParams) => void) => {
    const next = new URLSearchParams(params);
    fn(next);
    setParams(next, { replace: true });
  };
  const toggle = (key: string, value: string) => update(p => {
    const cur = p.getAll(key);
    p.delete(key);
    (cur.includes(value) ? cur.filter(v => v !== value) : [...cur, value]).forEach(v => p.append(key, v));
  });

  const inCat = products.filter(p => !cat || p.category === cat);
  const sizeOptions = [...new Set(inCat.flatMap(p => p.sizes))].filter(s => s !== "مقاس واحد");
  const colorOptions = [...new Set(inCat.map(p => p.color))];

  const results = useMemo(() => {
    const n = normalize(q);
    const words = n ? n.split(" ") : [];
    return sortBy(products.filter(p => {
      if (cat && p.category !== cat) return false;
      if (p.price < min || p.price > max) return false;
      if (sizes.length && !sizes.some(s => (p.stock[s] ?? 0) > 0)) return false;
      if (colors.length && !colors.includes(p.color)) return false;
      if (inStock && totalStock(p.stock) === 0) return false;
      if (words.length) {
        const hay = normalize([p.name, p.description, CATEGORIES.find(c => c.id === p.category)!.label, COLORS[p.color].label, p.sku].join(" "));
        if (!words.every(w => hay.includes(w))) return false;
      }
      return true;
    }), sort);
  }, [products, q, cat, min, max, sizes.join(), colors.join(), inStock, sort]);

  useEffect(() => setVisible(PAGE), [params.toString()]);

  const active = [
    ...(q ? [{ k: "q", label: `بحث: ${q}`, clear: () => update(p => p.delete("q")) }] : []),
    ...sizes.map(s => ({ k: `size-${s}`, label: `المقاس ${s}`, clear: () => toggle("size", s) })),
    ...colors.map(c => ({ k: `color-${c}`, label: COLORS[c].label, clear: () => toggle("color", c) })),
    ...(min > 0 || max < maxPrice ? [{ k: "price", label: `${iqd(min)} – ${iqd(max)}`, clear: () => update(p => { p.delete("min"); p.delete("max"); }) }] : []),
    ...(inStock ? [{ k: "stock", label: "المتوفر فقط", clear: () => update(p => p.delete("stock")) }] : [])
  ];
  const clearAll = () => update(p => { ["q", "size", "color", "min", "max", "stock"].forEach(k => p.delete(k)); });
  const title = cat ? CATEGORIES.find(c => c.id === cat)?.label : sort === "discount" ? "العروض" : "كل المنتجات";

  const filters = (
    <div className="space-y-8">
      <fieldset>
        <legend className="mb-3 text-sm font-semibold">القسم</legend>
        <div className="flex flex-col gap-1">
          {[{ id: "", label: "الكل" }, ...CATEGORIES].map(c => (
            <button key={c.id} type="button" aria-pressed={cat === c.id} onClick={() => update(p => { if (c.id) p.set("cat", c.id); else p.delete("cat"); p.delete("size"); })}
              className={`flex min-h-10 items-center justify-between rounded-sm px-2 text-start text-[15px] ${cat === c.id ? "bg-sand font-medium" : "hover:bg-muted"}`}>
              {c.label}<span className="text-xs text-muted-foreground num">{products.filter(p => !c.id || p.category === c.id).length}</span>
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-4 text-sm font-semibold">السعر</legend>
        <Slider dir="rtl" min={0} max={maxPrice} step={5000} value={[min, max]} minStepsBetweenThumbs={1} aria-label="نطاق السعر"
          onValueChange={([a, b]) => update(p => { if (a > 0) p.set("min", String(a)); else p.delete("min"); if (b < maxPrice) p.set("max", String(b)); else p.delete("max"); })} />
        <p className="mt-3 flex justify-between text-xs text-muted-foreground"><span className="num">{iqd(min)}</span><span className="num">{iqd(max)}</span></p>
      </fieldset>
      {sizeOptions.length > 0 && (
        <fieldset>
          <legend className="mb-3 text-sm font-semibold">المقاس</legend>
          <div className="flex flex-wrap gap-2">
            {sizeOptions.map(s => (
              <button key={s} type="button" aria-pressed={sizes.includes(s)} onClick={() => toggle("size", s)}
                className={`h-10 min-w-11 rounded-sm border px-3 text-sm ${sizes.includes(s) ? "border-foreground bg-foreground text-background" : "border-input bg-card hover:border-foreground"}`}>{s}</button>
            ))}
          </div>
        </fieldset>
      )}
      <fieldset>
        <legend className="mb-3 text-sm font-semibold">اللون</legend>
        <div className="flex flex-wrap gap-2">
          {colorOptions.map(c => (
            <button key={c} type="button" aria-pressed={colors.includes(c)} onClick={() => toggle("color", c)}
              className={`flex h-10 items-center gap-2 rounded-full border px-3 text-sm ${colors.includes(c) ? "border-foreground bg-sand" : "border-input bg-card hover:border-foreground"}`}>
              <span className="size-4 rounded-full border border-black/10" style={{ background: COLORS[c].hex }} aria-hidden />{COLORS[c].label}
            </button>
          ))}
        </div>
      </fieldset>
      <label className="flex min-h-10 cursor-pointer items-center gap-3 text-[15px]">
        <Checkbox checked={inStock} onCheckedChange={v => update(p => { if (v) p.set("stock", "1"); else p.delete("stock"); })} />
        المتوفر فقط
      </label>
    </div>
  );

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 md:px-8 md:py-12">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="font-display text-4xl md:text-5xl">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground" aria-live="polite"><span className="num">{results.length}</span> منتج</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="h-11 gap-2 lg:hidden" onClick={() => setFiltersOpen(true)}>
            <SlidersHorizontal className="size-4" />تصفية{active.length > 0 && <span className="num">({active.length})</span>}
          </Button>
          <Select dir="rtl" value={sort} onValueChange={v => update(p => { if (v === "featured") p.delete("sort"); else p.set("sort", v); })}>
            <SelectTrigger className="h-11 min-w-44 bg-card" aria-label="ترتيب حسب"><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(SORTS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </header>

      {active.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {active.map(a => (
            <button key={a.k} type="button" onClick={a.clear} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-sand px-3 text-sm" aria-label={`إزالة ${a.label}`}>
              <span className="num">{a.label}</span><X className="size-3.5" />
            </button>
          ))}
          <button type="button" onClick={clearAll} className="h-9 px-2 text-sm underline underline-offset-4">مسح الكل</button>
        </div>
      )}

      <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block" aria-label="التصفية">{filters}</aside>
        <section aria-label="المنتجات">
          {results.length === 0 ? (
            <Empty icon={<SearchX className="size-7" />} title="لا توجد نتائج" text="جرّب كلمة أخرى أو خفّف التصفية.">
              <Button className="h-11 px-6" onClick={clearAll}>مسح التصفية</Button>
            </Empty>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-x-3 gap-y-9 md:grid-cols-3 md:gap-x-5">
                {results.slice(0, visible).map((p, i) => <ProductCard key={p.slug} p={p} eager={i < 6} />)}
              </div>
              <div className="mt-12 flex flex-col items-center gap-3">
                <p className="text-sm text-muted-foreground">عرض <span className="num">{Math.min(visible, results.length)}</span> من <span className="num">{results.length}</span></p>
                {visible < results.length && <Button variant="outline" className="h-12 min-w-48 bg-card" onClick={() => setVisible(v => v + PAGE)}>عرض المزيد</Button>}
              </div>
            </>
          )}
        </section>
      </div>

      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="right" className="flex w-[88vw] max-w-sm flex-col bg-background">
          <SheetHeader><SheetTitle className="font-display text-2xl">تصفية</SheetTitle><SheetDescription className="sr-only">خيارات التصفية</SheetDescription></SheetHeader>
          <div className="flex-1 overflow-y-auto px-4">{filters}</div>
          <div className="flex gap-2 border-t p-4">
            <Button className="h-12 flex-1" onClick={() => setFiltersOpen(false)}>عرض <span className="num">{results.length}</span> منتج</Button>
            <Button variant="outline" className="h-12" onClick={clearAll}>مسح</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
