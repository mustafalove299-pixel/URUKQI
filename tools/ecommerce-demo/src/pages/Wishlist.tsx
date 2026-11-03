import { useState } from "react";
import { Link } from "react-router";
import { Heart, X } from "lucide-react";
import { toast } from "sonner";
import { totalStock } from "@/lib/format";
import { useStore } from "@/store/store";
import { Empty, Picture, Price } from "@/components/store-ui";
import { Button } from "@/components/ui/button";

export function Wishlist() {
  const products = useStore(s => s.products);
  const wishlist = useStore(s => s.wishlist);
  const toggle = useStore(s => s.toggleWish);
  const add = useStore(s => s.addToCart);
  const [sizes, setSizes] = useState<Record<string, string>>({});
  const items = wishlist.map(slug => products.find(p => p.slug === slug)).filter((p): p is NonNullable<typeof p> => !!p);

  const moveToCart = (slug: string) => {
    const p = items.find(x => x.slug === slug)!;
    const size = p.sizes.length === 1 ? p.sizes[0] : sizes[slug];
    if (!size) { toast.error("اختر المقاس أولًا."); return; }
    const r = add(slug, size, 1);
    if (!r.added) { toast.error("لا توجد كمية إضافية متوفرة من هذا المقاس."); return; }
    toggle(slug);
    toast.success("نُقل إلى السلة", { action: { label: "عرض السلة", onClick: () => window.dispatchEvent(new Event("nasaq:open-cart")) } });
  };

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 md:px-8 md:py-12">
      <h1 className="font-display text-4xl md:text-5xl">المفضلة</h1>
      {!items.length ? (
        <Empty icon={<Heart className="size-7" />} title="لا توجد منتجات في المفضلة" text="اضغط على القلب في أي منتج لتحفظه هنا، وسيبقى محفوظًا عند عودتك.">
          <Link to="/shop" className="inline-flex h-11 items-center rounded-sm bg-foreground px-6 text-background">تصفّح المنتجات</Link>
        </Empty>
      ) : (
        <>
          <p className="mt-2 text-sm text-muted-foreground"><span className="num">{items.length}</span> منتج محفوظ</p>
          <ul className="mt-8 grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-4 md:gap-x-5">
            {items.map(p => {
              const unavailable = !p.enabled || totalStock(p.stock) === 0;
              return (
                <li key={p.slug} className="flex flex-col" data-testid="wish-item">
                  <div className="relative">
                    <Link to={`/product/${p.slug}`} className="block aspect-[4/5] overflow-hidden rounded-sm bg-muted"><Picture image={p.image} sizes="(max-width: 768px) 50vw, 25vw" alt={p.name} /></Link>
                    <button type="button" onClick={() => toggle(p.slug)} aria-label={`إزالة ${p.name} من المفضلة`} className="absolute end-3 top-3 grid size-10 place-items-center rounded-full bg-card/90 shadow-sm"><X className="size-4" /></button>
                  </div>
                  <Link to={`/product/${p.slug}`} className="mt-2 inline-block py-1 font-medium hover:underline">{p.name}</Link>
                  <Price price={p.price} oldPrice={p.oldPrice} className="mt-1 text-sm" />
                  {unavailable ? (
                    <p className="mt-3 text-sm text-muted-foreground">غير متوفر حاليًا</p>
                  ) : (
                    <div className="mt-3 flex flex-col gap-2">
                      {p.sizes.length > 1 && (
                        <select aria-label={`مقاس ${p.name}`} value={sizes[p.slug] ?? ""} onChange={e => setSizes(s => ({ ...s, [p.slug]: e.target.value }))}
                          className="h-11 rounded-sm border border-input bg-card px-3 text-sm">
                          <option value="">اختر المقاس</option>
                          {p.sizes.map(s => <option key={s} value={s} disabled={(p.stock[s] ?? 0) === 0}>{s}{(p.stock[s] ?? 0) === 0 ? " — نفد" : ""}</option>)}
                        </select>
                      )}
                      <Button className="h-11" onClick={() => moveToCart(p.slug)}>انقل إلى السلة</Button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
