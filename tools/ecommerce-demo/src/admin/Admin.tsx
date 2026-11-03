// Demo merchant dashboard. It edits this browser's local copy of the store only; it is not a secure backend.
import { useMemo, useState } from "react";
import { Link, NavLink, Outlet, useNavigate, useParams, useSearchParams } from "react-router";
import { ArrowRight, BadgePercent, Boxes, LayoutDashboard, Plus, RotateCcw, ShoppingCart, Store, Trash2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { CATEGORIES, COLORS, type CategoryId, type ColorId, type Product } from "@/data/catalog";
import { dateOnly, dateTime, discountPct, gallery, iqd, IMAGE_KEYS, pct, totalStock } from "@/lib/format";
import { reconcileCart, STATUS, useStore, type OrderStatus } from "@/store/store";
import { Picture } from "@/components/store-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const NAV = [
  { to: "/admin", end: true, label: "نظرة عامة", icon: LayoutDashboard },
  { to: "/admin/orders", label: "الطلبات", icon: ShoppingCart },
  { to: "/admin/products", label: "المنتجات والمخزون", icon: Boxes },
  { to: "/admin/discounts", label: "الخصومات", icon: BadgePercent }
];

const Badge = ({ status }: { status: OrderStatus }) => <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STATUS[status].tone}`}>{STATUS[status].label}</span>;
const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => <div className={`rounded-lg border border-stone-200 bg-white ${className}`}>{children}</div>;
const num = (s: string) => Number(s.replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 1632)).replace(/[^\d]/g, ""));

export function AdminLayout() {
  const reset = useStore(s => s.resetDemo);
  const [confirm, setConfirm] = useState(false);
  const navigate = useNavigate();
  return (
    <div className="min-h-svh bg-stone-100 text-stone-900">
      <div className="bg-[#07152a] px-4 py-2 text-[13px] text-[#e9edf4] md:px-6">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-2">
          <p><span className="me-2 rounded-sm bg-[#d9a95e] px-1.5 py-0.5 text-[11px] font-semibold text-[#1b1305]">لوحة تجريبية</span>التعديلات محفوظة في متصفحك فقط، وهذه ليست لوحة إدارة آمنة للإنتاج.</p>
          <a href="../../" className="inline-flex min-h-8 items-center gap-1 hover:underline"><ArrowRight className="size-3.5" />العودة إلى URUKQI</a>
        </div>
      </div>
      <div className="mx-auto grid max-w-[1440px] md:grid-cols-[230px_1fr]">
        <aside className="min-w-0 border-b border-stone-200 bg-white md:min-h-[calc(100svh-36px)] md:border-b-0 md:border-e">
          <div className="flex items-center justify-between px-5 py-4 md:block">
            <div><p className="font-display text-2xl leading-none">نَسَق</p><p className="mt-1 text-xs text-stone-500">إدارة المتجر</p></div>
            <Link to="/" className="inline-flex h-10 items-center gap-1.5 text-sm text-stone-600 hover:text-stone-900 md:hidden"><Store className="size-4" />المتجر</Link>
          </div>
          <nav className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:px-3" aria-label="أقسام لوحة الإدارة">
            {NAV.map(n => (
              <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `flex h-11 shrink-0 items-center gap-2.5 rounded-md px-3 text-sm ${isActive ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-100"}`}>
                <n.icon className="size-4" />{n.label}
              </NavLink>
            ))}
          </nav>
          <div className="hidden space-y-1 border-t border-stone-200 p-3 md:block">
            <Link to="/" className="flex h-11 items-center gap-2.5 rounded-md px-3 text-sm text-stone-600 hover:bg-stone-100"><Store className="size-4" />عرض المتجر</Link>
            <button type="button" onClick={() => setConfirm(true)} className="flex h-11 w-full items-center gap-2.5 rounded-md px-3 text-sm text-stone-600 hover:bg-stone-100"><RotateCcw className="size-4" />إعادة ضبط البيانات التجريبية</button>
          </div>
        </aside>
        <main id="main" className="min-w-0 p-4 md:p-8">
          <Outlet />
          <button type="button" onClick={() => setConfirm(true)} className="mt-10 flex h-11 w-full items-center justify-center gap-2 rounded-md border border-stone-300 bg-white text-sm md:hidden"><RotateCcw className="size-4" />إعادة ضبط البيانات التجريبية</button>
        </main>
      </div>
      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent className="bg-white">
          <DialogHeader><DialogTitle>إعادة ضبط البيانات التجريبية؟</DialogTitle><DialogDescription>ستعود المنتجات والأسعار والمخزون والخصومات والطلبات إلى حالتها الأصلية، وتُفرغ السلة والمفضلة.</DialogDescription></DialogHeader>
          <DialogFooter className="gap-2 sm:justify-start">
            <Button className="h-11" onClick={() => { reset(); setConfirm(false); toast.success("أُعيد ضبط البيانات التجريبية"); navigate("/admin"); }}>إعادة الضبط</Button>
            <Button variant="outline" className="h-11" onClick={() => setConfirm(false)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const Title = ({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) => (
  <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-semibold">{children}</h1>{action}</div>
);

export function Overview() {
  const orders = useStore(s => s.orders);
  const products = useStore(s => s.products);
  const live = orders.filter(o => o.status !== "cancelled");
  const revenue = live.reduce((s, o) => s + o.total, 0);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (6 - i));
    const end = d.getTime() + 86400000;
    return { label: d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit" }), value: live.filter(o => o.createdAt >= d.getTime() && o.createdAt < end).reduce((s, o) => s + o.total, 0) };
  });
  const peak = Math.max(...days.map(d => d.value), 1);
  const top = Object.values(live.flatMap(o => o.lines).reduce<Record<string, { name: string; qty: number; total: number }>>((m, l) => {
    m[l.slug] = m[l.slug] ?? { name: l.name, qty: 0, total: 0 }; m[l.slug].qty += l.qty; m[l.slug].total += l.qty * l.price; return m;
  }, {})).sort((a, b) => b.qty - a.qty).slice(0, 5);
  const low = products.filter(p => p.enabled && totalStock(p.stock) <= 3).slice(0, 6);
  const stats = [
    { label: "المبيعات (7 أيام)", value: iqd(revenue) },
    { label: "الطلبات", value: String(live.length) },
    { label: "متوسط الطلب", value: iqd(live.length ? revenue / live.length : 0) },
    { label: "بانتظار التجهيز", value: String(orders.filter(o => o.status === "new").length) }
  ];
  return (
    <>
      <Title>نظرة عامة</Title>
      <p className="-mt-4 mb-6 text-sm text-stone-500">أرقام محسوبة من الطلبات التجريبية في هذا المتصفح.</p>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(s => <Card key={s.label} className="p-4"><p className="text-xs text-stone-500">{s.label}</p><p className="mt-2 text-xl font-semibold num md:text-2xl">{s.value}</p></Card>)}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card className="p-5">
          <h2 className="font-semibold">المبيعات اليومية</h2>
          <div className="mt-6 flex items-end gap-2" role="img" aria-label={`مبيعات آخر 7 أيام: ${days.map(d => `${d.label} ${iqd(d.value)}`).join("، ")}`}>
            {days.map(d => (
              <div key={d.label} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex h-40 w-full items-end"><div className="w-full rounded-t-sm bg-stone-900" style={{ height: `${Math.max(2, (d.value / peak) * 100)}%` }} title={iqd(d.value)} /></div>
                <span className="text-[11px] text-stone-500 num">{d.label}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="font-semibold">الأكثر مبيعًا</h2>
          <ol className="mt-4 space-y-3 text-sm">
            {top.map((t, i) => <li key={t.name} className="flex items-center gap-3"><span className="grid size-6 place-items-center rounded-full bg-stone-100 text-xs num">{i + 1}</span><span className="flex-1 truncate">{t.name}</span><span className="text-stone-500 num">{t.qty} قطعة</span></li>)}
          </ol>
        </Card>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center justify-between"><h2 className="font-semibold">أحدث الطلبات</h2><Link to="/admin/orders" className="inline-flex min-h-10 items-center text-sm text-stone-600 underline-offset-4 hover:underline">كل الطلبات</Link></div>
          <ul className="mt-3 divide-y divide-stone-100">
            {orders.slice(0, 5).map(o => (
              <li key={o.id}><Link to={`/admin/orders/${o.id}`} className="flex items-center justify-between gap-3 py-3 text-sm hover:bg-stone-50">
                <span><span className="font-medium num">{o.id}</span><span className="block text-xs text-stone-500">{o.customer.name}</span></span>
                <span className="flex items-center gap-3"><span className="num">{iqd(o.total)}</span><Badge status={o.status} /></span>
              </Link></li>
            ))}
          </ul>
        </Card>
        <Card className="p-5">
          <h2 className="flex items-center gap-2 font-semibold"><TriangleAlert className="size-4 text-amber-600" />مخزون منخفض</h2>
          {low.length ? (
            <ul className="mt-3 divide-y divide-stone-100">
              {low.map(p => <li key={p.slug}><Link to={`/admin/products/${p.slug}`} className="flex items-center justify-between py-3 text-sm hover:bg-stone-50"><span>{p.name}</span><span className={`num ${totalStock(p.stock) === 0 ? "text-red-700" : "text-amber-700"}`}>{totalStock(p.stock)} قطعة</span></Link></li>)}
            </ul>
          ) : <p className="mt-3 text-sm text-stone-500">لا توجد منتجات بمخزون منخفض.</p>}
        </Card>
      </div>
    </>
  );
}

export function Orders() {
  const orders = useStore(s => s.orders);
  const [params, setParams] = useSearchParams();
  const filter = (params.get("status") as OrderStatus | null) ?? "all";
  const list = filter === "all" ? orders : orders.filter(o => o.status === filter);
  return (
    <>
      <Title>الطلبات</Title>
      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0" role="tablist" aria-label="تصفية حسب الحالة">
        {(["all", ...Object.keys(STATUS)] as (OrderStatus | "all")[]).map(s => (
          <button key={s} type="button" role="tab" aria-selected={filter === s} onClick={() => setParams(s === "all" ? {} : { status: s }, { replace: true })}
            className={`h-10 shrink-0 rounded-full border px-4 text-sm ${filter === s ? "border-stone-900 bg-stone-900 text-white" : "border-stone-300 bg-white"}`}>
            {s === "all" ? "الكل" : STATUS[s].label} <span className="num opacity-70">{s === "all" ? orders.length : orders.filter(o => o.status === s).length}</span>
          </button>
        ))}
      </div>
      <Card className="overflow-hidden">
        {list.length === 0 ? <p className="p-8 text-center text-sm text-stone-500">لا توجد طلبات بهذه الحالة.</p> : (
          <>
            <table className="hidden w-full text-sm md:table">
              <thead className="bg-stone-50 text-xs text-stone-500"><tr>{["الطلب", "التاريخ", "الزبون", "المحافظة", "القطع", "الإجمالي", "الحالة"].map(h => <th key={h} className="px-4 py-3 text-start font-medium">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-stone-100">
                {list.map(o => (
                  <tr key={o.id} className="hover:bg-stone-50">
                    <td className="px-4 py-3"><Link to={`/admin/orders/${o.id}`} className="font-medium underline-offset-4 hover:underline num">{o.id}</Link>{o.placedInDemo && <span className="ms-2 rounded bg-clay-soft px-1.5 py-0.5 text-[10px] text-clay">من المتجر</span>}</td>
                    <td className="px-4 py-3 text-stone-500 num">{dateOnly(o.createdAt)}</td>
                    <td className="px-4 py-3">{o.customer.name}</td>
                    <td className="px-4 py-3 text-stone-500">{o.customer.governorate}</td>
                    <td className="px-4 py-3 num">{o.lines.reduce((a, l) => a + l.qty, 0)}</td>
                    <td className="px-4 py-3 num">{iqd(o.total)}</td>
                    <td className="px-4 py-3"><Badge status={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <ul className="divide-y divide-stone-100 md:hidden">
              {list.map(o => (
                <li key={o.id}><Link to={`/admin/orders/${o.id}`} className="flex items-center justify-between gap-3 p-4 text-sm">
                  <span><span className="font-medium num">{o.id}</span><span className="block text-xs text-stone-500">{o.customer.name} · <span className="num">{dateOnly(o.createdAt)}</span></span></span>
                  <span className="flex flex-col items-end gap-1"><span className="num">{iqd(o.total)}</span><Badge status={o.status} /></span>
                </Link></li>
              ))}
            </ul>
          </>
        )}
      </Card>
    </>
  );
}

export function OrderDetail() {
  const { id } = useParams();
  const order = useStore(s => s.orders.find(o => o.id === id));
  const setStatus = useStore(s => s.setStatus);
  const [cancelAsk, setCancelAsk] = useState(false);
  if (!order) return <><Title>الطلب غير موجود</Title><Link to="/admin/orders" className="underline">العودة إلى الطلبات</Link></>;
  const change = (s: OrderStatus) => {
    if (s === "cancelled") { setCancelAsk(true); return; }
    const err = setStatus(order.id, s);
    if (err) toast.error(err); else toast.success(`أصبحت حالة الطلب: ${STATUS[s].label}`);
  };
  return (
    <>
      <Link to="/admin/orders" className="mb-3 inline-flex h-9 items-center gap-1 text-sm text-stone-600 hover:text-stone-900"><ArrowRight className="size-4" />الطلبات</Link>
      <Title action={<Badge status={order.status} />}><span className="num">{order.id}</span></Title>
      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card className="p-5">
          <h2 className="font-semibold">المنتجات</h2>
          <ul className="mt-3 divide-y divide-stone-100">
            {order.lines.map(l => (
              <li key={`${l.slug}-${l.size}`} className="flex items-center gap-3 py-3 text-sm">
                <div className="aspect-[4/5] w-12 shrink-0 overflow-hidden rounded bg-stone-100"><Picture image={l.image} sizes="48px" alt="" /></div>
                <div className="flex-1"><p className="font-medium">{l.name}</p><p className="text-xs text-stone-500">{l.size} · <span className="num">{iqd(l.price)} × {l.qty}</span></p></div>
                <p className="num">{iqd(l.price * l.qty)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-3 space-y-2 border-t border-stone-100 pt-3 text-sm">
            <div className="flex justify-between"><dt className="text-stone-500">المجموع الفرعي</dt><dd className="num">{iqd(order.subtotal)}</dd></div>
            {order.discount > 0 && <div className="flex justify-between"><dt className="text-stone-500">الخصم ({order.coupon})</dt><dd className="num">-{iqd(order.discount)}</dd></div>}
            <div className="flex justify-between"><dt className="text-stone-500">التوصيل</dt><dd className="num">{order.shipping ? iqd(order.shipping) : "مجاني"}</dd></div>
            <div className="flex justify-between font-semibold"><dt>الإجمالي (عند الاستلام)</dt><dd className="num">{iqd(order.total)}</dd></div>
          </dl>
        </Card>
        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="font-semibold">حالة الطلب</h2>
            <Label htmlFor="order-status" className="mt-3 mb-2 text-stone-500">تغيير الحالة</Label>
            <Select dir="rtl" value={order.status} onValueChange={v => change(v as OrderStatus)} disabled={order.status === "cancelled"}>
              <SelectTrigger id="order-status" className="h-11 w-full bg-white"><SelectValue /></SelectTrigger>
              <SelectContent>{(Object.keys(STATUS) as OrderStatus[]).map(s => <SelectItem key={s} value={s}>{STATUS[s].label}</SelectItem>)}</SelectContent>
            </Select>
            <p className="mt-2 text-xs text-stone-500">{order.status === "cancelled" ? "الطلب ملغي ولا يمكن تغيير حالته." : "إلغاء الطلب يعيد قطعه إلى المخزون."}</p>
          </Card>
          <Card className="p-5 text-sm">
            <h2 className="font-semibold">الزبون (بيانات تجريبية)</h2>
            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
              <dt className="text-stone-500">الاسم</dt><dd>{order.customer.name}</dd>
              <dt className="text-stone-500">الهاتف</dt><dd className="num text-start">{order.customer.phone}</dd>
              <dt className="text-stone-500">العنوان</dt><dd>{order.customer.governorate} — {order.customer.area}، {order.customer.address}</dd>
              {order.customer.notes && <><dt className="text-stone-500">ملاحظات</dt><dd>{order.customer.notes}</dd></>}
              <dt className="text-stone-500">التاريخ</dt><dd className="num">{dateTime(order.createdAt)}</dd>
              <dt className="text-stone-500">الدفع</dt><dd>عند الاستلام</dd>
            </dl>
          </Card>
        </div>
      </div>
      <Dialog open={cancelAsk} onOpenChange={setCancelAsk}>
        <DialogContent className="bg-white">
          <DialogHeader><DialogTitle>إلغاء الطلب <span className="num">{order.id}</span>؟</DialogTitle><DialogDescription>ستعود قطع الطلب إلى المخزون، ولا يمكن التراجع عن الإلغاء.</DialogDescription></DialogHeader>
          <DialogFooter className="gap-2 sm:justify-start">
            <Button variant="destructive" className="h-11" onClick={() => { setStatus(order.id, "cancelled"); setCancelAsk(false); toast.success("أُلغي الطلب وأُعيدت القطع إلى المخزون"); }}>إلغاء الطلب</Button>
            <Button variant="outline" className="h-11" onClick={() => setCancelAsk(false)}>رجوع</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function Products() {
  const products = useStore(s => s.products);
  const setEnabled = useStore(s => s.setEnabled);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<CategoryId | "all">("all");
  const list = products.filter(p => (cat === "all" || p.category === cat) && (!q || p.name.includes(q) || p.sku.toLowerCase().includes(q.toLowerCase())));
  const toggle = (p: Product, v: boolean) => { setEnabled(p.slug, v); reconcileCart(); toast.success(v ? `${p.name} ظاهر في المتجر` : `${p.name} مخفي من المتجر`); };
  return (
    <>
      <Title action={<Link to="/admin/products/new" className="inline-flex h-11 items-center gap-2 rounded-md bg-stone-900 px-4 text-sm text-white"><Plus className="size-4" />إضافة منتج</Link>}>المنتجات والمخزون</Title>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <Input value={q} onChange={e => setQ(e.target.value)} placeholder="ابحث بالاسم أو الرمز" aria-label="بحث في المنتجات" className="h-11 bg-white sm:max-w-xs" />
        <Select dir="rtl" value={cat} onValueChange={v => setCat(v as CategoryId | "all")}>
          <SelectTrigger className="h-11 bg-white sm:w-52" aria-label="القسم"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">كل الأقسام</SelectItem>{CATEGORIES.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <Card className="overflow-hidden">
        <ul className="divide-y divide-stone-100">
          {list.map(p => {
            const stock = totalStock(p.stock);
            return (
              <li key={p.slug} className="flex items-center gap-3 p-3 md:gap-4 md:px-4" data-testid="admin-product">
                <div className={`aspect-[4/5] w-12 shrink-0 overflow-hidden rounded bg-stone-100 ${p.enabled ? "" : "opacity-40"}`}><Picture image={p.image} sizes="48px" alt="" /></div>
                <div className="min-w-0 flex-1">
                  <Link to={`/admin/products/${p.slug}`} className="block truncate py-1.5 font-medium hover:underline">{p.name}</Link>
                  <p className="text-xs text-stone-500"><span className="num">{p.sku}</span> · {CATEGORIES.find(c => c.id === p.category)!.short}</p>
                </div>
                <div className="hidden w-32 text-sm sm:block"><p className="num">{iqd(p.price)}</p>{discountPct(p.price, p.oldPrice) > 0 && <p className="text-xs text-clay num">خصم {pct(discountPct(p.price, p.oldPrice))}</p>}</div>
                <p className={`w-16 text-sm num ${stock === 0 ? "text-red-700" : stock <= 3 ? "text-amber-700" : ""}`}>{stock} قطعة</p>
                <label className="flex items-center gap-2 text-xs text-stone-500">
                  <Switch checked={p.enabled} onCheckedChange={v => toggle(p, v)} aria-label={`إظهار ${p.name} في المتجر`} />
                  <span className="hidden lg:inline">{p.enabled ? "ظاهر" : "مخفي"}</span>
                </label>
              </li>
            );
          })}
          {list.length === 0 && <li className="p-8 text-center text-sm text-stone-500">لا توجد منتجات مطابقة.</li>}
        </ul>
      </Card>
    </>
  );
}

export function ProductForm() {
  const { slug } = useParams();
  const isNew = slug === undefined;
  const products = useStore(s => s.products);
  const save = useStore(s => s.saveProduct);
  const navigate = useNavigate();
  const existing = products.find(p => p.slug === slug);
  const initial = useMemo<Product>(() => existing ?? {
    slug: `new-${Date.now().toString(36)}`, sku: "", name: "", category: "women", description: "", details: [], price: 0, color: "black",
    sizes: ["S", "M", "L", "XL"], stock: { S: 0, M: 0, L: 0, XL: 0 }, tags: ["new"], rank: Math.max(...products.map(p => p.rank)) + 1, sold: 0, enabled: true, image: IMAGE_KEYS[0]
  }, [existing?.slug]);
  const [p, setP] = useState<Product>(initial);
  const [sizesText, setSizesText] = useState(initial.sizes.join("، "));
  const [errors, setErrors] = useState<Record<string, string>>({});
  if (!isNew && !existing) return <><Title>المنتج غير موجود</Title><Link to="/admin/products" className="underline">العودة إلى المنتجات</Link></>;

  const applySizes = (text: string) => {
    setSizesText(text);
    const sizes = [...new Set(text.split(/[،,]/).map(s => s.trim()).filter(Boolean))];
    setP(prev => ({ ...prev, sizes, stock: Object.fromEntries(sizes.map(s => [s, prev.stock[s] ?? 0])) }));
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (p.name.trim().length < 3) next.name = "اكتب اسم المنتج.";
    if (p.price < 1000) next.price = "السعر يجب ألا يقل عن 1,000 د.ع.";
    if (p.oldPrice !== undefined && p.oldPrice !== 0 && p.oldPrice <= p.price) next.oldPrice = "السعر قبل الخصم يجب أن يكون أعلى من السعر الحالي.";
    if (!p.sizes.length) next.sizes = "أضف مقاسًا واحدًا على الأقل، أو «مقاس واحد».";
    if (p.description.trim().length < 10) next.description = "اكتب وصفًا قصيرًا.";
    setErrors(next);
    if (Object.keys(next).length) { toast.error("راجع الحقول المشار إليها."); return; }
    const prefix = { men: "MN", women: "WM", shoes: "SH", bags: "BG", accessories: "AC", lifestyle: "LS" }[p.category];
    const sku = p.sku || `NSQ-${prefix}-${String(100 + products.length + 1)}`;
    save({ ...p, sku, name: p.name.trim(), oldPrice: p.oldPrice || undefined, details: p.details.length ? p.details : [p.description.trim()] }, isNew);
    reconcileCart();
    toast.success(isNew ? "أُضيف المنتج إلى المتجر" : "حُفظت التعديلات");
    navigate("/admin/products");
  };
  const err = (k: string) => errors[k] && <p className="mt-1.5 text-sm text-red-700">{errors[k]}</p>;

  return (
    <form onSubmit={submit} noValidate>
      <Link to="/admin/products" className="mb-3 inline-flex h-9 items-center gap-1 text-sm text-stone-600 hover:text-stone-900"><ArrowRight className="size-4" />المنتجات</Link>
      <Title action={!isNew && <Link to={`/product/${p.slug}`} className="inline-flex min-h-10 items-center text-sm underline underline-offset-4">عرضه في المتجر</Link>}>{isNew ? "إضافة منتج" : "تعديل المنتج"}</Title>
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <Card className="space-y-4 p-5">
            <div><Label htmlFor="pf-name" className="mb-2">اسم المنتج</Label><Input id="pf-name" className="h-11" value={p.name} onChange={e => setP({ ...p, name: e.target.value })} />{err("name")}</div>
            <div><Label htmlFor="pf-desc" className="mb-2">الوصف</Label><Textarea id="pf-desc" rows={3} value={p.description} onChange={e => setP({ ...p, description: e.target.value })} />{err("description")}</div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="pf-cat" className="mb-2">القسم</Label>
                <Select dir="rtl" value={p.category} onValueChange={v => setP({ ...p, category: v as CategoryId })}>
                  <SelectTrigger id="pf-cat" className="h-11 w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="pf-color" className="mb-2">اللون</Label>
                <Select dir="rtl" value={p.color} onValueChange={v => setP({ ...p, color: v as ColorId })}>
                  <SelectTrigger id="pf-color" className="h-11 w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>{(Object.keys(COLORS) as ColorId[]).map(c => <SelectItem key={c} value={c}>{COLORS[c].label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </Card>
          <Card className="space-y-4 p-5">
            <h2 className="font-semibold">السعر والخصم</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label htmlFor="pf-price" className="mb-2">السعر الحالي (د.ع)</Label><Input id="pf-price" className="h-11 text-start num" inputMode="numeric" value={p.price ? p.price.toLocaleString("en-US") : ""} onChange={e => setP({ ...p, price: num(e.target.value) })} />{err("price")}</div>
              <div><Label htmlFor="pf-old" className="mb-2">السعر قبل الخصم (اختياري)</Label><Input id="pf-old" className="h-11 text-start num" inputMode="numeric" value={p.oldPrice ? p.oldPrice.toLocaleString("en-US") : ""} onChange={e => setP({ ...p, oldPrice: num(e.target.value) || undefined })} />{err("oldPrice")}</div>
            </div>
            {discountPct(p.price, p.oldPrice) > 0 && <p className="text-sm text-clay">يظهر في المتجر بخصم {pct(discountPct(p.price, p.oldPrice))}.</p>}
          </Card>
          <Card className="space-y-4 p-5">
            <h2 className="font-semibold">المقاسات والمخزون</h2>
            <div><Label htmlFor="pf-sizes" className="mb-2">المقاسات (افصل بفاصلة)</Label><Input id="pf-sizes" className="h-11" value={sizesText} onChange={e => applySizes(e.target.value)} />{err("sizes")}</div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {p.sizes.map(s => (
                <div key={s}><Label htmlFor={`pf-stock-${s}`} className="mb-1.5 text-xs text-stone-500">{s}</Label>
                  <Input id={`pf-stock-${s}`} className="h-11 text-start num" inputMode="numeric" value={String(p.stock[s] ?? 0)} onChange={e => setP({ ...p, stock: { ...p.stock, [s]: Math.min(num(e.target.value), 999) } })} /></div>
              ))}
            </div>
            <p className="text-sm text-stone-500">الإجمالي: <span className="num">{totalStock(p.stock)}</span> قطعة</p>
          </Card>
        </div>
        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center justify-between"><Label htmlFor="pf-enabled">ظاهر في المتجر</Label><Switch id="pf-enabled" checked={p.enabled} onCheckedChange={v => setP({ ...p, enabled: v })} /></div>
            <div className="mt-4 flex items-center justify-between"><Label htmlFor="pf-new">علامة «جديد»</Label><Switch id="pf-new" checked={p.tags.includes("new")} onCheckedChange={v => setP({ ...p, tags: v ? [...p.tags.filter(t => t !== "new"), "new"] : p.tags.filter(t => t !== "new") })} /></div>
          </Card>
          <Card className="p-5">
            <h2 className="font-semibold">الصورة</h2>
            <p className="mt-1 text-xs text-stone-500">في هذا النموذج تختار من مكتبة صور المتجر. في متجرك الفعلي ترفع صورك.</p>
            <div className="mt-3 aspect-[4/5] w-40 overflow-hidden rounded bg-stone-100"><Picture image={p.image} sizes="160px" alt="" /></div>
            <div className="mt-3 grid max-h-64 grid-cols-5 gap-1.5 overflow-y-auto" role="radiogroup" aria-label="اختر صورة">
              {IMAGE_KEYS.map(k => (
                <button key={k} type="button" role="radio" aria-checked={p.image === k} aria-label={`صورة ${k}`} onClick={() => setP({ ...p, image: k })}
                  className={`aspect-[4/5] overflow-hidden rounded border-2 ${p.image === k ? "border-stone-900" : "border-transparent"}`}>
                  <img src={gallery(k)[0].src.replace("-960.", "-480.")} alt="" loading="lazy" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </Card>
          <Button type="submit" className="h-12 w-full">{isNew ? "إضافة المنتج" : "حفظ التعديلات"}</Button>
        </div>
      </div>
    </form>
  );
}

export function Discounts() {
  const coupons = useStore(s => s.coupons);
  const saveCoupon = useStore(s => s.saveCoupon);
  const del = useStore(s => s.deleteCoupon);
  const products = useStore(s => s.products);
  const save = useStore(s => s.saveProduct);
  const [code, setCode] = useState("");
  const [percentInput, setPercentInput] = useState("10");
  const [error, setError] = useState("");
  const onSale = products.filter(p => discountPct(p.price, p.oldPrice) > 0);
  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    const n = num(percentInput);
    if (!/^[A-Z0-9]{3,16}$/.test(c)) { setError("الرمز من 3 إلى 16 حرفًا إنكليزيًا أو رقمًا."); return; }
    if (n < 1 || n > 70) { setError("النسبة بين 1% و70%."); return; }
    if (coupons.some(x => x.code === c)) { setError("هذا الرمز موجود."); return; }
    saveCoupon({ code: c, percent: n, active: true });
    setCode(""); setError(""); toast.success(`أُضيف الرمز ${c} بخصم ${pct(n)}`);
  };
  return (
    <>
      <Title>الخصومات</Title>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-semibold">رموز الخصم</h2>
          <p className="mt-1 text-sm text-stone-500">يكتبها الزبون في صفحة إتمام الطلب.</p>
          <ul className="mt-4 divide-y divide-stone-100">
            {coupons.map(c => (
              <li key={c.code} className="flex items-center gap-3 py-3">
                <span className="flex-1"><span className="font-medium num">{c.code}</span><span className="ms-2 text-sm text-stone-500 num">{pct(c.percent)}</span></span>
                <Switch checked={c.active} onCheckedChange={v => { saveCoupon({ ...c, active: v }); toast.success(v ? "فُعّل الرمز" : "أُوقف الرمز"); }} aria-label={`تفعيل ${c.code}`} />
                <button type="button" onClick={() => { del(c.code); toast.success("حُذف الرمز"); }} className="grid size-10 place-items-center text-stone-500 hover:text-red-700" aria-label={`حذف ${c.code}`}><Trash2 className="size-4" /></button>
              </li>
            ))}
            {!coupons.length && <li className="py-6 text-center text-sm text-stone-500">لا توجد رموز.</li>}
          </ul>
          <form onSubmit={add} className="mt-4 flex flex-wrap items-end gap-2 border-t border-stone-100 pt-4" noValidate>
            <div className="flex-1"><Label htmlFor="cp-code" className="mb-1.5 text-xs text-stone-500">الرمز</Label><Input id="cp-code" dir="ltr" className="h-11 text-start uppercase" value={code} onChange={e => setCode(e.target.value)} placeholder="EID20" /></div>
            <div className="w-24"><Label htmlFor="cp-pct" className="mb-1.5 text-xs text-stone-500">النسبة %</Label><Input id="cp-pct" className="h-11 text-start num" inputMode="numeric" value={percentInput} onChange={e => setPercentInput(e.target.value)} /></div>
            <Button type="submit" className="h-11">إضافة</Button>
            {error && <p className="w-full text-sm text-red-700" role="alert">{error}</p>}
          </form>
        </Card>
        <Card className="p-5">
          <h2 className="font-semibold">منتجات عليها خصم</h2>
          <p className="mt-1 text-sm text-stone-500">لإضافة خصم على منتج، عدّل «السعر قبل الخصم» في صفحة المنتج.</p>
          <ul className="mt-4 divide-y divide-stone-100">
            {onSale.map(p => (
              <li key={p.slug} className="flex items-center gap-3 py-3 text-sm">
                <Link to={`/admin/products/${p.slug}`} className="flex-1 py-2.5 hover:underline">{p.name}</Link>
                <span className="text-clay num">خصم {pct(discountPct(p.price, p.oldPrice))}</span>
                <button type="button" className="h-10 px-2 text-stone-600 underline underline-offset-4" onClick={() => { save({ ...p, price: p.oldPrice!, oldPrice: undefined }, false); toast.success("أُلغي الخصم وعاد السعر الأصلي"); }}>إلغاء الخصم</button>
              </li>
            ))}
            {!onSale.length && <li className="py-6 text-center text-sm text-stone-500">لا توجد منتجات عليها خصم.</li>}
          </ul>
        </Card>
      </div>
    </>
  );
}
