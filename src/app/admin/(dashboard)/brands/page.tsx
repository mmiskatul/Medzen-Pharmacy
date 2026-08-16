import { PageHeader } from "@/components/admin/page-header";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/rbac";

import { BrandsManager } from "./brands-manager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Brands" };

export default async function BrandsPage() {
  const user = await requireUser("products.read");

  return (
    <>
      <PageHeader
        title="Brands"
        description="Manufacturers and ranges you stock. Brands appear as a filter on the products page."
      />
      <BrandsManager canWrite={can(user, "brands.write")} />
    </>
  );
}
