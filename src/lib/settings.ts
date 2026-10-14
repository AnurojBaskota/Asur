// Store settings: shape + defaults. Client-safe (no server imports).
// Each top-level key is stored as one JSON row in the `Setting` table and
// edited in Admin → Store settings. Anything not saved falls back to these defaults.

export const DEFAULT_SETTINGS = {
  shipping: {
    freeThreshold: 5000,
    flatFee: 150,
    deliveryDays: "3–5 business days",
    returnDays: 7,
    returnConditions: "Unworn items with tags attached",
    codEnabled: true,
  },
  announcements: [
    "Free shipping across Nepal on orders above Rs. 5,000",
    "7-day easy returns",
    "Foundation Drop 01 — out now",
    "Born in Nepal",
  ],
  hero: {
    eyebrow: "Drop 01 — Foundation Collection",
    sideNote: "Collection 2026",
    sideNoteSub: "Born in Nepal",
    titleLine1: "Built for",
    titleLine2: "the",
    outlineWord: "grind",
    subtitle: "Heavyweight oversized tees and raw-cut sleeveless, cut for the way you actually train. No excess. No compromise.",
    image: "https://images.unsplash.com/photo-1549505415-e16dbd446231?w=2400&q=80&auto=format&fit=crop",
    primaryLabel: "Shop the drop",
    primaryHref: "/shop",
    secondaryLabel: "New in",
    secondaryHref: "/shop?filter=new",
  },
  values: ["Strength", "Discipline", "Identity", "Precision"],
  campaign: {
    enabled: true,
    eyebrow: "The ASUR philosophy",
    title: "Discipline is the",
    outlineWord: "foundation.",
    body: "Every piece is designed with purpose. Heavier fabric that holds its shape, armholes cut for full range, collars that don't give up after ten washes. We build apparel that matches the intensity of your training.",
    image: "https://images.unsplash.com/photo-1770616756218-f0abe20da404?w=2000&q=80&auto=format&fit=crop",
    caption: "Campaign — Discipline, 2026",
    ctaLabel: "Explore the collection",
    ctaHref: "/shop",
  },
  craft: {
    enabled: true,
    eyebrow: "Construction",
    title: "Built different",
    body: "Fashion details, athletic engineering. Every ASUR piece is cut for movement first and style a close second.",
    specs: [
      { value: "280", unit: "GSM", title: "Heavyweight cotton", text: "Dense combed cotton that drapes with structure and holds its shape set after set." },
      { value: "01", unit: "", title: "Dropped shoulder", text: "An oversized block with a lowered shoulder seam for a relaxed, boxy silhouette." },
      { value: "02", unit: "", title: "Raw-cut armholes", text: "Sleeveless cut deep and low so nothing restricts your shoulders on pressing days." },
      { value: "03", unit: "", title: "Ribbed collars", text: "Thick ribbed necklines designed to keep their shape wash after wash." },
    ],
  },
  story: {
    enabled: true,
    eyebrow: "Our story",
    title: "Born beneath the Himalaya",
    paragraphs: [
      "ASUR takes its name from the asuras of Nepali and South Asian mythology — raw, untamed power that exists before discipline shapes it into strength.",
      "Born in Nepal with international ambition, we make apparel for athletes who know real strength comes from consistency, not shortcuts. Every thread, every cut is intentional — like the training that shapes you.",
    ],
    values: ["Strength", "Discipline", "Identity"],
    image: "https://images.unsplash.com/photo-1692452376160-14194abefba8?w=2400&q=80&auto=format&fit=crop",
  },
  newsletter: {
    enabled: true,
    eyebrow: "The ASUR Club",
    title: "First access. Every drop.",
    body: "Members hear about new drops, restocks and training events before anyone else.",
  },
  brand: {
    name: "ASUR",
    footerText: "Premium gym apparel. Strength meets discipline. Born in Nepal, built for athletes everywhere.",
    contactEmail: "",
    contactPhone: "",
    instagram: "",
    tiktok: "",
    facebook: "",
  },
};

export type StoreSettings = typeof DEFAULT_SETTINGS;
export type SettingsKey = keyof StoreSettings;
export const SETTINGS_KEYS = Object.keys(DEFAULT_SETTINGS) as SettingsKey[];

const MAX_STRING = 2000;
const MAX_ARRAY = 24;

/**
 * Coerce untrusted input into the shape of `template`: strings are trimmed and
 * length-capped, numbers become non-negative integers, booleans stay booleans,
 * arrays follow the shape of their first default element, unknown keys are dropped.
 */
export function sanitizeLike<T>(template: T, input: unknown): T {
  if (Array.isArray(template)) {
    if (!Array.isArray(input)) return template;
    const item = template[0];
    return input.slice(0, MAX_ARRAY).map((v) => sanitizeLike(item, v)) as T;
  }
  if (typeof template === "string") {
    return (typeof input === "string" ? input.trim().slice(0, MAX_STRING) : template) as T;
  }
  if (typeof template === "number") {
    const n = typeof input === "number" ? input : Number(input);
    return (Number.isFinite(n) && n >= 0 ? Math.round(n) : template) as T;
  }
  if (typeof template === "boolean") {
    return (typeof input === "boolean" ? input : template) as T;
  }
  if (template && typeof template === "object") {
    const src = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(template)) out[k] = k in src ? sanitizeLike(v, src[k]) : v;
    return out as T;
  }
  return template;
}

export type SizeChart = { columns: string[]; rows: string[][]; note: string };

export function parseSizeChart(raw: string | null | undefined): SizeChart | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw);
    if (!Array.isArray(v?.columns) || !Array.isArray(v?.rows) || !v.columns.length || !v.rows.length) return null;
    return { columns: v.columns.map(String), rows: v.rows.map((r: unknown[]) => r.map(String)), note: String(v.note ?? "") };
  } catch {
    return null;
  }
}

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "ready_for_dispatch",
  "dispatched",
  "delivered",
  "cancelled",
  "returned",
] as const;
export type OrderStatusValue = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABEL: Record<OrderStatusValue, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  ready_for_dispatch: "Ready for dispatch",
  dispatched: "Dispatched",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
};

/** Allowed next states. Packing happens on the dispatch scanner (processing → ready). */
export const ORDER_TRANSITIONS: Record<OrderStatusValue, OrderStatusValue[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["ready_for_dispatch", "cancelled"],
  ready_for_dispatch: ["dispatched", "cancelled"],
  dispatched: ["delivered", "returned"],
  delivered: ["returned"],
  cancelled: [],
  returned: [],
};

export const formatOrderNumber = (n: number) => `AS-${n}`;

export function shippingFor(subtotal: number, s: StoreSettings["shipping"]) {
  return subtotal >= s.freeThreshold ? 0 : s.flatFee;
}
