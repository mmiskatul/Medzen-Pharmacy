"use client";

import { Stethoscope } from "lucide-react";

import { ResourceManager, type ColumnSpec, type FieldSpec } from "@/components/admin/resource-manager";
import { ServiceIcon, ICON_NAMES } from "@/components/site/service-icon";
import { Badge } from "@/components/ui/primitives";
import { truncate } from "@/lib/utils";

type Service = {
  id: string;
  title: string;
  slug: string;
  description: string;
  icon: string;
  ctaLabel: string | null;
  ctaHref: string | null;
  isActive: boolean;
  sortOrder: number;
};

const FIELDS: FieldSpec[] = [
  { name: "title", label: "Service name", type: "text", placeholder: "Prescription support" },
  { name: "slug", label: "URL slug", type: "slug", from: "title" },
  {
    name: "description",
    label: "Description",
    type: "textarea",
    rows: 3,
    hint: "One or two plain sentences about what the customer gets.",
  },
  {
    name: "icon",
    label: "Icon",
    type: "select",
    options: ICON_NAMES.map((name) => ({ value: name, label: name })),
  },
  {
    name: "ctaLabel",
    label: "Button label",
    type: "text",
    optional: true,
    placeholder: "Ask about this",
  },
  {
    name: "ctaHref",
    label: "Button link",
    type: "text",
    optional: true,
    hint: "Leave empty to open WhatsApp with a message about this service.",
  },
  { name: "sortOrder", label: "Display order", type: "number" },
  { name: "isActive", label: "Show on the website", type: "checkbox" },
];

const COLUMNS: ColumnSpec<Service>[] = [
  {
    header: "Service",
    cell: (row) => (
      <div className="flex items-center gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700">
          <ServiceIcon name={row.icon} className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="font-medium text-ink">{row.title}</p>
          <p className="truncate text-xs text-muted">{truncate(row.description, 70)}</p>
        </div>
      </div>
    ),
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

export function ServicesManager({ canWrite }: { canWrite: boolean }) {
  return (
    <ResourceManager<Service>
      endpoint="/api/admin/services"
      singular="Service"
      plural="Services"
      fields={FIELDS}
      columns={COLUMNS}
      canWrite={canWrite}
      emptyIcon={Stethoscope}
      emptyDescription="List the services your pharmacy confirms it offers — prescription support, consultations, delivery requests."
      defaults={{
        title: "",
        slug: "",
        description: "",
        icon: "Stethoscope",
        ctaLabel: "",
        ctaHref: "",
        sortOrder: 0,
        isActive: true,
      }}
      toForm={(row) => ({
        title: row.title,
        slug: row.slug,
        description: row.description,
        icon: row.icon,
        ctaLabel: row.ctaLabel ?? "",
        ctaHref: row.ctaHref ?? "",
        sortOrder: row.sortOrder,
        isActive: row.isActive,
      })}
    />
  );
}
