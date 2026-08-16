import { PageHeader } from "@/components/admin/page-header";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { EMPTY_PRODUCT, ProductEditor } from "../product-editor";

export const dynamic = "force-dynamic";
export const metadata = { title: "New product" };

export default async function NewProductPage() {
  await requireUser("products.write");

  const [categories, brands] = await Promise.all([
    prisma.category.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.brand.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <>
      <PageHeader
        title="New product"
        description="Products start as drafts. Publish when the details and images are ready."
        backHref="/admin/products"
        backLabel="Products"
      />
      <ProductEditor
        initial={EMPTY_PRODUCT}
        categories={categories}
        brands={brands}
        canWrite
      />
    </>
  );
}
