"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FolderTree, Pencil, Plus, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { SmartImage } from "@/components/ui/SmartImage";
import { slugify } from "@/lib/barcode";
import { deleteCategory, saveCategory } from "@/app/admin/actions";
import { ImageUploader } from "./ImageUploader";
import { SizeChartEditor } from "./SizeChartEditor";
import type { SizeChart } from "@/lib/settings";
import { EmptyState, Label, PageHeader, fieldClass } from "./ui";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  sortOrder: number;
  productCount: number;
  sizeChart: SizeChart | null;
};

const blank: Category = { id: "", name: "", slug: "", description: "", image: "", sortOrder: 0, productCount: 0, sizeChart: null };

export function CategoryManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Category | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [pending, startTransition] = useTransition();

  const open = (c?: Category) => {
    setEditing(c ?? { ...blank, sortOrder: categories.length });
    setSlugTouched(!!c);
  };

  const save = () => {
    if (!editing) return;
    startTransition(async () => {
      const res = await saveCategory({
        id: editing.id || undefined,
        name: editing.name,
        slug: editing.slug,
        description: editing.description,
        image: editing.image,
        sortOrder: editing.sortOrder,
        sizeChart: editing.sizeChart,
      });
      if (!res.ok) return void toast.error(res.error);
      toast.success(editing.id ? "Category updated" : "Category created");
      setEditing(null);
      router.refresh();
    });
  };

  const remove = (c: Category) => {
    if (!confirm(`Delete the "${c.name}" category?`)) return;
    startTransition(async () => {
      const res = await deleteCategory(c.id);
      if (!res.ok) return void toast.error(res.error);
      toast.success("Category deleted");
      router.refresh();
    });
  };

  return (
    <div>
      <PageHeader
        title="Categories"
        subtitle="Group products for the storefront menu and filters."
        actions={
          <Button size="sm" onClick={() => open()}>
            <span className="flex items-center gap-2"><Plus size={14} /> New category</span>
          </Button>
        }
      />

      {categories.length === 0 ? (
        <div className="bg-asur-carbon border border-asur-graphite">
          <EmptyState icon={<FolderTree size={36} />} title="No categories yet">
            Create your first category, e.g. “Oversized Tees” or “Sleeveless”.
          </EmptyState>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {categories.map((c) => (
            <div key={c.id} className="bg-asur-carbon border border-asur-graphite flex">
              <div className="relative w-28 shrink-0 bg-asur-graphite">
                {c.image ? (
                  <SmartImage src={c.image} alt={c.name} fill sizes="112px" className="object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-asur-iron"><FolderTree size={24} /></div>
                )}
              </div>
              <div className="flex-1 min-w-0 p-4 flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-body-md font-medium text-asur-white truncate">{c.name}</h3>
                    <p className="text-caption text-asur-slate font-mono truncate">/category/{c.slug}</p>
                  </div>
                  <div className="flex shrink-0">
                    <button onClick={() => open(c)} className="p-1.5 text-asur-slate hover:text-asur-white" aria-label={`Edit ${c.name}`}><Pencil size={14} /></button>
                    <button onClick={() => remove(c)} disabled={pending} className="p-1.5 text-asur-slate hover:text-status-error" aria-label={`Delete ${c.name}`}><Trash2 size={14} /></button>
                  </div>
                </div>
                {c.description && <p className="text-caption text-asur-silver mt-2 line-clamp-2">{c.description}</p>}
                <Link href={`/admin/products?category=${c.id}`} className="mt-auto pt-3 text-caption text-accent-primary hover:underline">
                  {c.productCount} product{c.productCount === 1 ? "" : "s"} →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          <div className="absolute inset-0 bg-black/60" onClick={() => !pending && setEditing(null)} />
          <div className="relative w-full max-w-xl h-full bg-asur-carbon border-l border-asur-graphite flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-asur-graphite">
              <h2 className="text-body-md font-medium text-asur-white">{editing.id ? "Edit category" : "New category"}</h2>
              <button onClick={() => setEditing(null)} className="p-1.5 text-asur-silver hover:text-asur-white" aria-label="Close"><X size={18} /></button>
            </div>
            <form
              className="flex-1 overflow-y-auto p-5 space-y-5"
              onSubmit={(e) => { e.preventDefault(); save(); }}
            >
              <div>
                <Label htmlFor="cat-name">Name</Label>
                <input
                  id="cat-name"
                  autoFocus
                  required
                  value={editing.name}
                  onChange={(e) =>
                    setEditing({ ...editing, name: e.target.value, slug: slugTouched ? editing.slug : slugify(e.target.value) })
                  }
                  placeholder="Oversized Tees"
                  className={fieldClass}
                />
              </div>
              <div>
                <Label htmlFor="cat-slug" hint="Used in the URL">Slug</Label>
                <input
                  id="cat-slug"
                  value={editing.slug}
                  onChange={(e) => { setSlugTouched(true); setEditing({ ...editing, slug: e.target.value }); }}
                  className={cn(fieldClass, "font-mono")}
                />
              </div>
              <div>
                <Label htmlFor="cat-desc">Description</Label>
                <textarea
                  id="cat-desc"
                  rows={3}
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  placeholder="Shown on the category page"
                  className={cn(fieldClass, "resize-none")}
                />
              </div>
              <div>
                <Label htmlFor="cat-order" hint="Lower shows first">Sort order</Label>
                <input
                  id="cat-order"
                  type="number"
                  value={editing.sortOrder}
                  onChange={(e) => setEditing({ ...editing, sortOrder: Number(e.target.value) })}
                  className={fieldClass}
                />
              </div>
              <div>
                <Label>Cover image</Label>
                <ImageUploader
                  multiple={false}
                  images={editing.image ? [{ url: editing.image, alt: editing.name }] : []}
                  onChange={(imgs) => setEditing({ ...editing, image: imgs[0]?.url ?? "" })}
                />
              </div>
              <div>
                <Label hint="Shown as “Size guide” on product pages">Size chart</Label>
                <SizeChartEditor value={editing.sizeChart} onChange={(sizeChart) => setEditing({ ...editing, sizeChart })} />
              </div>
            </form>
            <div className="flex gap-2 px-5 py-4 border-t border-asur-graphite">
              <Button variant="outline" fullWidth onClick={() => setEditing(null)} disabled={pending}>Cancel</Button>
              <Button fullWidth onClick={save} loading={pending}>Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
