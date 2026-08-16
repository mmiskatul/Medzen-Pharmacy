"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Download, Eye, FileText, MessageCircle, Phone } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/components/admin/api-client";
import { PRESCRIPTION_STATUSES, statusLabel } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { Field, Select, Textarea } from "@/components/ui/field";
import { Card, CardHeader } from "@/components/ui/primitives";
import { telLink, whatsappLink } from "@/lib/whatsapp";

type FileRow = {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
};

/**
 * Prescription files are never linked directly. Each button opens the
 * authorised route, which checks the permission again server-side and
 * writes an audit entry before returning any bytes.
 */
export function PrescriptionFiles({
  files,
  canDownload,
}: {
  files: FileRow[];
  canDownload: boolean;
}) {
  if (files.length === 0) {
    return (
      <p className="p-5 text-sm text-muted">No files attached to this request.</p>
    );
  }

  return (
    <ul className="divide-y divide-line">
      {files.map((file) => (
        <li key={file.id} className="flex items-center gap-3 px-5 py-3">
          <FileText className="size-4 shrink-0 text-brand-700" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink">
              {file.originalName}
            </p>
            <p className="tnum text-xs text-muted">
              {file.mimeType.split("/")[1]?.toUpperCase()} ·{" "}
              {(file.sizeBytes / 1024).toFixed(0)} KB
            </p>
          </div>
          {canDownload ? (
            <div className="flex shrink-0 gap-1">
              <Button asChild variant="ghost" size="icon">
                <a
                  href={`/api/admin/prescriptions/files/${file.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`View ${file.originalName}`}
                >
                  <Eye />
                </a>
              </Button>
              <Button asChild variant="ghost" size="icon">
                <a
                  href={`/api/admin/prescriptions/files/${file.id}?download=1`}
                  aria-label={`Download ${file.originalName}`}
                >
                  <Download />
                </a>
              </Button>
            </div>
          ) : (
            <span className="shrink-0 text-xs text-muted">No access</span>
          )}
        </li>
      ))}
    </ul>
  );
}

export function PrescriptionReview({
  requestId,
  reference,
  phone,
  status,
  assignedToId,
  pharmacists,
  whatsapp,
  canUpdate,
}: {
  requestId: string;
  reference: string;
  phone: string;
  status: string;
  assignedToId: string | null;
  pharmacists: { id: string; name: string }[];
  whatsapp: string;
  canUpdate: boolean;
}) {
  const router = useRouter();
  const [nextStatus, setNextStatus] = React.useState(status);
  const [assignee, setAssignee] = React.useState(assignedToId ?? "");
  const [note, setNote] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const changed =
    nextStatus !== status ||
    assignee !== (assignedToId ?? "") ||
    note.trim().length > 0 ||
    message.trim().length > 0;

  async function save() {
    setSaving(true);
    try {
      await api.patch(`/api/admin/prescriptions/${requestId}`, {
        ...(nextStatus !== status ? { status: nextStatus } : {}),
        ...(assignee !== (assignedToId ?? "") ? { assignedToId: assignee || null } : {}),
        ...(note.trim() ? { note: note.trim() } : {}),
        ...(message.trim() ? { resolutionMessage: message.trim() } : {}),
      });
      toast.success("Request updated");
      setNote("");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "The request could not be updated.",
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
              href={whatsappLink(whatsapp, { kind: "prescription", reference })}
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
          <p className="text-xs leading-relaxed text-muted">
            Do not send clinical details over chat. Use it to arrange a call or a
            visit to the counter.
          </p>
        </div>
      </Card>

      {canUpdate ? (
        <Card>
          <CardHeader
            title="Review"
            description="Your decision and any note are recorded against your name."
          />
          <div className="space-y-4 p-5">
            <Field label="Status" htmlFor="rx-status">
              <Select
                id="rx-status"
                value={nextStatus}
                onChange={(event) => setNextStatus(event.target.value)}
              >
                {PRESCRIPTION_STATUSES.map((option) => (
                  <option key={option} value={option}>
                    {statusLabel(option)}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Assigned to" htmlFor="rx-assignee">
              <Select
                id="rx-assignee"
                value={assignee}
                onChange={(event) => setAssignee(event.target.value)}
              >
                <option value="">Unassigned</option>
                {pharmacists.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label="Message for the customer"
              htmlFor="rx-message"
              optional
              hint="What you told them, in plain language. No clinical detail."
            >
              <Textarea
                id="rx-message"
                rows={2}
                maxLength={600}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
              />
            </Field>

            <Field
              label="Internal note"
              htmlFor="rx-note"
              optional
              hint="Staff only. Never shown to the customer."
            >
              <Textarea
                id="rx-note"
                rows={3}
                maxLength={1000}
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </Field>

            <Button className="w-full" loading={saving} disabled={!changed} onClick={save}>
              Save review
            </Button>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
