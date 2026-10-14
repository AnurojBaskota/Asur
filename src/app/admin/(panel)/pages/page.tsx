import { db } from "@/lib/server/db";
import { requireAdmin } from "@/lib/server/session";
import { PagesManager } from "@/components/admin/PagesManager";

export default async function PagesAdmin() {
  await requireAdmin();
  const pages = await db.page.findMany({ orderBy: [{ sortOrder: "asc" }, { title: "asc" }] });
  return (
    <PagesManager
      pages={pages.map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        body: p.body,
        published: p.published,
        showInFooter: p.showInFooter,
        sortOrder: p.sortOrder,
        updatedAt: p.updatedAt.toISOString(),
      }))}
    />
  );
}
