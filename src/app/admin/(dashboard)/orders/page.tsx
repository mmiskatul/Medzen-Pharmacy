import Link from "next/link";
import { ShoppingCart } from "lucide-react";

import { PageHeader } from "@/components/admin/page-header";
import { ORDER_STATUSES, StatusBadge, statusLabel } from "@/components/admin/status-badge";
import { Card, EmptyState, Table, Td, Th } from "@/components/ui/primitives";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatPrice } from "@/lib/utils";
import type { Prisma } from "@prisma/client";

import { OrderFilters } from "./order-filters";

export const dynamic = "force-dynamic";
export const metadata = { title: "Orders" };

const PER_PAGE = 20;

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  await requireUser("orders.read");
  const params = await searchParams;

  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const where: Prisma.OrderWhereInput = { deletedAt: null };

  if (params.status && ORDER_STATUSES.includes(params.status as never)) {
    where.status = params.status as Prisma.OrderWhereInput["status"];
  }
  if (params.q?.trim()) {
    const term = params.q.trim();
    where.OR = [
      { reference: { contains: term, mode: "insensitive" } },
      { customerName: { contains: term, mode: "insensitive" } },
      { customerPhone: { contains: term, mode: "insensitive" } },
    ];
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: { _count: { select: { items: true } } },
    }),
    prisma.order.count({ where }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <>
      <PageHeader
        title="Orders"
        description="Requests sent from the website. Confirm stock and the total with the customer before preparing anything."
      />

      <OrderFilters
        statuses={ORDER_STATUSES.map((status) => ({
          value: status,
          label: statusLabel(status),
        }))}
      />

      <Card className="mt-4 overflow-hidden">
        {orders.length === 0 ? (
          <EmptyState
            className="border-0 bg-white"
            icon={ShoppingCart}
            title="No orders here"
            description={
              params.status || params.q
                ? "Nothing matches these filters yet."
                : "Order requests from the website will appear here as soon as customers send them."
            }
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th className="w-40">Reference</Th>
                <Th>Customer</Th>
                <Th className="w-32">Date</Th>
                <Th className="w-20">Items</Th>
                <Th className="w-28">Total</Th>
                <Th className="w-36">Payment</Th>
                <Th className="w-40">Status</Th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="transition-colors hover:bg-wash">
                  <Td>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="tnum font-medium text-ink hover:underline"
                    >
                      {order.reference}
                    </Link>
                  </Td>
                  <Td>
                    <p className="font-medium text-ink">{order.customerName}</p>
                    <p className="tnum text-xs text-muted">{order.customerPhone}</p>
                  </Td>
                  <Td className="text-xs">{formatDate(order.createdAt)}</Td>
                  <Td className="tnum">{order._count.items}</Td>
                  <Td className="tnum font-medium">{formatPrice(order.totalFils)}</Td>
                  <Td>
                    <StatusBadge status={order.paymentStatus} />
                  </Td>
                  <Td>
                    <StatusBadge status={order.status} />
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
            Page {page} of {pageCount} · {total} orders
          </p>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link
                href={`/admin/orders?${new URLSearchParams({ ...params, page: String(page - 1) } as Record<string, string>)}`}
                className="rounded-xl border border-line-strong px-3 py-2 text-sm font-medium text-ink-soft hover:bg-wash"
              >
                Previous
              </Link>
            ) : null}
            {page < pageCount ? (
              <Link
                href={`/admin/orders?${new URLSearchParams({ ...params, page: String(page + 1) } as Record<string, string>)}`}
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
