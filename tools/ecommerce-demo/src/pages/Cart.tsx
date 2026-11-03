import { Link } from "react-router";
import { ShoppingBag, Trash2 } from "lucide-react";
import { SHIPPING } from "@/data/catalog";
import { iqd } from "@/lib/format";
import { cartTotals, lineAvailable, useStore } from "@/store/store";
import { Empty, Picture, Qty } from "@/components/store-ui";

export function CartPanel({ compact, onNavigate }: { compact?: boolean; onNavigate?: () => void }) {
  const products = useStore(s => s.products);
  const cart = useStore(s => s.cart);
  const coupons = useStore(s => s.coupons);
  const setQty = useStore(s => s.setQty);
  const remove = useStore(s => s.removeLine);
  const t = cartTotals(products, cart, coupons, undefined, "");
  const toFree = Math.max(0, SHIPPING.freeOver - t.subtotal);

  if (!t.lines.length) {
    return (
      <div className="flex flex-1 items-center justify-center px-6">
        <Empty icon={<ShoppingBag className="size-7" />} title="سلتك فارغة" text="أضف ما يعجبك، وسنحفظه لك هنا حتى لو أغلقت الصفحة.">
          <Link to="/shop" onClick={onNavigate} className="inline-flex h-11 items-center rounded-sm bg-foreground px-6 text-background">ابدأ التسوّق</Link>
        </Empty>
      </div>
    );
  }

  return (
    <div className={compact ? "flex min-h-0 flex-1 flex-col" : "grid gap-10 lg:grid-cols-[1fr_380px]"}>
      <div className={compact ? "flex-1 overflow-y-auto px-5" : ""}>
        {toFree > 0 ? (
          <p className="mt-4 rounded-sm bg-sand px-4 py-3 text-sm">أضف <span className="num font-semibold">{iqd(toFree)}</span> للحصول على توصيل مجاني.</p>
        ) : (
          <p className="mt-4 rounded-sm bg-emerald-50 px-4 py-3 text-sm text-emerald-900">طلبك مؤهل للتوصيل المجاني.</p>
        )}
        <ul className="divide-y" aria-label="محتويات السلة">
          {t.lines.map(l => {
            const p = l.product!;
            const max = lineAvailable(products, l.slug, l.size);
            return (
              <li key={`${l.slug}-${l.size}`} className="flex gap-4 py-5" data-testid="cart-line">
                <Link to={`/product/${p.slug}`} onClick={onNavigate} className="aspect-[4/5] w-20 shrink-0 overflow-hidden rounded-sm bg-muted sm:w-24">
                  <Picture image={p.image} sizes="96px" alt={p.name} />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link to={`/product/${p.slug}`} onClick={onNavigate} className="inline-block py-1 font-medium leading-snug hover:underline">{p.name}</Link>
                      <p className="mt-1 text-xs text-muted-foreground">{l.size !== "مقاس واحد" && <>المقاس: {l.size} · </>}<span className="num">{iqd(p.price)}</span></p>
                    </div>
                    <button type="button" className="-me-2 -mt-2 grid size-10 shrink-0 place-items-center text-muted-foreground hover:text-destructive" aria-label={`حذف ${p.name}`} onClick={() => remove(l.slug, l.size)}><Trash2 className="size-4" /></button>
                  </div>
                  <div className="mt-auto flex flex-wrap items-end justify-between gap-2 pt-3">
                    <Qty value={l.qty} max={max} onChange={n => setQty(l.slug, l.size, n)} label={`كمية ${p.name}`} />
                    <p className="font-semibold num" data-testid="line-total">{iqd(p.price * l.qty)}</p>
                  </div>
                  {l.qty >= max && <p className="mt-2 text-xs text-clay">هذا كل المتوفر من هذا المقاس.</p>}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      <div className={compact ? "border-t bg-card px-5 py-5" : "self-start rounded-sm border bg-card p-6 lg:sticky lg:top-28"}>
        {!compact && <h2 className="mb-4 font-display text-2xl">ملخص الطلب</h2>}
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-muted-foreground">المجموع الفرعي</dt><dd className="num font-semibold" data-testid="subtotal">{iqd(t.subtotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted-foreground">التوصيل</dt><dd className="text-muted-foreground">يُحسب في الخطوة التالية</dd></div>
        </dl>
        <Link to="/checkout" onClick={onNavigate} className="mt-5 flex h-12 w-full items-center justify-center rounded-sm bg-foreground text-background hover:bg-ink-2">إتمام الطلب</Link>
        {compact && <Link to="/cart" onClick={onNavigate} className="mt-2 flex h-11 w-full items-center justify-center text-sm underline underline-offset-4">عرض السلة كاملة</Link>}
      </div>
    </div>
  );
}

export function CartPage() {
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 md:px-8 md:py-12">
      <h1 className="mb-2 font-display text-4xl md:text-5xl">سلة التسوّق</h1>
      <CartPanel />
    </div>
  );
}
