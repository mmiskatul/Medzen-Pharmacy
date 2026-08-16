import Link from "next/link";
import { Plus } from "lucide-react";

import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/rbac";

import { ProductsTable } from "./products-table";

export const dynamic = "force-dynamic";
export const metadata = { title: "Products" };

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const [user, params] = await Promise.all([
    requireUser("products.read"),
    searchParams,
  ]);

  const categories = await prisma.category.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const canWrite = can(user, "products.write");

  return (
    <>
      <PageHeader
        title="Products"
        description="Everything in the catalog, published or draft. Stock levels here are internal and never shown to customers."
        action={
          canWrite ? (
            <Button asChild>
              <Link href="/admin/products/new">
                <Plus />
                Add product
              </Link>
            </Button>
          ) : undefined
        }
      />

      <ProductsTable
        canWrite={canWrite}
        categories={categories}
        initialQuery={params.q ?? ""}
      />
    </>
  );
}
