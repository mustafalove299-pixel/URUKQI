import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { CheckCircle2, Info, LayoutDashboard, ShieldCheck, ShoppingBag } from "lucide-react";
import { GOVERNORATES } from "@/data/catalog";
import { dateTime, iqd, pct } from "@/lib/format";
import { cartTotals, STATUS, useStore, type Customer } from "@/store/store";
import { Empty, Picture } from "@/components/store-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const EMPTY: Customer = { name: "", phone: "", governorate: "", area: "", address: "", notes: "" };
const SAMPLE: Customer = { name: "زبون تجريبي", phone: "0770 123 4567", governorate: "بغداد", area: "المنصور", address: "شارع 14 رمضان، قرب الساحة", notes: "" };
const latin = (s: string) => s.replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 1632));

export function Checkout() {
  const products = useStore(s => s.products);
  const cart = useStore(s => s.cart);
  const coupons = useStore(s => s.coupons);
  const placeOrder = useStore(s => s.placeOrder);
  const navigate = useNavigate();
  const [c, setC] = useState<Customer>(EMPTY);
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState<string>();
  const [codeMsg, setCodeMsg] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof Customer, string>>>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const t = cartTotals(products, cart, coupons, applied, c.governorate);

  if (!t.lines.length) {
    return (
      <Empty icon={<ShoppingBag className="size-7" />} title="لا يوجد ما تطلبه بعد" text="سلتك فارغة. أضف منتجات ثم عد لإتمام الطلب.">
        <Link to="/shop" className="inline-flex h-11 items-center rounded-sm bg-foreground px-6 text-background">تصفّح المنتجات</Link>
      </Empty>
    );
  }

  const field = (k: keyof Customer) => ({
    id: `co-${k}`, value: c[k], "aria-invalid": !!errors[k] || undefined, "aria-describedby": errors[k] ? `co-${k}-err` : undefined,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { setC({ ...c, [k]: e.target.value }); setErrors({ ...errors, [k]: undefined }); }
  });
  const err = (k: keyof Customer) => errors[k] && <p id={`co-${k}-err`} className="mt-1.5 text-sm text-destructive">{errors[k]}</p>;

  const applyCode = () => {
    const found = coupons.find(x => x.active && x.code === code.trim().toUpperCase());
    if (found) { setApplied(found.code); setCodeMsg(`طُبّق خصم ${pct(found.percent)}`); } else { setApplied(undefined); setCodeMsg("الرمز غير صالح أو غير مفعّل."); }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const digits = latin(c.phone).replace(/\D/g, "");
    const next: typeof errors = {};
    if (c.name.trim().length < 2) next.name = "اكتب الاسم.";
    if (!/^07\d{9}$/.test(digits)) next.phone = "اكتب رقم هاتف عراقيًا من 11 رقمًا يبدأ بـ 07.";
    if (!c.governorate) next.governorate = "اختر المحافظة.";
    if (c.area.trim().length < 2) next.area = "اكتب المنطقة.";
    if (c.address.trim().length < 4) next.address = "اكتب أقرب نقطة دالة.";
    setErrors(next);
    if (Object.keys(next).length) {
      setFormError("أكمل الحقول المشار إليها.");
      document.getElementById(`co-${Object.keys(next)[0]}`)?.focus();
      return;
    }
    setBusy(true);
    setFormError("");
    window.setTimeout(() => {
      const r = placeOrder({ ...c, phone: digits }, applied);
      setBusy(false);
      if ("error" in r) { setFormError(r.error); return; }
      navigate(`/order/${r.id}`, { replace: true });
    }, 450);
  };

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 md:px-8 md:py-12">
      <h1 className="font-display text-4xl md:text-5xl">إتمام الطلب</h1>
      <p className="mt-3 flex items-start gap-2 rounded-sm border border-clay/30 bg-clay-soft px-4 py-3 text-sm leading-6">
        <Info className="mt-0.5 size-4 shrink-0 text-clay" />
        هذا طلب تجريبي: لن يُرسل إلى أي جهة ولن يُطلب منك أي دفع. البيانات تبقى في متصفحك فقط، ويمكنك استخدام بيانات وهمية.
      </p>

      <form onSubmit={submit} noValidate className="mt-8 grid gap-10 lg:grid-cols-[1fr_400px]">
        <div className="space-y-8">
          <section aria-labelledby="ship-h">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 id="ship-h" className="text-lg font-semibold">معلومات التوصيل</h2>
              <button type="button" className="min-h-10 text-sm underline underline-offset-4" onClick={() => { setC(SAMPLE); setErrors({}); }}>املأ ببيانات تجريبية</button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label htmlFor="co-name" className="mb-2">الاسم الكامل</Label><Input className="h-11 bg-card" autoComplete="name" {...field("name")} />{err("name")}</div>
              <div><Label htmlFor="co-phone" className="mb-2">رقم الهاتف</Label><Input className="h-11 bg-card text-start" dir="ltr" inputMode="tel" autoComplete="tel" placeholder="07XX XXX XXXX" {...field("phone")} />{err("phone")}</div>
              <div>
                <Label htmlFor="co-governorate" className="mb-2">المحافظة</Label>
                <Select dir="rtl" value={c.governorate} onValueChange={v => { setC({ ...c, governorate: v }); setErrors({ ...errors, governorate: undefined }); }}>
                  <SelectTrigger id="co-governorate" className="h-11 w-full bg-card" aria-invalid={!!errors.governorate || undefined}><SelectValue placeholder="اختر المحافظة" /></SelectTrigger>
                  <SelectContent>{GOVERNORATES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                </Select>
                {err("governorate")}
              </div>
              <div><Label htmlFor="co-area" className="mb-2">المنطقة</Label><Input className="h-11 bg-card" {...field("area")} />{err("area")}</div>
              <div className="sm:col-span-2"><Label htmlFor="co-address" className="mb-2">العنوان وأقرب نقطة دالة</Label><Input className="h-11 bg-card" autoComplete="street-address" {...field("address")} />{err("address")}</div>
              <div className="sm:col-span-2"><Label htmlFor="co-notes" className="mb-2">ملاحظات (اختياري)</Label><Textarea className="bg-card" rows={3} {...field("notes")} /></div>
            </div>
          </section>
          <section aria-labelledby="pay-h">
            <h2 id="pay-h" className="mb-4 text-lg font-semibold">طريقة الدفع</h2>
            <label className="flex items-center gap-3 rounded-sm border-2 border-foreground bg-card px-4 py-4">
              <input type="radio" name="pay" checked readOnly className="size-4 accent-[var(--foreground)]" />
              <span className="flex-1"><span className="block font-medium">الدفع عند الاستلام</span><span className="text-sm text-muted-foreground">نقدًا للمندوب عند وصول الطلب (توضيحي)</span></span>
            </label>
            <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="size-4" />لا يطلب هذا المتجر التجريبي أي بيانات بطاقة دفع.</p>
          </section>
        </div>

        <aside className="self-start rounded-sm border bg-card p-6 lg:sticky lg:top-28" aria-labelledby="sum-h">
          <h2 id="sum-h" className="font-display text-2xl">ملخص الطلب</h2>
          <ul className="mt-4 divide-y">
            {t.lines.map(l => (
              <li key={`${l.slug}-${l.size}`} className="flex items-center gap-3 py-3">
                <div className="relative aspect-[4/5] w-14 shrink-0 overflow-hidden rounded-sm bg-muted">
                  <Picture image={l.product!.image} sizes="56px" alt="" />
                  <span className="absolute -end-1 -top-1 grid size-5 place-items-center rounded-full bg-foreground text-[11px] text-background num">{l.qty}</span>
                </div>
                <div className="min-w-0 flex-1 text-sm"><p className="truncate font-medium">{l.product!.name}</p>{l.size !== "مقاس واحد" && <p className="text-xs text-muted-foreground">المقاس: {l.size}</p>}</div>
                <p className="text-sm num">{iqd(l.product!.price * l.qty)}</p>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex gap-2">
            <Input aria-label="رمز الخصم" placeholder="رمز الخصم" value={code} onChange={e => setCode(e.target.value)} className="h-11 bg-background text-start uppercase" dir="ltr" />
            <Button type="button" variant="outline" className="h-11" onClick={applyCode}>تطبيق</Button>
          </div>
          {codeMsg && <p className={`mt-2 text-sm ${applied ? "text-emerald-800" : "text-destructive"}`} role="status">{codeMsg}</p>}
          <p className="mt-2 text-xs text-muted-foreground">جرّب الرمز <span className="num font-medium">NASAQ10</span></p>
          <dl className="mt-5 space-y-2 border-t pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">المجموع الفرعي</dt><dd className="num">{iqd(t.subtotal)}</dd></div>
            {t.discount > 0 && <div className="flex justify-between text-clay"><dt>الخصم ({t.coupon!.code})</dt><dd className="num">-{iqd(t.discount)}</dd></div>}
            <div className="flex justify-between"><dt className="text-muted-foreground">التوصيل</dt><dd className="num">{!c.governorate ? <span className="text-muted-foreground">اختر المحافظة</span> : t.shipping === 0 ? "مجاني" : iqd(t.shipping)}</dd></div>
            <div className="flex justify-between border-t pt-3 text-base font-semibold"><dt>الإجمالي</dt><dd className="num" data-testid="grand-total">{iqd(t.total)}</dd></div>
          </dl>
          {formError && <p className="mt-4 rounded-sm bg-red-50 px-3 py-2 text-sm text-destructive" role="alert">{formError}</p>}
          <Button type="submit" className="mt-5 h-12 w-full text-[15px]" disabled={busy}>{busy ? "جارٍ تسجيل الطلب التجريبي…" : "تأكيد الطلب التجريبي"}</Button>
        </aside>
      </form>
    </div>
  );
}

export function OrderDone() {
  const { id } = useParams();
  const order = useStore(s => s.orders.find(o => o.id === id));
  if (!order) {
    return <Empty icon={<Info className="size-7" />} title="الطلب غير موجود" text="ربما أُعيد ضبط البيانات التجريبية."><Link to="/shop" className="inline-flex h-11 items-center rounded-sm bg-foreground px-6 text-background">العودة إلى المتجر</Link></Empty>;
  }
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 md:py-16">
      <div className="text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-50 text-emerald-700"><CheckCircle2 className="size-8" /></span>
        <p className="mt-6 inline-block rounded-full bg-clay-soft px-3 py-1 text-xs font-medium text-clay">طلب تجريبي — لم يُرسل إلى أي جهة</p>
        <h1 className="mt-4 font-display text-4xl md:text-5xl">شكرًا لك، تم تسجيل طلبك</h1>
        <p className="mt-3 text-muted-foreground">رقم الطلب <span className="num font-semibold text-foreground">{order.id}</span> · {dateTime(order.createdAt)}</p>
      </div>
      <div className="mt-10 rounded-sm border bg-card p-6">
        <ul className="divide-y">
          {order.lines.map(l => (
            <li key={`${l.slug}-${l.size}`} className="flex items-center gap-3 py-3 text-sm">
              <div className="aspect-[4/5] w-12 shrink-0 overflow-hidden rounded-sm bg-muted"><Picture image={l.image} sizes="48px" alt="" /></div>
              <p className="flex-1">{l.name}{l.size !== "مقاس واحد" && <span className="text-muted-foreground"> · {l.size}</span>} <span className="text-muted-foreground num">× {l.qty}</span></p>
              <p className="num">{iqd(l.price * l.qty)}</p>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-2 border-t pt-4 text-sm">
          {order.discount > 0 && <div className="flex justify-between text-clay"><dt>الخصم</dt><dd className="num">-{iqd(order.discount)}</dd></div>}
          <div className="flex justify-between"><dt className="text-muted-foreground">التوصيل</dt><dd className="num">{order.shipping ? iqd(order.shipping) : "مجاني"}</dd></div>
          <div className="flex justify-between text-base font-semibold"><dt>الإجمالي عند الاستلام</dt><dd className="num">{iqd(order.total)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted-foreground">الحالة</dt><dd><span className={`rounded-full px-2.5 py-1 text-xs ${STATUS[order.status].tone}`}>{STATUS[order.status].label}</span></dd></div>
        </dl>
      </div>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link to={`/admin/orders/${order.id}`} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-sm bg-foreground text-background hover:bg-ink-2"><LayoutDashboard className="size-4" />شاهد الطلب في لوحة الإدارة</Link>
        <Link to="/shop" className="flex h-12 flex-1 items-center justify-center rounded-sm border border-foreground/30 hover:border-foreground">متابعة التسوّق</Link>
      </div>
    </div>
  );
}
