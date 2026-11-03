// All demo state lives in this browser's localStorage. Nothing is sent to any server.
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { SEED_PRODUCTS, shippingFor, type Product } from "@/data/catalog";
import { seedOrders } from "@/data/orders";

export type OrderStatus = "new" | "processing" | "shipped" | "delivered" | "cancelled";
export const STATUS: Record<OrderStatus, { label: string; tone: string }> = {
  new: { label: "جديد", tone: "bg-clay-soft text-clay" },
  processing: { label: "قيد التجهيز", tone: "bg-amber-100 text-amber-900" },
  shipped: { label: "تم الشحن", tone: "bg-sky-100 text-sky-900" },
  delivered: { label: "تم التسليم", tone: "bg-emerald-100 text-emerald-900" },
  cancelled: { label: "ملغي", tone: "bg-stone-200 text-stone-700" }
};

export interface CartLine { slug: string; size: string; qty: number }
export interface Coupon { code: string; percent: number; active: boolean }
export interface Customer { name: string; phone: string; governorate: string; area: string; address: string; notes: string }
export interface OrderLine { slug: string; name: string; size: string; qty: number; price: number; image: string }
export interface Order {
  id: string; createdAt: number; customer: Customer; lines: OrderLine[];
  subtotal: number; discount: number; shipping: number; total: number; coupon?: string;
  status: OrderStatus; placedInDemo?: boolean;
}

const SEED_COUPONS: Coupon[] = [
  { code: "NASAQ10", percent: 10, active: true },
  { code: "WELCOME15", percent: 15, active: false }
];

interface State {
  products: Product[];
  orders: Order[];
  coupons: Coupon[];
  cart: CartLine[];
  wishlist: string[];
  nextOrder: number;
  addToCart: (slug: string, size: string, qty: number) => { added: number; capped: boolean };
  setQty: (slug: string, size: string, qty: number) => void;
  removeLine: (slug: string, size: string) => void;
  clearCart: () => void;
  toggleWish: (slug: string) => boolean;
  placeOrder: (customer: Customer, coupon?: string) => Order | { error: string };
  setStatus: (id: string, status: OrderStatus) => string | null;
  saveProduct: (p: Product, isNew: boolean) => void;
  setEnabled: (slug: string, enabled: boolean) => void;
  saveCoupon: (c: Coupon) => void;
  deleteCoupon: (code: string) => void;
  resetDemo: () => void;
}

const seedState = () => ({
  products: structuredClone(SEED_PRODUCTS),
  orders: seedOrders(Date.now()),
  coupons: structuredClone(SEED_COUPONS),
  cart: [] as CartLine[],
  wishlist: [] as string[],
  nextOrder: 1050
});

export const lineAvailable = (products: Product[], slug: string, size: string) => {
  const p = products.find(x => x.slug === slug);
  return p && p.enabled ? p.stock[size] ?? 0 : 0;
};

export const cartTotals = (products: Product[], cart: CartLine[], coupons: Coupon[], couponCode: string | undefined, governorate: string) => {
  const lines = cart.map(l => ({ ...l, product: products.find(p => p.slug === l.slug) })).filter(l => l.product && l.product.enabled);
  const subtotal = lines.reduce((s, l) => s + l.product!.price * l.qty, 0);
  const coupon = couponCode ? coupons.find(c => c.active && c.code === couponCode.trim().toUpperCase()) : undefined;
  const discount = coupon ? Math.round((subtotal * coupon.percent) / 100 / 250) * 250 : 0;
  const shipping = shippingFor(governorate, subtotal - discount);
  return { lines, subtotal, coupon, discount, shipping, total: subtotal - discount + shipping };
};

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      ...seedState(),

      addToCart: (slug, size, qty) => {
        const available = lineAvailable(get().products, slug, size);
        const line = get().cart.find(l => l.slug === slug && l.size === size);
        const current = line ? line.qty : 0;
        const next = Math.min(current + qty, available);
        if (next <= current) return { added: 0, capped: true };
        set(s => ({
          cart: line ? s.cart.map(l => (l === line ? { ...l, qty: next } : l)) : [...s.cart, { slug, size, qty: next }]
        }));
        return { added: next - current, capped: next < current + qty };
      },
      setQty: (slug, size, qty) => {
        const max = lineAvailable(get().products, slug, size);
        const q = Math.max(1, Math.min(Math.round(qty) || 1, max));
        set(s => ({ cart: s.cart.map(l => (l.slug === slug && l.size === size ? { ...l, qty: q } : l)) }));
      },
      removeLine: (slug, size) => set(s => ({ cart: s.cart.filter(l => !(l.slug === slug && l.size === size)) })),
      clearCart: () => set({ cart: [] }),
      toggleWish: slug => {
        const on = !get().wishlist.includes(slug);
        set(s => ({ wishlist: on ? [...s.wishlist, slug] : s.wishlist.filter(x => x !== slug) }));
        return on;
      },

      placeOrder: (customer, couponCode) => {
        const s = get();
        for (const l of s.cart) {
          if (l.qty > lineAvailable(s.products, l.slug, l.size)) return { error: "تغيّرت الكمية المتوفرة لأحد المنتجات. راجع السلة ثم حاول مجددًا." };
        }
        const t = cartTotals(s.products, s.cart, s.coupons, couponCode, customer.governorate);
        if (!t.lines.length) return { error: "السلة فارغة." };
        const order: Order = {
          id: `NSQ-${s.nextOrder}`,
          createdAt: Date.now(),
          customer,
          lines: t.lines.map(l => ({ slug: l.slug, name: l.product!.name, size: l.size, qty: l.qty, price: l.product!.price, image: l.product!.image })),
          subtotal: t.subtotal, discount: t.discount, shipping: t.shipping, total: t.total,
          coupon: t.coupon?.code, status: "new", placedInDemo: true
        };
        set(st => ({
          orders: [order, ...st.orders],
          nextOrder: st.nextOrder + 1,
          cart: [],
          products: st.products.map(p => {
            const sold = order.lines.filter(l => l.slug === p.slug);
            if (!sold.length) return p;
            const stock = { ...p.stock };
            sold.forEach(l => { stock[l.size] = Math.max(0, (stock[l.size] ?? 0) - l.qty); });
            return { ...p, stock, sold: p.sold + sold.reduce((a, l) => a + l.qty, 0) };
          })
        }));
        return order;
      },

      // Cancelling returns the items to stock; a cancelled order stays cancelled.
      setStatus: (id, status) => {
        const order = get().orders.find(o => o.id === id);
        if (!order) return "الطلب غير موجود.";
        if (order.status === "cancelled") return "لا يمكن تغيير حالة طلب ملغي.";
        set(s => ({
          orders: s.orders.map(o => (o.id === id ? { ...o, status } : o)),
          products: status !== "cancelled" ? s.products : s.products.map(p => {
            const back = order.lines.filter(l => l.slug === p.slug);
            if (!back.length) return p;
            const stock = { ...p.stock };
            back.forEach(l => { if (l.size in stock) stock[l.size] += l.qty; });
            return { ...p, stock };
          })
        }));
        return null;
      },

      saveProduct: (p, isNew) => set(s => ({ products: isNew ? [p, ...s.products] : s.products.map(x => (x.slug === p.slug ? p : x)) })),
      setEnabled: (slug, enabled) => set(s => ({ products: s.products.map(p => (p.slug === slug ? { ...p, enabled } : p)) })),
      saveCoupon: c => set(s => ({ coupons: s.coupons.some(x => x.code === c.code) ? s.coupons.map(x => (x.code === c.code ? c : x)) : [...s.coupons, c] })),
      deleteCoupon: code => set(s => ({ coupons: s.coupons.filter(c => c.code !== code) })),
      resetDemo: () => set(seedState())
    }),
    {
      name: "nasaq-demo-v1",
      version: 1,
      storage: createJSONStorage(() => {
        try { localStorage.setItem("nasaq-probe", "1"); localStorage.removeItem("nasaq-probe"); return localStorage; }
        catch { return sessionStorage; }
      })
    }
  )
);

// Cart lines whose product was disabled or ran out are dropped or capped when the store changes.
export function reconcileCart() {
  const { products, cart } = useStore.getState();
  const fixed = cart
    .map(l => ({ ...l, qty: Math.min(l.qty, lineAvailable(products, l.slug, l.size)) }))
    .filter(l => l.qty > 0);
  if (JSON.stringify(fixed) !== JSON.stringify(cart)) useStore.setState({ cart: fixed });
}
