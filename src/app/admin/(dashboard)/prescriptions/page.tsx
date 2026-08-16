import Link from "next/link";
import { FileText, Lock } from "lucide-react";

import { PageHeader } from "@/components/admin/page-header";
import {
  PRESCRIPTION_STATUSES,
  StatusBadge,
  statusLabel,
} from "@/components/admin/status-badge";
import { OrderFilters } from "@/app/admin/(dashboard)/orders/order-filters";
import { Card, EmptyState, Table, Td, Th } from "@/components/ui/primitives";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Prescriptions" };

const PER_PAGE = 20;

export default async function PrescriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  await requireUser("prescriptions.read");
  const params = await searchParams;

  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const where: Prisma.PrescriptionRequestWhereInput = {};

  if (params.status && PRESCRIPTION_STATUSES.includes(params.status as never)) {
    where.status = params.status as Prisma.PrescriptionRequestWhereInput["status"];
  }
  if (params.q?.trim()) {
    const term = params.q.trim();
    where.OR = [
      { reference: { contains: term, mode: "insensitive" } },
      { customerName: { contains: term, mode: "insensitive" } },
      { customerPhone: { contains: term, mode: "insensitive" } },
    ];
  }

  // The list projects metadata only — no storage keys, no file contents.
  const [requests, total] = await Promise.all([
    prisma.prescriptionRequest.findMany({
      where,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      select: {
        id: true,
        reference: true,
        customerName: true,
        customerPhone: true,
        status: true,
        createdAt: true,
        assignedTo: { select: { name: true } },
        _count: { select: { files: true } },
      },
    }),
    prisma.prescriptionRequest.count({ where }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <>
      <PageHeader
        title="Prescriptions"
        description="Requests uploaded through the website, waiting for pharmacist review."
      />

      <div className="mb-4 flex gap-3 rounded-xl border border-line bg-white px-4 py-3">
        <Lock className="mt-0.5 size-4 shrink-0 text-brand-700" aria-hidden />
        <p className="text-sm leading-relaxed text-muted">
          Files are stored privately and are opened through an authorised route
          only. Every view and download is recorded against your name.
        </p>
      </div>

      <OrderFilters
        statuses={PRESCRIPTION_STATUSES.map((status) => ({
          value: status,
          label: statusLabel(status),
        }))}
      />

      <Card className="mt-4 overflow-hidden">
        {requests.length === 0 ? (
          <EmptyState
            className="border-0 bg-white"
            icon={FileText}
            title="No requests here"
            description={
              params.status || params.q
                ? "Nothing matches these filters."
                : "Prescriptions uploaded on the website will appear here for review."
            }
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th className="w-40">Reference</Th>
                <Th>Customer</Th>
                <Th className="w-32">Submitted</Th>
                <Th className="w-20">Files</Th>
                <Th className="w-40">Assigned to</Th>
                <Th className="w-44">Status</Th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id} className="transition-colors hover:bg-wash">
                  <Td>
                    <Link
                      href={`/admin/prescriptions/${request.id}`}
                      className="tnum font-medium text-ink hover:underline"
                    >
                      {request.reference}
                    </Link>
                  </Td>
                  <Td>
                    <p className="font-medium text-ink">{request.customerName}</p>
                    <p className="tnum text-xs text-muted">{request.customerPhone}</p>
                  </Td>
                  <Td className="text-xs">{formatDate(request.createdAt)}</Td>
                  <Td className="tnum">{request._count.files}</Td>
                  <Td className="text-xs">
                    {request.assignedTo?.name ?? (
                      <span className="text-muted">Unassigned</span>
                    )}
                  </Td>
                  <Td>
                    <StatusBadge status={request.status} />
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      {pageCount > 1 ? (
        <nav className="mt-4 flex items-center justify-between gap-4" aria-label="Pagination">
          <p className="tnum text-sm text-muted">
            Page {page} of {pageCount} · {total} requests
          </p>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link
                href={`/admin/prescriptions?${new URLSearchParams({ ...params, page: String(page - 1) } as Record<string, string>)}`}
                className="rounded-xl border border-line-strong px-3 py-2 text-sm font-medium text-ink-soft hover:bg-wash"
              >
                Previous
              </Link>
            ) : null}
            {page < pageCount ? (
              <Link
                href={`/admin/prescriptions?${new URLSearchParams({ ...params, page: String(page + 1) } as Record<string, string>)}`}
                className="rounded-xl border border-line-strong px-3 py-2 text-sm font-medium text-ink-soft hover:bg-wash"
              >
                Next
              </Link>
            ) : null}
          </div>
        </nav>
      ) : null}
    </>
  );
}
