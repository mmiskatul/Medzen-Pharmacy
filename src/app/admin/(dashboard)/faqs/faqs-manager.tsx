"use client";

import { ClipboardList } from "lucide-react";

import { ResourceManager, type ColumnSpec, type FieldSpec } from "@/components/admin/resource-manager";
import { Badge } from "@/components/ui/primitives";
import { truncate } from "@/lib/utils";

type Faq = {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  sortOrder: number;
  isPublished: boolean;
};

const FIELDS: FieldSpec[] = [
  {
    name: "question",
    label: "Question",
    type: "text",
    placeholder: "Do you deliver to Nad Al Hamar?",
  },
  { name: "answer", label: "Answer", type: "textarea", rows: 5 },
  {
    name: "category",
    label: "Group",
    type: "text",
    optional: true,
    hint: "For example Orders, Prescriptions, Delivery.",
  },
  { name: "sortOrder", label: "Display order", type: "number" },
  { name: "isPublished", label: "Show on the website", type: "checkbox" },
];

const COLUMNS: ColumnSpec<Faq>[] = [
  {
    header: "Question",
    cell: (row) => (
      <div>
        <p className="font-medium text-ink">{row.question}</p>
        <p className="text-xs text-muted">{truncate(row.answer, 90)}</p>
      </div>
    ),
  },
  {
    header: "Group",
    cell: (row) => row.category ?? <span className="text-muted">—</span>,
    className: "w-32",
  },
  {
    header: "Order",
    cell: (row) => <span className="tnum">{row.sortOrder}</span>,
    className: "w-20",
  },
  {
    header: "Status",
    cell: (row) => (
      <Badge tone={row.isPublished ? "brand" : "muted"}>
        {row.isPublished ? "Published" : "Draft"}
      </Badge>
    ),
    className: "w-28",
  },
];

export function FaqsManager({ canWrite }: { canWrite: boolean }) {
  return (
    <ResourceManager<Faq>
      endpoint="/api/admin/faqs"
      singular="FAQ"
      plural="FAQs"
      fields={FIELDS}
      columns={COLUMNS}
      canWrite={canWrite}
      emptyIcon={ClipboardList}
      emptyDescription="Answer the questions customers actually call about — delivery areas, prescription handling, opening hours."
      defaults={{
        question: "",
        answer: "",
        category: "",
        sortOrder: 0,
        isPublished: true,
      }}
      toForm={(row) => ({
        question: row.question,
        answer: row.answer,
        category: row.category ?? "",
        sortOrder: row.sortOrder,
        isPublished: row.isPublished,
      })}
    />
  );
}
