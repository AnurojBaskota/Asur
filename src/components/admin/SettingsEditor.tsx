"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ExternalLink, Plus, RotateCcw, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { DEFAULT_SETTINGS, type SettingsKey, type StoreSettings } from "@/lib/settings";
import { resetSettingsSection, saveSettingsSection } from "@/app/admin/actions";
import { ImageUploader } from "./ImageUploader";
import { Label, PageHeader, Panel, Toggle, fieldClass } from "./ui";

const SECTIONS: { key: SettingsKey; title: string; description: string }[] = [
  { key: "shipping", title: "Shipping & checkout", description: "Delivery fees, free-shipping threshold and return policy used across the store and checkout." },
  { key: "announcements", title: "Announcement bar", description: "Messages that scroll across the top of every page. Leave empty to hide the bar." },
  { key: "hero", title: "Homepage hero", description: "The full-screen banner at the top of the homepage." },
  { key: "values", title: "Values strip", description: "Big words that scroll under the hero." },
  { key: "campaign", title: "Campaign section", description: "Split image + statement block on the homepage." },
  { key: "craft", title: "Construction section", description: "Fabric and fit highlights with big numbers." },
  { key: "story", title: "Brand story", description: "Full-width story section near the bottom of the homepage." },
  { key: "newsletter", title: "Newsletter", description: "Sign-up block above the footer." },
  { key: "brand", title: "Brand & contact", description: "Store name, footer text, contact details and social links." },
];

const LABELS: Record<string, string> = {
  freeThreshold: "Free shipping above (Rs.)",
  flatFee: "Shipping fee below threshold (Rs.)",
  deliveryDays: "Delivery time",
  returnDays: "Return window (days)",
  returnConditions: "Return conditions",
  codEnabled: "Accept Cash on Delivery orders",
  sideNote: "Top-right note",
  sideNoteSub: "Top-right note (second line)",
  titleLine1: "Headline — line 1",
  titleLine2: "Headline — line 2 (solid)",
  outlineWord: "Outlined word",
  primaryLabel: "Main button text",
  primaryHref: "Main button link",
  secondaryLabel: "Second button text",
  secondaryHref: "Second button link",
  ctaLabel: "Button text",
  ctaHref: "Button link",
  enabled: "Show this section",
  footerText: "Footer description",
  contactEmail: "Contact email",
  contactPhone: "Contact phone",
};

const MULTILINE = new Set(["subtitle", "body", "text", "footerText"]);
const IMAGE = new Set(["image"]);

const human = (k: string) => LABELS[k] ?? k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());

export function SettingsEditor({ settings }: { settings: StoreSettings }) {
  const [active, setActive] = useState<SettingsKey>("shipping");
  const section = SECTIONS.find((s) => s.key === active)!;

  return (
    <div>
      <PageHeader
        title="Store settings"
        subtitle="Everything customers see on the storefront — no code changes needed."
        actions={
          <a href="/" target="_blank" className="inline-flex items-center gap-2 text-body-sm text-asur-silver hover:text-asur-white">
            View store <ExternalLink size={14} />
          </a>
        }
      />
      <div className="grid lg:grid-cols-[220px_1fr] gap-6">
        <nav className="flex lg:flex-col gap-1 overflow-x-auto no-scrollbar">
          {SECTIONS.map((s) => (
            <button
              key={s.key}
              onClick={() => setActive(s.key)}
              className={cn(
                "shrink-0 text-left px-3 py-2.5 text-body-sm transition-colors border-l-2",
                active === s.key ? "border-accent-primary text-asur-white bg-asur-steel/30" : "border-transparent text-asur-silver hover:text-asur-white"
              )}
            >
              {s.title}
            </button>
          ))}
        </nav>
        {/* key resets local form state when switching tabs */}
        <SectionForm key={active} sectionKey={active} title={section.title} description={section.description} initial={settings[active]} />
      </div>
    </div>
  );
}

function SectionForm<K extends SettingsKey>({
  sectionKey,
  title,
  description,
  initial,
}: {
  sectionKey: K;
  title: string;
  description: string;
  initial: StoreSettings[K];
}) {
  const router = useRouter();
  const [value, setValue] = useState<unknown>(initial);
  const [pending, startTransition] = useTransition();
  const dirty = JSON.stringify(value) !== JSON.stringify(initial);

  const save = () =>
    startTransition(async () => {
      const res = await saveSettingsSection(sectionKey, value);
      if (!res.ok) return void toast.error(res.error);
      toast.success(`${title} saved — live on the store`);
      router.refresh();
    });

  const reset = () => {
    if (!confirm(`Reset “${title}” to the default content?`)) return;
    startTransition(async () => {
      await resetSettingsSection(sectionKey);
      setValue(DEFAULT_SETTINGS[sectionKey]);
      toast.success("Reset to defaults");
      router.refresh();
    });
  };

  return (
    <Panel
      title={title}
      action={
        <button onClick={reset} disabled={pending} className="flex items-center gap-1.5 text-caption text-asur-slate hover:text-asur-white">
          <RotateCcw size={12} /> Reset to default
        </button>
      }
    >
      <p className="text-body-sm text-asur-silver -mt-1 mb-6">{description}</p>
      <FieldFor name={title} template={DEFAULT_SETTINGS[sectionKey]} value={value} onChange={setValue} root />
      <div className="sticky bottom-0 -mx-5 -mb-5 mt-8 px-5 py-4 bg-asur-carbon/95 backdrop-blur border-t border-asur-graphite flex items-center justify-end gap-3">
        {dirty && <span className="mr-auto text-caption text-status-warning">Unsaved changes</span>}
        <Button variant="ghost" size="sm" onClick={() => setValue(initial)} disabled={!dirty || pending}>Discard</Button>
        <Button size="sm" onClick={save} loading={pending} disabled={!dirty}>Save</Button>
      </div>
    </Panel>
  );
}

/** Renders an input for any value, following the shape of its default. */
function FieldFor({
  name,
  template,
  value,
  onChange,
  root,
}: {
  name: string;
  template: unknown;
  value: unknown;
  onChange: (v: unknown) => void;
  root?: boolean;
}) {
  const id = `f-${name}`;

  if (typeof template === "boolean") {
    return <Toggle checked={!!value} onChange={onChange} label={human(name)} />;
  }

  if (typeof template === "number") {
    return (
      <div>
        <Label htmlFor={id}>{human(name)}</Label>
        <input id={id} type="number" min={0} value={Number(value ?? 0)} onChange={(e) => onChange(Number(e.target.value))} className={fieldClass} />
      </div>
    );
  }

  if (typeof template === "string") {
    if (IMAGE.has(name)) {
      return (
        <div>
          <Label>{human(name)}</Label>
          <ImageUploader multiple={false} images={value ? [{ url: String(value), alt: "" }] : []} onChange={(imgs) => onChange(imgs[0]?.url ?? "")} />
        </div>
      );
    }
    const multiline = MULTILINE.has(name) || String(template).length > 90;
    return (
      <div>
        <Label htmlFor={id}>{human(name)}</Label>
        {multiline ? (
          <textarea id={id} rows={3} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} className={cn(fieldClass, "resize-y")} />
        ) : (
          <input id={id} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} className={fieldClass} />
        )}
      </div>
    );
  }

  if (Array.isArray(template)) {
    const list = Array.isArray(value) ? value : [];
    const itemTemplate = template[0];
    const move = (i: number, d: -1 | 1) => {
      const j = i + d;
      if (j < 0 || j >= list.length) return;
      const next = [...list];
      [next[i], next[j]] = [next[j], next[i]];
      onChange(next);
    };
    const blank = typeof itemTemplate === "object" ? Object.fromEntries(Object.keys(itemTemplate as object).map((k) => [k, ""])) : "";
    return (
      <div>
        {!root && <Label>{human(name)}</Label>}
        <div className="space-y-2">
          {list.map((item, i) => (
            <div key={i} className={cn("flex gap-2", typeof itemTemplate === "object" && "items-start border border-asur-graphite p-3")}>
              <div className="flex-1 min-w-0">
                {typeof itemTemplate === "object" ? (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {Object.keys(itemTemplate as object).map((k) => (
                      <div key={k} className={MULTILINE.has(k) ? "sm:col-span-2" : ""}>
                        <FieldFor
                          name={k}
                          template={(itemTemplate as Record<string, unknown>)[k]}
                          value={(item as Record<string, unknown>)?.[k]}
                          onChange={(v) => onChange(list.map((x, xi) => (xi === i ? { ...(x as object), [k]: v } : x)))}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <input value={String(item ?? "")} onChange={(e) => onChange(list.map((x, xi) => (xi === i ? e.target.value : x)))} className={fieldClass} aria-label={`${human(name)} ${i + 1}`} />
                )}
              </div>
              <div className="flex shrink-0">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="p-2 text-asur-slate hover:text-asur-white disabled:opacity-30" aria-label="Move up"><ArrowUp size={14} /></button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === list.length - 1} className="p-2 text-asur-slate hover:text-asur-white disabled:opacity-30" aria-label="Move down"><ArrowDown size={14} /></button>
                <button type="button" onClick={() => onChange(list.filter((_, xi) => xi !== i))} className="p-2 text-asur-slate hover:text-status-error" aria-label="Remove"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => onChange([...list, blank])} className="mt-3 inline-flex items-center gap-1.5 text-caption text-accent-primary hover:underline">
          <Plus size={12} /> Add {typeof itemTemplate === "object" ? "item" : "line"}
        </button>
      </div>
    );
  }

  if (template && typeof template === "object") {
    const obj = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
    const entries = Object.entries(template as Record<string, unknown>);
    return (
      <div className={cn("grid gap-5", root ? "sm:grid-cols-2" : "")}>
        {entries.map(([k, t]) => {
          const wide = Array.isArray(t) || IMAGE.has(k) || MULTILINE.has(k) || (typeof t === "string" && t.length > 90) || typeof t === "boolean";
          return (
            <div key={k} className={wide && root ? "sm:col-span-2" : ""}>
              <FieldFor name={k} template={t} value={obj[k]} onChange={(v) => onChange({ ...obj, [k]: v })} />
            </div>
          );
        })}
      </div>
    );
  }

  return null;
}
