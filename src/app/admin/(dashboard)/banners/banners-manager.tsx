"use client";

import { GalleryHorizontal } from "lucide-react";

import { ResourceManager, type ColumnSpec, type FieldSpec } from "@/components/admin/resource-manager";
import { Badge } from "@/components/ui/primitives";
import { formatDate } from "@/lib/utils";

type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  imageKey: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  isActive: boolean;
  sortOrder: number;
  startsAt: string | null;
  endsAt: string | null;
};

const FIELDS: FieldSpec[] = [
  { name: "title", label: "Title", type: "text" },
  { name: "subtitle", label: "Subtitle", type: "text", optional: true },
  { name: "imageKey", label: "Banner image", type: "image", folder: "banners" },
  { name: "ctaLabel", label: "Button label", type: "text", optional: true },
  { name: "ctaHref", label: "Button link", type: "text", optional: true },
  {
    name: "startsAt",
    label: "Starts",
    type: "date",
    optional: true,
    hint: "Leave empty to start straight away.",
  },
  {
    name: "endsAt",
    label: "Ends",
    type: "date",
    optional: true,
    hint: "Leave empty to run until you turn it off.",
  },
  { name: "sortOrder", label: "Display order", type: "number" },
  { name: "isActive", label: "Active", type: "checkbox" },
];

function scheduleLabel(row: Banner) {
  if (!row.startsAt && !row.endsAt) return "Always";
  const from = row.startsAt ? formatDate(row.startsAt) : "now";
  const to = row.endsAt ? formatDate(row.endsAt) : "no end";
  return `${from} → ${to}`;
}

const COLUMNS: ColumnSpec<Banner>[] = [
  {
    header: "Banner",
    cell: (row) => (
      <div>
        <p className="font-medium text-ink">{row.title}</p>
        {row.subtitle ? <p className="text-xs text-muted">{row.subtitle}</p> : null}
      </div>
    ),
  },
  {
    header: "Schedule",
    cell: (row) => <span className="text-xs text-muted">{scheduleLabel(row)}</span>,
    className: "w-48",
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
        {row.isActive ? "Active" : "Off"}
      </Badge>
    ),
    className: "w-24",
  },
];

export function BannersManager({ canWrite }: { canWrite: boolean }) {
  return (
    <ResourceManager<Banner>
      endpoint="/api/admin/banners"
      singular="Banner"
      plural="Banners"
      fields={FIELDS}
      columns={COLUMNS}
      canWrite={canWrite}
      emptyIcon={GalleryHorizontal}
      emptyDescription="Create a banner to highlight a seasonal range, a delivery update or opening hours."
      defaults={{
        title: "",
        subtitle: "",
        imageKey: null,
        ctaLabel: "",
        ctaHref: "",
        startsAt: "",
        endsAt: "",
        sortOrder: 0,
        isActive: true,
      }}
      toForm={(row) => ({
        title: row.title,
        subtitle: row.subtitle ?? "",
        imageKey: row.imageKey,
        ctaLabel: row.ctaLabel ?? "",
        ctaHref: row.ctaHref ?? "",
        startsAt: row.startsAt ? row.startsAt.slice(0, 10) : "",
        endsAt: row.endsAt ? row.endsAt.slice(0, 10) : "",
        sortOrder: row.sortOrder,
        isActive: row.isActive,
      })}
    />
  );
}
