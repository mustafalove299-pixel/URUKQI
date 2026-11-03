import { Link } from "react-router";
import { Compass } from "lucide-react";
import credits from "@/data/credits.json";
import { Empty } from "@/components/store-ui";

export function Credits() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
      <h1 className="font-display text-4xl md:text-5xl">مصادر الصور</h1>
      <p className="mt-4 leading-8 text-muted-foreground">جميع صور المنتجات والحملات في هذا المتجر التجريبي من موقع Unsplash، ومستخدمة وفق <a className="inline-block py-1 underline underline-offset-4" href="https://unsplash.com/license" target="_blank" rel="noopener">رخصة Unsplash</a>. أسماء المنتجات وعلامة «نَسَق» خيالية، ولا تمثل الصور منتجات حقيقية معروضة للبيع.</p>
      <ul className="mt-8 divide-y border-y text-sm">
        {credits.map(c => (
          <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
            <span>{c.use}</span>
            <a href={`https://unsplash.com/photos/${c.id}`} target="_blank" rel="noopener" className="inline-block py-2 text-muted-foreground underline-offset-4 hover:underline" dir="ltr">Photo by {c.by}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function NotFound() {
  return (
    <Empty icon={<Compass className="size-7" />} title="الصفحة غير موجودة" text="ربما تغيّر الرابط. يمكنك العودة إلى المتجر.">
      <Link to="/" className="inline-flex h-11 items-center rounded-sm bg-foreground px-6 text-background">الرئيسية</Link>
      <Link to="/shop" className="inline-flex h-11 items-center rounded-sm border border-foreground/30 px-6">كل المنتجات</Link>
    </Empty>
  );
}
