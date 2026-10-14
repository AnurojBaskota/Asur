"use client";

import { useRef, useState } from "react";
import { ImagePlus, Link2, Loader2, Star, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import { SmartImage } from "@/components/ui/SmartImage";
import { cn } from "@/lib/utils";
import { fieldClass } from "./ui";

export type UploadedImage = { url: string; alt: string };

async function uploadFiles(files: File[]): Promise<string[]> {
  const body = new FormData();
  files.forEach((f) => body.append("files", f));
  const res = await fetch("/api/admin/uploads", { method: "POST", body });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? "Upload failed");
  return json.urls as string[];
}

export function ImageUploader({
  images,
  onChange,
  multiple = true,
  defaultAlt = "",
}: {
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  multiple?: boolean;
  defaultAlt?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [urlMode, setUrlMode] = useState(false);
  const [url, setUrl] = useState("");

  const add = (urls: string[]) => {
    const next = urls.map((u) => ({ url: u, alt: defaultAlt }));
    onChange(multiple ? [...images, ...next] : next.slice(0, 1));
  };

  const handleFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    const files = Array.from(list).slice(0, multiple ? 12 : 1);
    setUploading(true);
    try {
      add(await uploadFiles(files));
      toast.success(files.length > 1 ? `${files.length} images uploaded` : "Image uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const addUrl = () => {
    const u = url.trim();
    if (!/^https:\/\/\S+$/.test(u)) return toast.error("Enter an https:// image URL");
    add([u]);
    setUrl("");
    setUrlMode(false);
  };

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= images.length) return;
    const next = [...images];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {images.length > 0 && (
        <div className={cn("grid gap-3", multiple ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-1")}>
          {images.map((img, i) => (
            <div key={img.url + i} className="group border border-asur-iron bg-asur-graphite">
              <div className="relative aspect-[3/4] overflow-hidden">
                <SmartImage src={img.url} alt={img.alt || "Product image"} fill sizes="200px" className="object-cover" />
                {multiple && i === 0 && (
                  <span className="absolute top-2 left-2 bg-asur-white text-asur-black text-[10px] font-semibold px-1.5 py-0.5 uppercase tracking-wider">
                    Cover
                  </span>
                )}
                <div className="absolute inset-x-0 bottom-0 flex justify-between p-1.5 bg-gradient-to-t from-black/80 to-transparent opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <div className="flex gap-1">
                    {multiple && (
                      <>
                        <IconBtn label="Move left" onClick={() => move(i, -1)} disabled={i === 0}><ChevronLeft size={14} /></IconBtn>
                        <IconBtn label="Move right" onClick={() => move(i, 1)} disabled={i === images.length - 1}><ChevronRight size={14} /></IconBtn>
                        {i !== 0 && (
                          <IconBtn label="Make cover" onClick={() => onChange([img, ...images.filter((_, k) => k !== i)])}><Star size={14} /></IconBtn>
                        )}
                      </>
                    )}
                  </div>
                  <IconBtn label="Remove image" onClick={() => onChange(images.filter((_, k) => k !== i))} danger><Trash2 size={14} /></IconBtn>
                </div>
              </div>
              <input
                value={img.alt}
                onChange={(e) => onChange(images.map((im, k) => (k === i ? { ...im, alt: e.target.value } : im)))}
                placeholder="Alt text (for SEO & accessibility)"
                className="w-full bg-transparent border-t border-asur-iron px-2 py-1.5 text-caption text-asur-ash placeholder:text-asur-slate focus:outline-none"
              />
            </div>
          ))}
        </div>
      )}

      {(multiple || images.length === 0) && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
          onClick={() => !uploading && inputRef.current?.click()}
          className={cn(
            "border-2 border-dashed p-6 text-center cursor-pointer transition-colors",
            dragOver ? "border-accent-primary bg-accent-primary/5" : "border-asur-iron hover:border-asur-silver"
          )}
        >
          {uploading ? (
            <Loader2 size={22} className="mx-auto mb-2 animate-spin text-asur-silver" />
          ) : (
            <ImagePlus size={22} className="mx-auto mb-2 text-asur-silver" />
          )}
          <p className="text-body-sm text-asur-silver">{uploading ? "Uploading…" : "Click or drag images here"}</p>
          <p className="text-caption text-asur-slate mt-1">JPG, PNG or WebP · up to 5 MB each</p>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple={multiple}
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
      )}

      {(multiple || images.length === 0) &&
        (urlMode ? (
          <div className="flex gap-2">
            <input
              autoFocus
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addUrl())}
              placeholder="https://…"
              className={fieldClass}
            />
            <button type="button" onClick={addUrl} className="px-3 border border-asur-iron text-body-sm text-asur-white hover:border-asur-silver">Add</button>
          </div>
        ) : (
          <button type="button" onClick={() => setUrlMode(true)} className="flex items-center gap-1.5 text-caption text-asur-slate hover:text-asur-white transition-colors">
            <Link2 size={12} /> Or add from an image URL
          </button>
        ))}
    </div>
  );
}

function IconBtn({ children, label, onClick, disabled, danger }: { children: React.ReactNode; label: string; onClick: () => void; disabled?: boolean; danger?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={cn(
        "w-7 h-7 flex items-center justify-center bg-asur-black/70 text-asur-white disabled:opacity-30",
        danger ? "hover:bg-status-error" : "hover:bg-asur-steel"
      )}
    >
      {children}
    </button>
  );
}
