import { Product, Order, DashboardMetrics, Customer } from "@/types";

// ===================================
// ASUR Product Catalog
// ===================================

export const products: Product[] = [
  {
    id: "prod_001",
    name: "ASUR Heavy Oversized Tee",
    slug: "asur-heavy-oversized-tee",
    description:
      "280GSM heavyweight cotton tee with a dropped shoulder and relaxed fit. Built for those who train hard and dress with intention. The fabric weight gives structure without sacrificing comfort.",
    category: "oversized-tees",
    collection: "Foundation",
    material: "100% Premium Cotton, 280GSM",
    careInstructions: "Machine wash cold. Tumble dry low. Do not bleach.",
    fit: "Oversized",
    weight: "320g",
    gender: "Men",
    tags: ["bestseller", "new"],
    featured: true,
    isNew: true,
    status: "active",
    createdAt: "2026-07-01T00:00:00Z",
    updatedAt: "2026-08-20T00:00:00Z",
    images: [
      { id: "img_001", url: "/images/products/heavy-tee-black-1.jpg", alt: "ASUR Heavy Oversized Tee - Black Front", position: 1, isDefault: true },
      { id: "img_002", url: "/images/products/heavy-tee-black-2.jpg", alt: "ASUR Heavy Oversized Tee - Black Back", position: 2, isDefault: false },
      { id: "img_003", url: "/images/products/heavy-tee-black-3.jpg", alt: "ASUR Heavy Oversized Tee - Black Detail", position: 3, isDefault: false },
    ],
    variants: [
      { id: "var_001", productId: "prod_001", sku: "ASUR-HOT-BLK-S", barcode: "8901234001001", size: "S", color: { name: "Black", hex: "#0A0A0A" }, price: 2490, salePrice: undefined, costPrice: 890, stockQuantity: 45, lowStockThreshold: 10, status: "in_stock" },
      { id: "var_002", productId: "prod_001", sku: "ASUR-HOT-BLK-M", barcode: "8901234001002", size: "M", color: { name: "Black", hex: "#0A0A0A" }, price: 2490, salePrice: undefined, costPrice: 890, stockQuantity: 62, lowStockThreshold: 10, status: "in_stock" },
      { id: "var_003", productId: "prod_001", sku: "ASUR-HOT-BLK-L", barcode: "8901234001003", size: "L", color: { name: "Black", hex: "#0A0A0A" }, price: 2490, salePrice: undefined, costPrice: 890, stockQuantity: 38, lowStockThreshold: 10, status: "in_stock" },
      { id: "var_004", productId: "prod_001", sku: "ASUR-HOT-BLK-XL", barcode: "8901234001004", size: "XL", color: { name: "Black", hex: "#0A0A0A" }, price: 2490, salePrice: undefined, costPrice: 890, stockQuantity: 25, lowStockThreshold: 10, status: "in_stock" },
      { id: "var_005", productId: "prod_001", sku: "ASUR-HOT-GRY-S", barcode: "8901234001005", size: "S", color: { name: "Graphite", hex: "#2A2A2A" }, price: 2490, salePrice: undefined, costPrice: 890, stockQuantity: 30, lowStockThreshold: 10, status: "in_stock" },
      { id: "var_006", productId: "prod_001", sku: "ASUR-HOT-GRY-M", barcode: "8901234001006", size: "M", color: { name: "Graphite", hex: "#2A2A2A" }, price: 2490, salePrice: undefined, costPrice: 890, stockQuantity: 42, lowStockThreshold: 10, status: "in_stock" },
      { id: "var_007", productId: "prod_001", sku: "ASUR-HOT-GRY-L", barcode: "8901234001007", size: "L", color: { name: "Graphite", hex: "#2A2A2A" }, price: 2490, salePrice: undefined, costPrice: 890, stockQuantity: 8, lowStockThreshold: 10, status: "low_stock" },
      { id: "var_008", productId: "prod_001", sku: "ASUR-HOT-CRM-M", barcode: "8901234001008", size: "M", color: { name: "Bone", hex: "#E8E5E0" }, price: 2490, salePrice: undefined, costPrice: 890, stockQuantity: 28, lowStockThreshold: 10, status: "in_stock" },
      { id: "var_009", productId: "prod_001", sku: "ASUR-HOT-CRM-L", barcode: "8901234001009", size: "L", color: { name: "Bone", hex: "#E8E5E0" }, price: 2490, salePrice: undefined, costPrice: 890, stockQuantity: 35, lowStockThreshold: 10, status: "in_stock" },
    ],
  },
  {
    id: "prod_002",
    name: "ASUR Compression Tee",
    slug: "asur-compression-tee",
    description:
      "Second-skin compression fit engineered for peak performance. Four-way stretch fabric with moisture-wicking technology. Designed to support muscle movement during heavy lifts.",
    category: "compression",
    collection: "Performance",
    material: "85% Nylon, 15% Spandex",
    careInstructions: "Machine wash cold. Hang dry. Do not iron.",
    fit: "Compression",
    weight: "180g",
    gender: "Men",
    tags: ["performance", "bestseller"],
    featured: true,
    isNew: false,
    status: "active",
    createdAt: "2026-05-15T00:00:00Z",
    updatedAt: "2026-08-18T00:00:00Z",
    images: [
      { id: "img_004", url: "/images/products/compression-tee-black-1.jpg", alt: "ASUR Compression Tee - Black Front", position: 1, isDefault: true },
      { id: "img_005", url: "/images/products/compression-tee-black-2.jpg", alt: "ASUR Compression Tee - Black Side", position: 2, isDefault: false },
    ],
    variants: [
      { id: "var_010", productId: "prod_002", sku: "ASUR-CT-BLK-S", barcode: "8901234002001", size: "S", color: { name: "Black", hex: "#0A0A0A" }, price: 2990, salePrice: undefined, costPrice: 1100, stockQuantity: 55, lowStockThreshold: 10, status: "in_stock" },
      { id: "var_011", productId: "prod_002", sku: "ASUR-CT-BLK-M", barcode: "8901234002002", size: "M", color: { name: "Black", hex: "#0A0A0A" }, price: 2990, salePrice: undefined, costPrice: 1100, stockQuantity: 48, lowStockThreshold: 10, status: "in_stock" },
      { id: "var_012", productId: "prod_002", sku: "ASUR-CT-BLK-L", barcode: "8901234002003", size: "L", color: { name: "Black", hex: "#0A0A0A" }, price: 2990, salePrice: undefined, costPrice: 1100, stockQuantity: 33, lowStockThreshold: 10, status: "in_stock" },
      { id: "var_013", productId: "prod_002", sku: "ASUR-CT-BLK-XL", barcode: "8901234002004", size: "XL", color: { name: "Black", hex: "#0A0A0A" }, price: 2990, salePrice: undefined, costPrice: 1100, stockQuantity: 20, lowStockThreshold: 10, status: "in_stock" },
      { id: "var_014", productId: "prod_002", sku: "ASUR-CT-NVY-M", barcode: "8901234002005", size: "M", color: { name: "Navy", hex: "#1a1a2e" }, price: 2990, salePrice: undefined, costPrice: 1100, stockQuantity: 38, lowStockThreshold: 10, status: "in_stock" },
      { id: "var_015", productId: "prod_002", sku: "ASUR-CT-NVY-L", barcode: "8901234002006", size: "L", color: { name: "Navy", hex: "#1a1a2e" }, price: 2990, salePrice: undefined, costPrice: 1100, stockQuantity: 5, lowStockThreshold: 10, status: "low_stock" },
    ],
  },
  {
    id: "prod_003",
    name: "ASUR Training Shorts",
    slug: "asur-training-shorts",
    description:
      "Engineered 5-inch inseam shorts with a tapered cut. Zippered pockets, internal drawcord, and breathable mesh lining. Built for leg day and everything after.",
    category: "shorts",
    collection: "Foundation",
    material: "92% Polyester, 8% Elastane",
    careInstructions: "Machine wash cold. Tumble dry low.",
    fit: "Regular",
    weight: "200g",
    gender: "Men",
    tags: ["essential"],
    featured: true,
    isNew: false,
    status: "active",
    createdAt: "2026-04-10T00:00:00Z",
    updatedAt: "2026-08-15T00:00:00Z",
    images: [
      { id: "img_006", url: "/images/products/training-shorts-grey-1.jpg", alt: "ASUR Training Shorts - Grey Front", position: 1, isDefault: true },
      { id: "img_007", url: "/images/products/training-shorts-grey-2.jpg", alt: "ASUR Training Shorts - Grey Detail", position: 2, isDefault: false },
    ],
    variants: [
      { id: "var_016", productId: "prod_003", sku: "ASUR-TS-GRY-S", barcode: "8901234003001", size: "S", color: { name: "Grey", hex: "#6B6B6B" }, price: 2290, salePrice: undefined, costPrice: 780, stockQuantity: 40, lowStockThreshold: 10, status: "in_stock" },
      { id: "var_017", productId: "prod_003", sku: "ASUR-TS-GRY-M", barcode: "8901234003002", size: "M", color: { name: "Grey", hex: "#6B6B6B" }, price: 2290, salePrice: undefined, costPrice: 780, stockQuantity: 55, lowStockThreshold: 10, status: "in_stock" },
      { id: "var_018", productId: "prod_003", sku: "ASUR-TS-GRY-L", barcode: "8901234003003", size: "L", color: { name: "Grey", hex: "#6B6B6B" }, price: 2290, salePrice: undefined, costPrice: 780, stockQuantity: 42, lowStockThreshold: 10, status: "in_stock" },
      { id: "var_019", productId: "prod_003", sku: "ASUR-TS-BLK-M", barcode: "8901234003004", size: "M", color: { name: "Black", hex: "#0A0A0A" }, price: 2290, salePrice: undefined, costPrice: 780, stockQuantity: 60, lowStockThreshold: 10, status: "in_stock" },
      { id: "var_020", productId: "prod_003", sku: "ASUR-TS-BLK-L", barcode: "8901234003005", size: "L", color: { name: "Black", hex: "#0A0A0A" }, price: 2290, salePrice: undefined, costPrice: 780, stockQuantity: 3, lowStockThreshold: 10, status: "low_stock" },
    ],
  },
  {
    id: "prod_004",
    name: "ASUR Apex Hoodie",
    slug: "asur-apex-hoodie",
    description:
      "380GSM French terry hoodie with kangaroo pocket and minimal ASUR branding. Heavy enough to feel substantial, soft enough for all-day wear. The hood is structured, not floppy.",
    category: "hoodies",
    collection: "Foundation",
    material: "80% Cotton, 20% Polyester, 380GSM French Terry",
    careInstructions: "Machine wash cold inside out. Tumble dry low.",
    fit: "Regular",
    weight: "650g",
    gender: "Unisex",
    tags: ["bestseller", "winter"],
    featured: true,
    isNew: false,
    status: "active",
    createdAt: "2026-03-20T00:00:00Z",
    updatedAt: "2026-08-10T00:00:00Z",
    images: [
      { id: "img_008", url: "/images/products/apex-hoodie-black-1.jpg", alt: "ASUR Apex Hoodie - Black Front", position: 1, isDefault: true },
      { id: "img_009", url: "/images/products/apex-hoodie-black-2.jpg", alt: "ASUR Apex Hoodie - Black Detail", position: 2, isDefault: false },
    ],
    variants: [
      { id: "var_021", productId: "prod_004", sku: "ASUR-AH-BLK-S", barcode: "8901234004001", size: "S", color: { name: "Black", hex: "#0A0A0A" }, price: 4490, salePrice: undefined, costPrice: 1600, stockQuantity: 22, lowStockThreshold: 8, status: "in_stock" },
      { id: "var_022", productId: "prod_004", sku: "ASUR-AH-BLK-M", barcode: "8901234004002", size: "M", color: { name: "Black", hex: "#0A0A0A" }, price: 4490, salePrice: undefined, costPrice: 1600, stockQuantity: 35, lowStockThreshold: 8, status: "in_stock" },
      { id: "var_023", productId: "prod_004", sku: "ASUR-AH-BLK-L", barcode: "8901234004003", size: "L", color: { name: "Black", hex: "#0A0A0A" }, price: 4490, salePrice: undefined, costPrice: 1600, stockQuantity: 28, lowStockThreshold: 8, status: "in_stock" },
      { id: "var_024", productId: "prod_004", sku: "ASUR-AH-BLK-XL", barcode: "8901234004004", size: "XL", color: { name: "Black", hex: "#0A0A0A" }, price: 4490, salePrice: undefined, costPrice: 1600, stockQuantity: 15, lowStockThreshold: 8, status: "in_stock" },
      { id: "var_025", productId: "prod_004", sku: "ASUR-AH-CHR-M", barcode: "8901234004005", size: "M", color: { name: "Charcoal", hex: "#2A2A2A" }, price: 4490, salePrice: undefined, costPrice: 1600, stockQuantity: 18, lowStockThreshold: 8, status: "in_stock" },
      { id: "var_026", productId: "prod_004", sku: "ASUR-AH-CHR-L", barcode: "8901234004006", size: "L", color: { name: "Charcoal", hex: "#2A2A2A" }, price: 4490, salePrice: undefined, costPrice: 1600, stockQuantity: 6, lowStockThreshold: 8, status: "low_stock" },
    ],
  },
  {
    id: "prod_005",
    name: "ASUR Tapered Joggers",
    slug: "asur-tapered-joggers",
    description:
      "Slim tapered joggers with a structured waistband and zippered ankle cuffs. The taper is aggressive enough to show quad development without being restrictive.",
    category: "joggers",
    collection: "Foundation",
    material: "70% Cotton, 25% Polyester, 5% Elastane",
    careInstructions: "Machine wash cold. Hang dry recommended.",
    fit: "Slim",
    weight: "420g",
    gender: "Men",
    tags: ["essential"],
    featured: false,
    isNew: true,
    status: "active",
    createdAt: "2026-07-15T00:00:00Z",
    updatedAt: "2026-08-22T00:00:00Z",
    images: [
      { id: "img_010", url: "/images/products/joggers-black-1.jpg", alt: "ASUR Tapered Joggers - Black Front", position: 1, isDefault: true },
      { id: "img_011", url: "/images/products/joggers-black-2.jpg", alt: "ASUR Tapered Joggers - Black Side", position: 2, isDefault: false },
    ],
    variants: [
      { id: "var_027", productId: "prod_005", sku: "ASUR-TJ-BLK-S", barcode: "8901234005001", size: "S", color: { name: "Black", hex: "#0A0A0A" }, price: 3490, salePrice: 2990, costPrice: 1200, stockQuantity: 30, lowStockThreshold: 10, status: "in_stock" },
      { id: "var_028", productId: "prod_005", sku: "ASUR-TJ-BLK-M", barcode: "8901234005002", size: "M", color: { name: "Black", hex: "#0A0A0A" }, price: 3490, salePrice: 2990, costPrice: 1200, stockQuantity: 45, lowStockThreshold: 10, status: "in_stock" },
      { id: "var_029", productId: "prod_005", sku: "ASUR-TJ-BLK-L", barcode: "8901234005003", size: "L", color: { name: "Black", hex: "#0A0A0A" }, price: 3490, salePrice: 2990, costPrice: 1200, stockQuantity: 38, lowStockThreshold: 10, status: "in_stock" },
      { id: "var_030", productId: "prod_005", sku: "ASUR-TJ-BLK-XL", barcode: "8901234005004", size: "XL", color: { name: "Black", hex: "#0A0A0A" }, price: 3490, salePrice: 2990, costPrice: 1200, stockQuantity: 22, lowStockThreshold: 10, status: "in_stock" },
      { id: "var_031", productId: "prod_005", sku: "ASUR-TJ-GRY-M", barcode: "8901234005005", size: "M", color: { name: "Grey", hex: "#6B6B6B" }, price: 3490, salePrice: 2990, costPrice: 1200, stockQuantity: 28, lowStockThreshold: 10, status: "in_stock" },
      { id: "var_032", productId: "prod_005", sku: "ASUR-TJ-GRY-L", barcode: "8901234005006", size: "L", color: { name: "Grey", hex: "#6B6B6B" }, price: 3490, salePrice: 2990, costPrice: 1200, stockQuantity: 7, lowStockThreshold: 10, status: "low_stock" },
    ],
  },
  {
    id: "prod_006",
    name: "ASUR Seamless Sports Bra",
    slug: "asur-seamless-sports-bra",
    description:
      "Medium-impact seamless sports bra with removable padding. Ribbed texture detail with clean minimal branding. Designed for training sessions that demand support without restriction.",
    category: "compression",
    collection: "Women's Performance",
    material: "75% Nylon, 25% Spandex",
    careInstructions: "Hand wash cold. Lay flat to dry.",
    fit: "Compression",
    weight: "120g",
    gender: "Women",
    tags: ["women", "new"],
    featured: true,
    isNew: true,
    status: "active",
    createdAt: "2026-07-20T00:00:00Z",
    updatedAt: "2026-08-23T00:00:00Z",
    images: [
      { id: "img_012", url: "/images/products/sports-bra-black-1.jpg", alt: "ASUR Seamless Sports Bra - Black Front", position: 1, isDefault: true },
      { id: "img_013", url: "/images/products/sports-bra-black-2.jpg", alt: "ASUR Seamless Sports Bra - Black Back", position: 2, isDefault: false },
    ],
    variants: [
      { id: "var_033", productId: "prod_006", sku: "ASUR-SB-BLK-XS", barcode: "8901234006001", size: "XS", color: { name: "Black", hex: "#0A0A0A" }, price: 1990, salePrice: undefined, costPrice: 650, stockQuantity: 35, lowStockThreshold: 10, status: "in_stock" },
      { id: "var_034", productId: "prod_006", sku: "ASUR-SB-BLK-S", barcode: "8901234006002", size: "S", color: { name: "Black", hex: "#0A0A0A" }, price: 1990, salePrice: undefined, costPrice: 650, stockQuantity: 42, lowStockThreshold: 10, status: "in_stock" },
      { id: "var_035", productId: "prod_006", sku: "ASUR-SB-BLK-M", barcode: "8901234006003", size: "M", color: { name: "Black", hex: "#0A0A0A" }, price: 1990, salePrice: undefined, costPrice: 650, stockQuantity: 50, lowStockThreshold: 10, status: "in_stock" },
      { id: "var_036", productId: "prod_006", sku: "ASUR-SB-BLK-L", barcode: "8901234006004", size: "L", color: { name: "Black", hex: "#0A0A0A" }, price: 1990, salePrice: undefined, costPrice: 650, stockQuantity: 28, lowStockThreshold: 10, status: "in_stock" },
      { id: "var_037", productId: "prod_006", sku: "ASUR-SB-OLV-S", barcode: "8901234006005", size: "S", color: { name: "Olive", hex: "#4A5238" }, price: 1990, salePrice: undefined, costPrice: 650, stockQuantity: 20, lowStockThreshold: 10, status: "in_stock" },
      { id: "var_038", productId: "prod_006", sku: "ASUR-SB-OLV-M", barcode: "8901234006006", size: "M", color: { name: "Olive", hex: "#4A5238" }, price: 1990, salePrice: undefined, costPrice: 650, stockQuantity: 15, lowStockThreshold: 10, status: "in_stock" },
    ],
  },
];

// ===================================
// Sample Orders
// ===================================

export const orders: Order[] = [
  {
    id: "ord_001",
    orderNumber: "AS10294",
    customer: {
      id: "cust_001",
      firstName: "Aarav",
      lastName: "Sharma",
      email: "aarav@example.com",
      phone: "+977-9841234567",
      totalOrders: 5,
      totalSpent: 18450,
      createdAt: "2026-03-15T00:00:00Z",
    },
    items: [
      {
        id: "oi_001",
        productId: "prod_001",
        variantId: "var_003",
        productName: "ASUR Heavy Oversized Tee",
        variantSku: "ASUR-HOT-BLK-L",
        variantBarcode: "8901234001003",
        size: "L",
        color: { name: "Black", hex: "#0A0A0A" },
        quantity: 1,
        price: 2490,
        total: 2490,
        image: "/images/products/heavy-tee-black-1.jpg",
        scanned: false,
      },
      {
        id: "oi_002",
        productId: "prod_003",
        variantId: "var_017",
        productName: "ASUR Training Shorts",
        variantSku: "ASUR-TS-GRY-M",
        variantBarcode: "8901234003002",
        size: "M",
        color: { name: "Grey", hex: "#6B6B6B" },
        quantity: 1,
        price: 2290,
        total: 2290,
        image: "/images/products/training-shorts-grey-1.jpg",
        scanned: false,
      },
    ],
    subtotal: 4780,
    shippingCost: 150,
    tax: 0,
    discount: 0,
    total: 4930,
    status: "processing",
    paymentStatus: "paid",
    shippingAddress: {
      firstName: "Aarav",
      lastName: "Sharma",
      street: "Durbar Marg",
      apartment: "Block 4, Apt 12",
      city: "Kathmandu",
      state: "Bagmati",
      postalCode: "44600",
      country: "Nepal",
      phone: "+977-9841234567",
    },
    billingAddress: {
      firstName: "Aarav",
      lastName: "Sharma",
      street: "Durbar Marg",
      apartment: "Block 4, Apt 12",
      city: "Kathmandu",
      state: "Bagmati",
      postalCode: "44600",
      country: "Nepal",
      phone: "+977-9841234567",
    },
    createdAt: "2026-08-24T14:30:00Z",
    updatedAt: "2026-08-24T14:30:00Z",
  },
  {
    id: "ord_002",
    orderNumber: "AS10295",
    customer: {
      id: "cust_002",
      firstName: "Priya",
      lastName: "Thapa",
      email: "priya.thapa@example.com",
      phone: "+977-9851234567",
      totalOrders: 2,
      totalSpent: 8970,
      createdAt: "2026-06-20T00:00:00Z",
    },
    items: [
      {
        id: "oi_003",
        productId: "prod_006",
        variantId: "var_035",
        productName: "ASUR Seamless Sports Bra",
        variantSku: "ASUR-SB-BLK-M",
        variantBarcode: "8901234006003",
        size: "M",
        color: { name: "Black", hex: "#0A0A0A" },
        quantity: 2,
        price: 1990,
        total: 3980,
        image: "/images/products/sports-bra-black-1.jpg",
        scanned: false,
      },
      {
        id: "oi_004",
        productId: "prod_005",
        variantId: "var_028",
        productName: "ASUR Tapered Joggers",
        variantSku: "ASUR-TJ-BLK-M",
        variantBarcode: "8901234005002",
        size: "M",
        color: { name: "Black", hex: "#0A0A0A" },
        quantity: 1,
        price: 2990,
        total: 2990,
        image: "/images/products/joggers-black-1.jpg",
        scanned: false,
      },
    ],
    subtotal: 6970,
    shippingCost: 0,
    tax: 0,
    discount: 500,
    total: 6470,
    status: "pending",
    paymentStatus: "paid",
    shippingAddress: {
      firstName: "Priya",
      lastName: "Thapa",
      street: "Jhamsikhel",
      city: "Lalitpur",
      state: "Bagmati",
      postalCode: "44700",
      country: "Nepal",
      phone: "+977-9851234567",
    },
    billingAddress: {
      firstName: "Priya",
      lastName: "Thapa",
      street: "Jhamsikhel",
      city: "Lalitpur",
      state: "Bagmati",
      postalCode: "44700",
      country: "Nepal",
      phone: "+977-9851234567",
    },
    createdAt: "2026-08-25T09:15:00Z",
    updatedAt: "2026-08-25T09:15:00Z",
  },
  {
    id: "ord_003",
    orderNumber: "AS10296",
    customer: {
      id: "cust_003",
      firstName: "Bikram",
      lastName: "Rai",
      email: "bikram.rai@example.com",
      phone: "+977-9861234567",
      totalOrders: 8,
      totalSpent: 32400,
      createdAt: "2026-01-10T00:00:00Z",
    },
    items: [
      {
        id: "oi_005",
        productId: "prod_004",
        variantId: "var_023",
        productName: "ASUR Apex Hoodie",
        variantSku: "ASUR-AH-BLK-L",
        variantBarcode: "8901234004003",
        size: "L",
        color: { name: "Black", hex: "#0A0A0A" },
        quantity: 1,
        price: 4490,
        total: 4490,
        image: "/images/products/apex-hoodie-black-1.jpg",
        scanned: false,
      },
    ],
    subtotal: 4490,
    shippingCost: 150,
    tax: 0,
    discount: 0,
    total: 4640,
    status: "ready_for_dispatch",
    paymentStatus: "paid",
    shippingAddress: {
      firstName: "Bikram",
      lastName: "Rai",
      street: "New Baneshwor",
      apartment: "House 56",
      city: "Kathmandu",
      state: "Bagmati",
      postalCode: "44600",
      country: "Nepal",
      phone: "+977-9861234567",
    },
    billingAddress: {
      firstName: "Bikram",
      lastName: "Rai",
      street: "New Baneshwor",
      apartment: "House 56",
      city: "Kathmandu",
      state: "Bagmati",
      postalCode: "44600",
      country: "Nepal",
      phone: "+977-9861234567",
    },
    dispatchVerification: {
      orderId: "ord_003",
      items: [
        {
          orderItemId: "oi_005",
          variantBarcode: "8901234004003",
          requiredQuantity: 1,
          scannedQuantity: 1,
          verified: true,
          scannedAt: "2026-08-25T10:30:00Z",
        },
      ],
      status: "verified",
      verifiedBy: "admin_001",
      verifiedAt: "2026-08-25T10:30:00Z",
    },
    createdAt: "2026-08-23T16:45:00Z",
    updatedAt: "2026-08-25T10:30:00Z",
  },
];

// ===================================
// Dashboard Metrics
// ===================================

export const dashboardMetrics: DashboardMetrics = {
  totalSales: 847500,
  todaysOrders: 12,
  pendingOrders: 8,
  readyForDispatch: 5,
  dispatchedOrders: 156,
  lowStockProducts: 4,
  inventoryValue: 2340000,
  revenueToday: 34680,
  revenueThisMonth: 847500,
  revenueChange: 12.5,
};

// ===================================
// Helper Functions
// ===================================

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function getProductsByCategory(category: string): Product[] {
  return products.filter((p) => p.category === category);
}

export function getFeaturedProducts(): Product[] {
  return products.filter((p) => p.featured);
}

export function getNewArrivals(): Product[] {
  return products.filter((p) => p.isNew);
}

export function getOrderByNumber(orderNumber: string): Order | undefined {
  return orders.find((o) => o.orderNumber === orderNumber);
}

export function getVariantByBarcode(barcode: string) {
  for (const product of products) {
    const variant = product.variants.find((v) => v.barcode === barcode);
    if (variant) {
      return { product, variant };
    }
  }
  return null;
}

export { formatPrice } from "./format";

export function generateBarcode(): string {
  const prefix = "890123";
  const random = Math.floor(Math.random() * 9000000) + 1000000;
  return `${prefix}${random}`;
}
