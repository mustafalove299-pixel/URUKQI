// Sample orders with fictional customers, dated relative to the moment the demo is (re)set.
import type { Order, OrderStatus } from "@/store/store";
import { SEED_PRODUCTS } from "./catalog";

const HOUR = 3600000;
type Row = [id: number, hoursAgo: number, status: OrderStatus, name: string, gov: string, area: string, items: [string, string, number][], coupon?: string];

const ROWS: Row[] = [
  [1049, 2, "new", "زبونة تجريبية — سارة", "بغداد", "المنصور", [["w-knit-set", "M", 1], ["a-gold-pendant", "مقاس واحد", 1]]],
  [1048, 5, "new", "زبون تجريبي — علي", "البصرة", "العشار", [["m-camel-coat", "L", 1]]],
  [1047, 20, "processing", "زبونة تجريبية — نور", "أربيل", "عنكاوا", [["b-black-tote", "مقاس واحد", 1], ["l-ceramic-candle", "مقاس واحد", 2]], "NASAQ10"],
  [1046, 30, "processing", "زبون تجريبي — حسين", "بغداد", "الكرادة", [["s-monk-strap", "42", 1], ["a-leather-belt", "100", 1]]],
  [1045, 52, "shipped", "زبونة تجريبية — مريم", "النجف", "حي الأمير", [["w-embroidered-abaya", "54", 1]]],
  [1044, 75, "shipped", "زبون تجريبي — أحمد", "بغداد", "زيونة", [["m-essential-tee", "M", 2], ["m-washed-shirt", "L", 1]]],
  [1043, 100, "delivered", "زبونة تجريبية — زينب", "كربلاء", "حي الحسين", [["s-block-heels", "38", 1], ["b-croc-mini", "مقاس واحد", 1]]],
  [1042, 126, "delivered", "زبون تجريبي — مصطفى", "بابل", "الحلة", [["a-minimal-watch", "مقاس واحد", 1]], "NASAQ10"],
  [1041, 150, "cancelled", "زبونة تجريبية — رقية", "ديالى", "بعقوبة", [["l-eau-de-parfum", "50 مل", 1]]]
];

export function seedOrders(now: number): Order[] {
  return ROWS.map(([id, hoursAgo, status, name, governorate, area, items, coupon]) => {
    const lines = items.map(([slug, size, qty]) => {
      const p = SEED_PRODUCTS.find(x => x.slug === slug)!;
      return { slug, name: p.name, size, qty, price: p.price, image: p.image };
    });
    const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
    const discount = coupon ? Math.round(subtotal * 0.1 / 250) * 250 : 0;
    const shipping = subtotal - discount >= 150000 ? 0 : governorate === "بغداد" ? 5000 : 8000;
    return {
      id: `NSQ-${id}`, createdAt: now - hoursAgo * HOUR, status, coupon,
      customer: { name, phone: "0770 000 0000", governorate, area, address: "عنوان تجريبي", notes: "" },
      lines, subtotal, discount, shipping, total: subtotal - discount + shipping
    };
  });
}
