"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";
import type { Product } from "@/types";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/stores/cart";
import { SmartImage } from "@/components/ui/SmartImage";

const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];

interface ProductCardProps {
  product: Product;
  className?: string;
  index?: number;
  priority?: boolean;
  bestSeller?: boolean;
}

export function ProductCard({ product, className, index, priority, bestSeller }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);

  const cover = product.images.find((img) => img.isDefault) ?? product.images[0];
  const alt = product.images.find((img) => img !== cover);
  const colors = [...new Map(product.variants.map((v) => [v.color.hex, v.color])).values()];
  const defaultColor = colors[0];
  const quickVariants = product.variants
    .filter((v) => v.color.hex === defaultColor?.hex)
    .sort((a, b) => SIZE_ORDER.indexOf(a.size) - SIZE_ORDER.indexOf(b.size));

  const prices = product.variants.map((v) => v.price);
  const salePrices = product.variants.filter((v) => v.salePrice).map((v) => v.salePrice!);
  const price = Math.min(...prices);
  const salePrice = salePrices.length ? Math.min(...salePrices) : null;
  const soldOut = product.variants.every((v) => v.stockQuantity <= 0);
  const lowStock = !soldOut && product.variants.some((v) => v.stockQuantity > 0 && v.stockQuantity <= v.lowStockThreshold);

  const quickAdd = (e: React.MouseEvent, variantId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const variant = product.variants.find((v) => v.id === variantId);
    if (!variant || variant.stockQuantity <= 0) return;
    addItem(product, variant, 1);
    toast.success(`${variant.color.name} / ${variant.size} added to bag`);
    openCart();
  };

  return (
    <Link href={`/product/${product.slug}`} className={cn("group block", className)}>
      <div className="relative aspect-[4/5] overflow-hidden bg-asur-graphite">
        {cover ? (
          <>
            <SmartImage
              src={cover.url}
              alt={cover.alt}
              fill
              priority={priority}
              sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
              className={cn(
                "object-cover transition-[transform,opacity] duration-[900ms] ease-out group-hover:scale-[1.04]",
                alt && "group-hover:opacity-0",
                soldOut && "grayscale opacity-60"
              )}
            />
            {alt && (
              <SmartImage
                src={alt.url}
                alt={alt.alt}
                fill
                sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
                className="object-cover opacity-0 scale-[1.04] transition-opacity duration-700 group-hover:opacity-100"
              />
            )}
          </>
        ) : (
          <span className="absolute inset-0 flex items-center justify-center font-display condensed font-black text-3xl text-asur-iron">ASUR</span>
        )}

        {/* Top meta */}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          <div className="flex flex-col gap-1">
            {soldOut ? (
              <Tag className="bg-asur-black/80 text-asur-ash">Sold out</Tag>
            ) : (
              <>
                {bestSeller && <Tag className="bg-accent-primary text-asur-black">Best seller</Tag>}
                {product.isNew && !bestSeller && <Tag className="bg-asur-bone text-asur-black">New</Tag>}
                {salePrice && <Tag className="bg-status-error text-white">−{Math.round((1 - salePrice / price) * 100)}%</Tag>}
              </>
            )}
          </div>
          {typeof index === "number" && (
            <span className="font-mono text-[11px] text-asur-white/70 mix-blend-difference">{String(index + 1).padStart(2, "0")}</span>
          )}
        </div>

        {/* Quick add */}
        {!soldOut && quickVariants.length > 0 && (
          <div className="absolute inset-x-0 bottom-0 hidden sm:block translate-y-full group-hover:translate-y-0 group-focus-within:translate-y-0 transition-transform duration-500 ease-out">
            <div className="m-2 bg-asur-bone/95 backdrop-blur px-3 py-2.5">
              <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-asur-black/60 mb-2">
                <Plus size={10} /> Quick add · {defaultColor.name}
              </p>
              <div className="flex flex-wrap gap-1">
                {quickVariants.map((v) => {
                  const out = v.stockQuantity <= 0;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      disabled={out}
                      onClick={(e) => quickAdd(e, v.id)}
                      className={cn(
                        "min-w-9 h-8 px-2 text-[12px] font-semibold border transition-colors",
                        out
                          ? "border-asur-black/10 text-asur-black/25 line-through cursor-not-allowed"
                          : "border-asur-black/20 text-asur-black hover:bg-asur-black hover:text-asur-bone"
                      )}
                      aria-label={`Add size ${v.size} to bag`}
                    >
                      {v.size}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="pt-3.5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[15px] font-medium text-asur-white leading-snug line-clamp-1">
            {product.name.replace(/^ASUR\s+/i, "")}
          </h3>
          <p className="mt-0.5 text-[13px] text-asur-slate">
            {product.categoryName ?? product.fit}
            {colors.length > 1 && ` · ${colors.length} colours`}
          </p>
          {lowStock && <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-accent-primary">Selling fast</p>}
        </div>
        <div className="text-right shrink-0">
          {salePrice ? (
            <>
              <p className="text-[15px] font-medium text-asur-white">{formatPrice(salePrice)}</p>
              <p className="text-[12px] text-asur-slate line-through">{formatPrice(price)}</p>
            </>
          ) : (
            <p className="text-[15px] font-medium text-asur-white">{formatPrice(price)}</p>
          )}
        </div>
      </div>

      {colors.length > 1 && (
        <div className="mt-2 flex gap-1.5">
          {colors.map((c) => (
            <span key={c.hex} title={c.name} className="h-3 w-3 rounded-full ring-1 ring-white/20" style={{ backgroundColor: c.hex }} />
          ))}
        </div>
      )}
    </Link>
  );
}

function Tag({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("px-2 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.12em] leading-none", className)}>
      {children}
    </span>
  );
}
