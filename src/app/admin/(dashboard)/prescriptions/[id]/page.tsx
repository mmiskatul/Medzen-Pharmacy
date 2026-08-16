import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock } from "lucide-react";

import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { Card, CardHeader } from "@/components/ui/primitives";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/rbac";
import { getSettings } from "@/lib/site-settings.server";
import { formatDate, relativeTime } from "@/lib/utils";

import { PrescriptionFiles, PrescriptionReview } from "./prescription-review";

export const dynamic = "force-dynamic";
export const metadata = { title: "Prescription request" };

export default async function PrescriptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser("prescriptions.read");
  const { id } = await params;

  const [request, settings, pharmacists] = await Promise.all([
    prisma.prescriptionRequest.findUnique({
      where: { id },
      include: {
        // Only metadata is selected. The storage key stays server-side and
        // is never serialised into the page payload.
        files: {
          select: {
            id: true,
            originalName: true,
            mimeType: true,
            sizeBytes: true,
          },
        },
        assignedTo: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true } },
        notesLog: {
          orderBy: { createdAt: "desc" },
          include: { user: { select: { name: true } } },
        },
      },
    }),
    getSettings(),
    prisma.user.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        role: { in: ["PHARMACIST", "PHARMACY_ADMIN", "SUPER_ADMIN"] },
      },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!request) notFound();

  return (
    <>
      <PageHeader
        title={request.reference}
        description={`Submitted ${formatDate(request.createdAt, true)}`}
        backHref="/admin/prescriptions"
        backLabel="Prescriptions"
        action={<StatusBadge status={request.status} />}
      />

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-5">
          <Card className="overflow-hidden">
            <CardHeader
              title="Uploaded files"
              description="Opening a file records your name and the time."
            />
            <PrescriptionFiles
              files={request.files}
              canDownload={can(user, "prescriptions.download")}
            />
            <div className="flex gap-2.5 border-t border-line bg-wash px-5 py-3">
              <Lock className="mt-0.5 size-3.5 shrink-0 text-muted" aria-hidden />
              <p className="text-xs leading-relaxed text-muted">
                These files have no public address. They can only be read through
                this screen by staff with the prescription permission.
              </p>
            </div>
          </Card>

          <Card>
            <CardHeader title="Customer" />
            <dl className="grid gap-4 p-5 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted">Name</dt>
                <dd className="font-medium text-ink">
                  {request.customer && can(user, "customers.read") ? (
                    <Link
                      href={`/admin/customers/${request.customer.id}`}
                      className="hover:underline"
                    >
                      {request.customerName}
                    </Link>
                  ) : (
                    request.customerName
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Phone</dt>
                <dd className="tnum font-medium text-ink">{request.customerPhone}</dd>
              </div>
              {request.customerEmail ? (
                <div>
                  <dt className="text-xs text-muted">Email</dt>
                  <dd className="font-medium text-ink">{request.customerEmail}</dd>
                </div>
              ) : null}
              {request.reviewedAt ? (
                <div>
                  <dt className="text-xs text-muted">First reviewed</dt>
                  <dd className="font-medium text-ink">
                    {formatDate(request.reviewedAt, true)}
                  </dd>
                </div>
              ) : null}
            </dl>

            {request.notes ? (
              <div className="border-t border-line px-5 py-4">
                <p className="text-xs font-medium text-muted">
                  Note from the customer
                </p>
                <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-ink-soft">
                  {request.notes}
                </p>
              </div>
            ) : null}

            {request.resolutionMessage ? (
              <div className="border-t border-line bg-wash px-5 py-4">
                <p className="text-xs font-medium text-muted">
                  What the customer was told
                </p>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                  {request.resolutionMessage}
                </p>
              </div>
            ) : null}
          </Card>

          <Card>
            <CardHeader
              title="Internal notes"
              description="Staff only — never shown to the customer."
            />
            {request.notesLog.length === 0 ? (
              <p className="p-5 text-sm text-muted">No notes yet.</p>
            ) : (
              <ul className="divide-y divide-line">
                {request.notesLog.map((entry) => (
                  <li key={entry.id} className="px-5 py-3">
                    <p className="whitespace-pre-line text-sm leading-relaxed text-ink-soft">
                      {entry.body}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {entry.user?.name ?? "Staff"} · {relativeTime(entry.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <PrescriptionReview
          requestId={request.id}
          reference={request.reference}
          phone={request.customerPhone}
          status={request.status}
          assignedToId={request.assignedToId}
          pharmacists={pharmacists}
          whatsapp={settings.contact.whatsapp}
          canUpdate={can(user, "prescriptions.update")}
        />
      </div>
    </>
  );
}
