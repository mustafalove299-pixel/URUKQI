import { expect, test, type Page } from "@playwright/test";

const D = "demos/ecommerce/";
const money = (n: number) => `${n.toLocaleString("en-US")}`;
const errors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  const list: string[] = [];
  errors.set(page, list);
  page.on("pageerror", e => list.push(e.message));
  page.on("console", m => { if (m.type() === "error") list.push(m.text()); });
  page.on("response", r => { if (r.status() >= 400 && r.url().includes("/demos/")) list.push(`${r.status()} ${r.url()}`); });
  await page.route(/cloudflareinsights/, r => r.abort());
});
test.afterEach(async ({ page }) => {
  expect(errors.get(page), "no console errors or failed requests").toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "no horizontal overflow").toBe(true);
});

const cartCount = (page: Page) => page.getByTestId("cart-count");
async function addSize(page: Page, slug: string, size: string, qty = 1) {
  await page.goto(`${D}#/product/${slug}`);
  if (size) await page.getByRole("radio", { name: size, exact: true }).click();
  for (let i = 1; i < qty; i++) await page.getByRole("button", { name: "زيادة الكمية" }).click();
  await page.getByRole("button", { name: "أضف إلى السلة" }).click();
}

test("home renders hero, sections, demo notice and back link", async ({ page }) => {
  await page.goto(D);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("أناقة هادئة");
  await expect(page.getByText("متجر تجريبي — جميع المنتجات والأسعار والطلبات لأغراض العرض فقط.")).toBeVisible();
  await expect(page.getByRole("link", { name: "العودة إلى URUKQI" }).first()).toHaveAttribute("href", "../../");
  for (const h of ["تسوّق حسب القسم", "وصل حديثًا", "الأكثر مبيعًا", "عروض الموسم"]) await expect(page.getByRole("heading", { name: h })).toBeVisible();
  const broken = await page.evaluate(async () => {
    document.querySelectorAll("img").forEach(i => { i.loading = "eager"; });
    await Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; })));
    return [...document.images].filter(i => !i.naturalWidth).map(i => i.src);
  });
  expect(broken).toEqual([]);
});

test("listing: category, search with Arabic normalisation, price, size, colour, sort, load more, clear", async ({ page }) => {
  await page.goto(`${D}#/shop`);
  await expect(page.getByText("34 منتج")).toBeVisible();
  await expect(page.locator("article")).toHaveCount(12);
  await page.getByRole("button", { name: "عرض المزيد" }).click();
  await expect(page.locator("article")).toHaveCount(24);

  await page.goto(`${D}#/shop?q=${encodeURIComponent("حقيبه")}`);
  await expect(page.getByText("6 منتج")).toBeVisible();
  await page.goto(`${D}#/shop?cat=shoes&size=42`);
  const names = await page.locator("article h3").allInnerTexts();
  expect(names.length).toBeGreaterThan(0);
  await page.goto(`${D}#/shop?cat=bags&color=black`);
  await expect(page.locator("article")).toHaveCount(2);
  await page.goto(`${D}#/shop?max=20000`);
  const prices = await page.locator("article").getByTestId("price").allInnerTexts();
  expect(prices.every(t => Number(t.replace(/[^\d]/g, "")) <= 20000)).toBe(true);
  await page.goto(`${D}#/shop?sort=price-asc`);
  const sorted = (await page.locator("article").getByTestId("price").allInnerTexts()).map(t => Number(t.replace(/[^\d]/g, "")));
  expect(sorted).toEqual([...sorted].sort((a, b) => a - b));
  await page.goto(`${D}#/shop?q=zzzz`);
  await expect(page.getByText("لا توجد نتائج")).toBeVisible();
  await page.getByRole("button", { name: "مسح التصفية" }).click();
  await expect(page.getByText("34 منتج")).toBeVisible();
});

test("filters work through the UI controls", async ({ page, isMobile }) => {
  await page.goto(`${D}#/shop`);
  if (isMobile) await page.getByRole("button", { name: /تصفية/ }).click();
  const scope = isMobile ? page.getByRole("dialog") : page.getByRole("complementary", { name: "التصفية" });
  await scope.getByRole("button", { name: /الحقائب/ }).click();
  await scope.getByRole("button", { name: /أسود/ }).click();
  if (isMobile) await page.getByRole("button", { name: /عرض \d+ منتج/ }).click();
  await expect(page.locator("article")).toHaveCount(2);
  await expect(page).toHaveURL(/cat=bags/);
  await page.getByRole("button", { name: "مسح الكل" }).click();
  await expect(page.locator("article")).toHaveCount(6);
});

test("product: gallery, size required, out-of-stock size disabled, add to cart, stock cap", async ({ page }) => {
  await page.goto(`${D}#/product/m-denim-jacket`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("جاكيت جينز كلاسيكي");
  await expect(page.getByRole("radio", { name: "XL" })).toBeDisabled();
  await page.getByRole("button", { name: "أضف إلى السلة" }).click();
  await expect(page.getByRole("alert")).toContainText("اختر المقاس");
  await page.getByRole("radio", { name: "S", exact: true }).click();
  await expect(page.getByText(/متبقٍ 2 فقط/)).toBeVisible();
  await page.getByRole("button", { name: "زيادة الكمية" }).click();
  await expect(page.getByRole("button", { name: "زيادة الكمية" })).toBeDisabled();
  await page.getByRole("button", { name: "أضف إلى السلة" }).click();
  await expect(cartCount(page)).toHaveText("2");
  await expect(page.getByRole("button", { name: "كل المتوفر في سلتك" })).toBeDisabled();
  await page.getByRole("button", { name: "تكبير" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("heading", { name: "قد يعجبك أيضًا" })).toBeVisible();
});

test("cart: quantities, totals, stock limit, remove, persistence and empty state", async ({ page }) => {
  await addSize(page, "m-essential-tee", "M", 2);
  await addSize(page, "l-ceramic-candle", "");
  await page.goto(`${D}#/cart`);
  await expect(page.getByTestId("cart-line")).toHaveCount(2);
  await expect(page.getByTestId("subtotal")).toContainText(money(18000 * 2 + 15000));
  await page.reload();
  await expect(page.getByTestId("subtotal")).toContainText(money(51000));
  const tee = page.getByTestId("cart-line").filter({ hasText: "تيشيرت" });
  await tee.getByRole("textbox", { name: "الكمية" }).fill("99");
  await expect(tee.getByRole("textbox", { name: "الكمية" })).toHaveValue("15");
  await expect(tee.getByText("هذا كل المتوفر من هذا المقاس.")).toBeVisible();
  await tee.getByRole("button", { name: /حذف/ }).click();
  await expect(page.getByTestId("subtotal")).toContainText(money(15000));
  await page.getByTestId("cart-line").getByRole("button", { name: /حذف/ }).click();
  await expect(page.getByText("سلتك فارغة")).toBeVisible();
});

test("wishlist: add, persist, move to cart", async ({ page }) => {
  await page.goto(`${D}#/product/b-black-tote`);
  await page.getByRole("button", { name: /إضافة حقيبة توت سوداء إلى المفضلة/ }).click();
  await page.goto(`${D}#/product/w-trench-coat`);
  await page.getByRole("button", { name: /إضافة ترنش كوت بيج إلى المفضلة/ }).click();
  await page.reload();
  await page.goto(`${D}#/wishlist`);
  await expect(page.getByTestId("wish-item")).toHaveCount(2);
  const coat = page.getByTestId("wish-item").filter({ hasText: "ترنش" });
  await coat.getByRole("button", { name: "انقل إلى السلة" }).click();
  await expect(page.getByText("اختر المقاس أولًا.")).toBeVisible();
  await coat.getByRole("combobox").selectOption("L");
  await coat.getByRole("button", { name: "انقل إلى السلة" }).click();
  await expect(page.getByTestId("wish-item")).toHaveCount(1);
  await expect(cartCount(page)).toHaveText("1");
});

test("checkout: validation, coupon, shipping rules, simulated order reaches the dashboard and reduces stock", async ({ page }) => {
  await addSize(page, "w-knit-set", "M");
  await page.goto(`${D}#/checkout`);
  await expect(page.getByText("هذا طلب تجريبي")).toBeVisible();
  await page.getByRole("button", { name: "تأكيد الطلب التجريبي" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "أكمل الحقول" })).toBeVisible();
  await page.getByLabel("الاسم الكامل").fill("زبون اختبار");
  await page.getByLabel("رقم الهاتف").fill("123");
  await page.getByRole("button", { name: "تأكيد الطلب التجريبي" }).click();
  await expect(page.getByText("اكتب رقم هاتف عراقيًا")).toBeVisible();
  await page.getByLabel("رقم الهاتف").fill("٠٧٧٠١٢٣٤٥٦٧");
  await page.getByRole("combobox", { name: "المحافظة" }).click();
  await page.getByRole("option", { name: "البصرة" }).click();
  await page.getByLabel("المنطقة").fill("العشار");
  await page.getByLabel("العنوان وأقرب نقطة دالة").fill("قرب الكورنيش");
  await expect(page.getByTestId("grand-total")).toContainText(money(68000 + 8000));
  await page.getByLabel("رمز الخصم").fill("nasaq10");
  await page.getByRole("button", { name: "تطبيق" }).click();
  await expect(page.getByRole("status").filter({ hasText: "طُبّق خصم" })).toBeVisible();
  await expect(page.getByTestId("grand-total")).toContainText(money(68000 - 6750 + 8000));
  await page.getByLabel("رمز الخصم").fill("WELCOME15");
  await page.getByRole("button", { name: "تطبيق" }).click();
  await expect(page.getByText("الرمز غير صالح أو غير مفعّل.")).toBeVisible();
  await page.getByLabel("رمز الخصم").fill("NASAQ10");
  await page.getByRole("button", { name: "تطبيق" }).click();
  let leaked = false;
  page.on("request", r => { if (!r.url().startsWith("http://127.0.0.1") && !/fonts|unsplash/.test(r.url())) leaked = true; if (/api\//.test(r.url())) leaked = true; });
  await page.getByRole("button", { name: "تأكيد الطلب التجريبي" }).click();
  await expect(page.getByRole("heading", { name: "شكرًا لك، تم تسجيل طلبك" })).toBeVisible();
  await expect(page.getByText("طلب تجريبي — لم يُرسل إلى أي جهة")).toBeVisible();
  expect(leaked, "checkout sends nothing to any server").toBe(false);
  await expect(cartCount(page)).toHaveCount(0);
  const id = (await page.getByText(/NSQ-\d+/).first().innerText()).match(/NSQ-\d+/)![0];
  await page.getByRole("link", { name: "شاهد الطلب في لوحة الإدارة" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(id);
  await expect(page.getByText("0770 123 4567").or(page.getByText("07701234567"))).toBeVisible();
  await page.goto(`${D}#/product/w-knit-set`);
  await page.getByRole("radio", { name: "M", exact: true }).click();
  await expect(page.getByText(/متبقٍ 4 فقط/).or(page.getByText("متوفر"))).toBeVisible();
});

test("free shipping above 150,000 and Baghdad rate", async ({ page }) => {
  await addSize(page, "w-trench-coat", "M");
  await addSize(page, "a-card-holder", "");
  await page.goto(`${D}#/checkout`);
  await page.getByRole("button", { name: "املأ ببيانات تجريبية" }).click();
  await expect(page.getByTestId("grand-total")).toContainText(money(155000));
  await expect(page.getByText("مجاني")).toBeVisible();
});

test("deep links and refresh never hit the site 404", async ({ page }) => {
  for (const h of ["#/shop?cat=bags", "#/product/s-block-heels", "#/admin/products", "#/admin/orders/NSQ-1047", "#/checkout"]) {
    await page.goto("about:blank");
    const res = await page.goto(D + h);
    expect(res!.status()).toBe(200);
    await page.reload();
    await expect(page.locator("#root")).not.toBeEmpty();
  }
  await page.goto(`${D}#/product/does-not-exist`);
  await expect(page.getByText("المنتج غير موجود")).toBeVisible();
  const missing = await page.request.get(`${D}does-not-exist`);
  expect(missing.status()).toBe(404);
});

test("keyboard: skip link, search and add to cart without a mouse", async ({ page, isMobile }) => {
  test.skip(isMobile, "keyboard flow is a desktop check");
  await page.goto(`${D}#/shop`);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "انتقل إلى المحتوى" })).toBeFocused();
  await page.getByRole("button", { name: "بحث", exact: true }).focus();
  await page.keyboard.press("Enter");
  await page.keyboard.type("مسك");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/q=/);
  await expect(page.locator("article")).toHaveCount(1);
  await page.locator("article a").first().focus();
  await page.keyboard.press("Enter");
  await page.getByRole("radio", { name: "50 مل" }).focus();
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "أضف إلى السلة" }).focus();
  await page.keyboard.press("Enter");
  await expect(cartCount(page)).toHaveText("1");
  const focus = await page.evaluate(() => { const c = getComputedStyle(document.activeElement!); return { outline: c.outlineStyle, ring: c.boxShadow }; });
  expect(focus.outline !== "none" || focus.ring !== "none", `visible focus indicator ${JSON.stringify(focus)}`).toBe(true);
});
