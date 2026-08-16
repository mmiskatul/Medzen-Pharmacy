import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircle, Phone, ShieldAlert } from "lucide-react";

import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, EmptyState } from "@/components/ui/primitives";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/rbac";
import { getSettings } from "@/lib/site-settings.server";
import { formatDate, formatPrice } from "@/lib/utils";
import { telLink, whatsappLink } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";
export const metadata = { title: "Customer" };

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser("customers.read");
  const { id } = await params;

  const [customer, settings] = await Promise.all([
    prisma.customer.findFirst({
      where: { id, deletedAt: null },
      include: {
        orders: {
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id: true,
            reference: true,
            totalFils: true,
            status: true,
            createdAt: true,
          },
        },
        // Prescription history shows references and status only. Nothing
        // clinical, and no file access from this screen.
        prescriptions: {
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id: true,
            reference: true,
            status: true,
            createdAt: true,
          },
        },
      },
    }),
    getSettings(),
  ]);

  if (!customer) notFound();

  const canSeePrescriptions = can(user, "prescriptions.read");

  return (
    <>
      <PageHeader
        title={customer.name}
        description={`Customer since ${formatDate(customer.createdAt)}`}
        backHref="/admin/customers"
        backLabel="Customers"
      />

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-5">
          <Card>
            <CardHeader
              title="Orders"
              description={`${customer.orders.length} most recent`}
            />
            {customer.orders.length === 0 ? (
              <EmptyState
                className="border-0 bg-white py-10"
                icon={MessageCircle}
                title="No orders yet"
                description="This customer has not sent an order request."
              />
            ) : (
              <ul className="divide-y divide-line">
                {customer.orders.map((order) => (
                  <li key={order.id}>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-wash"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="tnum text-sm font-medium text-ink">
                          {order.reference}
                        </p>
                        <p className="text-xs text-muted">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <span className="tnum text-sm font-medium">
                        {formatPrice(order.totalFils)}
                      </span>
                      <StatusBadge status={order.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {canSeePrescriptions ? (
            <Card>
              <CardHeader
                title="Prescription requests"
                description="References and status only."
              />
              {customer.prescriptions.length === 0 ? (
                <p className="p-5 text-sm text-muted">
                  No prescription requests from this customer.
                </p>
              ) : (
                <ul className="divide-y divide-line">
                  {customer.prescriptions.map((request) => (
                    <li key={request.id}>
                      <Link
                        href={`/admin/prescriptions/${request.id}`}
                        className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-wash"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="tnum text-sm font-medium text-ink">
                            {request.reference}
                          </p>
                          <p className="text-xs text-muted">
                            {formatDate(request.createdAt)}
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

        <div className="space-y-5">
          <Card>
            <CardHeader title="Contact" />
            <dl className="space-y-3 p-5 text-sm">
              <div>
                <dt className="text-xs text-muted">Phone</dt>
                <dd className="tnum font-medium text-ink">{customer.phone}</dd>
              </div>
              {customer.email ? (
                <div>
                  <dt className="text-xs text-muted">Email</dt>
                  <dd className="font-medium text-ink">{customer.email}</dd>
                </div>
              ) : null}
              {customer.address ? (
                <div>
                  <dt className="text-xs text-muted">Address</dt>
                  <dd className="leading-relaxed text-ink-soft">{customer.address}</dd>
                </div>
              ) : null}
            </dl>
            <div className="grid gap-2 border-t border-line p-5">
              <Button asChild variant="whatsapp">
                <a
                  href={whatsappLink(settings.contact.whatsapp, { kind: "general" })}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle />
                  Message on WhatsApp
                </a>
              </Button>
              <Button asChild variant="secondary">
                <a href={telLink(customer.phone)}>
                  <Phone />
                  Call
                </a>
              </Button>
            </div>
          </Card>

          <div className="flex gap-3 rounded-xl border border-rx-line bg-rx-bg px-4 py-3">
            <ShieldAlert className="mt-0.5 size-4 shrink-0 text-rx" aria-hidden />
            <p className="text-xs leading-relaxed text-rx">
              Keep health information out of customer records. Anything clinical
              belongs on the prescription request, where access is restricted and
              logged.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
