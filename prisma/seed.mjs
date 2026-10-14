// Seeds the ASUR catalog: Oversized Tees + Sleeveless.
// Run with: npm run db:seed   (wipes catalog tables first)
import { PrismaClient } from "@prisma/client";

if (process.env.NODE_ENV === "production" && process.env.ALLOW_SEED !== "1") {
  console.error("Refusing to seed in production: it wipes the catalogue. Set ALLOW_SEED=1 to override.");
  process.exit(1);
}

const db = new PrismaClient();

const img = (id) =>
  `https://images.unsplash.com/photo-${id}?w=1400&q=80&auto=format&fit=crop`;

function ean13(seq) {
  const body = "20" + String(seq).padStart(10, "0");
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Number(body[i]) * (i % 2 === 0 ? 1 : 3);
  return body + ((10 - (sum % 10)) % 10);
}

const categories = [
  {
    name: "Oversized Tees",
    slug: "oversized-tees",
    description: "Heavyweight cotton, dropped shoulders, boxy cut. Built to hold shape set after set.",
    image: img("1741346075329-5e386cd8d463"),
    sortOrder: 0,
    sizeChart: JSON.stringify({
      columns: ["Size", "Chest (cm)", "Length (cm)", "Shoulder (cm)"],
      rows: [
        ["S", "104", "72", "50"],
        ["M", "110", "74", "52"],
        ["L", "116", "76", "54"],
        ["XL", "122", "78", "56"],
        ["XXL", "128", "80", "58"],
      ],
      note: "Garment measurements in centimetres, measured flat. Compare against a tee you already own.",
    }),
  },
  {
    name: "Sleeveless",
    slug: "sleeveless",
    description: "Deep armholes and raw edges for full range of motion on the heaviest days.",
    image: img("1611672585731-fa10603fb9e0"),
    sortOrder: 1,
  },
];

const products = [
  {
    category: "oversized-tees",
    name: "ASUR Heavy Oversized Tee",
    description:
      "Our signature 280GSM heavyweight tee. Dropped shoulder, relaxed body and a thick ribbed collar that never bacons. Built for those who train hard and dress with intention.",
    material: "100% combed cotton, 280GSM",
    careInstructions: "Machine wash cold, inside out. Tumble dry low.",
    fit: "Oversized",
    weight: "320g",
    gender: "Men",
    collection: "Foundation",
    tags: "bestseller,heavyweight",
    featured: true,
    isNew: true,
    images: ["1778759335271-91d85dacaf96", "1693501315338-f2bf831da60a"],
    colors: [["Black", "#0A0A0A"], ["Bone", "#E8E5E0"]],
    sizes: ["S", "M", "L", "XL", "XXL"],
    price: 2490,
    cost: 890,
  },
  {
    category: "oversized-tees",
    name: "ASUR Foundation Boxy Tee",
    description:
      "A cropped, boxy silhouette in mid-weight jersey. Sits clean over the waistband for lifting and off-duty days alike.",
    material: "100% cotton, 240GSM",
    careInstructions: "Machine wash cold. Do not bleach.",
    fit: "Oversized",
    weight: "280g",
    gender: "Unisex",
    collection: "Foundation",
    tags: "essential",
    featured: true,
    isNew: false,
    images: ["1615903040611-e599dfaa6752", "1741346075329-5e386cd8d463"],
    colors: [["Black", "#0A0A0A"], ["Graphite", "#2A2A2A"]],
    sizes: ["S", "M", "L", "XL"],
    price: 2290,
    cost: 820,
  },
  {
    category: "oversized-tees",
    name: "ASUR Washed Oversized Tee",
    description:
      "Garment-dyed and enzyme-washed for a lived-in, faded black. Every piece wears in a little differently.",
    material: "100% cotton, 260GSM, garment dyed",
    careInstructions: "Wash with like colours. Colour may vary slightly.",
    fit: "Oversized",
    weight: "300g",
    gender: "Men",
    collection: "Washed",
    tags: "limited",
    featured: true,
    isNew: true,
    images: ["1726140872004-850c80900ae3", "1714249090984-cbc595b0f3b8"],
    colors: [["Washed Black", "#1F1F1F"]],
    sizes: ["M", "L", "XL"],
    price: 2690,
    salePrice: 2290,
    cost: 990,
  },
  {
    category: "sleeveless",
    name: "ASUR Raw-Cut Sleeveless",
    description:
      "Cut from our heavyweight jersey with raw, unfinished armholes dropped low for full shoulder mobility.",
    material: "100% cotton, 220GSM",
    careInstructions: "Machine wash cold. Raw edges will curl naturally.",
    fit: "Regular",
    weight: "190g",
    gender: "Men",
    collection: "Foundation",
    tags: "bestseller",
    featured: true,
    isNew: false,
    images: ["1611672585731-fa10603fb9e0"],
    colors: [["Black", "#0A0A0A"], ["Grey", "#6B6B6B"]],
    sizes: ["S", "M", "L", "XL"],
    price: 1890,
    cost: 620,
  },
  {
    category: "sleeveless",
    name: "ASUR Drop-Arm Tank",
    description:
      "A stringer-inspired tank with a deep drop arm and longer back hem. Breathable, light and made to move.",
    material: "60% cotton, 40% polyester, 180GSM",
    careInstructions: "Machine wash cold. Hang dry.",
    fit: "Regular",
    weight: "160g",
    gender: "Men",
    collection: "Training",
    tags: "new",
    featured: false,
    isNew: true,
    images: ["1614367674345-f414b2be3e5b"],
    colors: [["Black", "#0A0A0A"]],
    sizes: ["S", "M", "L", "XL", "XXL"],
    price: 1790,
    cost: 560,
  },
];

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const colorCode = { Black: "BLK", Bone: "BNE", Graphite: "GPH", Grey: "GRY", "Washed Black": "WBK" };
const prodCode = (name) =>
  name.replace(/^ASUR\s+/i, "").replace(/[^A-Za-z ]/g, " ").split(/\s+/).filter(Boolean).map((w) => w[0].toUpperCase()).join("").slice(0, 4);

async function main() {
  await db.stockMovement.deleteMany();
  await db.variant.deleteMany();
  await db.productImage.deleteMany();
  await db.product.deleteMany();
  await db.category.deleteMany();

  const catIds = {};
  for (const c of categories) catIds[c.slug] = (await db.category.create({ data: c })).id;

  let seq = 1;
  for (const p of products) {
    const { images, colors, sizes, price, salePrice, cost, category, ...rest } = p;
    const product = await db.product.create({
      data: {
        ...rest,
        slug: slug(p.name),
        status: "active",
        categoryId: catIds[category],
        images: {
          create: images.map((id, i) => ({ url: img(id), alt: `${p.name} — view ${i + 1}`, position: i })),
        },
      },
    });

    for (const [colorName, colorHex] of colors) {
      for (const size of sizes) {
        // Deterministic but varied stock, with a few low/out-of-stock variants.
        const stock = (seq * 37) % 61;
        const v = await db.variant.create({
          data: {
            productId: product.id,
            sku: `ASUR-${prodCode(p.name)}-${colorCode[colorName]}-${size}`,
            barcode: ean13(seq++),
            size,
            colorName,
            colorHex,
            price,
            salePrice: salePrice ?? null,
            costPrice: cost,
            stock,
            lowStockThreshold: 8,
          },
        });
        await db.stockMovement.create({
          data: { variantId: v.id, change: stock, balance: stock, type: "initial", note: "Opening stock" },
        });
      }
    }
  }

  // Starter content pages — only created if missing, never overwritten.
  const pages = [
    {
      slug: "shipping",
      title: "Shipping",
      sortOrder: 0,
      published: true,
      body: `We deliver across Nepal.

## Delivery fees
- Free standard shipping on orders above Rs. 5,000
- Rs. 150 on orders below Rs. 5,000

## Delivery time
Orders are delivered in 3–5 business days. Our rider will call the phone number on your order before delivery.

## Payment
Pay in cash when your order arrives.`,
    },
    {
      slug: "returns",
      title: "Returns & exchanges",
      sortOrder: 1,
      published: true,
      body: `Not the right fit? You can return or exchange within 7 days of delivery.

## Conditions
- Items must be unworn, unwashed and with tags attached
- Sale items can be exchanged for a different size

## How to start a return
Contact us with your order number and we'll arrange a pickup.`,
    },
    {
      slug: "contact",
      title: "Contact us",
      sortOrder: 2,
      published: true,
      body: `Questions about sizing, an order or a return? Get in touch and we'll get back to you within one business day.

Add your email, phone and social links in Admin → Store settings → Brand & contact.`,
    },
    {
      slug: "privacy",
      title: "Privacy policy",
      sortOrder: 3,
      published: false,
      body: `DRAFT — review with a legal advisor before publishing.

## What we collect
Your name, email, phone number and delivery address when you place an order.

## How we use it
Only to process and deliver your order and to contact you about it.`,
    },
    {
      slug: "terms",
      title: "Terms of service",
      sortOrder: 4,
      published: false,
      body: `DRAFT — review with a legal advisor before publishing.`,
    },
  ];
  for (const page of pages) {
    await db.page.upsert({ where: { slug: page.slug }, update: {}, create: page });
  }

  const [c, pr, v, pg] = await Promise.all([db.category.count(), db.product.count(), db.variant.count(), db.page.count()]);
  console.log(`Seeded ${c} categories, ${pr} products, ${v} variants, ${pg} pages.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
