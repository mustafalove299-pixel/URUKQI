import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import useEmblaCarousel from "embla-carousel-react";
import { Check, ChevronLeft, ChevronRight, PackageX, Truck, ZoomIn } from "lucide-react";
import { toast } from "sonner";
import { CATEGORIES, COLORS } from "@/data/catalog";
import { gallery, totalStock } from "@/lib/format";
import { useStore } from "@/store/store";
import { Empty, Price, ProductCard, Qty, WishButton } from "@/components/store-ui";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

function Gallery({ image, name }: { image: string; name: string }) {
  const shots = gallery(image);
  const [ref, api] = useEmblaCarousel({ direction: "rtl", loop: false });
  const [index, setIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  const [hover, setHover] = useState<string | null>(null);

  useEffect(() => {
    if (!api) return;
    const on = () => setIndex(api.selectedScrollSnap());
    api.on("select", on);
    return () => { api.off("select", on); };
  }, [api]);
  useEffect(() => { api?.scrollTo(0, true); setIndex(0); }, [image, api]);
  const go = useCallback((i: number) => api?.scrollTo(i), [api]);
  const point = (e: React.PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
  };

  return (
    <div className="flex flex-col-reverse gap-3 md:flex-row">
      {shots.length > 1 && (
        <div className="flex gap-2 md:w-20 md:flex-col" role="tablist" aria-label="صور المنتج">
          {shots.map((s, i) => (
            <button key={s.src} type="button" role="tab" aria-selected={index === i} aria-label={`الصورة ${i + 1}`} onClick={() => go(i)}
              className={`aspect-[4/5] w-16 overflow-hidden rounded-sm border-2 md:w-full ${index === i ? "border-foreground" : "border-transparent opacity-70 hover:opacity-100"}`}>
              <img src={s.src} srcSet={s.srcSet} sizes="80px" alt="" className="h-full w-full object-cover" style={{ backgroundColor: s.color }} />
            </button>
          ))}
        </div>
      )}
      <div className="relative flex-1">
        <div ref={ref} className="overflow-hidden rounded-sm bg-muted">
          <div className="flex touch-pan-y">
            {shots.map((s, i) => (
              <div key={s.src} className="relative aspect-[4/5] min-w-0 flex-[0_0_100%] overflow-hidden"
                onPointerMove={e => { if (e.pointerType === "mouse") setHover(point(e)); }} onPointerLeave={() => setHover(null)}>
                <img src={s.src} srcSet={s.srcSet} sizes="(max-width: 768px) 100vw, 50vw" alt={i === 0 ? name : `${name} — صورة ${i + 1}`}
                  loading={i === 0 ? "eager" : "lazy"} style={{ backgroundColor: s.color, transformOrigin: hover ?? "50% 50%" }}
                  className={`h-full w-full object-cover transition-transform duration-300 ${hover && i === index ? "md:scale-[1.8]" : ""}`} />
              </div>
            ))}
          </div>
        </div>
        <button type="button" onClick={() => { setZoomed(false); setZoomOpen(true); }} className="absolute bottom-3 start-3 inline-flex h-10 items-center gap-1.5 rounded-full bg-card/90 px-4 text-sm shadow-sm backdrop-blur">
          <ZoomIn className="size-4" />تكبير
        </button>
        {shots.length > 1 && (
          <div className="absolute bottom-3 end-3 flex gap-1.5">
            <button type="button" aria-label="الصورة السابقة" disabled={index === 0} onClick={() => go(index - 1)} className="grid size-10 place-items-center rounded-full bg-card/90 shadow-sm disabled:opacity-40"><ChevronRight className="size-4" /></button>
            <button type="button" aria-label="الصورة التالية" disabled={index === shots.length - 1} onClick={() => go(index + 1)} className="grid size-10 place-items-center rounded-full bg-card/90 shadow-sm disabled:opacity-40"><ChevronLeft className="size-4" /></button>
          </div>
        )}
      </div>
      <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
        <DialogContent className="max-h-[94svh] w-[min(94vw,880px)] max-w-none overflow-hidden bg-card p-2 sm:max-w-none">
          <DialogTitle className="sr-only">{name}</DialogTitle>
          <DialogDescription className="sr-only">اضغط على الصورة للتكبير أو التصغير</DialogDescription>
          <div className={`relative aspect-[4/5] max-h-[88svh] overflow-hidden ${zoomed ? "cursor-zoom-out" : "cursor-zoom-in"}`}
            onClick={e => { setOrigin(point(e as unknown as React.PointerEvent<HTMLElement>)); setZoomed(z => !z); }}
            onPointerMove={e => { if (zoomed) setOrigin(point(e)); }}>
            <img src={shots[index].large} alt={name} className="mx-auto h-full w-auto object-contain transition-transform duration-300"
              style={{ transform: zoomed ? "scale(2.2)" : "none", transformOrigin: origin }} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function ProductPage() {
  const { slug } = useParams();
  const products = useStore(s => s.products);
  const p = products.find(x => x.slug === slug);
  const inCart = useStore(s => s.cart);
  const add = useStore(s => s.addToCart);
  const [size, setSize] = useState("");
  const [qty, setQty] = useState(1);
  const [sizeError, setSizeError] = useState(false);

  useEffect(() => {
    if (!p) return;
    setSize(p.sizes.length === 1 ? p.sizes[0] : "");
    setQty(1);
    setSizeError(false);
    document.title = `${p.name} — نَسَق`;
    return () => { document.title = "نَسَق — متجر تجريبي من URUKQI"; };
  }, [p?.slug]);

  if (!p || !p.enabled) {
    return (
      <Empty icon={<PackageX className="size-7" />} title={p ? "هذا المنتج غير متاح حاليًا" : "المنتج غير موجود"} text={p ? "أوقفته إدارة المتجر مؤقتًا." : "ربما حُذف أو تغيّر الرابط."}>
        <Link to="/shop" className="inline-flex h-11 items-center rounded-sm bg-foreground px-6 text-background">تصفّح المنتجات</Link>
      </Empty>
    );
  }

  const cat = CATEGORIES.find(c => c.id === p.category)!;
  const already = size ? inCart.find(l => l.slug === p.slug && l.size === size)?.qty ?? 0 : 0;
  const available = size ? (p.stock[size] ?? 0) : totalStock(p.stock);
  const canAdd = size ? available - already : 0;
  const related = products.filter(x => x.enabled && x.slug !== p.slug && x.category === p.category).sort((a, b) => b.sold - a.sold).slice(0, 4);

  const submit = () => {
    if (!size) { setSizeError(true); document.getElementById("sizes")?.focus(); return; }
    const r = add(p.slug, size, qty);
    if (!r.added) { toast.error("وصلت إلى الحد المتوفر من هذا المقاس في سلتك."); return; }
    setQty(1);
    toast.success(r.capped ? `أُضيفت ${r.added} قطعة فقط حسب المتوفر.` : "أُضيف إلى السلة", {
      action: { label: "عرض السلة", onClick: () => window.dispatchEvent(new Event("nasaq:open-cart")) }
    });
  };

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 md:px-8 md:py-10">
      <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-muted-foreground" aria-label="مسار الصفحة">
        <Link to="/" className="hover:text-foreground">الرئيسية</Link><span aria-hidden>/</span>
        <Link to={`/shop?cat=${p.category}`} className="hover:text-foreground">{cat.label}</Link><span aria-hidden>/</span>
        <span className="text-foreground" aria-current="page">{p.name}</span>
      </nav>

      <div className="grid gap-8 md:grid-cols-[1.1fr_1fr] lg:gap-16">
        <Gallery image={p.image} name={p.name} />

        <div className="md:sticky md:top-28 md:self-start">
          <p className="text-sm text-muted-foreground">{cat.label}</p>
          <div className="mt-2 flex items-start justify-between gap-4">
            <h1 className="font-display text-4xl leading-tight md:text-5xl">{p.name}</h1>
            <WishButton slug={p.slug} name={p.name} className="mt-1 border bg-card shadow-none" />
          </div>
          <Price price={p.price} oldPrice={p.oldPrice} className="mt-4 text-xl" />
          <p className="mt-5 leading-8 text-muted-foreground">{p.description}</p>

          <div className="mt-6 flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">اللون:</span>
            <span className="size-4 rounded-full border border-black/10" style={{ background: COLORS[p.color].hex }} aria-hidden />
            <span>{COLORS[p.color].label}</span>
          </div>

          {p.sizes.length > 1 || p.sizes[0] !== "مقاس واحد" ? (
            <fieldset className="mt-6">
              <legend className="mb-3 flex w-full justify-between text-sm"><span className="font-semibold">اختر المقاس</span>{sizeError && <span className="text-destructive" role="alert">اختر المقاس أولًا</span>}</legend>
              <div id="sizes" tabIndex={-1} className="flex flex-wrap gap-2" role="radiogroup" aria-label="المقاس">
                {p.sizes.map(s => {
                  const left = p.stock[s] ?? 0;
                  return (
                    <button key={s} type="button" role="radio" aria-checked={size === s} disabled={left === 0}
                      onClick={() => { setSize(s); setQty(1); setSizeError(false); }}
                      className={`relative h-12 min-w-14 rounded-sm border px-4 text-sm transition ${size === s ? "border-foreground bg-foreground text-background" : "border-input bg-card hover:border-foreground"} disabled:cursor-not-allowed disabled:text-muted-foreground disabled:line-through disabled:opacity-60`}>
                      {s}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ) : null}

          <p className="mt-5 flex items-center gap-2 text-sm" aria-live="polite">
            {available === 0 ? <span className="text-destructive">نفدت الكمية{size ? " لهذا المقاس" : ""}</span>
              : available <= 3 ? <span className="text-clay">متبقٍ <span className="num">{available}</span> فقط{size ? " من هذا المقاس" : ""}</span>
              : <><Check className="size-4 text-emerald-700" /><span>متوفر</span></>}
            {already > 0 && <span className="text-muted-foreground">· في سلتك <span className="num">{already}</span></span>}
          </p>

          <div className="mt-5 flex gap-3">
            <Qty value={qty} max={Math.max(1, canAdd || 1)} onChange={setQty} label="الكمية" />
            <Button className="h-11 flex-1 text-[15px]" onClick={submit} disabled={totalStock(p.stock) === 0 || (!!size && canAdd <= 0)}>
              {totalStock(p.stock) === 0 ? "نفدت الكمية" : size && canAdd <= 0 ? "كل المتوفر في سلتك" : "أضف إلى السلة"}
            </Button>
          </div>

          <div className="mt-6 flex items-start gap-3 rounded-sm bg-sand px-4 py-3 text-sm leading-6">
            <Truck className="mt-0.5 size-4 shrink-0 text-clay" />
            <p>توصيل خلال 1–3 أيام في بغداد و2–5 أيام للمحافظات، والدفع عند الاستلام. <span className="text-muted-foreground">(مثال توضيحي)</span></p>
          </div>

          <div className="mt-8 divide-y border-y">
            <details open className="group py-4">
              <summary className="flex min-h-8 cursor-pointer list-none items-center justify-between font-medium">التفاصيل<span className="text-xl leading-none transition group-open:rotate-45" aria-hidden>+</span></summary>
              <ul className="mt-3 list-disc space-y-1.5 ps-5 text-sm leading-6 text-muted-foreground">{p.details.map(d => <li key={d}>{d}</li>)}</ul>
            </details>
            <details className="group py-4">
              <summary className="flex min-h-8 cursor-pointer list-none items-center justify-between font-medium">معلومات المنتج<span className="text-xl leading-none transition group-open:rotate-45" aria-hidden>+</span></summary>
              <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
                <dt className="text-muted-foreground">رمز المنتج</dt><dd className="num text-start">{p.sku}</dd>
                <dt className="text-muted-foreground">القسم</dt><dd>{cat.label}</dd>
                <dt className="text-muted-foreground">المقاسات</dt><dd>{p.sizes.join("، ")}</dd>
              </dl>
            </details>
            <details className="group py-4">
              <summary className="flex min-h-8 cursor-pointer list-none items-center justify-between font-medium">التوصيل والاستبدال<span className="text-xl leading-none transition group-open:rotate-45" aria-hidden>+</span></summary>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">5,000 د.ع لبغداد و8,000 د.ع للمحافظات، والتوصيل مجاني للطلبات فوق 150,000 د.ع. يمكن استبدال المقاس خلال 7 أيام. جميع هذه السياسات أمثلة ضمن المتجر التجريبي.</p>
            </details>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20" aria-labelledby="related">
          <h2 id="related" className="mb-8 font-display text-3xl md:text-4xl">قد يعجبك أيضًا</h2>
          <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4 md:gap-x-5">{related.map(r => <ProductCard key={r.slug} p={r} />)}</div>
        </section>
      )}
    </div>
  );
}
