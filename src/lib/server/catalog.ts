import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { stockStatus } from "@/lib/barcode";
import type { Product, ProductSize } from "@/types";

const productInclude = {
  category: true,
  images: { orderBy: { position: "asc" } },
  variants: { orderBy: [{ colorName: "asc" }, { createdAt: "asc" }] },
} satisfies Prisma.ProductInclude;

export type DbProduct = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

/** Map a DB row to the storefront `Product` shape used by cards, cart, etc. */
export function toStorefrontProduct(p: DbProduct): Product {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    category: p.category.slug,
    categoryName: p.category.name,
    collection: p.collection ?? undefined,
    material: p.material,
    careInstructions: p.careInstructions,
    fit: p.fit as Product["fit"],
    weight: p.weight ?? undefined,
    gender: p.gender as Product["gender"],
    tags: p.tags.split(",").map((t) => t.trim()).filter(Boolean),
    featured: p.featured,
    isNew: p.isNew,
    status: p.status as Product["status"],
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    images: p.images.map((img, i) => ({
      id: img.id,
      url: img.url,
      alt: img.alt || p.name,
      position: img.position,
      isDefault: i === 0,
    })),
    variants: p.variants.map((v) => ({
      id: v.id,
      productId: v.productId,
      sku: v.sku,
      barcode: v.barcode,
      size: v.size as ProductSize,
      color: { name: v.colorName, hex: v.colorHex },
      price: v.price,
      salePrice: v.salePrice ?? undefined,
      costPrice: 0, // never expose cost to the storefront
      stockQuantity: v.stock,
      lowStockThreshold: v.lowStockThreshold,
      status: stockStatus(v.stock, v.lowStockThreshold),
    })),
  };
}

// ---------- Storefront queries (active products only) ----------

export async function getActiveProducts(where: Prisma.ProductWhereInput = {}, take?: number) {
  const rows = await db.product.findMany({
    where: { status: "active", ...where },
    include: productInclude,
    orderBy: { createdAt: "desc" },
    take,
  });
  return rows.map(toStorefrontProduct);
}

export async function getProductBySlug(slug: string) {
  const row = await db.product.findFirst({ where: { slug, status: "active" }, include: productInclude });
  return row ? toStorefrontProduct(row) : null;
}

export async function getCategoriesWithCounts() {
  return db.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: { where: { status: "active" } } } } },
  });
}

// ---------- Admin queries ----------

export async function getAdminProduct(id: string) {
  return db.product.findUnique({ where: { id }, include: productInclude });
}

export async function getAdminProducts() {
  return db.product.findMany({ include: productInclude, orderBy: { updatedAt: "desc" } });
}

export async function getInventory() {
  return db.variant.findMany({
    include: {
      product: { select: { id: true, name: true, status: true, category: { select: { name: true } }, images: { take: 1, orderBy: { position: "asc" } } } },
    },
    orderBy: [{ product: { name: "asc" } }, { colorName: "asc" }, { createdAt: "asc" }],
  });
}

/** Product ids ranked by units sold in the last `days` days (cancelled/returned excluded). */
export async function getBestSellerIds(limit = 8, days = 60): Promise<string[]> {
  const since = new Date(Date.now() - days * 86_400_000);
  const rows = await db.orderItem.groupBy({
    by: ["variantId"],
    where: { variantId: { not: null }, order: { createdAt: { gte: since }, status: { notIn: ["cancelled", "returned"] } } },
    _sum: { quantity: true },
  });
  if (!rows.length) return [];
  const variants = await db.variant.findMany({
    where: { id: { in: rows.map((r) => r.variantId!) } },
    select: { id: true, productId: true },
  });
  const byProduct = new Map<string, number>();
  for (const r of rows) {
    const pid = variants.find((v) => v.id === r.variantId)?.productId;
    if (pid) byProduct.set(pid, (byProduct.get(pid) ?? 0) + (r._sum.quantity ?? 0));
  }
  return [...byProduct].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([id]) => id);
}
