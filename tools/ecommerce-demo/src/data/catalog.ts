// Fictional NASAQ catalogue. Names, prices and stock are illustrative examples, not market quotations.
export type CategoryId = "men" | "women" | "shoes" | "bags" | "accessories" | "lifestyle";
export type ColorId = "white" | "ivory" | "beige" | "camel" | "brown" | "burgundy" | "black" | "grey" | "blue" | "gold" | "mustard" | "olive";
export type Tag = "new" | "best";

export interface Product {
  slug: string;
  sku: string;
  name: string;
  category: CategoryId;
  description: string;
  details: string[];
  price: number;
  oldPrice?: number;
  color: ColorId;
  sizes: string[];
  stock: Record<string, number>;
  tags: Tag[];
  rank: number;
  sold: number;
  enabled: boolean;
  image: string;
}

export const CATEGORIES: { id: CategoryId; label: string; short: string; cover: string }[] = [
  { id: "women", label: "أزياء نسائية", short: "نساء", cover: "w-knit-set" },
  { id: "men", label: "أزياء رجالية", short: "رجال", cover: "m-camel-coat" },
  { id: "shoes", label: "الأحذية", short: "أحذية", cover: "s-block-heels" },
  { id: "bags", label: "الحقائب", short: "حقائب", cover: "b-leather-satchel" },
  { id: "accessories", label: "الإكسسوارات", short: "إكسسوارات", cover: "a-gold-pendant" },
  { id: "lifestyle", label: "المنزل ونمط الحياة", short: "المنزل", cover: "l-lavender-pitcher" }
];

export const COLORS: Record<ColorId, { label: string; hex: string }> = {
  white: { label: "أبيض", hex: "#f5f3ef" },
  ivory: { label: "عاجي", hex: "#ece3d3" },
  beige: { label: "بيج", hex: "#cdb79a" },
  camel: { label: "جملي", hex: "#b08458" },
  brown: { label: "بني", hex: "#6f4630" },
  burgundy: { label: "خمري", hex: "#5d1f26" },
  black: { label: "أسود", hex: "#1d1b18" },
  grey: { label: "رمادي", hex: "#8d8a85" },
  blue: { label: "أزرق", hex: "#3d5b80" },
  gold: { label: "ذهبي", hex: "#c9a14a" },
  mustard: { label: "خردلي", hex: "#c99a2e" },
  olive: { label: "زيتوني", hex: "#4d4f3a" }
};

const CLOTHES = ["S", "M", "L", "XL"];
const ONE = ["مقاس واحد"];
const stockOf = (sizes: string[], counts: number[]) => Object.fromEntries(sizes.map((s, i) => [s, counts[i] ?? 0]));

type Seed = Omit<Product, "sku" | "stock" | "enabled" | "image" | "rank"> & { counts: number[] };
const SKU: Record<CategoryId, string> = { men: "MN", women: "WM", shoes: "SH", bags: "BG", accessories: "AC", lifestyle: "LS" };

const seeds: Seed[] = [
  { slug: "m-washed-shirt", name: "قميص قطني مغسول", category: "men", color: "white", price: 32000, sizes: CLOTHES, counts: [6, 9, 7, 3], tags: ["best"], sold: 214,
    description: "قميص بقصّة مريحة من قطن مغسول ناعم، يبقى أنيقًا مع الجينز أو البنطلون القماشي.", details: ["قطن 100%", "قصّة مريحة", "غسيل بالماء البارد"] },
  { slug: "m-essential-tee", name: "تيشيرت أساسي أبيض", category: "men", color: "white", price: 18000, sizes: CLOTHES, counts: [12, 15, 10, 8], tags: ["best"], sold: 388,
    description: "تيشيرت بقبة دائرية من قطن كثيف، قطعة أساسية تُلبس وحدها أو تحت الجاكيت.", details: ["قطن كثيف 220 غم", "قبة دائرية مضلّعة", "لا يفقد شكله بعد الغسيل"] },
  { slug: "m-denim-jacket", name: "جاكيت جينز كلاسيكي", category: "men", color: "blue", price: 55000, oldPrice: 68000, sizes: CLOTHES, counts: [2, 5, 4, 0], tags: [], sold: 96,
    description: "جاكيت جينز بغسلة متوسطة وأزرار معدنية، يناسب أمسيات الربيع والخريف.", details: ["دنيم قطني متين", "جيبان أماميان بأزرار", "قصّة مستقيمة"] },
  { slug: "m-camel-coat", name: "معطف طويل جملي", category: "men", color: "camel", price: 125000, sizes: CLOTHES, counts: [3, 4, 2, 1], tags: ["new"], sold: 41,
    description: "معطف بطول الركبة بلون جملي دافئ وقماش متماسك، يرفع أي إطلالة شتوية.", details: ["مزيج صوف وبوليستر", "بطانة داخلية خفيفة", "تنظيف جاف"] },
  { slug: "m-wide-trousers", name: "بنطلون واسع رمادي", category: "men", color: "grey", price: 42000, sizes: CLOTHES, counts: [4, 6, 5, 2], tags: ["new"], sold: 58,
    description: "بنطلون بقصّة واسعة وخصر مرتفع، بقماش ينسدل بانسيابية.", details: ["قماش ينسدل بانسيابية", "خصر مرتفع", "جيبان جانبيان"] },
  { slug: "m-pocket-tee", name: "تيشيرت خردلي بجيب", category: "men", color: "mustard", price: 22000, sizes: CLOTHES, counts: [7, 8, 6, 4], tags: [], sold: 132,
    description: "تيشيرت صيفي بلون خردلي وجيب على الصدر، خفيف ومناسب للأيام الحارة.", details: ["قطن خفيف", "جيب على الصدر", "قصّة مريحة"] },

  { slug: "w-knit-set", name: "طقم تريكو ناعم", category: "women", color: "ivory", price: 68000, oldPrice: 82000, sizes: CLOTHES, counts: [3, 5, 4, 2], tags: ["best"], sold: 177,
    description: "طقم من بلوزة تريكو وتنورة طويلة بلون عاجي هادئ، أنيق ومريح طوال اليوم.", details: ["تريكو ناعم", "تنورة بخصر مطاطي", "يُغسل يدويًا"] },
  { slug: "w-trench-coat", name: "ترنش كوت بيج", category: "women", color: "beige", price: 135000, sizes: CLOTHES, counts: [2, 3, 3, 1], tags: ["new", "best"], sold: 88,
    description: "ترنش كوت كلاسيكي بحزام وياقة عريضة، قطعة تبقى معك لسنوات.", details: ["قطن مقاوم للرذاذ", "حزام قابل للتعديل", "أزرار مزدوجة"] },
  { slug: "w-embroidered-abaya", name: "عباءة مطرّزة سوداء", category: "women", color: "black", price: 95000, sizes: ["52", "54", "56", "58"], counts: [3, 4, 4, 2], tags: ["best"], sold: 203,
    description: "عباءة سوداء بتطريز زهري ناعم على الصدر والأكمام، وأطراف دانتيل.", details: ["كريب ينسدل بانسيابية", "تطريز يدوي المظهر", "أكمام بدانتيل"] },
  { slug: "w-wool-coat", name: "معطف صوفي أسود", category: "women", color: "black", price: 110000, sizes: CLOTHES, counts: [2, 4, 3, 2], tags: ["new"], sold: 37,
    description: "معطف واسع من الصوف الناعم بلون أسود عميق، دافئ وبسيط.", details: ["مزيج صوف", "قصّة واسعة", "جيبان جانبيان"] },

  { slug: "s-monk-strap", name: "حذاء مونك جلد بني", category: "shoes", color: "brown", price: 85000, sizes: ["40", "41", "42", "43", "44"], counts: [2, 3, 4, 2, 1], tags: [], sold: 64,
    description: "حذاء رسمي من الجلد البني بإبزيمين، مناسب للعمل والمناسبات.", details: ["جلد طبيعي", "نعل جلدي", "إبزيمان معدنيان"] },
  { slug: "s-suede-boots", name: "بوت شمواه بأربطة", category: "shoes", color: "camel", price: 92000, sizes: ["40", "41", "42", "43", "44"], counts: [1, 3, 3, 2, 0], tags: ["new"], sold: 49,
    description: "بوت من الشمواه بلون جملي وأربطة طبيعية، يجمع بين المتانة والأناقة.", details: ["شمواه طبيعي", "نعل مطاطي", "خياطة ظاهرة"] },
  { slug: "s-hiking-shoes", name: "حذاء مشي خارجي", category: "shoes", color: "olive", price: 78000, sizes: ["40", "41", "42", "43", "44"], counts: [2, 4, 5, 3, 2], tags: [], sold: 71,
    description: "حذاء متين للمشي والرحلات بنعل مانع للانزلاق.", details: ["نعل مانع للانزلاق", "مقدمة مدعّمة", "خفيف الوزن"] },
  { slug: "s-block-heels", name: "حذاء كعب عريض نيود", category: "shoes", color: "beige", price: 58000, sizes: ["36", "37", "38", "39", "40"], counts: [2, 4, 4, 3, 1], tags: ["best"], sold: 156,
    description: "حذاء بكعب عريض مريح ومقدمة مدببة بلون نيود يناسب كل الإطلالات.", details: ["كعب 5 سم", "بطانة جلدية", "مقدمة مدببة"] },
  { slug: "s-buckle-slides", name: "صندل زيتوني بإبزيمين", category: "shoes", color: "olive", price: 30000, oldPrice: 38000, sizes: ["39", "40", "41", "42", "43"], counts: [5, 6, 6, 4, 3], tags: [], sold: 241,
    description: "صندل مريح بإبزيمين قابلين للتعديل، مثالي للصيف.", details: ["نعل مريح", "إبزيمان قابلان للتعديل", "مقاوم للماء"] },

  { slug: "b-leather-satchel", name: "حقيبة جلد عسلية", category: "bags", color: "camel", price: 88000, sizes: ONE, counts: [6], tags: ["best"], sold: 129,
    description: "حقيبة يد واسعة من الجلد بلون عسلي، بحزامين وجيوب أمامية.", details: ["جلد طبيعي", "حزام كتف قابل للفصل", "جيبان أماميان"] },
  { slug: "b-croc-mini", name: "حقيبة صغيرة بنقشة جلد التمساح", category: "bags", color: "burgundy", price: 72000, sizes: ONE, counts: [4], tags: ["new"], sold: 52,
    description: "حقيبة صغيرة بلون خمري ونقشة جلد التمساح، مع قفل ذهبي مميز.", details: ["جلد صناعي بنقشة بارزة", "قفل معدني ذهبي", "حزام قصير"] },
  { slug: "b-leather-backpack", name: "حقيبة ظهر جلدية", category: "bags", color: "brown", price: 98000, sizes: ONE, counts: [5], tags: [], sold: 83,
    description: "حقيبة ظهر من الجلد المعتّق، تتسع للحاسوب وأغراض اليوم.", details: ["جلد معتّق", "جيب داخلي للحاسوب", "جيوب جانبية"] },
  { slug: "b-black-tote", name: "حقيبة توت سوداء", category: "bags", color: "black", price: 64000, sizes: ONE, counts: [7], tags: ["best"], sold: 168,
    description: "حقيبة توت سوداء بخطوط محفورة ومقابض طويلة، عملية وأنيقة.", details: ["سعة كبيرة", "مقابض مريحة", "بطانة داخلية"] },
  { slug: "b-folio-clutch", name: "حقيبة ملفات بسحّاب", category: "bags", color: "black", price: 45000, sizes: ONE, counts: [8], tags: [], sold: 47,
    description: "حقيبة مسطحة بسحّاب معدني للأوراق والجهاز اللوحي.", details: ["سحّاب معدني", "خفيفة", "تتسع لجهاز لوحي"] },
  { slug: "b-crossbody", name: "حقيبة كروس جلد", category: "bags", color: "brown", price: 52000, oldPrice: 60000, sizes: ONE, counts: [6], tags: [], sold: 95,
    description: "حقيبة كتف صغيرة من الجلد بإبزيم كلاسيكي، تتوفر في التشكيلة بألوان دافئة.", details: ["جلد طبيعي", "إبزيم معدني", "حزام طويل"] },

  { slug: "a-gold-pendant", name: "قلادة نصف قمر", category: "accessories", color: "gold", price: 38000, sizes: ONE, counts: [9], tags: ["new"], sold: 74,
    description: "قلادة بسلسلة رفيعة ودلاية مطروقة على شكل نصف قمر.", details: ["نحاس مطلي بالذهب", "طول السلسلة 45 سم", "دلاية مطروقة يدويًا"] },
  { slug: "a-gold-bangles", name: "طقم أساور ذهبية اللون", category: "accessories", color: "gold", price: 62000, sizes: ONE, counts: [4], tags: ["best"], sold: 118,
    description: "طقم أساور مجدولة مع قلادة رفيعة، لإطلالة المناسبات.", details: ["معدن مطلي بالذهب", "5 أساور وقلادة", "علبة هدية"] },
  { slug: "a-metal-sunglasses", name: "نظارة شمسية معدنية", category: "accessories", color: "black", price: 35000, sizes: ONE, counts: [10], tags: [], sold: 99,
    description: "نظارة شمسية بإطار معدني خفيف وعدسات داكنة.", details: ["حماية من الأشعة فوق البنفسجية", "إطار معدني", "حافظة مرفقة"] },
  { slug: "a-round-sunglasses", name: "نظارة شمسية دائرية", category: "accessories", color: "black", price: 33000, sizes: ONE, counts: [8], tags: ["new"], sold: 61,
    description: "نظارة دائرية بطابع كلاسيكي وإطار رفيع.", details: ["عدسات داكنة", "إطار رفيع", "حافظة مرفقة"] },
  { slug: "a-card-holder", name: "محفظة بطاقات جلد", category: "accessories", color: "burgundy", price: 20000, sizes: ONE, counts: [14], tags: [], sold: 143,
    description: "محفظة بطاقات صغيرة من الجلد المخيط يدويًا.", details: ["جلد طبيعي", "خياطة يدوية", "4 جيوب للبطاقات"] },
  { slug: "a-leather-belt", name: "حزام جلد بإبزيم فضي", category: "accessories", color: "camel", price: 28000, sizes: ["90", "100", "110"], counts: [4, 6, 3], tags: [], sold: 87,
    description: "حزام بعرض متوسط بإبزيم فضي مصقول.", details: ["جلد طبيعي", "إبزيم فضي", "عرض 3.5 سم"] },
  { slug: "a-minimal-watch", name: "ساعة يد بسيطة", category: "accessories", color: "black", price: 115000, oldPrice: 135000, sizes: ONE, counts: [3], tags: ["best"], sold: 66,
    description: "ساعة بميناء أبيض وسوار جلدي أسود، بتصميم هادئ يناسب كل يوم.", details: ["حركة كوارتز", "سوار جلدي", "مقاومة للرذاذ"] },

  { slug: "l-eau-de-parfum", name: "عطر مسك أبيض", category: "lifestyle", color: "white", price: 48000, sizes: ["50 مل", "100 مل"], counts: [6, 4], tags: ["best"], sold: 190,
    description: "عطر ناعم بنفحات المسك الأبيض والزهور، يدوم طوال اليوم.", details: ["أو دو بارفان", "نفحات مسك وزهور", "زجاجة قابلة لإعادة التعبئة"] },
  { slug: "l-ceramic-candle", name: "شمعة معطّرة بوعاء خزفي", category: "lifestyle", color: "brown", price: 15000, sizes: ONE, counts: [18], tags: [], sold: 222,
    description: "شمعة بوعاء خزفي صغير وعطر خشبي دافئ.", details: ["شمع صويا", "مدة احتراق 20 ساعة", "وعاء قابل لإعادة الاستخدام"] },
  { slug: "l-gold-handle-mug", name: "كوب بمقبض ذهبي", category: "lifestyle", color: "white", price: 12000, sizes: ONE, counts: [20], tags: ["new"], sold: 137,
    description: "كوب بورسلين أبيض بمقبض ذهبي اللون.", details: ["بورسلين", "سعة 300 مل", "يُغسل يدويًا"] },
  { slug: "l-handmade-cup", name: "كوب فخاري مزجج", category: "lifestyle", color: "beige", price: 14000, sizes: ONE, counts: [12], tags: [], sold: 76,
    description: "كوب فخاري بتزجيج يدوي بدرجات العسلي والأزرق، لا تتشابه قطعتان.", details: ["فخار مزجج", "صناعة يدوية", "سعة 250 مل"] },
  { slug: "l-white-vase", name: "مزهرية خزفية بيضاء", category: "lifestyle", color: "white", price: 26000, sizes: ONE, counts: [9], tags: [], sold: 58,
    description: "مزهرية صغيرة بشكل بيضاوي ناعم، تكفيها غصن واحد.", details: ["خزف مطفي", "ارتفاع 18 سم", "مناسبة للأغصان المجففة"] },
  { slug: "l-lavender-pitcher", name: "إبريق خزفي للزهور", category: "lifestyle", color: "white", price: 24000, oldPrice: 30000, sizes: ONE, counts: [7], tags: [], sold: 44,
    description: "إبريق خزفي أبيض يُستخدم مزهريةً لباقات اللافندر المجفف.", details: ["خزف لامع", "ارتفاع 22 سم", "الزهور غير مشمولة"] }
];

export const SEED_PRODUCTS: Product[] = seeds.map(({ counts, ...p }, i) => ({
  ...p,
  sku: `NSQ-${SKU[p.category]}-${String(101 + i)}`,
  stock: stockOf(p.sizes, counts),
  enabled: true,
  image: p.slug,
  rank: seeds.length - i
}));

export const GOVERNORATES = ["بغداد", "البصرة", "نينوى", "أربيل", "النجف", "كربلاء", "بابل", "الأنبار", "ديالى", "كركوك", "صلاح الدين", "واسط", "ذي قار", "ميسان", "المثنى", "الديوانية", "السليمانية", "دهوك"];
export const SHIPPING = { baghdad: 5000, other: 8000, freeOver: 150000 };
export const shippingFor = (governorate: string, subtotal: number) =>
  subtotal >= SHIPPING.freeOver || subtotal === 0 ? 0 : governorate === "بغداد" ? SHIPPING.baghdad : SHIPPING.other;
