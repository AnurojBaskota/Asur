import { requireAdmin } from "@/lib/server/session";
import { getSettings } from "@/lib/server/settings";
import { SettingsEditor } from "@/components/admin/SettingsEditor";

export default async function SettingsPage() {
  await requireAdmin();
  return <SettingsEditor settings={await getSettings()} />;
}
