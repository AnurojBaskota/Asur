import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/server/db";
import { Footer } from "@/components/storefront/Sections";
import { RichText } from "@/components/storefront/RichText";

async function getPage(slug: string) {
  return db.page.findFirst({ where: { slug, published: true } });
}

export async function generateMetadata({ params }: PageProps<"/pages/[slug]">): Promise<Metadata> {
  const page = await getPage((await params).slug);
  return { title: page ? `${page.title} | ASUR` : "ASUR" };
}

export default async function ContentPage({ params }: PageProps<"/pages/[slug]">) {
  const page = await getPage((await params).slug);
  if (!page) notFound();

  return (
    <>
      <article className="pt-[150px] pb-24 max-w-3xl mx-auto px-4 sm:px-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent-primary mb-3">
          Updated {page.updatedAt.toLocaleDateString("en-GB", { dateStyle: "long" })}
        </p>
        <h1 className="font-display condensed font-black uppercase text-asur-white leading-[0.85] text-[clamp(3.25rem,8vw,6rem)] mb-10">{page.title}</h1>
        <RichText body={page.body} />
      </article>
      <Footer />
    </>
  );
}
