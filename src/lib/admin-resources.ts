import "server-only";

import { createCrudHandlers } from "./admin-crud";
import {
  bannerSchema,
  brandSchema,
  categorySchema,
  faqSchema,
  serviceSchema,
  testimonialSchema,
} from "./validation";

/**
 * Resource definitions for the generic admin endpoints. Route files import
 * from here and export only the HTTP verbs Next expects, keeping route
 * modules free of configuration.
 */

function emptyToNull(input: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    out[key] = value === "" ? null : value;
  }
  return out;
}

export const categoryCrud = createCrudHandlers({
  model: "category",
  entity: "Category",
  readPermission: "products.read",
  writePermission: "categories.write",
  createSchema: categorySchema,
  updateSchema: categorySchema.partial(),
  searchFields: ["name", "slug"],
  orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  softDelete: true,
  include: { _count: { select: { products: true } } },
  toData: (input) => emptyToNull(input as Record<string, unknown>),
});

export const brandCrud = createCrudHandlers({
  model: "brand",
  entity: "Brand",
  readPermission: "products.read",
  writePermission: "brands.write",
  createSchema: brandSchema,
  updateSchema: brandSchema.partial(),
  searchFields: ["name", "slug"],
  orderBy: { name: "asc" },
  softDelete: true,
  include: { _count: { select: { products: true } } },
  toData: (input) => emptyToNull(input as Record<string, unknown>),
});

export const serviceCrud = createCrudHandlers({
  model: "service",
  entity: "Service",
  readPermission: "products.read",
  writePermission: "cms.write",
  createSchema: serviceSchema,
  updateSchema: serviceSchema.partial(),
  searchFields: ["title", "slug"],
  orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
  softDelete: true,
  toData: (input) => emptyToNull(input as Record<string, unknown>),
});

export const bannerCrud = createCrudHandlers({
  model: "banner",
  entity: "Banner",
  readPermission: "products.read",
  writePermission: "cms.write",
  createSchema: bannerSchema,
  updateSchema: bannerSchema.partial(),
  searchFields: ["title"],
  orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  toData: (input) => {
    const data = emptyToNull(input as Record<string, unknown>);
    // Schedule fields arrive as date strings from the form.
    for (const key of ["startsAt", "endsAt"] as const) {
      const value = data[key];
      data[key] = typeof value === "string" ? new Date(value) : null;
    }
    return data;
  },
});

export const faqCrud = createCrudHandlers({
  model: "faq",
  entity: "Faq",
  readPermission: "products.read",
  writePermission: "cms.write",
  createSchema: faqSchema,
  updateSchema: faqSchema.partial(),
  searchFields: ["question", "answer"],
  orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  toData: (input) => emptyToNull(input as Record<string, unknown>),
});

export const testimonialCrud = createCrudHandlers({
  model: "testimonial",
  entity: "Testimonial",
  readPermission: "products.read",
  writePermission: "cms.write",
  createSchema: testimonialSchema,
  updateSchema: testimonialSchema.partial(),
  searchFields: ["authorName", "body"],
  orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  toData: (input) => {
    const data = emptyToNull(input as Record<string, unknown>);
    // A testimonial cannot go live unless it has been marked verified —
    // the site never displays a review the business has not confirmed.
    if (data.isPublished === true && data.isVerified !== true) {
      data.isPublished = false;
    }
    return data;
  },
});
