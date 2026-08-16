"use client";

import { Quote } from "lucide-react";

import { ResourceManager, type ColumnSpec, type FieldSpec } from "@/components/admin/resource-manager";
import { Badge } from "@/components/ui/primitives";
import { truncate } from "@/lib/utils";

type Testimonial = {
  id: string;
  authorName: string;
  authorTitle: string | null;
  body: string;
  rating: number | null;
  isVerified: boolean;
  isPublished: boolean;
  sortOrder: number;
};

const FIELDS: FieldSpec[] = [
  { name: "authorName", label: "Customer name", type: "text" },
  {
    name: "authorTitle",
    label: "Description",
    type: "text",
    optional: true,
    hint: "For example “Umm Ramool resident”. Never add anything about their health.",
  },
  { name: "body", label: "What they said", type: "textarea", rows: 4 },
  {
    name: "rating",
    label: "Rating out of 5",
    type: "number",
    optional: true,
  },
  { name: "sortOrder", label: "Display order", type: "number" },
  {
    name: "isVerified",
    label: "I confirm this is a genuine customer review",
    type: "checkbox",
    hint: "Required before it can be published.",
  },
  {
    name: "isPublished",
    label: "Show on the website",
    type: "checkbox",
    hint: "Publishing is ignored unless the review is marked verified.",
  },
];

const COLUMNS: ColumnSpec<Testimonial>[] = [
  {
    header: "Review",
    cell: (row) => (
      <div>
        <p className="font-medium text-ink">{row.authorName}</p>
        <p className="text-xs text-muted">{truncate(row.body, 90)}</p>
      </div>
    ),
  },
  {
    header: "Rating",
    cell: (row) =>
      row.rating ? (
        <span className="tnum">{row.rating}/5</span>
      ) : (
        <span className="text-muted">—</span>
      ),
    className: "w-24",
  },
  {
    header: "Status",
    cell: (row) => (
      <div className="flex flex-wrap gap-1.5">
        <Badge tone={row.isVerified ? "brand" : "rx"}>
          {row.isVerified ? "Verified" : "Unverified"}
        </Badge>
        <Badge tone={row.isPublished ? "brand" : "muted"}>
          {row.isPublished ? "Live" : "Hidden"}
        </Badge>
      </div>
    ),
    className: "w-48",
  },
];

export function TestimonialsManager({ canWrite }: { canWrite: boolean }) {
  return (
    <ResourceManager<Testimonial>
      endpoint="/api/admin/testimonials"
      singular="Testimonial"
      plural="Testimonials"
      fields={FIELDS}
      columns={COLUMNS}
      canWrite={canWrite}
      emptyIcon={Quote}
      emptyDescription="Add reviews customers have given you in person, by message or on a review platform — with their permission."
      defaults={{
        authorName: "",
        authorTitle: "",
        body: "",
        rating: 5,
        sortOrder: 0,
        isVerified: false,
        isPublished: false,
      }}
      toForm={(row) => ({
        authorName: row.authorName,
        authorTitle: row.authorTitle ?? "",
        body: row.body,
        rating: row.rating ?? "",
        sortOrder: row.sortOrder,
        isVerified: row.isVerified,
        isPublished: row.isPublished,
      })}
    />
  );
}
