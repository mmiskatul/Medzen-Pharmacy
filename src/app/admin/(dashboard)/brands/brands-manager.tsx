"use client";

import { Award } from "lucide-react";

import { ResourceManager, type ColumnSpec, type FieldSpec } from "@/components/admin/resource-manager";
import { Badge } from "@/components/ui/primitives";

type Brand = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoKey: string | null;
  isActive: boolean;
  _count?: { products: number };
};

const FIELDS: FieldSpec[] = [
  { name: "name", label: "Brand name", type: "text", placeholder: "Panadol" },
  { name: "slug", label: "URL slug", type: "slug", from: "name" },
  { name: "description", label: "Description", type: "textarea", rows: 3, optional: true },
  { name: "logoKey", label: "Logo", type: "image", folder: "brands" },
  {
    name: "isActive",
    label: "Show on the website",
    type: "checkbox",
    hint: "Hidden brands stay attached to their products but disappear from filters.",
  },
];

const COLUMNS: ColumnSpec<Brand>[] = [
  {
    header: "Brand",
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
    header: "Status",
    cell: (row) => (
      <Badge tone={row.isActive ? "brand" : "muted"}>
        {row.isActive ? "Visible" : "Hidden"}
      </Badge>
    ),
    className: "w-28",
  },
];

export function BrandsManager({ canWrite }: { canWrite: boolean }) {
  return (
    <ResourceManager<Brand>
      endpoint="/api/admin/brands"
      singular="Brand"
      plural="Brands"
      fields={FIELDS}
      columns={COLUMNS}
      canWrite={canWrite}
      emptyIcon={Award}
      emptyDescription="Add the brands you carry so customers can filter by them."
      defaults={{ name: "", slug: "", description: "", logoKey: null, isActive: true }}
      toForm={(row) => ({
        name: row.name,
        slug: row.slug,
        description: row.description ?? "",
        logoKey: row.logoKey,
        isActive: row.isActive,
      })}
    />
  );
}
