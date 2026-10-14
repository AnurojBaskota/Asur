"use server";

import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/server/db";
import { getSettings } from "@/lib/server/settings";
import { formatOrderNumber, shippingFor } from "@/lib/settings";

export type CartLineInput = { variantId: string; quantity: number };

export type CheckoutInput = {
  items: CartLineInput[];
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  area: string;
  notes: string;
};

export type CheckoutResult =
  | { ok: true; token: string; number: string }
  | { ok: false; error: string; field?: keyof CheckoutInput };

// Simple per-process limiter: max 5 orders per IP per 10 minutes.
// Swap for Redis/Upstash when running more than one server instance.
const hits = new Map<string, number[]>();
function rateLimited(key: string, limit = 5, windowMs = 10 * 60_000) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > limit;
}

const clean = (s: unknown, max: number) => (typeof s === "string" ? s.trim().slice(0, max) : "");

class CheckoutError extends Error {}

export async function placeOrder(input: CheckoutInput): Promise<CheckoutResult> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "local";
  if (rateLimited(ip)) return { ok: false, error: "Too many orders from this connection. Please wait a few minutes." };

  const name = clean(input.name, 120);
  const email = clean(input.email, 160).toLowerCase();
  const phone = clean(input.phone, 20).replace(/[\s-]/g, "");
  const address = clean(input.address, 300);
  const city = clean(input.city, 80);
  const area = clean(input.area, 120);
  const notes = clean(input.notes, 500);

  if (name.length < 2) return { ok: false, error: "Enter your full name.", field: "name" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Enter a valid email address.", field: "email" };
  if (!/^\+?\d{7,15}$/.test(phone)) return { ok: false, error: "Enter a valid phone number.", field: "phone" };
  if (address.length < 4) return { ok: false, error: "Enter your street address.", field: "address" };
  if (city.length < 2) return { ok: false, error: "Enter your city.", field: "city" };

  // Merge duplicate lines and validate quantities.
  const lines = new Map<string, number>();
  for (const l of Array.isArray(input.items) ? input.items.slice(0, 50) : []) {
    const q = Math.floor(Number(l?.quantity));
    if (typeof l?.variantId !== "string" || !Number.isFinite(q) || q < 1) continue;
    lines.set(l.variantId, Math.min(10, (lines.get(l.variantId) ?? 0) + q));
  }
  if (!lines.size) return { ok: false, error: "Your bag is empty." };

  const settings = await getSettings();
  if (!settings.shipping.codEnabled) return { ok: false, error: "Checkout is temporarily unavailable." };

  try {
    const order = await db.$transaction(async (tx) => {
      const variants = await tx.variant.findMany({
        where: { id: { in: [...lines.keys()] } },
        include: { product: { include: { images: { take: 1, orderBy: { position: "asc" } } } } },
      });

      const items = [...lines].map(([variantId, quantity]) => {
        const v = variants.find((x) => x.id === variantId);
        if (!v || v.product.status !== "active") throw new CheckoutError("An item in your bag is no longer available. Please review your bag.");
        if (v.stock < quantity) {
          throw new CheckoutError(
            v.stock <= 0
              ? `${v.product.name} (${v.colorName} / ${v.size}) just sold out.`
              : `Only ${v.stock} left of ${v.product.name} (${v.colorName} / ${v.size}).`
          );
        }
        const unitPrice = v.salePrice ?? v.price;
        return { v, quantity, unitPrice, total: unitPrice * quantity };
      });

      const subtotal = items.reduce((a, i) => a + i.total, 0);
      const shippingFee = shippingFor(subtotal, settings.shipping);

      const customer = await tx.customer.upsert({
        where: { email },
        update: { name, phone },
        create: { email, name, phone },
      });

      const order = await tx.order.create({
        data: {
          publicToken: randomBytes(18).toString("base64url"),
          customerId: customer.id,
          paymentMethod: "cod",
          subtotal,
          shippingFee,
          total: subtotal + shippingFee,
          shipName: name,
          shipPhone: phone,
          shipAddress: address,
          shipCity: city,
          shipArea: area || null,
          shipNotes: notes || null,
          items: {
            create: items.map((i) => ({
              variantId: i.v.id,
              productName: i.v.product.name,
              sku: i.v.sku,
              barcode: i.v.barcode,
              size: i.v.size,
              colorName: i.v.colorName,
              colorHex: i.v.colorHex,
              image: i.v.product.images[0]?.url ?? null,
              unitPrice: i.unitPrice,
              quantity: i.quantity,
              total: i.total,
            })),
          },
          events: { create: { type: "created", message: "Order placed — Cash on Delivery" } },
        },
      });

      // Conditional decrement guards against two checkouts racing for the last unit
      // (the row lock makes the second one see the reduced stock and fail).
      for (const i of items) {
        const res = await tx.variant.updateMany({
          where: { id: i.v.id, stock: { gte: i.quantity } },
          data: { stock: { decrement: i.quantity } },
        });
        if (res.count !== 1) throw new CheckoutError(`${i.v.product.name} (${i.v.size}) just sold out.`);
        const fresh = await tx.variant.findUniqueOrThrow({ where: { id: i.v.id }, select: { stock: true } });
        await tx.stockMovement.create({
          data: {
            variantId: i.v.id,
            change: -i.quantity,
            balance: fresh.stock,
            type: "sale",
            note: `Order ${formatOrderNumber(order.number)}`,
          },
        });
      }
      return order;
    }, { timeout: 20_000, maxWait: 10_000 });

    revalidatePath("/", "layout");
    return { ok: true, token: order.publicToken, number: formatOrderNumber(order.number) };
  } catch (e) {
    if (e instanceof CheckoutError) return { ok: false, error: e.message };
    console.error("placeOrder failed", e);
    return { ok: false, error: "We couldn't place your order. Please try again." };
  }
}

export type CartSnapshotLine = {
  variantId: string;
  available: boolean;
  stock: number;
  price: number;
  salePrice: number | null;
};

/** Current price/stock for items in a visitor's bag, so stale carts get corrected. */
export async function getCartSnapshot(variantIds: string[]): Promise<CartSnapshotLine[]> {
  const ids = (Array.isArray(variantIds) ? variantIds : []).filter((x) => typeof x === "string").slice(0, 50);
  if (!ids.length) return [];
  const variants = await db.variant.findMany({
    where: { id: { in: ids } },
    select: { id: true, stock: true, price: true, salePrice: true, product: { select: { status: true } } },
  });
  return ids.map((id) => {
    const v = variants.find((x) => x.id === id);
    return v
      ? { variantId: id, available: v.product.status === "active", stock: v.stock, price: v.price, salePrice: v.salePrice }
      : { variantId: id, available: false, stock: 0, price: 0, salePrice: null };
  });
}
