import { PageHeader } from "@/components/admin/page-header";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/rbac";

import { InventoryBoard } from "./inventory-board";

export const dynamic = "force-dynamic";
export const metadata = { title: "Inventory" };

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const [user, params] = await Promise.all([
    requireUser("inventory.read"),
    searchParams,
  ]);

  return (
    <>
      <PageHeader
        title="Inventory"
        description="Stock levels, batches and expiry dates. None of this is shown to customers — the website only shows in stock, low or out of stock."
      />
      <InventoryBoard
        canWrite={can(user, "inventory.write")}
        initialFilter={params.filter ?? ""}
      />
    </>
  );
}
