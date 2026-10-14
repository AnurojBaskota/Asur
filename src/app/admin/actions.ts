"use server";

import { timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/server/db";
import { createSession, destroySession, requireAdmin } from "@/lib/server/session";
import { generateEan13, isValidEan13, slugify, SIZES } from "@/lib/barcode";
import {
  DEFAULT_SETTINGS,
  ORDER_STATUS_LABEL,
  ORDER_TRANSITIONS,
  SETTINGS_KEYS,
  formatOrderNumber,
  sanitizeLike,
  type OrderStatusValue,
  type SettingsKey,
  type SizeChart,
} from "@/lib/settings";

export type ActionResult<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

function fail(error: string): ActionResult<never> {
  return { ok: false, error };
}

function revalidateAll() {
  // Admin + storefront both read the catalog.
  revalidatePath("/", "layout");
}

function uniqueError(e: unknown): string | null {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
    const target = String((e.meta?.target as string[] | string | undefined) ?? "");
    if (target.includes("slug")) return "That slug is already in use.";
    if (target.includes("sku")) return "One of the SKUs is already used by another product.";
    if (target.includes("barcode")) return "One of the barcodes is already used by another product.";
    if (target.includes("size")) return "Two variants have the same size and colour.";
    return "A record with these values already exists.";
  }
  return null;
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export async function login(_prev: { error?: string } | undefined, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const expectedEmail = (process.env.ADMIN_EMAIL ?? "").toLowerCase();
  const expectedPassword = process.env.ADMIN_PASSWORD ?? "";

  if (!expectedEmail || !expectedPassword) {
    return { error: "Admin credentials are not configured (ADMIN_EMAIL / ADMIN_PASSWORD)." };
  }
  if (!safeEqual(email, expectedEmail) || !safeEqual(password, expectedPassword)) {
    return { error: "Invalid email or password." };
  }
  await createSession(email);
  redirect("/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export type CategoryInput = {
  id?: string;
  name: string;
  slug?: string;
  description?: string;
  image?: string;
  sortOrder?: number;
  sizeChart?: SizeChart | null;
};

function cleanSizeChart(chart: SizeChart | null | undefined): string | null {
  if (!chart) return null;
  const columns = (chart.columns ?? []).map((c) => String(c).trim().slice(0, 40)).filter(Boolean).slice(0, 8);
  if (!columns.length) return null;
  const rows = (chart.rows ?? [])
    .slice(0, 20)
    .map((r) => columns.map((_, i) => String(r?.[i] ?? "").trim().slice(0, 40)))
    .filter((r) => r.some(Boolean));
  if (!rows.length) return null;
  return JSON.stringify({ columns, rows, note: String(chart.note ?? "").trim().slice(0, 300) });
}

export async function saveCategory(input: CategoryInput): Promise<ActionResult> {
  await requireAdmin();
  const name = input.name?.trim();
  if (!name) return fail("Category name is required.");
  const slug = slugify(input.slug?.trim() || name);
  if (!slug) return fail("Slug must contain letters or numbers.");

  const data = {
    name,
    slug,
    description: input.description?.trim() || null,
    image: input.image?.trim() || null,
    sortOrder: Number.isFinite(input.sortOrder) ? Number(input.sortOrder) : 0,
    ...(input.sizeChart !== undefined ? { sizeChart: cleanSizeChart(input.sizeChart) } : {}),
  };

  try {
    if (input.id) await db.category.update({ where: { id: input.id }, data });
    else await db.category.create({ data });
  } catch (e) {
    return fail(uniqueError(e) ?? "Could not save category.");
  }
  revalidateAll();
  return { ok: true };
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  await requireAdmin();
  const count = await db.product.count({ where: { categoryId: id } });
  if (count > 0) {
    return fail(`This category still has ${count} product${count === 1 ? "" : "s"}. Move or delete them first.`);
  }
  await db.category.delete({ where: { id } });
  revalidateAll();
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

export type VariantInput = {
  id?: string;
  size: string;
  colorName: string;
  colorHex: string;
  price: number;
  salePrice: number | null;
  costPrice: number;
  stock: number;
  lowStockThreshold: number;
  sku: string;
  barcode: string;
};

export type ProductInput = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  collection: string;
  material: string;
  careInstructions: string;
  fit: string;
  weight: string;
  gender: string;
  tags: string;
  featured: boolean;
  isNew: boolean;
  status: "draft" | "active" | "archived";
  images: { url: string; alt: string }[];
  variants: VariantInput[];
};

const FITS = ["Slim", "Regular", "Oversized", "Compression"];
const GENDERS = ["Men", "Women", "Unisex"];
const STATUSES = ["draft", "active", "archived"];
const isInt = (n: unknown) => typeof n === "number" && Number.isInteger(n);

function validateProduct(input: ProductInput): string | null {
  if (!input.name?.trim()) return "Product name is required.";
  if (!slugify(input.slug || input.name)) return "Slug is required.";
  if (!input.categoryId) return "Choose a category.";
  if (!FITS.includes(input.fit)) return "Invalid fit.";
  if (!GENDERS.includes(input.gender)) return "Invalid gender.";
  if (!STATUSES.includes(input.status)) return "Invalid status.";
  if (input.status === "active" && input.images.length === 0) return "Add at least one image before publishing.";
  if (input.variants.length === 0) return "Add at least one variant (size + colour).";

  const combos = new Set<string>();
  const skus = new Set<string>();
  const barcodes = new Set<string>();
  for (const v of input.variants) {
    const label = `${v.colorName || "?"} / ${v.size}`;
    if (!(SIZES as readonly string[]).includes(v.size)) return `${label}: invalid size.`;
    if (!v.colorName.trim()) return `A ${v.size} variant is missing its colour name.`;
    if (!/^#[0-9a-fA-F]{6}$/.test(v.colorHex)) return `${label}: colour must be a hex value like #0A0A0A.`;
    if (!isInt(v.price) || v.price <= 0) return `${label}: price must be a whole number above 0.`;
    if (v.salePrice !== null && (!isInt(v.salePrice) || v.salePrice <= 0 || v.salePrice >= v.price))
      return `${label}: sale price must be lower than the regular price.`;
    if (!isInt(v.costPrice) || v.costPrice < 0) return `${label}: cost price must be 0 or more.`;
    if (!isInt(v.stock) || v.stock < 0) return `${label}: stock must be 0 or more.`;
    if (!isInt(v.lowStockThreshold) || v.lowStockThreshold < 0) return `${label}: low-stock alert must be 0 or more.`;
    if (!v.sku.trim()) return `${label}: SKU is required.`;
    if (!isValidEan13(v.barcode)) return `${label}: barcode ${v.barcode} is not a valid EAN-13.`;

    const combo = `${v.colorName.trim().toLowerCase()}|${v.size}`;
    if (combos.has(combo)) return `Duplicate variant: ${label}.`;
    if (skus.has(v.sku.trim())) return `Duplicate SKU: ${v.sku}.`;
    if (barcodes.has(v.barcode)) return `Duplicate barcode: ${v.barcode}.`;
    combos.add(combo);
    skus.add(v.sku.trim());
    barcodes.add(v.barcode);
  }
  return null;
}

export async function saveProduct(input: ProductInput): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();
  const error = validateProduct(input);
  if (error) return fail(error);

  const data = {
    name: input.name.trim(),
    slug: slugify(input.slug || input.name),
    description: input.description.trim(),
    categoryId: input.categoryId,
    collection: input.collection.trim() || null,
    material: input.material.trim(),
    careInstructions: input.careInstructions.trim(),
    fit: input.fit,
    weight: input.weight.trim() || null,
    gender: input.gender,
    tags: input.tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean).join(","),
    featured: input.featured,
    isNew: input.isNew,
    status: input.status,
  };

  const variantData = (v: VariantInput) => ({
    size: v.size,
    colorName: v.colorName.trim(),
    colorHex: v.colorHex.toUpperCase(),
    price: v.price,
    salePrice: v.salePrice,
    costPrice: v.costPrice,
    lowStockThreshold: v.lowStockThreshold,
    sku: v.sku.trim().toUpperCase(),
    barcode: v.barcode,
  });

  try {
    const id = await db.$transaction(async (tx) => {
      const product = input.id
        ? await tx.product.update({ where: { id: input.id }, data })
        : await tx.product.create({ data });

      // Images: replace the ordered list.
      await tx.productImage.deleteMany({ where: { productId: product.id } });
      if (input.images.length) {
        await tx.productImage.createMany({
          data: input.images.map((img, position) => ({
            productId: product.id,
            url: img.url,
            alt: img.alt.trim(),
            position,
          })),
        });
      }

      // Variants: delete removed ones, update existing, create new.
      const existing = await tx.variant.findMany({ where: { productId: product.id } });
      const keepIds = new Set(input.variants.filter((v) => v.id).map((v) => v.id));
      const removed = existing.filter((v) => !keepIds.has(v.id)).map((v) => v.id);
      if (removed.length) await tx.variant.deleteMany({ where: { id: { in: removed } } });

      // Free up SKU/barcodes first so swaps between variants don't collide.
      for (const v of input.variants.filter((v) => v.id)) {
        await tx.variant.update({ where: { id: v.id }, data: { sku: `__tmp_${v.id}`, barcode: `__tmp_${v.id}` } });
      }

      for (const v of input.variants) {
        const prev = v.id ? existing.find((e) => e.id === v.id) : undefined;
        if (v.id && !prev) throw new Error("Variant does not belong to this product.");
        if (prev) {
          await tx.variant.update({ where: { id: prev.id }, data: { ...variantData(v), stock: v.stock } });
          if (v.stock !== prev.stock) {
            await tx.stockMovement.create({
              data: {
                variantId: prev.id,
                change: v.stock - prev.stock,
                balance: v.stock,
                type: "correction",
                note: "Edited on product page",
              },
            });
          }
        } else {
          const created = await tx.variant.create({
            data: { ...variantData(v), productId: product.id, stock: v.stock },
          });
          await tx.stockMovement.create({
            data: { variantId: created.id, change: v.stock, balance: v.stock, type: "initial", note: "Opening stock" },
          });
        }
      }
      return product.id;
    });

    revalidateAll();
    return { ok: true, data: { id } };
  } catch (e) {
    return fail(uniqueError(e) ?? (e instanceof Error ? e.message : "Could not save product."));
  }
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  await requireAdmin();
  await db.product.delete({ where: { id } });
  revalidateAll();
  return { ok: true };
}

export async function setProductStatus(id: string, status: ProductInput["status"]): Promise<ActionResult> {
  await requireAdmin();
  if (!STATUSES.includes(status)) return fail("Invalid status.");
  if (status === "active") {
    const images = await db.productImage.count({ where: { productId: id } });
    if (!images) return fail("Add at least one image before publishing.");
  }
  await db.product.update({ where: { id }, data: { status } });
  revalidateAll();
  return { ok: true };
}

/** Returns a fresh EAN-13 that is not used by any variant. */
export async function newBarcode(): Promise<string> {
  await requireAdmin();
  for (let i = 0; i < 20; i++) {
    const code = generateEan13();
    if (!(await db.variant.findUnique({ where: { barcode: code }, select: { id: true } }))) return code;
  }
  throw new Error("Could not generate a unique barcode, try again.");
}

/** Batch version for generating a whole size/colour grid at once. */
export async function newBarcodes(count: number): Promise<string[]> {
  await requireAdmin();
  const n = Math.min(Math.max(Math.floor(count), 0), 200);
  const out = new Set<string>();
  while (out.size < n) {
    const code = generateEan13();
    if (out.has(code)) continue;
    if (await db.variant.findUnique({ where: { barcode: code }, select: { id: true } })) continue;
    out.add(code);
  }
  return [...out];
}

// ---------------------------------------------------------------------------
// Stock
// ---------------------------------------------------------------------------

export type StockAdjustment = {
  variantId: string;
  mode: "add" | "remove" | "set";
  quantity: number;
  type: "restock" | "sale" | "return" | "damage" | "correction";
  note?: string;
};

export async function adjustStock(input: StockAdjustment): Promise<ActionResult<{ stock: number }>> {
  await requireAdmin();
  if (!isInt(input.quantity) || input.quantity < 0) return fail("Quantity must be a whole number.");
  if (input.mode !== "set" && input.quantity === 0) return fail("Quantity must be at least 1.");
  if (!["restock", "sale", "return", "damage", "correction"].includes(input.type)) return fail("Invalid reason.");

  try {
    const stock = await db.$transaction(async (tx) => {
      const v = await tx.variant.findUnique({ where: { id: input.variantId } });
      if (!v) throw new Error("Variant not found.");
      const next =
        input.mode === "add" ? v.stock + input.quantity
        : input.mode === "remove" ? v.stock - input.quantity
        : input.quantity;
      if (next < 0) throw new Error(`Only ${v.stock} in stock — can't remove ${input.quantity}.`);
      if (next === v.stock) return next;

      await tx.variant.update({ where: { id: v.id }, data: { stock: next } });
      await tx.stockMovement.create({
        data: {
          variantId: v.id,
          change: next - v.stock,
          balance: next,
          type: input.type,
          note: input.note?.trim() || null,
        },
      });
      return next;
    });
    revalidateAll();
    return { ok: true, data: { stock } };
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Could not update stock.");
  }
}

export async function getStockHistory(variantId: string) {
  await requireAdmin();
  return db.stockMovement.findMany({
    where: { variantId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

/** Look up a variant by scanned barcode (or SKU). */
export async function lookupBarcode(code: string) {
  await requireAdmin();
  const q = code.trim();
  if (!q) return null;
  return db.variant.findFirst({
    where: { OR: [{ barcode: q }, { sku: q.toUpperCase() }] },
    include: { product: { select: { id: true, name: true, images: { take: 1, orderBy: { position: "asc" } } } } },
  });
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------


export async function updateOrderStatus(orderId: string, next: OrderStatusValue, note?: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    await db.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
      if (!order) throw new Error("Order not found.");
      const current = order.status as OrderStatusValue;
      if (!ORDER_TRANSITIONS[current]?.includes(next)) {
        throw new Error(`Can't move an order from ${ORDER_STATUS_LABEL[current]} to ${ORDER_STATUS_LABEL[next] ?? next}.`);
      }
      if (next === "ready_for_dispatch" && order.items.some((i) => i.scannedQty < i.quantity)) {
        throw new Error("Scan every item on the dispatch screen before marking it packed.");
      }

      const data: Record<string, unknown> = { status: next };
      if (next === "dispatched") data.dispatchedAt = new Date();
      if (next === "delivered") {
        data.deliveredAt = new Date();
        if (order.paymentMethod === "cod" && order.paymentStatus === "pending") data.paymentStatus = "paid";
      }
      if (next === "returned" && order.paymentStatus === "paid") data.paymentStatus = "refunded";
      await tx.order.update({ where: { id: orderId }, data });

      // Put stock back when an order is cancelled or returned.
      if (next === "cancelled" || next === "returned") {
        for (const item of order.items) {
          if (!item.variantId) continue;
          const v = await tx.variant.update({ where: { id: item.variantId }, data: { stock: { increment: item.quantity } } });
          await tx.stockMovement.create({
            data: {
              variantId: item.variantId,
              change: item.quantity,
              balance: v.stock,
              type: "return",
              note: `Order ${formatOrderNumber(order.number)} ${next}`,
            },
          });
        }
      }

      await tx.orderEvent.create({
        data: {
          orderId,
          type: "status",
          message: `${ORDER_STATUS_LABEL[current]} → ${ORDER_STATUS_LABEL[next]}${note?.trim() ? ` — ${note.trim().slice(0, 300)}` : ""}`,
        },
      });
      if (data.paymentStatus === "paid") {
        await tx.orderEvent.create({ data: { orderId, type: "payment", message: "Cash collected on delivery — marked paid" } });
      }
      if (next === "cancelled" || next === "returned") {
        await tx.orderEvent.create({ data: { orderId, type: "status", message: "Items returned to stock" } });
      }
    });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Could not update order.");
  }
  revalidateAll();
  return { ok: true };
}

export async function setPaymentStatus(orderId: string, status: "pending" | "paid" | "refunded"): Promise<ActionResult> {
  await requireAdmin();
  if (!["pending", "paid", "refunded"].includes(status)) return fail("Invalid payment status.");
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) return fail("Order not found.");
  if (order.paymentStatus === status) return { ok: true };
  await db.$transaction([
    db.order.update({ where: { id: orderId }, data: { paymentStatus: status } }),
    db.orderEvent.create({ data: { orderId, type: "payment", message: `Payment ${order.paymentStatus} → ${status}` } }),
  ]);
  revalidateAll();
  return { ok: true };
}

export async function addOrderNote(orderId: string, message: string): Promise<ActionResult> {
  await requireAdmin();
  const text = message?.trim().slice(0, 500);
  if (!text) return fail("Write a note first.");
  await db.orderEvent.create({ data: { orderId, type: "note", message: text } });
  revalidateAll();
  return { ok: true };
}

export type ScanResult = {
  ok: boolean;
  kind: "correct" | "complete" | "already_done" | "wrong_item" | "unknown" | "error";
  message: string;
  itemId?: string;
};

/** Dispatch verification: count a scanned barcode against the order's items. */
export async function scanOrderItem(orderId: string, code: string): Promise<ScanResult> {
  await requireAdmin();
  const barcode = code.trim();
  if (!barcode) return { ok: false, kind: "error", message: "Empty scan." };

  const order = await db.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) return { ok: false, kind: "error", message: "Order not found." };
  if (!["confirmed", "processing"].includes(order.status)) {
    return { ok: false, kind: "error", message: `Order is ${ORDER_STATUS_LABEL[order.status as OrderStatusValue]} — scanning is closed.` };
  }

  const item = order.items.find((i) => i.barcode === barcode || i.sku === barcode.toUpperCase());
  if (!item) {
    const other = await db.variant.findFirst({ where: { OR: [{ barcode }, { sku: barcode.toUpperCase() }] }, include: { product: true } });
    return other
      ? { ok: false, kind: "wrong_item", message: `Wrong item: ${other.product.name} (${other.colorName} / ${other.size}) is not in this order.` }
      : { ok: false, kind: "unknown", message: `Unknown barcode ${barcode}.` };
  }
  if (item.scannedQty >= item.quantity) {
    return { ok: false, kind: "already_done", message: `Already packed all ${item.quantity} × ${item.productName} (${item.size}).`, itemId: item.id };
  }

  await db.$transaction(async (tx) => {
    await tx.orderItem.update({ where: { id: item.id }, data: { scannedQty: { increment: 1 } } });
    if (order.status === "confirmed") {
      await tx.order.update({ where: { id: orderId }, data: { status: "processing" } });
      await tx.orderEvent.create({ data: { orderId, type: "status", message: "Confirmed → Processing (packing started)" } });
    }
  });

  const remaining = order.items.reduce((a, i) => a + (i.quantity - i.scannedQty), 0) - 1;
  revalidateAll();
  return remaining === 0
    ? { ok: true, kind: "complete", message: "All items scanned — ready to mark packed.", itemId: item.id }
    : { ok: true, kind: "correct", message: `${item.productName} (${item.colorName} / ${item.size}) ✓ — ${remaining} left`, itemId: item.id };
}

export async function resetOrderScans(orderId: string): Promise<ActionResult> {
  await requireAdmin();
  await db.orderItem.updateMany({ where: { orderId }, data: { scannedQty: 0 } });
  await db.orderEvent.create({ data: { orderId, type: "note", message: "Dispatch scans reset" } });
  revalidateAll();
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Store settings & content pages
// ---------------------------------------------------------------------------

export async function saveSettingsSection(key: SettingsKey, value: unknown): Promise<ActionResult> {
  await requireAdmin();
  if (!SETTINGS_KEYS.includes(key)) return fail("Unknown settings section.");
  const clean = sanitizeLike(DEFAULT_SETTINGS[key], value);
  await db.setting.upsert({
    where: { key },
    update: { value: JSON.stringify(clean) },
    create: { key, value: JSON.stringify(clean) },
  });
  revalidateAll();
  return { ok: true };
}

export async function resetSettingsSection(key: SettingsKey): Promise<ActionResult> {
  await requireAdmin();
  if (!SETTINGS_KEYS.includes(key)) return fail("Unknown settings section.");
  await db.setting.deleteMany({ where: { key } });
  revalidateAll();
  return { ok: true };
}

export type PageInput = {
  id?: string;
  title: string;
  slug: string;
  body: string;
  published: boolean;
  showInFooter: boolean;
  sortOrder: number;
};

export async function savePage(input: PageInput): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();
  const title = input.title?.trim().slice(0, 120);
  if (!title) return fail("Page title is required.");
  const slug = slugify(input.slug || title);
  if (!slug) return fail("Slug must contain letters or numbers.");
  const data = {
    title,
    slug,
    body: String(input.body ?? "").slice(0, 50_000),
    published: !!input.published,
    showInFooter: !!input.showInFooter,
    sortOrder: Number.isFinite(input.sortOrder) ? Math.round(input.sortOrder) : 0,
  };
  try {
    const page = input.id
      ? await db.page.update({ where: { id: input.id }, data })
      : await db.page.create({ data });
    revalidateAll();
    return { ok: true, data: { id: page.id } };
  } catch (e) {
    return fail(uniqueError(e) ?? "Could not save page.");
  }
}

export async function deletePage(id: string): Promise<ActionResult> {
  await requireAdmin();
  await db.page.delete({ where: { id } });
  revalidateAll();
  return { ok: true };
}
