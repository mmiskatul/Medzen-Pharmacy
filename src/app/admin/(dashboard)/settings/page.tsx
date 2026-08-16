import { PageHeader } from "@/components/admin/page-header";
import { requireUser } from "@/lib/auth";
import { getSettings } from "@/lib/site-settings.server";

import { SettingsForm } from "./settings-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  await requireUser("settings.write");
  const settings = await getSettings();

  return (
    <>
      <PageHeader
        title="Settings"
        description="Business details, contact numbers, opening hours and website content. Nothing here is hardcoded — what you save is what the website shows."
      />
      <SettingsForm initial={settings} />
    </>
  );
}
