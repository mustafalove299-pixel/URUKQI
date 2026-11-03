import { StrictMode, Suspense, lazy, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { createHashRouter, RouterProvider } from "react-router";
import { Direction } from "radix-ui";
import "./index.css";
import { Toaster } from "@/components/ui/sonner";
import { StoreLayout } from "@/layout/StoreLayout";
import { Home } from "@/pages/Home";
import { CartPage } from "@/pages/Cart";
import { reconcileCart, useStore } from "@/store/store";

// Each page loads its own chunk; the dashboard is separate so shoppers never download it.
const Shop = lazy(() => import("@/pages/Shop").then(m => ({ default: m.Shop })));
const ProductPage = lazy(() => import("@/pages/Product").then(m => ({ default: m.ProductPage })));
const Wishlist = lazy(() => import("@/pages/Wishlist").then(m => ({ default: m.Wishlist })));
const Checkout = lazy(() => import("@/pages/Checkout").then(m => ({ default: m.Checkout })));
const OrderDone = lazy(() => import("@/pages/Checkout").then(m => ({ default: m.OrderDone })));
const Credits = lazy(() => import("@/pages/Misc").then(m => ({ default: m.Credits })));
const NotFound = lazy(() => import("@/pages/Misc").then(m => ({ default: m.NotFound })));
const admin = () => import("@/admin/Admin");
const AdminLayout = lazy(() => admin().then(m => ({ default: m.AdminLayout })));
const Overview = lazy(() => admin().then(m => ({ default: m.Overview })));
const Orders = lazy(() => admin().then(m => ({ default: m.Orders })));
const OrderDetail = lazy(() => admin().then(m => ({ default: m.OrderDetail })));
const Products = lazy(() => admin().then(m => ({ default: m.Products })));
const ProductForm = lazy(() => admin().then(m => ({ default: m.ProductForm })));
const Discounts = lazy(() => admin().then(m => ({ default: m.Discounts })));

const Loading = () => <div className="grid min-h-[100svh] place-items-start justify-center pt-24 text-sm text-muted-foreground" role="status">جارٍ التحميل…</div>;
const lazyEl = (C: React.ComponentType) => <Suspense fallback={<Loading />}><C /></Suspense>;

// Hash routes keep every deep link on /demos/ecommerce/index.html, so refreshes never hit the site's 404.
const router = createHashRouter([
  {
    element: <StoreLayout />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/shop", element: lazyEl(Shop) },
      { path: "/product/:slug", element: lazyEl(ProductPage) },
      { path: "/cart", element: <CartPage /> },
      { path: "/wishlist", element: lazyEl(Wishlist) },
      { path: "/checkout", element: lazyEl(Checkout) },
      { path: "/order/:id", element: lazyEl(OrderDone) },
      { path: "/credits", element: lazyEl(Credits) },
      { path: "*", element: lazyEl(NotFound) }
    ]
  },
  {
    path: "/admin",
    element: lazyEl(AdminLayout),
    children: [
      { index: true, element: lazyEl(Overview) },
      { path: "orders", element: lazyEl(Orders) },
      { path: "orders/:id", element: lazyEl(OrderDetail) },
      { path: "products", element: lazyEl(Products) },
      { path: "products/new", element: lazyEl(ProductForm) },
      { path: "products/:slug", element: lazyEl(ProductForm) },
      { path: "discounts", element: lazyEl(Discounts) }
    ]
  }
]);

function App() {
  // Keep tabs in sync and drop cart lines that are no longer available.
  useEffect(() => {
    reconcileCart();
    const onStorage = (e: StorageEvent) => { if (e.key === "nasaq-demo-v1") useStore.persist.rehydrate(); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  return (
    <Direction.Provider dir="rtl">
      <RouterProvider router={router} />
      <Toaster position="bottom-center" richColors={false} closeButton />
    </Direction.Provider>
  );
}

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
