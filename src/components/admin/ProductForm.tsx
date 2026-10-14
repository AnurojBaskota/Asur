"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ExternalLink, Plus, RefreshCw, Trash2, Wand2, X } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { SIZES, buildSku, slugify } from "@/lib/barcode";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { deleteProduct, newBarcode, newBarcodes, saveProduct, type ProductInput } from "@/app/admin/actions";
import { BarcodeSvg } from "./BarcodeSvg";
import { ImageUploader, type UploadedImage } from "./ImageUploader";
import { Label, PageHeader, Panel, Toggle, fieldClass } from "./ui";

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
  { name: "Washed Black", hex: "#1F1F1F" },
  { name: "Graphite", hex: "#2A2A2A" },
  { name: "Grey", hex: "#6B6B6B" },
  { name: "Bone", hex: "#E8E5E0" },
  { name: "White", hex: "#FAFAFA" },
  { name: "Olive", hex: "#4A5238" },
  { name: "Sand", hex: "#C8B79A" },
];

const toInt = (s: string) => (s.trim() === "" ? NaN : Number(s));
let keySeq = 0;
const nextKey = () => `v${++keySeq}`;

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
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [images, setImages] = useState<UploadedImage[]>(initial?.images ?? []);
  const [variants, setVariants] = useState<VariantRow[]>(
    () => initial?.variants.map((v) => ({ ...v, key: nextKey() })) ?? []
  );

  // Variant builder state
  const [colors, setColors] = useState<{ name: string; hex: string }[]>(() => {
    const seen = new Map<string, string>();
    initial?.variants.forEach((v) => seen.set(v.colorName, v.colorHex));
    return seen.size ? [...seen].map(([name, hex]) => ({ name, hex })) : [COLOR_PRESETS[0]];
  });
  const [sizes, setSizes] = useState<string[]>(() =>
    initial?.variants.length ? [...new Set(initial.variants.map((v) => v.size))] : ["S", "M", "L", "XL"]
  );
  const [defaults, setDefaults] = useState({ price: "", salePrice: "", costPrice: "", stock: "", lowStockThreshold: "5" });
  const [customColor, setCustomColor] = useState({ name: "", hex: "#8B7355" });
  const [barcodePreview, setBarcodePreview] = useState<string | null>(null);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));
  const setVariant = (key: string, patch: Partial<VariantRow>) =>
    setVariants((vs) => vs.map((v) => (v.key === key ? { ...v, ...patch } : v)));

  const generateVariants = async () => {
    if (!form.name.trim()) return toast.error("Enter the product name first — it's used for SKUs.");
    if (!colors.length || !sizes.length) return toast.error("Pick at least one colour and one size.");
    const existing = new Set(variants.map((v) => `${v.colorName.toLowerCase()}|${v.size}`));
    const orderedSizes = SIZES.filter((s) => sizes.includes(s));
    const combos = colors.flatMap((c) => orderedSizes.map((s) => ({ c, s }))).filter(({ c, s }) => !existing.has(`${c.name.toLowerCase()}|${s}`));
    if (!combos.length) return toast("All those combinations already exist.");

    try {
      const codes = await newBarcodes(combos.length);
      setVariants((vs) => [
        ...vs,
        ...combos.map(({ c, s }, i) => ({
          key: nextKey(),
          size: s,
          colorName: c.name,
          colorHex: c.hex,
          price: defaults.price,
          salePrice: defaults.salePrice,
          costPrice: defaults.costPrice || "0",
          stock: defaults.stock || "0",
          lowStockThreshold: defaults.lowStockThreshold || "5",
          sku: buildSku(form.name, c.name, s),
          barcode: codes[i],
        })),
      ]);
      toast.success(`Added ${combos.length} variant${combos.length === 1 ? "" : "s"} with new barcodes`);
    } catch {
      toast.error("Could not generate barcodes");
    }
  };

  const applyToAll = (field: "price" | "salePrice" | "costPrice" | "stock" | "lowStockThreshold") => {
    const value = defaults[field];
    setVariants((vs) => vs.map((v) => ({ ...v, [field]: value })));
    toast.success("Applied to all variants");
  };

  const regenerateSkus = () => {
    setVariants((vs) => vs.map((v) => ({ ...v, sku: buildSku(form.name, v.colorName, v.size) })));
    toast.success("SKUs rebuilt from product name");
  };

  const regenerateBarcode = async (key: string) => {
    try {
      setVariant(key, { barcode: await newBarcode() });
    } catch {
      toast.error("Could not generate barcode");
    }
  };

  const summary = useMemo(() => {
    const units = variants.reduce((a, v) => a + (toInt(v.stock) || 0), 0);
    const prices = variants.map((v) => toInt(v.salePrice) || toInt(v.price)).filter((n) => n > 0);
    const margins = variants
      .map((v) => {
        const sell = toInt(v.salePrice) || toInt(v.price);
        const cost = toInt(v.costPrice);
        return sell > 0 && cost >= 0 ? ((sell - cost) / sell) * 100 : NaN;
      })
      .filter((n) => !Number.isNaN(n));
    return {
      units,
      minPrice: prices.length ? Math.min(...prices) : 0,
      margin: margins.length ? Math.round(margins.reduce((a, b) => a + b, 0) / margins.length) : null,
    };
  }, [variants]);

  const submit = (status: ProductInput["status"]) => {
    const payload: ProductInput = {
      id: initial?.id,
      ...form,
      status,
      slug: form.slug || slugify(form.name),
      images,
      variants: variants.map((v) => ({
        id: v.id,
        size: v.size,
        colorName: v.colorName,
        colorHex: v.colorHex,
        price: toInt(v.price),
        salePrice: v.salePrice.trim() ? toInt(v.salePrice) : null,
        costPrice: toInt(v.costPrice || "0"),
        stock: toInt(v.stock || "0"),
        lowStockThreshold: toInt(v.lowStockThreshold || "0"),
        sku: v.sku,
        barcode: v.barcode,
      })),
    };
    startTransition(async () => {
      const res = await saveProduct(payload);
      if (!res.ok) return void toast.error(res.error, { duration: 5000 });
      set("status", status);
      toast.success(isEdit ? "Product saved" : status === "active" ? "Product published" : "Draft saved");
      if (!isEdit) router.replace(`/admin/products/${res.data!.id}`);
      else router.refresh();
    });
  };

  const remove = () => {
    if (!initial?.id || !confirm(`Delete "${form.name}" and all ${variants.length} variants? This can't be undone.`)) return;
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
        <h1 className="text-heading-lg font-bold text-asur-white mb-2">Create a category first</h1>
        <p className="text-body-sm text-asur-silver mb-6">Every product belongs to a category like “Oversized Tees” or “Sleeveless”.</p>
        <Link href="/admin/categories"><Button>Go to categories</Button></Link>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <PageHeader
        back={
          <Link href="/admin/products" className="mt-1.5 p-1.5 text-asur-silver hover:text-asur-white" aria-label="Back to products">
            <ArrowLeft size={18} />
          </Link>
        }
        title={isEdit ? form.name || "Edit product" : "Add product"}
        subtitle={
          isEdit ? (
            <span className="flex items-center gap-3">
              <span className="capitalize">{form.status}</span>
              {form.status === "active" && (
                <Link href={`/product/${form.slug}`} target="_blank" className="inline-flex items-center gap-1 text-accent-primary hover:underline">
                  View in store <ExternalLink size={12} />
                </Link>
              )}
            </span>
          ) : "Fill in the details, generate variants, then publish."
        }
      />

      <div className="grid xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <Panel title="Basic information">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Product name</Label>
                <input
                  id="name"
                  value={form.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setForm((f) => ({ ...f, name, slug: slugTouched ? f.slug : slugify(name) }));
                  }}
                  placeholder="ASUR Heavy Oversized Tee"
                  className={fieldClass}
                />
              </div>
              <div>
                <Label htmlFor="slug" hint={`/product/${form.slug || "…"}`}>URL slug</Label>
                <input
                  id="slug"
                  value={form.slug}
                  onChange={(e) => { setSlugTouched(true); set("slug", e.target.value); }}
                  className={cn(fieldClass, "font-mono")}
                />
              </div>
              <div>
                <Label htmlFor="desc" hint={`${form.description.length} characters`}>Description</Label>
                <textarea
                  id="desc"
                  rows={5}
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="Fabric, fit, why it's built the way it is…"
                  className={cn(fieldClass, "resize-y")}
                />
              </div>
            </div>
          </Panel>

          <Panel title="Images" action={<span className="text-caption text-asur-slate">First image is the cover</span>}>
            <ImageUploader images={images} onChange={setImages} defaultAlt={form.name} />
          </Panel>

          <Panel title="Specifications">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="material">Material</Label>
                <input id="material" value={form.material} onChange={(e) => set("material", e.target.value)} placeholder="100% cotton, 280GSM" className={fieldClass} />
              </div>
              <div>
                <Label htmlFor="fit">Fit</Label>
                <select id="fit" value={form.fit} onChange={(e) => set("fit", e.target.value)} className={fieldClass}>
                  {["Oversized", "Regular", "Slim", "Compression"].map((f) => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <Label htmlFor="weight">Weight</Label>
                <input id="weight" value={form.weight} onChange={(e) => set("weight", e.target.value)} placeholder="320g" className={fieldClass} />
              </div>
              <div>
                <Label htmlFor="gender">Gender</Label>
                <select id="gender" value={form.gender} onChange={(e) => set("gender", e.target.value)} className={fieldClass}>
                  {["Men", "Women", "Unisex"].map((g) => <option key={g}>{g}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="care">Care instructions</Label>
                <input id="care" value={form.careInstructions} onChange={(e) => set("careInstructions", e.target.value)} className={fieldClass} />
              </div>
            </div>
          </Panel>

          <Panel title="Variant builder" action={<span className="text-caption text-asur-slate">Colours × sizes</span>}>
            <div className="space-y-5">
              <div>
                <Label>Colours</Label>
                <div className="flex flex-wrap gap-2">
                  {colors.map((c) => (
                    <span key={c.name} className="inline-flex items-center gap-2 pl-2 pr-1 py-1 border border-asur-iron bg-asur-graphite text-body-sm text-asur-white">
                      <span className="w-3.5 h-3.5 rounded-full border border-asur-slate" style={{ background: c.hex }} />
                      {c.name}
                      <button type="button" onClick={() => setColors(colors.filter((x) => x.name !== c.name))} className="p-0.5 text-asur-slate hover:text-status-error" aria-label={`Remove ${c.name}`}>
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {COLOR_PRESETS.filter((p) => !colors.some((c) => c.name === p.name)).map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => setColors([...colors, p])}
                      className="inline-flex items-center gap-1.5 px-2 py-1 border border-dashed border-asur-iron text-caption text-asur-silver hover:text-asur-white hover:border-asur-silver"
                    >
                      <span className="w-3 h-3 rounded-full border border-asur-slate" style={{ background: p.hex }} />
                      {p.name}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 mt-3 max-w-sm">
                  <input
                    type="color"
                    value={customColor.hex}
                    onChange={(e) => setCustomColor({ ...customColor, hex: e.target.value })}
                    className="h-10 w-12 shrink-0 bg-asur-graphite border border-asur-iron p-1 cursor-pointer"
                    aria-label="Custom colour"
                  />
                  <input
                    value={customColor.name}
                    onChange={(e) => setCustomColor({ ...customColor, name: e.target.value })}
                    placeholder="Custom colour name"
                    className={fieldClass}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const name = customColor.name.trim();
                      if (!name) return toast.error("Name the colour");
                      if (colors.some((c) => c.name.toLowerCase() === name.toLowerCase())) return toast.error("Colour already added");
                      setColors([...colors, { name, hex: customColor.hex.toUpperCase() }]);
                      setCustomColor({ ...customColor, name: "" });
                    }}
                    className="px-3 border border-asur-iron text-asur-white hover:border-asur-silver"
                    aria-label="Add custom colour"
                  >
                    <Plus size={16} />
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
                        onClick={() => setSizes(on ? sizes.filter((x) => x !== s) : [...sizes, s])}
                        className={cn(
                          "min-w-12 h-10 px-3 border text-body-sm font-medium transition-colors",
                          on ? "bg-asur-white text-asur-black border-asur-white" : "border-asur-iron text-asur-silver hover:border-asur-silver"
                        )}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <Label hint="Used for new variants · “All” overwrites existing rows">Defaults</Label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {([
                    ["price", "Price (Rs.)"],
                    ["salePrice", "Sale price"],
                    ["costPrice", "Cost price"],
                    ["stock", "Stock"],
                    ["lowStockThreshold", "Low alert"],
                  ] as const).map(([field, label]) => (
                    <div key={field}>
                      <div className="flex">
                        <input
                          type="number"
                          min={0}
                          value={defaults[field]}
                          onChange={(e) => setDefaults({ ...defaults, [field]: e.target.value })}
                          placeholder={label}
                          aria-label={label}
                          className={cn(fieldClass, "min-w-0")}
                        />
                        {variants.length > 0 && (
                          <button type="button" onClick={() => applyToAll(field)} className="px-2 border border-l-0 border-asur-iron text-[10px] uppercase tracking-wider text-asur-slate hover:text-asur-white" title={`Apply ${label} to all variants`}>
                            All
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-asur-slate mt-1">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <Button type="button" variant="secondary" onClick={generateVariants}>
                <span className="flex items-center gap-2"><Wand2 size={14} /> Generate variants &amp; barcodes</span>
              </Button>
            </div>
          </Panel>

          <Panel
            title={`Variants (${variants.length})`}
            action={
              variants.length > 0 && (
                <button type="button" onClick={regenerateSkus} className="flex items-center gap-1.5 text-caption text-asur-slate hover:text-asur-white">
                  <RefreshCw size={12} /> Rebuild SKUs
                </button>
              )
            }
            className="overflow-hidden"
          >
            {variants.length === 0 ? (
              <p className="text-body-sm text-asur-slate text-center py-6">
                No variants yet. Pick colours and sizes above, then press <span className="text-asur-white">Generate</span>.
              </p>
            ) : (
              <div className="-m-5 overflow-x-auto">
                <table className="w-full text-body-sm min-w-[980px]">
                  <thead>
                    <tr className="border-b border-asur-graphite text-left text-caption text-asur-slate uppercase tracking-wider">
                      <th className="px-4 py-2.5 font-medium">Variant</th>
                      <th className="px-2 py-2.5 font-medium">SKU</th>
                      <th className="px-2 py-2.5 font-medium">Barcode</th>
                      <th className="px-2 py-2.5 font-medium w-24">Price</th>
                      <th className="px-2 py-2.5 font-medium w-24">Sale</th>
                      <th className="px-2 py-2.5 font-medium w-24">Cost</th>
                      <th className="px-2 py-2.5 font-medium w-20">Stock</th>
                      <th className="px-2 py-2.5 font-medium w-20">Alert ≤</th>
                      <th className="px-2 py-2.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((v) => {
                      const cell = "w-full bg-transparent border border-transparent hover:border-asur-iron focus:border-asur-silver focus:bg-asur-graphite px-2 py-1.5 text-asur-white focus:outline-none";
                      return (
                        <tr key={v.key} className="border-b border-asur-graphite/60 last:border-0">
                          <td className="px-4 py-2 whitespace-nowrap">
                            <span className="inline-flex items-center gap-2 text-asur-white">
                              <span className="w-3.5 h-3.5 rounded-full border border-asur-slate" style={{ background: v.colorHex }} />
                              {v.colorName} <span className="text-asur-slate">/</span> <span className="font-medium">{v.size}</span>
                            </span>
                          </td>
                          <td className="px-2 py-2">
                            <input value={v.sku} onChange={(e) => setVariant(v.key, { sku: e.target.value.toUpperCase() })} className={`${cell} font-mono text-caption min-w-36`} aria-label="SKU" />
                          </td>
                          <td className="px-2 py-2">
                            <div className="flex items-center gap-1">
                              <button type="button" onClick={() => setBarcodePreview(v.barcode)} className="font-mono text-caption text-asur-silver hover:text-asur-white underline decoration-dotted underline-offset-4" title="Preview barcode">
                                {v.barcode}
                              </button>
                              <button type="button" onClick={() => regenerateBarcode(v.key)} className="p-1 text-asur-slate hover:text-asur-white" title="Generate a new barcode" aria-label="Regenerate barcode">
                                <RefreshCw size={12} />
                              </button>
                            </div>
                          </td>
                          <td className="px-2 py-2"><input type="number" min={0} value={v.price} onChange={(e) => setVariant(v.key, { price: e.target.value })} className={cell} aria-label="Price" placeholder="—" /></td>
                          <td className="px-2 py-2"><input type="number" min={0} value={v.salePrice} onChange={(e) => setVariant(v.key, { salePrice: e.target.value })} className={cell} aria-label="Sale price" placeholder="—" /></td>
                          <td className="px-2 py-2"><input type="number" min={0} value={v.costPrice} onChange={(e) => setVariant(v.key, { costPrice: e.target.value })} className={cell} aria-label="Cost price" /></td>
                          <td className="px-2 py-2"><input type="number" min={0} value={v.stock} onChange={(e) => setVariant(v.key, { stock: e.target.value })} className={cn(cell, (toInt(v.stock) || 0) <= (toInt(v.lowStockThreshold) || 0) && "text-status-warning")} aria-label="Stock" /></td>
                          <td className="px-2 py-2"><input type="number" min={0} value={v.lowStockThreshold} onChange={(e) => setVariant(v.key, { lowStockThreshold: e.target.value })} className={cell} aria-label="Low stock alert" /></td>
                          <td className="px-2 py-2 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                if (v.id && !confirm(`Remove ${v.colorName} / ${v.size}? Its stock history will be deleted when you save.`)) return;
                                setVariants(variants.filter((x) => x.key !== v.key));
                              }}
                              className="p-1.5 text-asur-slate hover:text-status-error"
                              aria-label={`Remove ${v.colorName} ${v.size}`}
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {isEdit && variants.some((v) => v.id) && (
              <p className="text-caption text-asur-slate mt-8">
                Tip: for day-to-day restocks use <Link href="/admin/inventory" className="text-accent-primary hover:underline">Stock levels</Link> — it keeps a reason for every change.
              </p>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Organisation">
            <div className="space-y-4">
              <div>
                <div className="flex items-baseline justify-between mb-1.5">
                  <Label htmlFor="category">Category</Label>
                  <Link href="/admin/categories" className="text-[11px] text-accent-primary hover:underline">Manage</Link>
                </div>
                <select id="category" value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)} className={fieldClass}>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <Label htmlFor="collection">Collection</Label>
                <input id="collection" value={form.collection} onChange={(e) => set("collection", e.target.value)} placeholder="Foundation" className={fieldClass} />
              </div>
              <div>
                <Label htmlFor="tags" hint="Comma separated">Tags</Label>
                <input id="tags" value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="bestseller, heavyweight" className={fieldClass} />
              </div>
              <div className="pt-2 space-y-4">
                <Toggle checked={form.featured} onChange={(v) => set("featured", v)} label="Featured" description="Show on the homepage" />
                <Toggle checked={form.isNew} onChange={(v) => set("isNew", v)} label="New arrival" description="Adds a NEW badge" />
              </div>
            </div>
          </Panel>

          <Panel title="Summary">
            <dl className="grid grid-cols-2 gap-4 text-body-sm">
              <div><dt className="text-caption text-asur-slate">Variants</dt><dd className="text-heading-sm text-asur-white">{variants.length}</dd></div>
              <div><dt className="text-caption text-asur-slate">Units in stock</dt><dd className="text-heading-sm text-asur-white">{summary.units}</dd></div>
              <div><dt className="text-caption text-asur-slate">From</dt><dd className="text-heading-sm text-asur-white">{summary.minPrice ? formatPrice(summary.minPrice) : "—"}</dd></div>
              <div><dt className="text-caption text-asur-slate">Avg. margin</dt><dd className={cn("text-heading-sm", summary.margin === null ? "text-asur-white" : summary.margin < 40 ? "text-status-warning" : "text-status-success")}>{summary.margin === null ? "—" : `${summary.margin}%`}</dd></div>
            </dl>
          </Panel>

          {isEdit && (
            <Panel title="Danger zone">
              <Button type="button" variant="danger" size="sm" onClick={remove} disabled={pending}>
                <span className="flex items-center gap-2"><Trash2 size={14} /> Delete product</span>
              </Button>
            </Panel>
          )}
        </div>
      </div>

      {/* Sticky save bar */}
      <div className="fixed bottom-0 right-0 left-0 lg:left-64 z-30 bg-asur-carbon/95 backdrop-blur border-t border-asur-graphite px-4 sm:px-8 py-3 flex items-center justify-end gap-2">
        <span className="mr-auto text-caption text-asur-slate hidden sm:block">
          {form.status === "active" ? "Live on the store" : form.status === "draft" ? "Draft — not visible to customers" : "Archived — hidden from the store"}
        </span>
        {form.status === "active" ? (
          <>
            <Button variant="ghost" size="sm" onClick={() => submit("draft")} disabled={pending}>Unpublish</Button>
            <Button size="sm" onClick={() => submit("active")} loading={pending}>Save changes</Button>
          </>
        ) : (
          <>
            <Button variant="outline" size="sm" onClick={() => submit(form.status === "archived" ? "archived" : "draft")} disabled={pending}>Save draft</Button>
            <Button size="sm" onClick={() => submit("active")} loading={pending}>Publish</Button>
          </>
        )}
      </div>

      {barcodePreview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setBarcodePreview(null)}>
          <div className="absolute inset-0 bg-black/70" />
          <div className="relative bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <BarcodeSvg value={barcodePreview} height={70} />
            <p className="text-center text-caption text-neutral-500 mt-2">EAN-13 · click outside to close</p>
          </div>
        </div>
      )}
    </div>
  );
}
