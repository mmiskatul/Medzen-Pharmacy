import Link from "next/link";
import { ScrollText } from "lucide-react";

import { PageHeader } from "@/components/admin/page-header";
import { Badge, Card, EmptyState, Table, Td, Th } from "@/components/ui/primitives";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Audit log" };

const PER_PAGE = 50;

/**
 * Read-only compliance view. Entries cannot be edited or deleted from the
 * dashboard — that is the point of an audit trail.
 */
export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireUser("audit.read");
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const [entries, total] = await Promise.all([
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    prisma.auditLog.count(),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <>
      <PageHeader
        title="Audit log"
        description="Every staff action, including each time a prescription file was opened or downloaded. This record is read-only."
      />

      <Card className="overflow-hidden">
        {entries.length === 0 ? (
          <EmptyState
            className="border-0 bg-white"
            icon={ScrollText}
            title="Nothing recorded yet"
            description="Staff actions are written here as soon as people start using the dashboard."
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th className="w-44">When</Th>
                <Th className="w-56">Who</Th>
                <Th className="w-56">Action</Th>
                <Th>Record</Th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                const sensitive = entry.action.startsWith("prescription.file_");
                return (
                  <tr key={entry.id} className="transition-colors hover:bg-wash">
                    <Td className="text-xs">{formatDate(entry.createdAt, true)}</Td>
                    <Td className="text-xs">{entry.actorLabel}</Td>
                    <Td>
                      <Badge tone={sensitive ? "rx" : "neutral"}>
                        <code className="tnum text-[0.6875rem]">{entry.action}</code>
                      </Badge>
                    </Td>
                    <Td className="text-xs text-muted">
                      {entry.entity}
                      {entry.entityId ? (
                        <span className="tnum"> · {entry.entityId.slice(0, 8)}</span>
                      ) : null}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>

      {pageCount > 1 ? (
        <nav className="mt-4 flex items-center justify-between gap-4" aria-label="Pagination">
          <p className="tnum text-sm text-muted">
            Page {page} of {pageCount} · {total} entries
          </p>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link
                href={`/admin/audit?page=${page - 1}`}
                className="rounded-xl border border-line-strong px-3 py-2 text-sm font-medium text-ink-soft hover:bg-wash"
              >
                Previous
              </Link>
            ) : null}
            {page < pageCount ? (
              <Link
                href={`/admin/audit?page=${page + 1}`}
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
