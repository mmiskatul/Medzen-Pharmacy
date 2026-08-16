import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, ShieldAlert, Store, Truck } from "lucide-react";

import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { Badge, Card, CardHeader, Table, Td, Th } from "@/components/ui/primitives";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/rbac";
import { getSettings } from "@/lib/site-settings.server";
import { formatDate, formatPrice, relativeTime } from "@/lib/utils";

import { OrderActions } from "./order-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Order" };

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser("orders.read");
  const { id } = await params;

  const [order, settings] = await Promise.all([
    prisma.order.findFirst({
      where: { id, deletedAt: null },
      include: {
        items: true,
        events: {
          orderBy: { createdAt: "desc" },
          include: { user: { select: { name: true } } },
        },
        customer: { select: { id: true, name: true } },
      },
    }),
    getSettings(),
  ]);

  if (!order) notFound();

  const needsPrescription = order.items.some((item) => item.prescriptionRequired);

  return (
    <>
      <PageHeader
        title={order.reference}
        description={`Received ${formatDate(order.createdAt, true)}`}
        backHref="/admin/orders"
        backLabel="Orders"
        action={
          <div className="flex gap-2">
            <StatusBadge status={order.paymentStatus} />
            <StatusBadge status={order.status} />
          </div>
        }
      />

      {needsPrescription ? (
        <div className="mb-5 flex gap-3 rounded-xl border border-rx-line bg-rx-bg px-4 py-3">
          <ShieldAlert className="mt-0.5 size-4 shrink-0 text-rx" aria-hidden />
          <p className="text-sm leading-relaxed text-rx">
            This order includes an item marked prescription required. Check for a
            valid prescription before preparing it — dispensing is subject to
            pharmacist approval.
          </p>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-5">
          <Card className="overflow-hidden">
            <CardHeader
              title="Items"
              description={`${order.items.length} ${order.items.length === 1 ? "line" : "lines"}`}
            />
            <Table className="min-w-[520px]">
              <thead>
                <tr>
                  <Th>Product</Th>
                  <Th className="w-24">Unit</Th>
                  <Th className="w-20">Qty</Th>
                  <Th className="w-28 text-right">Line total</Th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <Td>
                      <p className="flex items-center gap-1.5 font-medium text-ink">
                        {item.productId ? (
                          <Link
                            href={`/admin/products/${item.productId}`}
                            className="hover:underline"
                          >
                            {item.productName}
                          </Link>
                        ) : (
                          item.productName
                        )}
                        {item.prescriptionRequired ? (
                          <ShieldAlert
                            className="size-3.5 text-rx"
                            aria-label="Prescription required"
                          />
                        ) : null}
                      </p>
                      {item.sku ? (
                        <p className="tnum text-xs text-muted">{item.sku}</p>
                      ) : null}
                    </Td>
                    <Td className="tnum">{formatPrice(item.unitFils)}</Td>
                    <Td className="tnum">{item.quantity}</Td>
                    <Td className="tnum text-right font-medium">
                      {formatPrice(item.lineFils)}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>

            <dl className="space-y-2 border-t border-line px-5 py-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Subtotal</dt>
                <dd className="tnum font-medium">{formatPrice(order.subtotalFils)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Delivery</dt>
                <dd className="tnum font-medium">
                  {order.deliveryFils === 0 ? "—" : formatPrice(order.deliveryFils)}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-line pt-2 text-base">
                <dt className="font-semibold text-ink">Total</dt>
                <dd className="tnum font-bold text-ink">
                  {formatPrice(order.totalFils)}
                </dd>
              </div>
            </dl>
          </Card>

          <Card>
            <CardHeader title="Timeline" />
            <ol className="divide-y divide-line">
              {order.events.map((event) => (
                <li key={event.id} className="px-5 py-3">
                  <p className="text-sm text-ink">{event.message}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {event.user?.name ?? "Website"} · {relativeTime(event.createdAt)}
                  </p>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Customer" />
            <dl className="space-y-3 p-5 text-sm">
              <div>
                <dt className="text-xs text-muted">Name</dt>
                <dd className="font-medium text-ink">
                  {order.customer && can(user, "customers.read") ? (
                    <Link
                      href={`/admin/customers/${order.customer.id}`}
                      className="hover:underline"
                    >
                      {order.customerName}
                    </Link>
                  ) : (
                    order.customerName
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Phone</dt>
                <dd className="tnum font-medium text-ink">{order.customerPhone}</dd>
              </div>
              {order.customerEmail ? (
                <div>
                  <dt className="text-xs text-muted">Email</dt>
                  <dd className="font-medium text-ink">{order.customerEmail}</dd>
                </div>
              ) : null}
            </dl>
          </Card>

          <Card>
            <CardHeader title="Fulfilment" />
            <div className="space-y-3 p-5 text-sm">
              <Badge tone="neutral">
                {order.fulfilment === "DELIVERY" ? (
                  <>
                    <Truck className="size-3" aria-hidden />
                    Delivery
                  </>
                ) : (
                  <>
                    <Store className="size-3" aria-hidden />
                    Collection
                  </>
                )}
              </Badge>

              {order.deliveryAddress ? (
                <p className="flex gap-2 leading-relaxed text-ink-soft">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
                  {order.deliveryAddress}
                </p>
              ) : null}

              {order.notes ? (
                <div className="rounded-xl border border-line bg-wash p-3">
                  <p className="text-xs font-medium text-muted">Customer note</p>
                  <p className="mt-1 leading-relaxed text-ink-soft">{order.notes}</p>
                </div>
              ) : null}
            </div>
          </Card>

          <OrderActions
            orderId={order.id}
            reference={order.reference}
            phone={order.customerPhone}
            status={order.status}
            paymentStatus={order.paymentStatus}
            whatsapp={settings.contact.whatsapp}
            canUpdate={can(user, "orders.update")}
          />
        </div>
      </div>
    </>
  );
}
