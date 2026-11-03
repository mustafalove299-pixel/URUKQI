import { Link } from "react-router";
import { Heart, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { COLORS, type Product } from "@/data/catalog";
import { discountPct, gallery, iqd, pct as pctText, totalStock } from "@/lib/format";
import { useStore } from "@/store/store";
import { cn } from "@/lib/utils";

export function Picture({ image, index = 0, sizes, alt, className, eager }: { image: string; index?: number; sizes: string; alt: string; className?: string; eager?: boolean }) {
  const shots = gallery(image);
  const s = shots[Math.min(index, shots.length - 1)];
  return (
    <img
      src={s.src}
      srcSet={s.srcSet}
      sizes={sizes}
      alt={alt}
      width={960}
      height={1200}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      style={{ backgroundColor: s.color }}
      className={cn("h-full w-full object-cover", className)}
    />
  );
}

export function Price({ price, oldPrice, className }: { price: number; oldPrice?: number; className?: string }) {
  const pct = discountPct(price, oldPrice);
  return (
    <p className={cn("flex flex-wrap items-baseline gap-x-2", className)}>
      <span className="font-semibold num" data-testid="price">{iqd(price)}</span>
      {pct > 0 && <><s className="text-sm text-muted-foreground num" aria-label={`السعر السابق ${iqd(oldPrice!)}`}>{iqd(oldPrice!)}</s><span className="text-xs font-semibold text-clay">خصم {pctText(pct)}</span></>}
    </p>
  );
}

export function WishButton({ slug, name, className }: { slug: string; name: string; className?: string }) {
  const on = useStore(s => s.wishlist.includes(slug));
  const toggle = useStore(s => s.toggleWish);
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? `إزالة ${name} من المفضلة` : `إضافة ${name} إلى المفضلة`}
      onClick={e => { e.preventDefault(); const now = toggle(slug); toast(now ? "أُضيف إلى المفضلة" : "أُزيل من المفضلة"); }}
      className={cn("grid size-10 place-items-center rounded-full bg-card/90 text-foreground shadow-sm backdrop-blur transition hover:bg-card", className)}
    >
      <Heart className={cn("size-[18px]", on && "fill-clay text-clay")} strokeWidth={1.6} />
    </button>
  );
}

export function ProductCard({ p, eager, sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" }: { p: Product; eager?: boolean; sizes?: string }) {
  const shots = gallery(p.image);
  const pct = discountPct(p.price, p.oldPrice);
  const out = totalStock(p.stock) === 0;
  return (
    <article className="group relative">
      <Link to={`/product/${p.slug}`} className="block focus-visible:outline-offset-4">
        <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-muted">
          <Picture image={p.image} sizes={sizes} alt={p.name} eager={eager} className="transition duration-700 ease-out group-hover:scale-[1.03]" />
          {shots.length > 1 && (
            <Picture image={p.image} index={1} sizes={sizes} alt="" className="absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100" />
          )}
          <div className="absolute start-3 top-3 flex flex-col items-start gap-1.5">
            {out && <span className="rounded-full bg-foreground px-2.5 py-1 text-[11px] font-medium text-background">نفدت الكمية</span>}
            {!out && pct > 0 && <span className="rounded-full bg-clay px-2.5 py-1 text-[11px] font-medium text-white">خصم {pctText(pct)}</span>}
            {!out && p.tags.includes("new") && <span className="rounded-full bg-card px-2.5 py-1 text-[11px] font-medium">جديد</span>}
          </div>
        </div>
        <div className="mt-3 space-y-1 pe-1">
          <h3 className="text-[15px] font-medium leading-snug">{p.name}</h3>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="inline-block size-2.5 rounded-full border border-black/10" style={{ background: COLORS[p.color].hex }} aria-hidden />
            {COLORS[p.color].label}
          </p>
          <Price price={p.price} oldPrice={p.oldPrice} className="text-sm" />
        </div>
      </Link>
      <WishButton slug={p.slug} name={p.name} className="absolute end-3 top-3" />
    </article>
  );
}

export function Qty({ value, max, onChange, label }: { value: number; max: number; onChange: (n: number) => void; label: string }) {
  return (
    <div className="inline-flex h-11 items-center rounded-sm border border-input bg-card" role="group" aria-label={label}>
      <button type="button" className="grid size-11 place-items-center disabled:opacity-35" onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="زيادة الكمية"><Plus className="size-4" /></button>
      <input
        className="h-full w-10 bg-transparent text-center text-sm num outline-none"
        inputMode="numeric"
        value={value}
        aria-label="الكمية"
        onChange={e => { const n = parseInt(e.target.value.replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 1632)), 10); if (!Number.isNaN(n)) onChange(Math.max(1, Math.min(n, max))); }}
      />
      <button type="button" className="grid size-11 place-items-center disabled:opacity-35" onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label="إنقاص الكمية"><Minus className="size-4" /></button>
    </div>
  );
}

export function SectionHead({ kicker, title, to, link }: { kicker?: string; title: string; to?: string; link?: string }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4 md:mb-8">
      <div>
        {kicker && <p className="mb-1 font-latin text-sm tracking-[0.25em] text-clay uppercase">{kicker}</p>}
        <h2 className="font-display text-3xl leading-tight md:text-4xl">{title}</h2>
      </div>
      {to && <Link to={to} className="inline-flex min-h-11 shrink-0 items-center text-sm underline decoration-foreground/40 underline-offset-[6px] hover:decoration-foreground">{link ?? "عرض الكل"}</Link>}
    </div>
  );
}

export function Empty({ icon, title, text, children }: { icon: React.ReactNode; title: string; text: string; children?: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
      <div className="mb-5 grid size-16 place-items-center rounded-full bg-sand text-clay">{icon}</div>
      <h2 className="font-display text-2xl">{title}</h2>
      <p className="mt-2 text-muted-foreground">{text}</p>
      {children && <div className="mt-6 flex flex-wrap justify-center gap-3">{children}</div>}
    </div>
  );
}
