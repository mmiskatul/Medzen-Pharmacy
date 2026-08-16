import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  CalendarClock,
  FileText,
  MessageSquare,
  Package,
  ShoppingCart,
  TrendingUp,
  UsersRound,
} from "lucide-react";

import { DashboardCharts } from "@/components/admin/dashboard-charts";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, EmptyState } from "@/components/ui/primitives";
import { getDashboardStats } from "@/lib/analytics";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/rbac";
import { getSettings } from "@/lib/site-settings.server";
import { formatPrice, relativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const user = await requireUser();
  const [stats, settings, recentOrders, recentPrescriptions] = await Promise.all([
    getDashboardStats(),
    getSettings(),
    can(user, "orders.read")
      ? prisma.order.findMany({
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
          take: 6,
          select: {
            id: true,
            reference: true,
            customerName: true,
            totalFils: true,
            status: true,
            createdAt: true,
          },
        })
      : Promise.resolve([]),
    can(user, "prescriptions.read")
      ? prisma.prescriptionRequest.findMany({
          orderBy: { createdAt: "desc" },
          take: 6,
          select: {
            id: true,
            reference: true,
            customerName: true,
            status: true,
            createdAt: true,
          },
        })
      : Promise.resolve([]),
  ]);

  const cards = [
    {
      label: "Total orders",
      value: stats.orders.total,
      detail: `${stats.orders.last30} in the last 30 days`,
      icon: ShoppingCart,
      href: "/admin/orders",
      permission: "orders.read" as const,
    },
    {
      label: "Pending orders",
      value: stats.orders.pending,
      detail: "Waiting for your team",
      icon: CalendarClock,
      href: "/admin/orders?status=PENDING",
      permission: "orders.read" as const,
      urgent: stats.orders.pending > 0,
    },
    {
      label: "Prescription requests",
      value: stats.prescriptions.pending,
      detail: `${stats.prescriptions.total} received in total`,
      icon: FileText,
      href: "/admin/prescriptions",
      permission: "prescriptions.read" as const,
      urgent: stats.prescriptions.pending > 0,
    },
    {
      label: "Products",
      value: stats.products.total,
      detail: `${stats.products.published} published`,
      icon: Package,
      href: "/admin/products",
      permission: "products.read" as const,
    },
    {
      label: "Low stock",
      value: stats.products.lowStock,
      detail: `${stats.products.outOfStock} out of stock`,
      icon: Boxes,
      href: "/admin/inventory?filter=low",
      permission: "inventory.read" as const,
      urgent: stats.products.lowStock > 0,
    },
    {
      label: "New messages",
      value: stats.messages.unread,
      detail: `${stats.messages.total} received in total`,
      icon: MessageSquare,
      href: "/admin/messages?status=NEW",
      permission: "messages.read" as const,
      urgent: stats.messages.unread > 0,
    },
    {
      label: "Customers",
      value: stats.customers.total,
      detail: `${stats.customers.last30} new in 30 days`,
      icon: UsersRound,
      href: "/admin/customers",
      permission: "customers.read" as const,
    },
    ...(settings.commerce.showPrices
      ? [
          {
            label: "Completed order value",
            value: formatPrice(stats.revenue.completedFils),
            detail: `${formatPrice(stats.revenue.last30Fils)} in 30 days`,
            icon: TrendingUp,
            href: "/admin/orders?status=COMPLETED",
            permission: "analytics.read" as const,
          },
        ]
      : []),
  ].filter((card) => can(user, card.permission));

  const alerts = [
    stats.products.outOfStock > 0
      ? `${stats.products.outOfStock} ${stats.products.outOfStock === 1 ? "product is" : "products are"} out of stock`
      : null,
    stats.products.expiringSoon > 0
      ? `${stats.products.expiringSoon} ${stats.products.expiringSoon === 1 ? "batch expires" : "batches expire"} within 90 days`
      : null,
  ].filter((alert): alert is string => alert !== null);

  return (
    <>
      <PageHeader
        title={`Good to see you, ${user.name.split(" ")[0]}`}
        description="Everything waiting on the pharmacy team, in one view."
      />

      {alerts.length > 0 && can(user, "inventory.read") ? (
        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-rx-line bg-rx-bg px-4 py-3">
          <AlertTriangle className="size-4 shrink-0 text-rx" aria-hidden />
          <p className="flex-1 text-sm text-rx">{alerts.join(" · ")}</p>
          <Button asChild size="sm" variant="secondary">
            <Link href="/admin/inventory">Open inventory</Link>
          </Button>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="group rounded-2xl border border-line bg-white p-5 transition-colors hover:border-brand-200"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="text-sm font-medium text-muted">{card.label}</span>
              <card.icon
                className={
                  "urgent" in card && card.urgent
                    ? "size-4 shrink-0 text-rx"
                    : "size-4 shrink-0 text-muted"
                }
                aria-hidden
              />
            </div>
            <p className="tnum mt-3 font-display text-2xl font-bold text-ink">
              {card.value}
            </p>
            <p className="mt-1 text-xs text-muted">{card.detail}</p>
          </Link>
        ))}
      </div>

      {can(user, "analytics.read") ? (
        <div className="mt-8">
          <DashboardCharts prescriptions={stats.prescriptions} />
        </div>
      ) : null}

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {can(user, "orders.read") ? (
          <Card>
            <CardHeader
              title="Latest orders"
              action={
                <Button asChild size="sm" variant="ghost">
                  <Link href="/admin/orders">
                    View all
                    <ArrowRight />
                  </Link>
                </Button>
              }
            />
            {recentOrders.length === 0 ? (
              <EmptyState
                className="border-0 bg-white py-10"
                icon={ShoppingCart}
                title="No orders yet"
                description="Order requests sent from the website will appear here."
              />
            ) : (
              <ul className="divide-y divide-line">
                {recentOrders.map((order) => (
                  <li key={order.id}>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-wash"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="tnum truncate text-sm font-medium text-ink">
                          {order.reference}
                        </p>
                        <p className="truncate text-xs text-muted">
                          {order.customerName} · {relativeTime(order.createdAt)}
                        </p>
                      </div>
                      <span className="tnum shrink-0 text-sm font-medium text-ink">
                        {formatPrice(order.totalFils)}
                      </span>
                      <StatusBadge status={order.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        ) : null}

        {can(user, "prescriptions.read") ? (
          <Card>
            <CardHeader
              title="Latest prescription requests"
              action={
                <Button asChild size="sm" variant="ghost">
                  <Link href="/admin/prescriptions">
                    View all
                    <ArrowRight />
                  </Link>
                </Button>
              }
            />
            {recentPrescriptions.length === 0 ? (
              <EmptyState
                className="border-0 bg-white py-10"
                icon={FileText}
                title="No requests yet"
                description="Prescriptions uploaded on the website will appear here for review."
              />
            ) : (
              <ul className="divide-y divide-line">
                {recentPrescriptions.map((request) => (
                  <li key={request.id}>
                    <Link
                      href={`/admin/prescriptions/${request.id}`}
                      className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-wash"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="tnum truncate text-sm font-medium text-ink">
                          {request.reference}
                        </p>
                        <p className="truncate text-xs text-muted">
                          {request.customerName} · {relativeTime(request.createdAt)}
                        </p>
                      </div>
                      <StatusBadge status={request.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        ) : null}
      </div>
    </>
  );
}
