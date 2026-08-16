import { notFound } from "next/navigation";

import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/rbac";
import { filsToInput } from "@/lib/utils";

import { ProductEditor } from "../product-editor";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit product" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser("products.read");
  const { id } = await params;

  const [product, categories, brands] = await Promise.all([
    prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: { images: { orderBy: { sortOrder: "asc" } } },
    }),
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

  if (!product) notFound();

  return (
    <>
      <PageHeader
        title={product.name}
        description={`SKU ${product.sku}`}
        backHref="/admin/products"
        backLabel="Products"
        action={<StatusBadge status={product.status} />}
      />

      <ProductEditor
        canWrite={can(user, "products.write")}
        categories={categories}
        brands={brands}
        initial={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          sku: product.sku,
          summary: product.summary ?? "",
          description: product.description ?? "",
          keyInfo: product.keyInfo ?? "",
          usageInfo: product.usageInfo ?? "",
          price: filsToInput(product.priceFils),
          compareAt: filsToInput(product.compareAtFils),
          categoryId: product.categoryId ?? "",
          brandId: product.brandId ?? "",
          prescriptionRequired: product.prescriptionRequired,
          status: product.status,
          isFeatured: product.isFeatured,
          metaTitle: product.metaTitle ?? "",
          metaDescription: product.metaDescription ?? "",
          imageKeys: product.images.map((image) => image.key),
        }}
      />
    </>
  );
}
