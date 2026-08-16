"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Phone } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/components/admin/api-client";
import {
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  statusLabel,
} from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { Field, Select, Textarea } from "@/components/ui/field";
import { Card, CardHeader } from "@/components/ui/primitives";
import { telLink, whatsappLink } from "@/lib/whatsapp";

export function OrderActions({
  orderId,
  reference,
  phone,
  status,
  paymentStatus,
  whatsapp,
  canUpdate,
}: {
  orderId: string;
  reference: string;
  phone: string;
  status: string;
  paymentStatus: string;
  whatsapp: string;
  canUpdate: boolean;
}) {
  const router = useRouter();
  const [nextStatus, setNextStatus] = React.useState(status);
  const [nextPayment, setNextPayment] = React.useState(paymentStatus);
  const [note, setNote] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const changed =
    nextStatus !== status || nextPayment !== paymentStatus || note.trim().length > 0;

  async function save() {
    setSaving(true);
    try {
      await api.patch(`/api/admin/orders/${orderId}`, {
        ...(nextStatus !== status ? { status: nextStatus } : {}),
        ...(nextPayment !== paymentStatus ? { paymentStatus: nextPayment } : {}),
        ...(note.trim() ? { note: note.trim() } : {}),
      });
      toast.success("Order updated");
      setNote("");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "The order could not be updated.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="Contact the customer" />
        <div className="grid gap-2 p-5">
          <Button asChild variant="whatsapp">
            <a
              href={whatsappLink(whatsapp, { kind: "order", reference })}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle />
              Message on WhatsApp
            </a>
          </Button>
          <Button asChild variant="secondary">
            <a href={telLink(phone)}>
              <Phone />
              Call {phone}
            </a>
          </Button>
        </div>
      </Card>

      {canUpdate ? (
        <Card>
          <CardHeader
            title="Update this order"
            description="Every change is added to the timeline with your name."
          />
          <div className="space-y-4 p-5">
            <Field label="Order status" htmlFor="order-status">
              <Select
                id="order-status"
                value={nextStatus}
                onChange={(event) => setNextStatus(event.target.value)}
              >
                {ORDER_STATUSES.map((option) => (
                  <option key={option} value={option}>
                    {statusLabel(option)}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Payment" htmlFor="order-payment">
              <Select
                id="order-payment"
                value={nextPayment}
                onChange={(event) => setNextPayment(event.target.value)}
              >
                {PAYMENT_STATUSES.map((option) => (
                  <option key={option} value={option}>
                    {statusLabel(option)}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label="Note for the timeline"
              htmlFor="order-note"
              optional
              hint="Visible to staff only."
            >
              <Textarea
                id="order-note"
                rows={3}
                maxLength={500}
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </Field>

            <Button className="w-full" loading={saving} disabled={!changed} onClick={save}>
              Save update
            </Button>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
