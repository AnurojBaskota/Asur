"use server";

import { timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/server/db";
import { createSession, destroySession, requireAdmin } from "@/lib/server/session";
import { generateEan13, isValidEan13, slugify, SIZES } from "@/lib/barcode";

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
};

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
