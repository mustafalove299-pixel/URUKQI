import { useMemo } from "react";
import { Link } from "react-router";
import { RotateCcw, Truck, Wallet } from "lucide-react";
import { CATEGORIES } from "@/data/catalog";
import { banner, discountPct } from "@/lib/format";
import { useStore } from "@/store/store";
import { Picture, ProductCard, SectionHead } from "@/components/store-ui";

function Banner({ name, className, sizes = "100vw", eager }: { name: "hero" | "atelier" | "rack"; className?: string; sizes?: string; eager?: boolean }) {
  const b = banner(name);
  return <img src={b.src} srcSet={b.srcSet} sizes={sizes} alt="" loading={eager ? "eager" : "lazy"} decoding="async" style={{ backgroundColor: b.color }} className={className} />;
}

export function Home() {
  const all = useStore(s => s.products);
  const products = useMemo(() => all.filter(p => p.enabled), [all]);
  const fresh = [...products].filter(p => p.tags.includes("new")).sort((a, b) => b.rank - a.rank).slice(0, 8);
  const best = [...products].sort((a, b) => b.sold - a.sold).slice(0, 8);
  const offers = products.filter(p => discountPct(p.price, p.oldPrice) > 0).slice(0, 4);

  return (
    <>
      <section className="relative isolate overflow-hidden bg-[#e9e2d6]">
        <div className="mx-auto grid max-w-[1440px] md:min-h-[min(82svh,760px)] md:grid-cols-[1fr_1.15fr]">
          <div className="relative z-10 order-2 flex flex-col justify-center px-4 py-8 md:order-1 md:px-12 md:py-16 lg:px-16">
            <p className="font-latin text-sm tracking-[0.35em] text-clay uppercase">Autumn · Winter 2026</p>
            <h1 className="mt-3 font-display text-[40px] leading-[1.2] md:mt-4 md:text-[64px] lg:text-[76px]">أناقة هادئة<br />تليق بكل يوم.</h1>
            <p className="mt-5 max-w-md text-base leading-8 text-muted-foreground md:text-lg">مجموعة الخريف من نَسَق: خامات طبيعية، ألوان ترابية، وقطع تُلبس لسنوات لا لموسم واحد.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/shop" className="inline-flex h-12 items-center rounded-sm bg-foreground px-7 text-background transition hover:bg-ink-2">تسوّق المجموعة</Link>
              <Link to="/shop?sort=new" className="inline-flex h-12 items-center rounded-sm border border-foreground/30 px-7 transition hover:border-foreground">وصل حديثًا</Link>
            </div>
          </div>
          <div className="relative order-1 aspect-[4/3] w-full md:order-2 md:aspect-auto">
            <Banner name="hero" eager className="absolute inset-0 h-full w-full object-cover" sizes="(max-width: 768px) 100vw, 55vw" />
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/25 to-transparent md:hidden" aria-hidden />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-4 pt-16 md:px-8 md:pt-24" aria-labelledby="cats">
        <SectionHead kicker="Collections" title="تسوّق حسب القسم" />
        <h2 id="cats" className="sr-only">الأقسام</h2>
        <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-6 md:gap-4 md:px-0">
          {CATEGORIES.map(c => (
            <Link key={c.id} to={`/shop?cat=${c.id}`} className="group w-[42vw] shrink-0 snap-start sm:w-[30vw] md:w-auto">
              <div className="aspect-[4/5] overflow-hidden rounded-sm bg-muted">
                <Picture image={c.cover} sizes="(max-width: 768px) 42vw, 16vw" alt="" className="transition duration-700 group-hover:scale-105" />
              </div>
              <p className="mt-3 text-[15px] font-medium">{c.label}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-4 pt-16 md:px-8 md:pt-24">
        <SectionHead kicker="New In" title="وصل حديثًا" to="/shop?sort=new" />
        <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4 md:gap-x-5">
          {fresh.map(p => <ProductCard key={p.slug} p={p} />)}
        </div>
      </section>

      <section className="mx-auto mt-16 grid max-w-[1440px] items-stretch md:mt-24 md:grid-cols-2 md:px-8">
        <div className="aspect-[4/5] overflow-hidden md:aspect-auto md:min-h-[640px]">
          <Banner name="atelier" className="h-full w-full object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
        </div>
        <div className="flex flex-col justify-center bg-card px-6 py-12 md:px-14">
          <p className="font-latin text-sm tracking-[0.35em] text-clay uppercase">The Atelier</p>
          <h2 className="mt-3 font-display text-4xl leading-tight md:text-5xl">صُنعت لتبقى معك.</h2>
          <p className="mt-5 max-w-md leading-8 text-muted-foreground">نختار خامات تتحمل الاستعمال اليومي، ونصمم قطعًا تتناسق مع بعضها، حتى تبني خزانة أقل عددًا وأكثر أناقة.</p>
          <div className="mt-8 grid grid-cols-3 gap-4 border-t pt-6 text-center">
            <div><p className="font-display text-3xl num">{products.length}</p><p className="text-xs text-muted-foreground">قطعة في المجموعة</p></div>
            <div><p className="font-display text-3xl num">6</p><p className="text-xs text-muted-foreground">أقسام</p></div>
            <div><p className="font-display text-3xl num">18</p><p className="text-xs text-muted-foreground">محافظة للتوصيل</p></div>
          </div>
          <Link to="/shop?cat=women" className="mt-8 inline-flex h-12 w-fit items-center rounded-sm bg-foreground px-7 text-background hover:bg-ink-2">اكتشفي الأزياء النسائية</Link>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-4 pt-16 md:px-8 md:pt-24">
        <SectionHead kicker="Best Sellers" title="الأكثر مبيعًا" to="/shop?sort=best" />
        <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-4 md:gap-x-5 md:gap-y-8 md:overflow-visible md:px-0">
          {best.map(p => <div key={p.slug} className="w-[64vw] shrink-0 snap-start sm:w-[40vw] md:w-auto"><ProductCard p={p} sizes="(max-width: 768px) 64vw, 25vw" /></div>)}
        </div>
      </section>

      {offers.length > 0 && (
        <section className="mt-16 bg-foreground py-16 text-background md:mt-24 md:py-20">
          <div className="mx-auto max-w-[1440px] px-4 md:px-8">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <p className="font-latin text-sm tracking-[0.35em] text-[#d9b28f] uppercase">Seasonal Offers</p>
                <h2 className="mt-1 font-display text-4xl">عروض الموسم</h2>
              </div>
              <Link to="/shop?sort=discount" className="inline-flex min-h-11 items-center text-sm underline decoration-background/40 underline-offset-[6px] hover:decoration-background">كل العروض</Link>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4 md:gap-x-5 [&_h3]:text-background [&_p]:text-background/80">
              {offers.map(p => <ProductCard key={p.slug} p={p} />)}
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto mt-16 max-w-[1440px] px-4 md:mt-24 md:px-8">
        <div className="relative isolate overflow-hidden rounded-sm">
          <Banner name="rack" className="absolute inset-0 -z-10 h-full w-full object-cover" sizes="100vw" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-l from-black/55 via-black/25 to-transparent" aria-hidden />
          <div className="flex min-h-[420px] max-w-xl flex-col justify-end p-8 text-white md:min-h-[520px] md:p-14">
            <p className="font-latin text-sm tracking-[0.35em] uppercase">Home & Gifts</p>
            <h2 className="mt-2 font-display text-4xl leading-tight md:text-5xl">تفاصيل صغيرة تصنع بيتًا دافئًا.</h2>
            <p className="mt-4 leading-8 text-white/85">شموع وخزفيات وعطور مختارة، تصلح هدية أو لمسة لمكانك.</p>
            <Link to="/shop?cat=lifestyle" className="mt-6 inline-flex h-12 w-fit items-center rounded-sm bg-white px-7 text-foreground hover:bg-white/90">تسوّق المنزل</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-16 grid max-w-[1440px] gap-px overflow-hidden border-y bg-border px-0 md:mt-20 md:grid-cols-3">
        {[
          { icon: <Truck className="size-5" />, t: "توصيل لكل المحافظات", d: "5,000 د.ع لبغداد و8,000 د.ع للمحافظات، ومجاني فوق 150,000 د.ع." },
          { icon: <Wallet className="size-5" />, t: "الدفع عند الاستلام", d: "ادفع نقدًا عندما يصلك طلبك." },
          { icon: <RotateCcw className="size-5" />, t: "استبدال خلال 7 أيام", d: "إذا لم يناسبك المقاس، نستبدله لك." }
        ].map(x => (
          <div key={x.t} className="flex items-start gap-4 bg-background px-6 py-7">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sand text-clay">{x.icon}</span>
            <div><p className="font-medium">{x.t}</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{x.d}</p></div>
          </div>
        ))}
      </section>
      <p className="mx-auto max-w-[1440px] px-4 pt-3 text-xs text-muted-foreground md:px-8">سياسات التوصيل والاستبدال أمثلة ضمن المتجر التجريبي.</p>
    </>
  );
}
