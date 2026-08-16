import { Badge } from "@/components/ui/primitives";

type Tone = "neutral" | "brand" | "rx" | "danger" | "info" | "muted";

/**
 * One mapping for every workflow status in the dashboard, so the same
 * state always reads the same colour wherever it appears. Amber stays
 * reserved for states that need a pharmacist's attention.
 */
const TONES: Record<string, { label: string; tone: Tone }> = {
  // Orders
  PENDING: { label: "Pending", tone: "rx" },
  CONFIRMED: { label: "Confirmed", tone: "info" },
  PREPARING: { label: "Preparing", tone: "info" },
  READY: { label: "Ready", tone: "brand" },
  OUT_FOR_DELIVERY: { label: "Out for delivery", tone: "info" },
  COMPLETED: { label: "Completed", tone: "brand" },
  CANCELLED: { label: "Cancelled", tone: "muted" },

  // Payments
  UNPAID: { label: "Unpaid", tone: "muted" },
  PAY_ON_DELIVERY: { label: "Pay on delivery", tone: "neutral" },
  PAID: { label: "Paid", tone: "brand" },
  REFUNDED: { label: "Refunded", tone: "muted" },

  // Prescriptions
  UNDER_REVIEW: { label: "Under review", tone: "info" },
  CLARIFICATION_REQUESTED: { label: "Needs clarification", tone: "rx" },
  APPROVED: { label: "Approved", tone: "brand" },
  REJECTED: { label: "Rejected", tone: "danger" },

  // Messages
  NEW: { label: "New", tone: "rx" },
  IN_PROGRESS: { label: "In progress", tone: "info" },
  RESOLVED: { label: "Resolved", tone: "brand" },

  // Products
  DRAFT: { label: "Draft", tone: "muted" },
  PUBLISHED: { label: "Published", tone: "brand" },
};

export function StatusBadge({ status }: { status: string }) {
  const config = TONES[status] ?? {
    label: status.replace(/_/g, " ").toLowerCase(),
    tone: "neutral" as Tone,
  };
  return <Badge tone={config.tone}>{config.label}</Badge>;
}

export const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
  "COMPLETED",
  "CANCELLED",
] as const;

export const PAYMENT_STATUSES = [
  "UNPAID",
  "PAY_ON_DELIVERY",
  "PAID",
  "REFUNDED",
] as const;

export const PRESCRIPTION_STATUSES = [
  "PENDING",
  "UNDER_REVIEW",
  "CLARIFICATION_REQUESTED",
  "APPROVED",
  "REJECTED",
  "COMPLETED",
] as const;

export const MESSAGE_STATUSES = ["NEW", "IN_PROGRESS", "RESOLVED"] as const;

export function statusLabel(status: string) {
  return TONES[status]?.label ?? status.replace(/_/g, " ");
}
