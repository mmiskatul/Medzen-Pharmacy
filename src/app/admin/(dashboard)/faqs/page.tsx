import { PageHeader } from "@/components/admin/page-header";
import { requireUser } from "@/lib/auth";

import { FaqsManager } from "./faqs-manager";

export const dynamic = "force-dynamic";
export const metadata = { title: "FAQs" };

export default async function FaqsPage() {
  await requireUser("cms.write");

  return (
    <>
      <PageHeader
        title="FAQs"
        description="Answers shown on the homepage. Write them the way you would say them at the counter."
      />
      <FaqsManager canWrite />
    </>
  );
}
