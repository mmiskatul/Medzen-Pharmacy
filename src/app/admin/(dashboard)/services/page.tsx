import { PageHeader } from "@/components/admin/page-header";
import { requireUser } from "@/lib/auth";

import { ServicesManager } from "./services-manager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Services" };

export default async function ServicesPage() {
  await requireUser("cms.write");

  return (
    <>
      <PageHeader
        title="Services"
        description="Only list services the pharmacy actually offers. Anything here appears on the homepage and the services page."
      />
      <ServicesManager canWrite />
    </>
  );
}
