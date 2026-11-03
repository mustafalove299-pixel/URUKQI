# NASAQ — URUKQI e-commerce showcase

A fictional fashion and lifestyle store that prospective clients can try before ordering an online store from URUKQI. It builds into `/demos/ecommerce/` of the published site. This folder sits under `/tools/`, which the site never serves (see `functions/tools/[[path]].js`).

Everything runs in the browser. Cart, wishlist, orders and dashboard edits are kept in `localStorage` (`nasaq-demo-v1`). Nothing is sent to any server, there is no payment step, and the dashboard is a demonstration, not a secure admin.

## Stack

React 19, TypeScript, Vite 8, Tailwind CSS 4, shadcn/ui (Radix), Lucide, Zustand, Embla Carousel, React Router (hash routes), Playwright. Fonts: IBM Plex Sans Arabic, Amiri, Cormorant Garamond (OFL, via Fontsource).

Hash routes (`#/product/...`, `#/admin/...`) keep every deep link on `demos/ecommerce/index.html`, so refreshing any page never reaches the site's real `404.html`. No redirect rules were added.

## Commands

```sh
npm install
npm run images     # builds demos/ecommerce/img/ from the licensed source photos (see below)
npm run build      # type-checks and writes demos/ecommerce/index.html + assets/
npm run dev        # local development server
DEMO_BASE=http://127.0.0.1:8799/ npm run test:e2e   # against a served copy of the whole site
```

The built files in `demos/ecommerce/` are committed, because the Cloudflare Pages project publishes the repository root without a build step.

## Images

- `scripts/photo-sources.json` is the licence record: every photo's Unsplash page, photographer, file and licence check.
- `scripts/photos.json` holds the crop for each product (4:5, never upscaled).
- Source photos are kept outside the repository in `URUKQI-ecommerce-photo-source` (2000 px downloads named by Unsplash id). Set `PHOTO_SOURCE` to point elsewhere.
- Every photo page showed "Free to use under the Unsplash License". Unsplash+ (paid) images and photos with visible third-party logos were rejected. The store's credits page (`#/credits`) lists photographers.

## Data

- `src/data/catalog.ts` — 34 fictional products, prices in IQD (illustrative, not market quotes), sizes and stock per size, shipping rules.
- `src/data/orders.ts` — 9 sample orders with fictional customers, dated relative to the moment the demo is reset.
- `src/store/store.ts` — all state and actions (cart, stock limits, checkout, order statuses, catalogue edits, coupons, reset).
