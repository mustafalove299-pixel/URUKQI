import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router";
import { ArrowRight, Heart, LayoutDashboard, Menu, Search, ShoppingBag, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { CATEGORIES } from "@/data/catalog";
import { useStore } from "@/store/store";
import { CartPanel } from "@/pages/Cart";

export const URUKQI_HOME = "../../";

export function DemoBar() {
  return (
    <div className="bg-[#07152a] text-[13px] text-[#e9edf4]">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-x-4 gap-y-0.5 px-4 py-1.5 md:px-8 md:py-2">
        <p className="flex items-center gap-2">
          <span className="hidden rounded-sm bg-[#d9a95e] px-1.5 py-0.5 text-[11px] font-semibold text-[#1b1305] sm:inline">نموذج URUKQI</span>
          <span>متجر تجريبي — جميع المنتجات والأسعار والطلبات لأغراض العرض فقط.</span>
        </p>
        <nav className="flex items-center gap-4" aria-label="روابط URUKQI">
          <Link to="/admin" className="inline-flex min-h-8 items-center gap-1.5 text-[#f4d49b] hover:underline"><LayoutDashboard className="size-3.5" /><span className="sm:hidden">لوحة الإدارة</span><span className="hidden sm:inline">جرّب لوحة إدارة المتجر</span></Link>
          <a href={URUKQI_HOME} className="inline-flex min-h-8 items-center gap-1 hover:underline"><ArrowRight className="size-3.5" />العودة إلى URUKQI</a>
        </nav>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <Link to="/" className="flex min-h-11 items-center gap-2" aria-label="نَسَق — الصفحة الرئيسية">
      <span className="font-display text-[28px] leading-none">نَسَق</span>
      <span className="font-latin text-sm tracking-[0.35em] text-muted-foreground">NASAQ</span>
    </Link>
  );
}

export function StoreLayout() {
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const count = useStore(s => s.cart.reduce((a, l) => a + l.qty, 0));
  const wish = useStore(s => s.wishlist.length);
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior }); setMenuOpen(false); setSearchOpen(false); }, [pathname]);
  useEffect(() => { if (searchOpen) searchRef.current?.focus(); }, [searchOpen]);
  useEffect(() => {
    const open = () => setCartOpen(true);
    window.addEventListener("nasaq:open-cart", open);
    return () => window.removeEventListener("nasaq:open-cart", open);
  }, []);
  const activeCat = new URLSearchParams(search).get("cat");

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/shop?q=${encodeURIComponent(q.trim())}`);
    setSearchOpen(false);
  };

  return (
    <div className="flex min-h-svh flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-50 focus:bg-card focus:px-4 focus:py-2">انتقل إلى المحتوى</a>
      <DemoBar />
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-3 px-4 md:h-[72px] md:px-8">
          <button type="button" className="-ms-2 grid size-11 place-items-center lg:hidden" aria-label="القائمة" onClick={() => setMenuOpen(true)}><Menu className="size-5" /></button>
          <Brand />
          <nav className="ms-8 hidden items-center gap-6 lg:flex" aria-label="الأقسام">
            <NavLink to="/shop" end className={() => `py-2 text-[15px] ${pathname === "/shop" && !activeCat ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}>الكل</NavLink>
            {CATEGORIES.map(c => (
              <Link key={c.id} to={`/shop?cat=${c.id}`} className={`py-2 text-[15px] ${activeCat === c.id ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}>{c.short}</Link>
            ))}
            <Link to="/shop?sort=discount" className="py-2 text-[15px] text-clay">العروض</Link>
          </nav>
          <div className="ms-auto flex items-center">
            <button type="button" className="grid size-11 place-items-center" aria-label="بحث" aria-expanded={searchOpen} onClick={() => setSearchOpen(v => !v)}><Search className="size-5" strokeWidth={1.6} /></button>
            <Link to="/wishlist" className="relative grid size-11 place-items-center" aria-label={`المفضلة (${wish})`}>
              <Heart className="size-5" strokeWidth={1.6} />
              {wish > 0 && <span className="absolute end-1 top-1.5 grid min-w-[18px] place-items-center rounded-full bg-foreground px-1 text-[10px] leading-[18px] text-background num">{wish}</span>}
            </Link>
            <button type="button" className="relative grid size-11 place-items-center" aria-label={`السلة (${count})`} onClick={() => setCartOpen(true)}>
              <ShoppingBag className="size-5" strokeWidth={1.6} />
              {count > 0 && <span className="absolute end-1 top-1.5 grid min-w-[18px] place-items-center rounded-full bg-clay px-1 text-[10px] leading-[18px] text-white num" data-testid="cart-count">{count}</span>}
            </button>
          </div>
        </div>
        {searchOpen && (
          <form onSubmit={submitSearch} className="border-t bg-background" role="search">
            <div className="mx-auto flex max-w-[1440px] items-center gap-3 px-4 py-3 md:px-8">
              <Search className="size-5 text-muted-foreground" />
              <input ref={searchRef} value={q} onChange={e => setQ(e.target.value)} placeholder="ابحث عن قميص، حقيبة، عطر..." aria-label="ابحث في المتجر" className="h-11 flex-1 bg-transparent text-base outline-none" />
              <Button type="submit" className="h-10 px-5">بحث</Button>
              <button type="button" className="grid size-10 place-items-center" aria-label="إغلاق البحث" onClick={() => setSearchOpen(false)}><X className="size-5" /></button>
            </div>
          </form>
        )}
      </header>

      <main id="main" className="flex-1">
        <Outlet />
      </main>

      <Footer />

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="right" className="w-[86vw] max-w-sm bg-background">
          <SheetHeader><SheetTitle className="font-display text-2xl">نَسَق</SheetTitle><SheetDescription>تسوّق حسب القسم</SheetDescription></SheetHeader>
          <nav className="flex flex-col px-4" aria-label="الأقسام">
            <Link to="/shop" className="border-b py-4 text-lg">كل المنتجات</Link>
            {CATEGORIES.map(c => <Link key={c.id} to={`/shop?cat=${c.id}`} className="border-b py-4 text-lg">{c.label}</Link>)}
            <Link to="/shop?sort=discount" className="border-b py-4 text-lg text-clay">العروض</Link>
            <Link to="/wishlist" className="border-b py-4 text-lg">المفضلة</Link>
            <Link to="/admin" className="py-4 text-lg">لوحة إدارة المتجر (تجريبية)</Link>
          </nav>
        </SheetContent>
      </Sheet>

      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent side="left" className="flex w-full flex-col gap-0 bg-background p-0 sm:max-w-md">
          <SheetHeader className="border-b px-5 py-4"><SheetTitle className="font-display text-2xl">سلة التسوّق</SheetTitle><SheetDescription className="sr-only">المنتجات المضافة إلى السلة</SheetDescription></SheetHeader>
          <CartPanel compact onNavigate={() => setCartOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Footer() {
  return (
    <footer className="mt-20 bg-foreground text-background">
      <div className="mx-auto grid max-w-[1440px] gap-10 px-4 py-14 md:grid-cols-4 md:px-8">
        <div className="md:col-span-2">
          <p className="font-display text-4xl">نَسَق</p>
          <p className="mt-3 max-w-md text-sm leading-7 text-background/70">علامة أزياء ونمط حياة خيالية صُممت لعرض إمكانيات المتاجر الإلكترونية التي تبنيها URUKQI. لا يمكن شراء أي منتج فعليًا.</p>
        </div>
        <nav className="flex flex-col gap-3 text-sm text-background/80" aria-label="تسوّق">
          <p className="mb-1 text-xs tracking-widest text-background/50">تسوّق</p>
          {CATEGORIES.slice(0, 4).map(c => <Link key={c.id} to={`/shop?cat=${c.id}`} className="hover:text-background">{c.label}</Link>)}
        </nav>
        <nav className="flex flex-col gap-3 text-sm text-background/80" aria-label="عن العرض">
          <p className="mb-1 text-xs tracking-widest text-background/50">عن هذا النموذج</p>
          <Link to="/admin" className="hover:text-background">لوحة إدارة المتجر</Link>
          <Link to="/credits" className="hover:text-background">مصادر الصور</Link>
          <a href={`${URUKQI_HOME}sectors/ecommerce/`} className="hover:text-background">متاجر URUKQI الإلكترونية</a>
          <a href={URUKQI_HOME} className="hover:text-background">العودة إلى URUKQI</a>
        </nav>
      </div>
      <div className="border-t border-background/15">
        <p className="mx-auto max-w-[1440px] px-4 py-5 text-xs text-background/60 md:px-8">متجر تجريبي من تصميم وتطوير URUKQI — الأسعار أمثلة توضيحية وليست أسعار سوق، والطلبات لا تُرسل إلى أي جهة.</p>
      </div>
    </footer>
  );
}
