"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, Minus, Plus, Ruler, RotateCcw, Truck, X } from "lucide-react";
import toast from "react-hot-toast";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/stores/cart";
import { ProductCard } from "@/components/ui/ProductCard";
import { SmartImage } from "@/components/ui/SmartImage";
import { Logo } from "@/components/ui/Logo";
import type { Product, ProductColor } from "@/types";
import type { SizeChart, StoreSettings } from "@/lib/settings";

const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];


export function ProductDetail({
  product,
  related,
  shipping,
  sizeChart,
}: {
  product: Product;
  related: Product[];
  shipping: StoreSettings["shipping"];
  sizeChart: SizeChart | null;
}) {
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);

  const colors = useMemo(() => [...new Map(product.variants.map((v) => [v.color.hex, v.color])).values()], [product.variants]);
  const [color, setColor] = useState<ProductColor | undefined>(colors[0]);
  const [size, setSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [sizeGuide, setSizeGuide] = useState(false);
  const [sizeError, setSizeError] = useState(false);
  const [slide, setSlide] = useState(0);

  const sizesForColor = product.variants
    .filter((v) => v.color.hex === color?.hex)
    .sort((a, b) => SIZE_ORDER.indexOf(a.size) - SIZE_ORDER.indexOf(b.size));
  const variant = sizesForColor.find((v) => v.size === size) ?? null;
  const maxQty = Math.max(1, Math.min(variant?.stockQuantity ?? 10, 10));

  const basePrice = variant?.price ?? Math.min(...product.variants.map((v) => v.price));
  const salePrices = product.variants.filter((v) => v.salePrice).map((v) => v.salePrice!);
  const salePrice = variant ? variant.salePrice ?? null : salePrices.length ? Math.min(...salePrices) : null;
  const soldOut = product.variants.every((v) => v.stockQuantity <= 0);

  const add = () => {
    if (!variant) {
      setSizeError(true);
      document.getElementById("size-picker")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (variant.stockQuantity <= 0) return;
    addItem(product, variant, Math.min(quantity, variant.stockQuantity));
    toast.success(`${product.name.replace(/^ASUR\s+/i, "")} — ${variant.size} added to bag`);
    openCart();
  };

  const cta = soldOut ? "Sold out" : !variant ? "Select a size" : variant.stockQuantity <= 0 ? "Sold out" : `Add to bag — ${formatPrice((salePrice ?? basePrice) * quantity)}`;

  return (
    <>
      <div className="pt-[104px]">
        <div className="max-w-9xl mx-auto lg:px-10">
          {/* Breadcrumb */}
          <nav className="hidden lg:flex items-center gap-2 py-5 font-mono text-[11px] uppercase tracking-[0.14em] text-asur-slate" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-asur-white">Home</Link>/
            <Link href="/shop" className="hover:text-asur-white">Shop</Link>/
            <Link href={`/category/${product.category}`} className="hover:text-asur-white">{product.categoryName ?? product.category}</Link>/
            <span className="text-asur-silver">{product.name}</span>
          </nav>

          <div className="grid lg:grid-cols-12 gap-x-10">
            {/* Gallery */}
            <div className="lg:col-span-7">
              {/* Mobile carousel */}
              <div className="lg:hidden relative">
                <div
                  className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar"
                  onScroll={(e) => setSlide(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
                >
                  {product.images.map((img, i) => (
                    <div key={img.id} className="relative w-full shrink-0 snap-center aspect-[4/5] bg-asur-graphite">
                      <SmartImage src={img.url} alt={img.alt} fill priority={i === 0} sizes="100vw" className="object-cover" />
                    </div>
                  ))}
                </div>
                {product.images.length > 1 && (
                  <div className="absolute bottom-4 inset-x-0 flex justify-center gap-1.5">
                    {product.images.map((img, i) => (
                      <span key={img.id} className={cn("h-1 rounded-full transition-all", i === slide ? "w-6 bg-asur-white" : "w-1.5 bg-asur-white/40")} />
                    ))}
                  </div>
                )}
              </div>

              {/* Desktop editorial grid */}
              <div className="hidden lg:grid grid-cols-2 gap-2">
                {product.images.map((img, i) => (
                  <div
                    key={img.id}
                    className={cn("relative bg-asur-graphite overflow-hidden", i === 0 || product.images.length === 2 ? "col-span-2 aspect-[4/5]" : "aspect-[3/4]")}
                  >
                    <SmartImage
                      src={img.url}
                      alt={img.alt}
                      fill
                      priority={i === 0}
                      sizes={i === 0 ? "60vw" : "30vw"}
                      className="object-cover transition-transform duration-[1200ms] hover:scale-[1.03]"
                    />
                  </div>
                ))}
                {product.images.length === 0 && (
                  <div className="col-span-2 aspect-[4/5] bg-asur-graphite flex items-center justify-center opacity-20"><Logo height={72} /></div>
                )}
              </div>
            </div>

            {/* Buy panel */}
            <div className="lg:col-span-5">
              <div className="lg:sticky lg:top-[120px] px-4 sm:px-6 lg:px-0 pt-6 lg:pt-0 pb-16">
                <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.14em]">
                  <span className="text-accent-primary">{product.categoryName ?? product.category}</span>
                  {product.collection && <span className="text-asur-slate">· {product.collection}</span>}
                  {product.isNew && <span className="px-1.5 py-0.5 bg-asur-bone text-asur-black">New</span>}
                </div>

                <h1 className="mt-3 font-display condensed font-black uppercase text-asur-white leading-[0.88] text-[clamp(2.75rem,5vw,4.5rem)]">
                  {product.name.replace(/^ASUR\s+/i, "")}
                </h1>

                <div className="mt-4 flex items-baseline gap-3">
                  <span className="text-2xl font-medium text-asur-white">{formatPrice(salePrice ?? basePrice)}</span>
                  {salePrice && (
                    <>
                      <span className="text-lg text-asur-slate line-through">{formatPrice(basePrice)}</span>
                      <span className="font-mono text-[11px] uppercase tracking-[0.12em] px-1.5 py-0.5 bg-status-error text-white">
                        Save {Math.round((1 - salePrice / basePrice) * 100)}%
                      </span>
                    </>
                  )}
                </div>

                {/* Colour */}
                <div className="mt-8">
                  <p className="text-[13px] text-asur-silver">
                    Colour: <span className="text-asur-white font-medium">{color?.name}</span>
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {colors.map((c) => {
                      const inStock = product.variants.some((v) => v.color.hex === c.hex && v.stockQuantity > 0);
                      return (
                        <button
                          key={c.hex}
                          onClick={() => { setColor(c); setSize(null); setQuantity(1); }}
                          className={cn(
                            "relative h-11 w-11 rounded-full p-1 border transition-colors",
                            color?.hex === c.hex ? "border-asur-white" : "border-transparent hover:border-asur-iron"
                          )}
                          aria-label={`${c.name}${inStock ? "" : " (sold out)"}`}
                          aria-pressed={color?.hex === c.hex}
                          title={c.name}
                        >
                          <span className="block h-full w-full rounded-full ring-1 ring-white/20" style={{ backgroundColor: c.hex }} />
                          {!inStock && <span className="absolute inset-0 m-auto h-px w-9 rotate-45 bg-asur-silver" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Size */}
                <div id="size-picker" className="mt-7 scroll-mt-40">
                  <div className="flex items-center justify-between">
                    <p className={cn("text-[13px]", sizeError && !variant ? "text-status-error" : "text-asur-silver")}>
                      {sizeError && !variant ? "Please select a size" : <>Size{size && <>: <span className="text-asur-white font-medium">{size}</span></>}</>}
                    </p>
                    {sizeChart && (
                      <button onClick={() => setSizeGuide(true)} className="flex items-center gap-1.5 text-[13px] text-asur-silver underline underline-offset-4 hover:text-asur-white">
                        <Ruler size={14} /> Size guide
                      </button>
                    )}
                  </div>
                  <div className="mt-3 grid grid-cols-5 gap-2">
                    {sizesForColor.map((v) => {
                      const out = v.stockQuantity <= 0;
                      const selected = size === v.size;
                      return (
                        <button
                          key={v.id}
                          disabled={out}
                          onClick={() => { setSize(v.size); setSizeError(false); setQuantity(1); }}
                          aria-pressed={selected}
                          className={cn(
                            "relative h-12 border text-[14px] font-medium transition-colors",
                            selected
                              ? "border-asur-white bg-asur-white text-asur-black"
                              : out
                                ? "border-asur-graphite text-asur-iron cursor-not-allowed"
                                : "border-asur-iron text-asur-white hover:border-asur-white",
                            sizeError && !variant && !out && "border-status-error/60"
                          )}
                        >
                          {v.size}
                          {out && <span className="absolute inset-0 m-auto h-px w-[70%] -rotate-[20deg] bg-asur-iron" />}
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-2.5 h-4 text-[12px]">
                    {variant && variant.stockQuantity > 0 && variant.stockQuantity <= variant.lowStockThreshold && (
                      <span className="text-accent-primary">Only {variant.stockQuantity} left in {variant.size}</span>
                    )}
                    {variant && variant.stockQuantity > variant.lowStockThreshold && <span className="text-status-success">In stock — ready to ship</span>}
                  </p>
                  {product.fit === "Oversized" && (
                    <p className="text-[12px] text-asur-slate">Oversized fit — take your usual size for a relaxed drape, or size down for a closer fit.</p>
                  )}
                </div>

                {/* Qty + CTA */}
                <div className="mt-6 hidden sm:flex gap-2">
                  <div className="flex items-center border border-asur-iron">
                    <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="h-14 w-11 flex items-center justify-center text-asur-silver hover:text-asur-white" aria-label="Decrease quantity">
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center text-[15px] text-asur-white tabular-nums" aria-live="polite">{quantity}</span>
                    <button onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))} className="h-14 w-11 flex items-center justify-center text-asur-silver hover:text-asur-white" aria-label="Increase quantity">
                      <Plus size={14} />
                    </button>
                  </div>
                  <AddButton label={cta} onClick={add} disabled={soldOut || (!!variant && variant.stockQuantity <= 0)} />
                </div>

                {/* Perks */}
                <ul className="mt-6 grid grid-cols-2 gap-3 text-[12px] text-asur-silver">
                  <li className="flex items-center gap-2"><Truck size={15} className="text-accent-primary" /> {shipping.freeThreshold > 0 ? `Free shipping over ${formatPrice(shipping.freeThreshold)}` : "Free shipping"}</li>
                  <li className="flex items-center gap-2"><RotateCcw size={15} className="text-accent-primary" /> {shipping.returnDays}-day easy returns</li>
                </ul>

                {/* Accordions */}
                <div className="mt-8 border-t border-asur-graphite">
                  <Accordion title="Description" defaultOpen>
                    <p>{product.description}</p>
                  </Accordion>
                  <Accordion title="Fabric & fit">
                    <dl className="grid grid-cols-2 gap-y-3">
                      <dt className="text-asur-slate">Material</dt><dd className="text-asur-white">{product.material || "—"}</dd>
                      <dt className="text-asur-slate">Fit</dt><dd className="text-asur-white">{product.fit}</dd>
                      {product.weight && (<><dt className="text-asur-slate">Weight</dt><dd className="text-asur-white">{product.weight}</dd></>)}
                      <dt className="text-asur-slate">Care</dt><dd className="text-asur-white">{product.careInstructions || "—"}</dd>
                    </dl>
                  </Accordion>
                  <Accordion title="Shipping & returns">
                    <p>
                      {shipping.freeThreshold > 0
                        ? `Free standard shipping on orders above ${formatPrice(shipping.freeThreshold)}, otherwise ${formatPrice(shipping.flatFee)}.`
                        : "Free standard shipping on every order."}{" "}
                      Delivery takes {shipping.deliveryDays}. Pay with cash on delivery.
                    </p>
                    <p className="mt-2">Returns accepted within {shipping.returnDays} days — {shipping.returnConditions.toLowerCase()}.</p>
                  </Accordion>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Spacer so the sticky mobile CTA never covers content */}
      <div className="sm:hidden h-20" />

      {/* Mobile sticky CTA */}
      <div className="sm:hidden fixed inset-x-0 bottom-0 z-30 border-t border-asur-graphite bg-asur-black/95 backdrop-blur p-3">
        <AddButton label={cta} onClick={add} disabled={soldOut || (!!variant && variant.stockQuantity <= 0)} />
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-10 py-20 sm:py-28 border-t border-asur-graphite">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent-primary mb-3">Pair it with</p>
          <h2 className="font-display condensed font-black uppercase text-asur-white leading-[0.85] text-[clamp(2.75rem,5vw,4.5rem)] mb-10">
            Complete the look
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-10 sm:gap-x-5">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* Size guide drawer */}
      {sizeGuide && sizeChart && (
        <div className="fixed inset-0 z-[70] flex justify-end" role="dialog" aria-modal="true" aria-label="Size guide">
          <div className="absolute inset-0 bg-black/70 animate-fade-in" onClick={() => setSizeGuide(false)} />
          <div className="relative w-full max-w-md h-full bg-asur-carbon border-l border-asur-graphite p-6 sm:p-8 overflow-y-auto animate-[slideInRight_.35s_ease-out]">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-display condensed font-black uppercase text-4xl text-asur-white">Size guide</h2>
              <button onClick={() => setSizeGuide(false)} className="p-2 -mr-2 text-asur-silver hover:text-asur-white" aria-label="Close size guide"><X size={20} /></button>
            </div>
            {sizeChart.note && <p className="text-[14px] text-asur-silver mb-6">{sizeChart.note}</p>}
            <div className="overflow-x-auto">
              <table className="w-full text-[14px]">
                <thead>
                  <tr className="border-b border-asur-iron text-left font-mono text-[11px] uppercase tracking-[0.12em] text-asur-slate">
                    {sizeChart.columns.map((c) => <th key={c} className="py-3 pr-3 font-medium">{c}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {sizeChart.rows.map((r, ri) => (
                    <tr key={ri} className={cn("border-b border-asur-graphite", r[0] === size && "bg-white/5")}>
                      {r.map((cell, ci) => (
                        <td key={ci} className={cn("py-3 pr-3", ci === 0 ? "font-medium text-asur-white" : "text-asur-ash")}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-8 p-4 border border-asur-graphite text-[13px] text-asur-silver space-y-2">
              <p className="flex gap-2"><Check size={15} className="shrink-0 text-accent-primary mt-0.5" /> Between sizes? Size up for a roomier drape.</p>
              <p className="flex gap-2"><Check size={15} className="shrink-0 text-accent-primary mt-0.5" /> Wrong fit? Exchanges within {shipping.returnDays} days.</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function AddButton({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex-1 w-full h-14 px-6 bg-asur-bone text-asur-black text-[13px] font-semibold uppercase tracking-[0.12em] hover:bg-asur-white transition-colors disabled:bg-asur-graphite disabled:text-asur-slate disabled:cursor-not-allowed"
    >
      {label}
    </button>
  );
}

function Accordion({ title, children, defaultOpen }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className="border-b border-asur-graphite">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-5 text-left" aria-expanded={open}>
        <span className="text-[13px] font-semibold uppercase tracking-[0.12em] text-asur-white">{title}</span>
        <ChevronDown size={16} className={cn("text-asur-silver transition-transform duration-300", open && "rotate-180")} />
      </button>
      <div className={cn("grid transition-[grid-template-rows] duration-300", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
        <div className="overflow-hidden">
          <div className="pb-6 text-[14px] leading-relaxed text-asur-ash">{children}</div>
        </div>
      </div>
    </div>
  );
}
