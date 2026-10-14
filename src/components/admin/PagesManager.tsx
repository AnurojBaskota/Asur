"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, FileText, Pencil, Plus, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { slugify } from "@/lib/barcode";
import { cn } from "@/lib/utils";
import { deletePage, savePage, type PageInput } from "@/app/admin/actions";
import { RichText } from "@/components/storefront/RichText";
import { EmptyState, Label, PageHeader, Toggle, fieldClass } from "./ui";

type Row = PageInput & { id: string; updatedAt: string };

const BLANK: PageInput = { title: "", slug: "", body: "", published: true, showInFooter: true, sortOrder: 0 };

export function PagesManager({ pages }: { pages: Row[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<PageInput | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [preview, setPreview] = useState(false);
  const [pending, startTransition] = useTransition();

  const open = (p?: Row) => {
    setEditing(p ? { ...p } : { ...BLANK, sortOrder: pages.length });
    setSlugTouched(!!p);
    setPreview(false);
  };

  const save = () => {
    if (!editing) return;
    startTransition(async () => {
      const res = await savePage(editing);
      if (!res.ok) return void toast.error(res.error);
      toast.success("Page saved");
      setEditing(null);
      router.refresh();
    });
  };

  const remove = (p: Row) => {
    if (!confirm(`Delete “${p.title}”?`)) return;
    startTransition(async () => {
      await deletePage(p.id);
      toast.success("Page deleted");
      router.refresh();
    });
  };

  return (
    <div>
      <PageHeader
        title="Pages"
        subtitle="Shipping, returns, size guide, privacy, terms — shown in the store footer."
        actions={<Button size="sm" onClick={() => open()}><span className="flex items-center gap-2"><Plus size={14} /> New page</span></Button>}
      />

      <div className="bg-asur-carbon border border-asur-graphite">
        {pages.length === 0 ? (
          <EmptyState icon={<FileText size={36} />} title="No pages yet">Create your shipping, returns and privacy pages.</EmptyState>
        ) : (
          <ul className="divide-y divide-asur-graphite">
            {pages.map((p) => (
              <li key={p.id} className="flex items-center gap-4 px-5 py-4">
                <FileText size={18} className="text-asur-slate shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-body-sm text-asur-white">{p.title}</p>
                  <p className="text-caption text-asur-slate font-mono">/pages/{p.slug}</p>
                </div>
                <span className={cn("text-caption", p.published ? "text-status-success" : "text-asur-slate")}>{p.published ? "Published" : "Hidden"}</span>
                {p.showInFooter && p.published && <span className="hidden sm:inline text-caption text-asur-slate">In footer</span>}
                <a href={`/pages/${p.slug}`} target="_blank" className="p-1.5 text-asur-slate hover:text-asur-white" aria-label={`View ${p.title}`}><ExternalLink size={14} /></a>
                <button onClick={() => open(p)} className="p-1.5 text-asur-slate hover:text-asur-white" aria-label={`Edit ${p.title}`}><Pencil size={14} /></button>
                <button onClick={() => remove(p)} disabled={pending} className="p-1.5 text-asur-slate hover:text-status-error" aria-label={`Delete ${p.title}`}><Trash2 size={14} /></button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          <div className="absolute inset-0 bg-black/60" onClick={() => !pending && setEditing(null)} />
          <div className="relative w-full max-w-3xl h-full bg-asur-carbon border-l border-asur-graphite flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-asur-graphite">
              <h2 className="text-body-md font-medium text-asur-white">{editing.title || "New page"}</h2>
              <button onClick={() => setEditing(null)} className="p-1.5 text-asur-silver hover:text-asur-white" aria-label="Close"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pg-title">Title</Label>
                  <input
                    id="pg-title"
                    autoFocus
                    value={editing.title}
                    onChange={(e) => setEditing({ ...editing, title: e.target.value, slug: slugTouched ? editing.slug : slugify(e.target.value) })}
                    className={fieldClass}
                  />
                </div>
                <div>
                  <Label htmlFor="pg-slug" hint={`/pages/${editing.slug || "…"}`}>Slug</Label>
                  <input id="pg-slug" value={editing.slug} onChange={(e) => { setSlugTouched(true); setEditing({ ...editing, slug: e.target.value }); }} className={cn(fieldClass, "font-mono")} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label htmlFor="pg-body" hint="Blank line = new paragraph · ## Heading · - bullet · [text](https://…)">Content</Label>
                </div>
                <div className="flex gap-1 mb-2">
                  {["Write", "Preview"].map((t) => (
                    <button key={t} type="button" onClick={() => setPreview(t === "Preview")} className={cn("px-3 h-8 text-caption uppercase tracking-wider border", (t === "Preview") === preview ? "border-asur-white text-asur-white" : "border-asur-iron text-asur-slate")}>
                      {t}
                    </button>
                  ))}
                </div>
                {preview ? (
                  <div className="min-h-[320px] border border-asur-iron bg-asur-black p-6"><RichText body={editing.body} /></div>
                ) : (
                  <textarea id="pg-body" rows={16} value={editing.body} onChange={(e) => setEditing({ ...editing, body: e.target.value })} className={cn(fieldClass, "font-mono text-caption leading-relaxed resize-y")} />
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <Toggle checked={editing.published} onChange={(v) => setEditing({ ...editing, published: v })} label="Published" description="Visible to customers" />
                <Toggle checked={editing.showInFooter} onChange={(v) => setEditing({ ...editing, showInFooter: v })} label="Show in footer" description="Under Help" />
                <div>
                  <Label htmlFor="pg-order" hint="Lower shows first">Footer order</Label>
                  <input id="pg-order" type="number" value={editing.sortOrder} onChange={(e) => setEditing({ ...editing, sortOrder: Number(e.target.value) })} className={fieldClass} />
                </div>
              </div>
            </div>
            <div className="flex gap-2 px-5 py-4 border-t border-asur-graphite">
              <Button variant="outline" fullWidth onClick={() => setEditing(null)} disabled={pending}>Cancel</Button>
              <Button fullWidth onClick={save} loading={pending}>Save page</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
