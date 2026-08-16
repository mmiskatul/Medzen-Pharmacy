import { PageHeader } from "@/components/admin/page-header";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/rbac";

import { CategoriesManager } from "./categories-manager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const user = await requireUser("products.read");

  return (
    <>
      <PageHeader
        title="Categories"
        description="The aisles customers browse on the website. Turn a category off to hide it without deleting its products."
      />
      <CategoriesManager canWrite={can(user, "categories.write")} />
    </>
  );
}
