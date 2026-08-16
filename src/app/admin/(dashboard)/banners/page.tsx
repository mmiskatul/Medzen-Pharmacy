import { PageHeader } from "@/components/admin/page-header";
import { requireUser } from "@/lib/auth";

import { BannersManager } from "./banners-manager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Banners" };

export default async function BannersPage() {
  await requireUser("cms.write");

  return (
    <>
      <PageHeader
        title="Banners"
        description="Promotional panels for the website. Set a start and end date and a banner shows and hides itself."
      />
      <BannersManager canWrite />
    </>
  );
}
