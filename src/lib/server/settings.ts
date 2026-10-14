import "server-only";
import { cache } from "react";
import { db } from "./db";
import { DEFAULT_SETTINGS, SETTINGS_KEYS, sanitizeLike, type StoreSettings } from "@/lib/settings";

/** All settings merged over defaults. Deduped per request via React cache(). */
export const getSettings = cache(async (): Promise<StoreSettings> => {
  const rows = await db.setting.findMany({ where: { key: { in: SETTINGS_KEYS } } });
  const out = structuredClone(DEFAULT_SETTINGS) as Record<string, unknown>;
  for (const row of rows) {
    try {
      const key = row.key as keyof StoreSettings;
      out[key] = sanitizeLike(DEFAULT_SETTINGS[key], JSON.parse(row.value));
    } catch {
      // Corrupt row: keep the default for that section.
    }
  }
  return out as StoreSettings;
});

export const getFooterPages = cache(async () =>
  db.page.findMany({
    where: { published: true, showInFooter: true },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    select: { slug: true, title: true },
  })
);
