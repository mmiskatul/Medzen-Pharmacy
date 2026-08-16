import { fail, ok, parseJson, toResponse } from "@/lib/api";
import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { clientIp } from "@/lib/rate-limit";
import { productSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Context) {
  try {
    await requireUser("products.read");
    const { id } = await params;
    const product = await prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        inventory: true,
        category: { select: { id: true, name: true } },
        brand: { select: { id: true, name: true } },
      },
    });
    if (!product) return fail("That product no longer exists.", 404);
    return ok(product);
  } catch (error) {
    return toResponse(error);
  }
}

export async function PATCH(request: Request, { params }: Context) {
  try {
    const user = await requireUser("products.write");
    const { id } = await params;
    const parsed = await parseJson(request, productSchema.partial());
    if (parsed.response) return parsed.response;
    const input = parsed.data;

    const { imageKeys, ...rest } = input;

    const updated = await prisma.$transaction(async (tx) => {
      const product = await tx.product.update({
        where: { id },
        data: {
          ...rest,
          ...(rest.summary !== undefined ? { summary: rest.summary || null } : {}),
          ...(rest.description !== undefined
            ? { description: rest.description || null }
            : {}),
          ...(rest.usageInfo !== undefined ? { usageInfo: rest.usageInfo || null } : {}),
          ...(rest.keyInfo !== undefined ? { keyInfo: rest.keyInfo || null } : {}),
          ...(rest.metaTitle !== undefined ? { metaTitle: rest.metaTitle || null } : {}),
          ...(rest.metaDescription !== undefined
            ? { metaDescription: rest.metaDescription || null }
            : {}),
        },
        select: { id: true, name: true },
      });

      // Images are replaced wholesale: the client always sends the full,
      // ordered list, so reordering and removal need no extra endpoint.
      if (imageKeys) {
        await tx.productImage.deleteMany({ where: { productId: id } });
        if (imageKeys.length > 0) {
          await tx.productImage.createMany({
            data: imageKeys.map((key, index) => ({
              productId: id,
              key,
              alt: product.name,
              sortOrder: index,
            })),
          });
        }
      }

      return product;
    });

    await audit({
      user,
      action: "product.updated",
      entity: "Product",
      entityId: id,
      meta: { fields: Object.keys(input) },
      ip: clientIp(request.headers),
    });

    return ok(updated);
  } catch (error) {
    return toResponse(error);
  }
}

export async function DELETE(request: Request, { params }: Context) {
  try {
    const user = await requireUser("products.write");
    const { id } = await params;

    // Soft delete: historical order lines keep pointing at a real row.
    await prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), status: "DRAFT" },
    });

    await audit({
      user,
      action: "product.deleted",
      entity: "Product",
      entityId: id,
      ip: clientIp(request.headers),
    });

    return ok({ id });
  } catch (error) {
    return toResponse(error);
  }
}
