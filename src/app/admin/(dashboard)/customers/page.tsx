import Link from "next/link";
import { UsersRound } from "lucide-react";
import type { Prisma } from "@prisma/client";

import { OrderFilters } from "@/app/admin/(dashboard)/orders/order-filters";
import { PageHeader } from "@/components/admin/page-header";
import { Card, EmptyState, Table, Td, Th } from "@/components/ui/primitives";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Customers" };

const PER_PAGE = 25;

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  await requireUser("customers.read");
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const where: Prisma.CustomerWhereInput = { deletedAt: null };
  if (params.q?.trim()) {
    const term = params.q.trim();
    where.OR = [
      { name: { contains: term, mode: "insensitive" } },
      { phone: { contains: term, mode: "insensitive" } },
      { email: { contains: term, mode: "insensitive" } },
    ];
  }

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        createdAt: true,
        _count: { select: { orders: true, prescriptions: true } },
        orders: {
          select: { createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    }),
    prisma.customer.count({ where }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <>
      <PageHeader
        title="Customers"
        description="People who have sent an order request or a prescription. Only contact details and request counts are kept here."
      />

      <OrderFilters statuses={[]} searchPlaceholder="Search by name, phone or email" />

      <Card className="mt-4 overflow-hidden">
        {customers.length === 0 ? (
          <EmptyState
            className="border-0 bg-white"
            icon={UsersRound}
            title="No customers yet"
            description="A record is created the first time someone sends an order request or a prescription."
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Customer</Th>
                <Th className="w-40">Phone</Th>
                <Th className="w-24">Orders</Th>
                <Th className="w-32">Prescriptions</Th>
                <Th className="w-32">Last order</Th>
                <Th className="w-32">Joined</Th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="transition-colors hover:bg-wash">
                  <Td>
                    <Link
                      href={`/admin/customers/${customer.id}`}
                      className="font-medium text-ink hover:underline"
                    >
                      {customer.name}
                    </Link>
                    {customer.email ? (
                      <p className="text-xs text-muted">{customer.email}</p>
                    ) : null}
                  </Td>
                  <Td className="tnum text-xs">{customer.phone}</Td>
                  <Td className="tnum">{customer._count.orders}</Td>
                  <Td className="tnum">{customer._count.prescriptions}</Td>
                  <Td className="text-xs">
                    {customer.orders[0] ? (
                      formatDate(customer.orders[0].createdAt)
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </Td>
                  <Td className="text-xs">{formatDate(customer.createdAt)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      {pageCount > 1 ? (
        <nav className="mt-4 flex items-center justify-between gap-4" aria-label="Pagination">
          <p className="tnum text-sm text-muted">
            Page {page} of {pageCount} · {total} customers
          </p>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link
                href={`/admin/customers?${new URLSearchParams({ ...params, page: String(page - 1) } as Record<string, string>)}`}
                className="rounded-xl border border-line-strong px-3 py-2 text-sm font-medium text-ink-soft hover:bg-wash"
              >
                Previous
              </Link>
            ) : null}
            {page < pageCount ? (
              <Link
                href={`/admin/customers?${new URLSearchParams({ ...params, page: String(page + 1) } as Record<string, string>)}`}
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
