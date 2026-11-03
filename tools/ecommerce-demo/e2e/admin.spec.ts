import { expect, test } from "@playwright/test";

const D = "demos/ecommerce/";
test.beforeEach(async ({ page }) => {
  const errs: string[] = [];
  page.on("pageerror", e => errs.push(e.message));
  await page.route(/cloudflareinsights/, r => r.abort());
  test.info().annotations.push({ type: "errors", description: "" });
  page.on("close", () => expect(errs).toEqual([]));
});

test("overview shows demo notice, stats, chart and lists", async ({ page }) => {
  await page.goto(`${D}#/admin`);
  await expect(page.getByText("التعديلات محفوظة في متصفحك فقط، وهذه ليست لوحة إدارة آمنة للإنتاج.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "نظرة عامة" })).toBeVisible();
  await expect(page.getByRole("img", { name: /مبيعات آخر 7 أيام/ })).toBeVisible();
  await expect(page.getByText("NSQ-1049")).toBeVisible();
});

test("change a price and discount: the store reflects it", async ({ page }) => {
  await page.goto(`${D}#/admin/products/m-essential-tee`);
  await page.getByLabel("السعر الحالي (د.ع)").fill("16000");
  await page.getByLabel("السعر قبل الخصم (اختياري)").fill("20000");
  await expect(page.getByText(/يظهر في المتجر بخصم/)).toBeVisible();
  await page.getByRole("button", { name: "حفظ التعديلات" }).click();
  await page.goto(`${D}#/product/m-essential-tee`);
  await expect(page.getByText("16,000").first()).toBeVisible();
  await expect(page.getByText("20,000").first()).toBeVisible();
});

test("invalid prices are rejected", async ({ page }) => {
  await page.goto(`${D}#/admin/products/m-essential-tee`);
  await page.getByLabel("السعر قبل الخصم (اختياري)").fill("100");
  await page.getByRole("button", { name: "حفظ التعديلات" }).click();
  await expect(page.getByText("السعر قبل الخصم يجب أن يكون أعلى من السعر الحالي.")).toBeVisible();
});

test("stock edits limit the shopper; disabling hides the product and removes it from the cart", async ({ page }) => {
  await page.goto(`${D}#/product/l-white-vase`);
  await page.getByRole("button", { name: "أضف إلى السلة" }).click();
  await page.goto(`${D}#/admin/products/l-white-vase`);
  await page.getByLabel("مقاس واحد").fill("0");
  await page.getByRole("button", { name: "حفظ التعديلات" }).click();
  await page.goto(`${D}#/product/l-white-vase`);
  await expect(page.getByRole("button", { name: "نفدت الكمية" })).toBeDisabled();
  await expect(page.getByTestId("cart-count")).toHaveCount(0);

  await page.goto(`${D}#/admin/products`);
  await page.getByRole("switch", { name: "إظهار حقيبة توت سوداء في المتجر" }).click();
  await page.goto(`${D}#/shop?cat=bags`);
  await expect(page.locator("article")).toHaveCount(5);
  await page.goto(`${D}#/product/b-black-tote`);
  await expect(page.getByText("هذا المنتج غير متاح حاليًا")).toBeVisible();
});

test("add a new product: it appears in the store and can be bought", async ({ page }) => {
  await page.goto(`${D}#/admin/products/new`);
  await page.getByRole("button", { name: "إضافة المنتج" }).click();
  await expect(page.getByText("اكتب اسم المنتج.")).toBeVisible();
  await page.getByLabel("اسم المنتج").fill("قميص كتان تجريبي");
  await page.getByLabel("الوصف").fill("قميص كتان خفيف أضفناه من لوحة الإدارة.");
  await page.getByLabel("السعر الحالي (د.ع)").fill("39000");
  await page.getByLabel("M", { exact: true }).fill("5");
  await page.getByRole("radio", { name: "صورة m-washed-shirt" }).click();
  await page.getByRole("button", { name: "إضافة المنتج" }).click();
  await expect(page.getByText("قميص كتان تجريبي")).toBeVisible();
  await page.goto(`${D}#/shop?q=${encodeURIComponent("كتان تجريبي")}`);
  await page.locator("article a").first().click();
  await page.getByRole("radio", { name: "M", exact: true }).click();
  await page.getByRole("button", { name: "أضف إلى السلة" }).click();
  await expect(page.getByTestId("cart-count")).toHaveText("1");
  await expect(page.getByRole("radio", { name: "S", exact: true })).toBeDisabled();
});

test("order status flow; cancelling restocks and locks the order", async ({ page }) => {
  await page.goto(`${D}#/admin/orders?status=new`);
  await expect(page.getByRole("tab", { name: /جديد/ })).toHaveAttribute("aria-selected", "true");
  await page.goto(`${D}#/admin/orders/NSQ-1048`);
  await page.getByRole("combobox", { name: "تغيير الحالة" }).click();
  await page.getByRole("option", { name: "قيد التجهيز" }).click();
  await expect(page.getByText("قيد التجهيز").first()).toBeVisible();
  await page.goto(`${D}#/product/m-camel-coat`);
  await page.getByRole("radio", { name: "L", exact: true }).click();
  await expect(page.getByText(/متبقٍ 2 فقط/)).toBeVisible();
  await page.goto(`${D}#/admin/orders/NSQ-1048`);
  await page.getByRole("combobox", { name: "تغيير الحالة" }).click();
  await page.getByRole("option", { name: "ملغي" }).click();
  await page.getByRole("button", { name: "إلغاء الطلب" }).click();
  await expect(page.getByText("الطلب ملغي ولا يمكن تغيير حالته.")).toBeVisible();
  await expect(page.getByRole("combobox", { name: "تغيير الحالة" })).toBeDisabled();
  await page.goto(`${D}#/product/m-camel-coat`);
  await page.getByRole("radio", { name: "L", exact: true }).click();
  await expect(page.getByText(/متبقٍ 3 فقط/)).toBeVisible();
});

test("coupons: add, toggle and use at checkout; remove a product discount", async ({ page }) => {
  await page.goto(`${D}#/admin/discounts`);
  await page.getByLabel("الرمز").fill("EID20");
  await page.getByLabel("النسبة %").fill("20");
  await page.getByRole("button", { name: "إضافة" }).click();
  await expect(page.getByText("EID20", { exact: true })).toBeVisible();
  await page.getByRole("switch", { name: "تفعيل WELCOME15" }).click();
  const sale = page.getByRole("listitem").filter({ hasText: "صندل زيتوني بإبزيمين" });
  await sale.getByRole("button", { name: "إلغاء الخصم" }).click();
  await expect(sale).toHaveCount(0);
  await page.goto(`${D}#/product/l-ceramic-candle`);
  await page.getByRole("button", { name: "أضف إلى السلة" }).click();
  await page.goto(`${D}#/checkout`);
  await page.getByLabel("رمز الخصم").fill("EID20");
  await page.getByRole("button", { name: "تطبيق" }).click();
  await expect(page.getByRole("status").filter({ hasText: "طُبّق خصم" })).toBeVisible();
  await page.getByLabel("رمز الخصم").fill("WELCOME15");
  await page.getByRole("button", { name: "تطبيق" }).click();
  await expect(page.getByRole("status").filter({ hasText: "طُبّق خصم" })).toBeVisible();
});

test("reset restores the original catalogue and orders", async ({ page }) => {
  await page.goto(`${D}#/admin/products/m-essential-tee`);
  await page.getByLabel("السعر الحالي (د.ع)").fill("11000");
  await page.getByRole("button", { name: "حفظ التعديلات" }).click();
  await page.getByRole("button", { name: "إعادة ضبط البيانات التجريبية" }).first().click();
  await page.getByRole("button", { name: "إعادة الضبط" }).click();
  await page.goto(`${D}#/product/m-essential-tee`);
  await expect(page.getByText("18,000").first()).toBeVisible();
  await page.goto(`${D}#/admin/orders`);
  await expect(page.getByRole("tab", { name: /الكل/ })).toContainText("9");
});
