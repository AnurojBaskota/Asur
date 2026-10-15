import type { Metadata } from "next";
import { BrandStory, CraftSection, Footer, ValuesMarquee } from "@/components/storefront/Sections";
import { getSettings } from "@/lib/server/settings";

export const metadata: Metadata = { title: "Our story | ASUR" };

export default async function AboutPage() {
  const settings = await getSettings();
  return (
    <>
      <div className="pt-[96px]">
        <BrandStory c={{ ...settings.story, enabled: true }} />
        <ValuesMarquee words={settings.values.filter(Boolean)} />
        <CraftSection c={{ ...settings.craft, enabled: true }} />
      </div>
      <Footer />
    </>
  );
}
