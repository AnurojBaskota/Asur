"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, ChevronDown, ExternalLink, Plus, RefreshCw, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import { SIZES, buildSku, generateEan13, slugify } from "@/lib/barcode";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { deleteProduct, saveProduct, type ProductInput } from "@/app/admin/actions";
import { BarcodeSvg } from "./BarcodeSvg";
import { ImageUploader, type UploadedImage } from "./ImageUploader";
import { Label, Panel, Toggle, fieldClass } from "./ui";

type Category = { id: string; name: string };

type VariantRow = {
  key: string;
  id?: string;
  size: string;
  colorName: string;
  colorHex: string;
  price: string;
  salePrice: string;
  costPrice: string;
  stock: string;
  lowStockThreshold: string;
  sku: string;
  barcode: string;
};

export type ProductFormValue = Omit<ProductInput, "variants" | "images"> & {
  images: UploadedImage[];
  variants: Omit<VariantRow, "key">[];
};

const COLOR_PRESETS = [
  { name: "Black", hex: "#0A0A0A" },
  { name: "White", hex: "#FAFAFA" },
  { name: "Grey", hex: "#6B6B6B" },
  { name: "Charcoal", hex: "#2A2A2A" },
  { name: "Bone", hex: "#E8E5E0" },
  { name: "Sand", hex: "#C8B79A" },
  { name: "Olive", hex: "#4A5238" },
  { name: "Navy", hex: "#1A2238" },
];

const toInt = (s: string) => (s.trim() === "" ? NaN : Number(s));
let keySeq = 0;
const nextKey = () => `v${++keySeq}`;
const comboKey = (color: string, size: string) => `${color.toLowerCase()}|${size}`;

export function ProductForm({ categories, initial }: { categories: Category[]; initial?: ProductFormValue }) {
  const router = useRouter();
  const isEdit = !!initial?.id;
  const [pending, startTransition] = useTransition();

  const [form, setForm] = useState(() => ({
    name: initial?.name ?? "",
    slug: initial?.slug ?? "",
    description: initial?.description ?? "",
    categoryId: initial?.categoryId ?? categories[0]?.id ?? "",
    collection: initial?.collection ?? "",
    material: initial?.material ?? "",
    careInstructions: initial?.careInstructions ?? "Machine wash cold, inside out. Tumble dry low.",
    fit: initial?.fit ?? "Oversized",
    weight: initial?.weight ?? "",
    gender: initial?.gender ?? "Men",
    tags: initial?.tags ?? "",
    featured: initial?.featured ?? false,
    isNew: initial?.isNew ?? true,
    status: initial?.status ?? ("draft" as ProductInput["status"]),
  }));
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [images, setImages] = useState<UploadedImage[]>(initial?.images ?? []);

  // Rows: one per colour × size. They're created/removed automatically below.
  const [rows, setRows] = useState<VariantRow[]>(() => initial?.variants.map((v) => ({ ...v, key: nextKey() })) ?? []);
  const [colors, setColors] = useState<{ name: string; hex: string }[]>(() => {
    const seen = new Map<string, string>();
    initial?.variants.forEach((v) => seen.set(v.colorName, v.colorHex));
    return [...seen].map(([name, hex]) => ({ name, hex }));
  });
  const [sizes, setSizes] = useState<string[]>(() => (initial?.variants.length ? [...new Set(initial.variants.map((v) => v.size))] : []));

  // Shared price/cost/alert. Editing them updates every row unless per-size pricing is on.
  const first = initial?.variants[0];
  const [price, setPrice] = useState(first?.price ?? "");
  const [salePrice, setSalePrice] = useState(first?.salePrice ?? "");
  const [onSale, setOnSale] = useState(!!first?.salePrice);
  const [cost, setCost] = useState(first?.costPrice ?? "");
  const [alertAt, setAlertAt] = useState(first?.lowStockThreshold ?? "5");
  const [perRowPrice, setPerRowPrice] = useState(
    () => !!initial && new Set(initial.variants.map((v) => `${v.price}|${v.salePrice}`)).size > 1
  );
  const [fillStock, setFillStock] = useState("");
  const [showMore, setShowMore] = useState(false);
  const [customColor, setCustomColor] = useState({ name: "", hex: "#8B7355" });
  const [barcodePreview, setBarcodePreview] = useState<string | null>(null);

  /** Rebuild rows for the chosen colours × sizes, keeping existing rows (and their stock). */
  const syncRows = (nextColors: typeof colors, nextSizes: string[]) => {
    const wanted = new Set(nextColors.flatMap((c) => nextSizes.map((s) => comboKey(c.name, s))));
    const losing = rows.filter((r) => !wanted.has(comboKey(r.colorName, r.size)) && r.id && toInt(r.stock) > 0);
    if (losing.length && !confirm(`This removes ${losing.map((r) => `${r.colorName} ${r.size}`).join(", ")} which still have stock. Continue?`)) {
      return false;
    }
    const kept = rows.filter((r) => wanted.has(comboKey(r.colorName, r.size)));
    const have = new Set(kept.map((r) => comboKey(r.colorName, r.size)));
    const added: VariantRow[] = [];
    for (const c of nextColors) {
      for (const s of SIZES.filter((x) => nextSizes.includes(x))) {
        if (have.has(comboKey(c.name, s))) continue;
        added.push({
          key: nextKey(),
          size: s,
          colorName: c.name,
          colorHex: c.hex,
          price: price,
          salePrice: onSale ? salePrice : "",
          costPrice: cost || "0",
          stock: "0",
          lowStockThreshold: alertAt || "5",
          sku: buildSku(form.name || "Product", c.name, s),
          barcode: generateEan13(),
        });
      }
    }
    const order = (r: VariantRow) => nextColors.findIndex((c) => c.name === r.colorName) * 100 + SIZES.indexOf(r.size as (typeof SIZES)[number]);
    setRows([...kept, ...added].sort((a, b) => order(a) - order(b)));
    setColors(nextColors);
    setSizes(nextSizes);
    return true;
  };

  const toggleSize = (s: string) => syncRows(colors, sizes.includes(s) ? sizes.filter((x) => x !== s) : [...sizes, s]);
  const addColor = (c: { name: string; hex: string }) => {
    if (colors.some((x) => x.name.toLowerCase() === c.name.toLowerCase())) return toast.error("That colour is already added");
    syncRows([...colors, c], sizes.length ? sizes : ["S", "M", "L", "XL"]);
  };
  const removeColor = (name: string) => syncRows(colors.filter((c) => c.name !== name), sizes);

  const setRow = (key: string, patch: Partial<VariantRow>) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const setAll = (patch: Partial<VariantRow>) => setRows((rs) => rs.map((r) => ({ ...r, ...patch })));

  const onName = (name: string) => {
    setForm((f) => ({ ...f, name, slug: slugTouched ? f.slug : slugify(name) }));
    // Keep auto SKUs in sync for rows that haven't been saved yet.
    setRows((rs) => rs.map((r) => (r.id ? r : { ...r, sku: buildSku(name || "Product", r.colorName, r.size) })));
  };

  const totalStock = rows.reduce((a, r) => a + (toInt(r.stock) || 0), 0);
  const selling = toInt(onSale && salePrice ? salePrice : price);
  const margin = selling > 0 && toInt(cost) >= 0 ? Math.round(((selling - toInt(cost)) / selling) * 100) : null;

  const submit = (status: ProductInput["status"]) => {
    if (!form.name.trim()) return toast.error("Give the product a name");
    if (!rows.length) return toast.error("Choose at least one colour and one size");
    if (!perRowPrice && !(toInt(price) > 0)) return toast.error("Enter a price");
    if (onSale && !perRowPrice && !(toInt(salePrice) > 0 && toInt(salePrice) < toInt(price))) return toast.error("The sale price must be lower than the normal price");

    const payload: ProductInput = {
      id: initial?.id,
      ...form,
      status,
      slug: form.slug || slugify(form.name),
      images,
      variants: rows.map((r) => ({
        id: r.id,
        size: r.size,
        colorName: r.colorName,
        colorHex: r.colorHex,
        price: perRowPrice ? toInt(r.price) : toInt(price),
        salePrice: perRowPrice ? (r.salePrice.trim() ? toInt(r.salePrice) : null) : onSale ? toInt(salePrice) : null,
        costPrice: toInt(r.costPrice || "0"),
        stock: toInt(r.stock || "0"),
        lowStockThreshold: toInt(r.lowStockThreshold || "0"),
        sku: r.sku,
        barcode: r.barcode,
      })),
    };
    startTransition(async () => {
      const res = await saveProduct(payload);
      if (!res.ok) return void toast.error(res.error, { duration: 6000 });
      set("status", status);
      toast.success(status === "active" ? "Saved — it's live on your store" : "Saved as a draft (hidden from customers)");
      if (!isEdit) router.replace(`/admin/products/${res.data!.id}`);
      else router.refresh();
    });
  };

  const remove = () => {
    if (!initial?.id || !confirm(`Delete "${form.name}" permanently? This can't be undone.`)) return;
    startTransition(async () => {
      const res = await deleteProduct(initial.id!);
      if (!res.ok) return void toast.error(res.error);
      toast.success("Product deleted");
      router.replace("/admin/products");
    });
  };

  if (!categories.length) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <h1 className="text-[24px] font-bold text-asur-white mb-2">First, create a category</h1>
        <p className="text-[15px] text-asur-silver mb-6">Every product belongs to a category, like “Oversized Tees” or “Sleeveless”.</p>
        <Link href="/admin/categories" className="inline-flex h-11 items-center px-5 rounded-md bg-asur-bone text-asur-black font-semibold">Create a category</Link>
      </div>
    );
  }

  const step = (n: number, title: string, hint?: string) => (
    <span className="flex items-center gap-3">
      <span className="h-7 w-7 rounded-full bg-asur-steel text-[13px] font-bold text-asur-white flex items-center justify-center">{n}</span>
      <span>
        {title}
        {hint && <span className="block text-[13px] font-normal text-asur-slate">{hint}</span>}
      </span>
    </span>
  );

  return (
    <div className="pb-28">
      <div className="flex items-start gap-3 mb-6">
        <Link href="/admin/products" className="mt-1 p-1.5 rounded-md text-asur-silver hover:text-asur-white hover:bg-asur-steel/40" aria-label="Back to products">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-[28px] font-bold tracking-tight text-asur-white truncate">{isEdit ? form.name || "Edit product" : "Add a product"}</h1>
          <p className="text-[15px] text-asur-silver">
            {isEdit ? (
              form.status === "active" ? (
                <Link href={`/product/${form.slug}`} target="_blank" className="inline-flex items-center gap-1 text-status-success hover:underline">
                  ● Live on your store <ExternalLink size={13} />
                </Link>
              ) : (
                <span className="text-status-warning">● Hidden — customers can&apos;t see it yet</span>
              )
            ) : (
              "Fill in the steps below. You can save it as a draft and finish later."
            )}
          </p>
        </div>
      </div>

      <div className="grid xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <Panel title={step(1, "The basics")}>
            <div className="space-y-5">
              <div>
                <Label htmlFor="name">Product name</Label>
                <input id="name" value={form.name} onChange={(e) => onName(e.target.value)} placeholder="e.g. ASUR Heavy Oversized Tee" className={fieldClass} />
              </div>
              <div>
                <Label>Category</Label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => set("categoryId", c.id)}
                      className={cn(
                        "h-10 px-4 rounded-full border text-[14px] transition-colors",
                        form.categoryId === c.id ? "bg-asur-bone text-asur-black border-asur-bone font-semibold" : "border-asur-iron text-asur-ash hover:border-asur-silver"
                      )}
                    >
                      {form.categoryId === c.id && <Check size={14} className="inline mr-1.5 -mt-0.5" />}
                      {c.name}
                    </button>
                  ))}
                  <Link href="/admin/categories" className="h-10 px-4 inline-flex items-center rounded-full border border-dashed border-asur-iron text-[14px] text-asur-slate hover:text-asur-white">
                    <Plus size={14} className="mr-1" /> New category
                  </Link>
                </div>
              </div>
              <div>
                <Label htmlFor="desc" hint="Shown on the product page">Description</Label>
                <textarea id="desc" rows={4} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="What's it made of, how does it fit, why will they love it?" className={cn(fieldClass, "resize-y")} />
              </div>
            </div>
          </Panel>

          <Panel title={step(2, "Photos", "The first photo is shown in the shop. Drag in as many as you like.")}>
            <ImageUploader images={images} onChange={setImages} defaultAlt={form.name} />
          </Panel>

          <Panel title={step(3, "Colours & sizes", "Pick what you sell — a stock line is made for each combination.")}>
            <div className="space-y-5">
              <div>
                <Label>Colours</Label>
                <div className="flex flex-wrap gap-2">
                  {colors.map((c) => (
                    <span key={c.name} className="inline-flex items-center gap-2 h-10 pl-3 pr-1.5 rounded-full border border-asur-white bg-asur-steel/40 text-[14px] text-asur-white">
                      <span className="w-4 h-4 rounded-full ring-1 ring-white/30" style={{ background: c.hex }} />
                      {c.name}
                      <button type="button" onClick={() => removeColor(c.name)} className="p-1 rounded-full text-asur-silver hover:text-status-error hover:bg-asur-graphite" aria-label={`Remove ${c.name}`}>
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                  {COLOR_PRESETS.filter((p) => !colors.some((c) => c.name === p.name)).map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => addColor(p)}
                      className="inline-flex items-center gap-2 h-10 px-3 rounded-full border border-dashed border-asur-iron text-[14px] text-asur-silver hover:text-asur-white hover:border-asur-silver"
                    >
                      <span className="w-4 h-4 rounded-full ring-1 ring-white/20" style={{ background: p.hex }} />
                      {p.name}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 mt-3 max-w-sm">
                  <input type="color" value={customColor.hex} onChange={(e) => setCustomColor({ ...customColor, hex: e.target.value })} className="h-11 w-12 shrink-0 rounded-md bg-asur-graphite border border-asur-iron p-1 cursor-pointer" aria-label="Pick a colour" />
                  <input
                    value={customColor.name}
                    onChange={(e) => setCustomColor({ ...customColor, name: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && customColor.name.trim()) {
                        e.preventDefault();
                        addColor({ name: customColor.name.trim(), hex: customColor.hex.toUpperCase() });
                        setCustomColor({ ...customColor, name: "" });
                      }
                    }}
                    placeholder="Other colour, e.g. Maroon"
                    className={fieldClass}
                  />
                  <button
                    type="button"
                    disabled={!customColor.name.trim()}
                    onClick={() => {
                      addColor({ name: customColor.name.trim(), hex: customColor.hex.toUpperCase() });
                      setCustomColor({ ...customColor, name: "" });
                    }}
                    className="h-11 px-4 rounded-md border border-asur-iron text-[14px] text-asur-white hover:border-asur-silver disabled:opacity-40"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div>
                <Label>Sizes</Label>
                <div className="flex flex-wrap gap-2">
                  {SIZES.map((s) => {
                    const on = sizes.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleSize(s)}
                        aria-pressed={on}
                        className={cn(
                          "min-w-14 h-11 px-3 rounded-md border text-[15px] font-semibold transition-colors",
                          on ? "bg-asur-bone text-asur-black border-asur-bone" : "border-asur-iron text-asur-silver hover:border-asur-silver"
                        )}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
                {!colors.length && <p className="mt-2 text-[13px] text-asur-slate">Add a colour first, then choose sizes.</p>}
              </div>
            </div>
          </Panel>

          <Panel title={step(4, "Price")}>
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <Label htmlFor="price">Price (Rs.)</Label>
                <input
                  id="price"
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={price}
                  disabled={perRowPrice}
                  onChange={(e) => {
                    setPrice(e.target.value);
                    if (!perRowPrice) setAll({ price: e.target.value });
                  }}
                  placeholder="e.g. 2490"
                  className={fieldClass}
                />
              </div>
              <div className="flex flex-col justify-end">
                <Toggle
                  checked={onSale}
                  onChange={(v) => {
                    setOnSale(v);
                    if (!perRowPrice) setAll({ salePrice: v ? salePrice : "" });
                  }}
                  label="On sale?"
                  description="Shows a crossed-out price and a % off badge"
                />
              </div>
              {onSale && !perRowPrice && (
                <div>
                  <Label htmlFor="sale">Sale price (Rs.)</Label>
                  <input
                    id="sale"
                    type="number"
                    min={0}
                    value={salePrice}
                    onChange={(e) => {
                      setSalePrice(e.target.value);
                      setAll({ salePrice: e.target.value });
                    }}
                    placeholder="Lower than the price"
                    className={fieldClass}
                  />
                  {toInt(salePrice) > 0 && toInt(price) > toInt(salePrice) && (
                    <p className="mt-1.5 text-[13px] text-status-success">{Math.round((1 - toInt(salePrice) / toInt(price)) * 100)}% off</p>
                  )}
                </div>
              )}
            </div>
            <label className="mt-5 flex items-center gap-2.5 text-[14px] text-asur-silver cursor-pointer w-fit">
              <input type="checkbox" checked={perRowPrice} onChange={(e) => setPerRowPrice(e.target.checked)} className="h-4 w-4 accent-[var(--color-accent-primary)]" />
              Some sizes cost more (set price per size below)
            </label>
          </Panel>

          <Panel
            title={step(5, "Stock", "How many of each do you have right now?")}
            action={rows.length > 0 && <span className="text-[14px] text-asur-silver">{totalStock} in total</span>}
          >
            {rows.length === 0 ? (
              <p className="text-[15px] text-asur-slate py-4 text-center">Choose colours and sizes in step 3 — the stock list appears here.</p>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="text-[14px] text-asur-silver">Set every size to</span>
                  <input type="number" min={0} value={fillStock} onChange={(e) => setFillStock(e.target.value)} className={cn(fieldClass, "w-24 h-10")} aria-label="Stock for every size" />
                  <button type="button" disabled={fillStock === ""} onClick={() => setAll({ stock: fillStock })} className="h-10 px-4 rounded-md border border-asur-iron text-[14px] text-asur-white hover:border-asur-silver disabled:opacity-40">
                    Apply
                  </button>
                </div>
                <div className="overflow-x-auto -mx-5">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-[13px] text-asur-slate border-b border-asur-graphite">
                        <th className="px-5 py-2 font-medium">Colour</th>
                        <th className="px-3 py-2 font-medium">Size</th>
                        {perRowPrice && <th className="px-3 py-2 font-medium">Price</th>}
                        {perRowPrice && <th className="px-3 py-2 font-medium">Sale price</th>}
                        <th className="px-5 py-2 font-medium w-40">In stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr key={r.key} className="border-b border-asur-graphite/60 last:border-0">
                          <td className="px-5 py-2">
                            <span className="inline-flex items-center gap-2 text-[15px] text-asur-white">
                              <span className="w-4 h-4 rounded-full ring-1 ring-white/30" style={{ background: r.colorHex }} />
                              {r.colorName}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-[15px] font-semibold text-asur-white">{r.size}</td>
                          {perRowPrice && (
                            <td className="px-3 py-2"><input type="number" min={0} value={r.price} onChange={(e) => setRow(r.key, { price: e.target.value })} className={cn(fieldClass, "w-28 h-10")} aria-label={`Price ${r.colorName} ${r.size}`} /></td>
                          )}
                          {perRowPrice && (
                            <td className="px-3 py-2"><input type="number" min={0} value={r.salePrice} onChange={(e) => setRow(r.key, { salePrice: e.target.value })} placeholder="—" className={cn(fieldClass, "w-28 h-10")} aria-label={`Sale price ${r.colorName} ${r.size}`} /></td>
                          )}
                          <td className="px-5 py-2">
                            <input
                              type="number"
                              min={0}
                              inputMode="numeric"
                              value={r.stock}
                              onChange={(e) => setRow(r.key, { stock: e.target.value })}
                              className={cn(fieldClass, "w-28 h-10", toInt(r.stock) === 0 && "text-status-error")}
                              aria-label={`Stock ${r.colorName} ${r.size}`}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {isEdit && (
                  <p className="mt-4 text-[13px] text-asur-slate">
                    For deliveries and corrections, the <Link href="/admin/inventory" className="text-accent-primary hover:underline">Stock page</Link> keeps a record of every change.
                  </p>
                )}
              </>
            )}
          </Panel>

          {/* More options */}
          <section className="bg-asur-carbon border border-asur-graphite rounded-lg">
            <button type="button" onClick={() => setShowMore((v) => !v)} className="w-full flex items-center justify-between px-5 py-4 text-left" aria-expanded={showMore}>
              <span>
                <span className="block text-[16px] font-semibold text-asur-white">More options</span>
                <span className="block text-[13px] text-asur-slate">Fit, fabric, cost, low-stock alert, web address, barcodes — optional</span>
              </span>
              <ChevronDown size={20} className={cn("text-asur-silver transition-transform", showMore && "rotate-180")} />
            </button>
            {showMore && (
              <div className="px-5 pb-6 pt-1 space-y-6 border-t border-asur-graphite">
                <div className="grid sm:grid-cols-2 gap-5 pt-5">
                  <div>
                    <Label htmlFor="fit">Fit</Label>
                    <select id="fit" value={form.fit} onChange={(e) => set("fit", e.target.value)} className={fieldClass}>
                      {["Oversized", "Regular", "Slim", "Compression"].map((f) => <option key={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="gender">Made for</Label>
                    <select id="gender" value={form.gender} onChange={(e) => set("gender", e.target.value)} className={fieldClass}>
                      {["Men", "Women", "Unisex"].map((g) => <option key={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="material">Fabric</Label>
                    <input id="material" value={form.material} onChange={(e) => set("material", e.target.value)} placeholder="100% cotton, 280GSM" className={fieldClass} />
                  </div>
                  <div>
                    <Label htmlFor="weight">Weight</Label>
                    <input id="weight" value={form.weight} onChange={(e) => set("weight", e.target.value)} placeholder="320g" className={fieldClass} />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="care">Care instructions</Label>
                    <input id="care" value={form.careInstructions} onChange={(e) => set("careInstructions", e.target.value)} className={fieldClass} />
                  </div>
                  <div>
                    <Label htmlFor="cost" hint="Only you see this">What it costs you (Rs.)</Label>
                    <input
                      id="cost"
                      type="number"
                      min={0}
                      value={cost}
                      onChange={(e) => {
                        setCost(e.target.value);
                        setAll({ costPrice: e.target.value });
                      }}
                      placeholder="For profit tracking"
                      className={fieldClass}
                    />
                    {margin !== null && <p className={cn("mt-1.5 text-[13px]", margin < 40 ? "text-status-warning" : "text-status-success")}>{margin}% profit margin</p>}
                  </div>
                  <div>
                    <Label htmlFor="alert" hint="Warns you when stock gets this low">Low-stock alert at</Label>
                    <input
                      id="alert"
                      type="number"
                      min={0}
                      value={alertAt}
                      onChange={(e) => {
                        setAlertAt(e.target.value);
                        setAll({ lowStockThreshold: e.target.value });
                      }}
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <Label htmlFor="collection">Collection</Label>
                    <input id="collection" value={form.collection} onChange={(e) => set("collection", e.target.value)} placeholder="e.g. Foundation" className={fieldClass} />
                  </div>
                  <div>
                    <Label htmlFor="tags" hint="Helps search, comma separated">Search keywords</Label>
                    <input id="tags" value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="heavyweight, gym, black" className={fieldClass} />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="slug" hint={`yourstore.com/product/${form.slug || "…"}`}>Web address</Label>
                    <input id="slug" value={form.slug} onChange={(e) => { setSlugTouched(true); set("slug", e.target.value); }} className={cn(fieldClass, "font-mono text-[14px]")} />
                  </div>
                </div>

                {rows.length > 0 && (
                  <div>
                    <Label hint="Made automatically — edit only if you use your own codes">SKUs & barcodes</Label>
                    <div className="overflow-x-auto border border-asur-graphite rounded-md">
                      <table className="w-full min-w-[560px]">
                        <tbody>
                          {rows.map((r) => (
                            <tr key={r.key} className="border-b border-asur-graphite/60 last:border-0">
                              <td className="px-3 py-2 text-[14px] text-asur-ash whitespace-nowrap">{r.colorName} / {r.size}</td>
                              <td className="px-2 py-2">
                                <input value={r.sku} onChange={(e) => setRow(r.key, { sku: e.target.value.toUpperCase() })} className={cn(fieldClass, "h-9 font-mono text-[13px]")} aria-label={`SKU ${r.colorName} ${r.size}`} />
                              </td>
                              <td className="px-2 py-2 whitespace-nowrap">
                                <button type="button" onClick={() => setBarcodePreview(r.barcode)} className="font-mono text-[13px] text-asur-silver hover:text-asur-white underline decoration-dotted underline-offset-4">{r.barcode}</button>
                                <button type="button" onClick={() => setRow(r.key, { barcode: generateEan13() })} className="ml-1 p-1 text-asur-slate hover:text-asur-white" title="New barcode" aria-label="New barcode"><RefreshCw size={13} /></button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {isEdit && (
                  <div className="pt-4 border-t border-asur-graphite">
                    <button type="button" onClick={remove} disabled={pending} className="inline-flex items-center gap-2 h-10 px-4 rounded-md text-[14px] text-status-error hover:bg-status-error/10">
                      <Trash2 size={16} /> Delete this product
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <div className="xl:sticky xl:top-8 space-y-6">
            <Panel title="Show on store">
              <div className="space-y-4">
                <Toggle checked={form.featured} onChange={(v) => set("featured", v)} label="Feature on homepage" description="Appears in “Popular right now”" />
                <Toggle checked={form.isNew} onChange={(v) => set("isNew", v)} label="Mark as new" description="Adds a NEW badge" />
              </div>
            </Panel>

            <Panel title="Preview">
              <div className="flex gap-4">
                <div className="relative w-20 aspect-[4/5] shrink-0 rounded-md overflow-hidden bg-asur-graphite">
                  {images[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={images[0].url} alt="" className="absolute inset-0 h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[15px] font-medium text-asur-white truncate">{form.name || "Product name"}</p>
                  <p className="text-[14px] text-asur-silver mt-0.5">
                    {onSale && toInt(salePrice) > 0 ? (
                      <>
                        {formatPrice(toInt(salePrice))} <span className="line-through text-asur-slate">{toInt(price) > 0 ? formatPrice(toInt(price)) : ""}</span>
                      </>
                    ) : toInt(price) > 0 ? (
                      formatPrice(toInt(price))
                    ) : (
                      "No price yet"
                    )}
                  </p>
                  <p className="text-[13px] text-asur-slate mt-1">
                    {colors.length} colour{colors.length === 1 ? "" : "s"} · {sizes.length} size{sizes.length === 1 ? "" : "s"} · {totalStock} in stock
                  </p>
                </div>
              </div>
              <ul className="mt-5 space-y-2 text-[14px]">
                {[
                  [!!form.name.trim(), "Name"],
                  [images.length > 0, "At least one photo"],
                  [rows.length > 0, "Colours & sizes"],
                  [perRowPrice ? rows.every((r) => toInt(r.price) > 0) : toInt(price) > 0, "Price"],
                  [totalStock > 0, "Some stock"],
                ].map(([ok, label]) => (
                  <li key={label as string} className={cn("flex items-center gap-2", ok ? "text-asur-ash" : "text-asur-slate")}>
                    <span className={cn("h-5 w-5 rounded-full flex items-center justify-center", ok ? "bg-status-success/20 text-status-success" : "border border-asur-iron")}>
                      {ok && <Check size={12} />}
                    </span>
                    {label as string}
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        </div>
      </div>

      {/* Save bar */}
      <div className="fixed bottom-0 right-0 left-0 lg:left-64 z-30 bg-asur-carbon/95 backdrop-blur border-t border-asur-graphite px-4 sm:px-8 py-3 flex items-center justify-end gap-3">
        <span className="mr-auto hidden sm:block text-[14px] text-asur-silver">
          {form.status === "active" ? "Changes go live as soon as you save." : "Customers can't see this until you publish."}
        </span>
        {form.status === "active" ? (
          <>
            <button type="button" onClick={() => submit("draft")} disabled={pending} className="h-11 px-4 rounded-md text-[14px] text-asur-silver hover:text-asur-white hover:bg-asur-steel/40">Hide from store</button>
            <button type="button" onClick={() => submit("active")} disabled={pending} className="h-11 px-6 rounded-md bg-asur-bone text-asur-black text-[15px] font-semibold hover:bg-asur-white disabled:opacity-60">
              {pending ? "Saving…" : "Save changes"}
            </button>
          </>
        ) : (
          <>
            <button type="button" onClick={() => submit(form.status === "archived" ? "archived" : "draft")} disabled={pending} className="h-11 px-5 rounded-md border border-asur-iron text-[15px] text-asur-white hover:border-asur-silver disabled:opacity-60">Save draft</button>
            <button type="button" onClick={() => submit("active")} disabled={pending} className="h-11 px-6 rounded-md bg-asur-bone text-asur-black text-[15px] font-semibold hover:bg-asur-white disabled:opacity-60">
              {pending ? "Saving…" : "Publish to store"}
            </button>
          </>
        )}
      </div>

      {barcodePreview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setBarcodePreview(null)}>
          <div className="absolute inset-0 bg-black/70" />
          <div className="relative bg-white p-6 rounded-lg" onClick={(e) => e.stopPropagation()}>
            <BarcodeSvg value={barcodePreview} height={70} />
            <p className="text-center text-[13px] text-neutral-500 mt-2">Click outside to close</p>
          </div>
        </div>
      )}
    </div>
  );
}
