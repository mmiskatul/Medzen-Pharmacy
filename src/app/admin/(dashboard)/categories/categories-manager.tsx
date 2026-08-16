"use client";

import { Tags } from "lucide-react";

import { ResourceManager, type ColumnSpec, type FieldSpec } from "@/components/admin/resource-manager";
import { Badge } from "@/components/ui/primitives";
import { ICON_NAMES } from "@/components/site/service-icon";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  imageKey: string | null;
  isActive: boolean;
  sortOrder: number;
  _count?: { products: number };
};

const FIELDS: FieldSpec[] = [
  { name: "name", label: "Name", type: "text", placeholder: "Vitamins & supplements" },
  {
    name: "slug",
    label: "URL slug",
    type: "slug",
    from: "name",
    hint: "Appears in the address, e.g. /products?category=vitamins-supplements",
  },
  {
    name: "description",
    label: "Description",
    type: "textarea",
    rows: 3,
    optional: true,
  },
  {
    name: "icon",
    label: "Icon",
    type: "select",
    options: ICON_NAMES.map((name) => ({ value: name, label: name })),
    hint: "Shown on the homepage category tiles.",
  },
  { name: "imageKey", label: "Category image", type: "image", folder: "categories" },
  {
    name: "sortOrder",
    label: "Display order",
    type: "number",
    hint: "Lower numbers appear first.",
  },
  {
    name: "isActive",
    label: "Show on the website",
    type: "checkbox",
    hint: "Turn this off to hide the category without deleting it.",
  },
];

const COLUMNS: ColumnSpec<Category>[] = [
  {
    header: "Category",
    cell: (row) => (
      <div>
        <p className="font-medium text-ink">{row.name}</p>
        <p className="text-xs text-muted">/{row.slug}</p>
      </div>
    ),
  },
  {
    header: "Products",
    cell: (row) => <span className="tnum">{row._count?.products ?? 0}</span>,
    className: "w-24",
  },
  {
    header: "Order",
    cell: (row) => <span className="tnum">{row.sortOrder}</span>,
    className: "w-20",
  },
  {
    header: "Status",
    cell: (row) => (
      <Badge tone={row.isActive ? "brand" : "muted"}>
        {row.isActive ? "Visible" : "Hidden"}
      </Badge>
    ),
    className: "w-28",
  },
];

export function CategoriesManager({ canWrite }: { canWrite: boolean }) {
  return (
    <ResourceManager<Category>
      endpoint="/api/admin/categories"
      singular="Category"
      plural="Categories"
      fields={FIELDS}
      columns={COLUMNS}
      canWrite={canWrite}
      emptyIcon={Tags}
      emptyDescription="Create the aisles your customers browse — medicines, vitamins, baby care and so on."
      defaults={{
        name: "",
        slug: "",
        description: "",
        icon: "Pill",
        imageKey: null,
        sortOrder: 0,
        isActive: true,
      }}
      toForm={(row) => ({
        name: row.name,
        slug: row.slug,
        description: row.description ?? "",
        icon: row.icon ?? "Pill",
        imageKey: row.imageKey,
        sortOrder: row.sortOrder,
        isActive: row.isActive,
      })}
    />
  );
}
