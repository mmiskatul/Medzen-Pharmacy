"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2, MessageCircle, ShieldAlert, Store, Truck } from "lucide-react";

import { useCart } from "@/components/site/cart-provider";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Card, EmptyState } from "@/components/ui/primitives";
import { formatPrice } from "@/lib/utils";
import { whatsappLink } from "@/lib/whatsapp";

type Errors = Record<string, string[]>;
type Fulfilment = "DELIVERY" | "COLLECTION";

export function CheckoutForm({
  whatsapp,
  showPrices,
}: {
  whatsapp: string;
  showPrices: boolean;
}) {
  const cart = useCart();
  const [fulfilment, setFulfilment] = React.useState<Fulfilment>("DELIVERY");
  const [errors, setErrors] = React.useState<Errors>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [confirmed, setConfirmed] = React.useState<{
    reference: string;
    needsPrescription: boolean;
  } | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setSubmitting(true);

    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name") ?? ""),
      phone: String(form.get("phone") ?? ""),
      email: String(form.get("email") ?? ""),
      fulfilment,
      address: String(form.get("address") ?? ""),
      notes: String(form.get("notes") ?? ""),
      website: String(form.get("website") ?? ""),
      items: cart.lines.map((line) => ({
        productId: line.productId,
        quantity: line.quantity,
      })),
    };

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as {
        ok: boolean;
        data?: { reference: string; needsPrescription: boolean };
        error?: string;
        fieldErrors?: Errors;
      };

      if (!response.ok || !result.ok || !result.data) {
        setErrors(result.fieldErrors ?? {});
        setFormError(result.error ?? "The request could not be sent.");
        return;
      }

      setErrors({});
      setConfirmed(result.data);
      cart.clear();
    } catch {
      setFormError(
        "We could not reach the pharmacy just now. Check your connection and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmed) {
    return (
      <Card className="mx-auto max-w-xl p-7 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-brand-50">
          <CheckCircle2 className="size-6 text-brand-700" aria-hidden />
        </span>
        <h2 className="mt-4 font-display text-xl font-bold text-ink">
          Request sent to the pharmacy
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
          Our team will check availability and contact you to confirm the total
          and arrange collection or delivery.
        </p>
        <p className="tnum mt-4 inline-block rounded-xl border border-line bg-wash px-4 py-2 text-base font-semibold text-ink">
          {confirmed.reference}
        </p>

        {confirmed.needsPrescription ? (
          <div className="mt-5 flex gap-2.5 rounded-xl border border-rx-line bg-rx-bg p-4 text-left">
            <ShieldAlert className="mt-0.5 size-4 shrink-0 text-rx" aria-hidden />
            <p className="text-sm leading-relaxed text-rx">
              One or more items may require a prescription.{" "}
              <Link href="/prescription" className="font-semibold underline underline-offset-2">
                Upload it now
              </Link>{" "}
              so the pharmacist can review it before you arrive.
            </p>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap justify-center gap-2.5">
          <Button asChild variant="whatsapp">
            <a
              href={whatsappLink(whatsapp, {
                kind: "order",
                reference: confirmed.reference,
              })}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle />
              Follow up on WhatsApp
            </a>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/products">Keep browsing</Link>
          </Button>
        </div>
      </Card>
    );
  }

  if (cart.ready && cart.lines.length === 0) {
    return (
      <EmptyState
        icon={Store}
        title="There is nothing to send yet"
        description="Add the products you need and come back to this step."
        action={
          <Button asChild>
            <Link href="/products">Browse products</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr] lg:gap-10">
      <form onSubmit={onSubmit} noValidate className="space-y-6">
        <div aria-hidden className="hidden">
          <label htmlFor="co-website">Website</label>
          <input id="co-website" name="website" tabIndex={-1} autoComplete="off" />
        </div>

        <Card className="p-6">
          <h2 className="text-base font-semibold text-ink">Your details</h2>
          <div className="mt-5 space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Full name" htmlFor="co-name" error={errors.name?.[0]}>
                <Input id="co-name" name="name" required autoComplete="name" />
              </Field>
              <Field label="Phone number" htmlFor="co-phone" error={errors.phone?.[0]}>
                <Input
                  id="co-phone"
                  name="phone"
                  type="tel"
                  required
                  autoComplete="tel"
                  inputMode="tel"
                  placeholder="+971 50 123 4567"
                />
              </Field>
            </div>
            <Field label="Email" htmlFor="co-email" optional error={errors.email?.[0]}>
              <Input id="co-email" name="email" type="email" autoComplete="email" />
            </Field>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-base font-semibold text-ink">
            Delivery or collection
          </h2>

          <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
            {(
              [
                {
                  value: "DELIVERY" as const,
                  icon: Truck,
                  title: "Delivery",
                  body: "We arrange delivery and confirm the fee with you.",
                },
                {
                  value: "COLLECTION" as const,
                  icon: Store,
                  title: "Collection",
                  body: "Pick it up at the counter in Umm Ramool.",
                },
              ]
            ).map((option) => (
              <label
                key={option.value}
                className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors ${
                  fulfilment === option.value
                    ? "border-brand-500 bg-brand-50"
                    : "border-line-strong hover:bg-wash"
                }`}
              >
                <input
                  type="radio"
                  name="fulfilment"
                  value={option.value}
                  checked={fulfilment === option.value}
                  onChange={() => setFulfilment(option.value)}
                  className="mt-0.5 size-4 border-line-strong text-brand-600 focus:ring-brand-500"
                />
                <span>
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                    <option.icon className="size-4" aria-hidden />
                    {option.title}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-muted">
                    {option.body}
                  </span>
                </span>
              </label>
            ))}
          </div>

          {fulfilment === "DELIVERY" ? (
            <div className="mt-5">
              <Field
                label="Delivery address"
                htmlFor="co-address"
                error={errors.address?.[0]}
                hint="Building, street and area — anything that helps us find you."
              >
                <Textarea id="co-address" name="address" rows={3} required />
              </Field>
            </div>
          ) : null}

          <div className="mt-5">
            <Field label="Notes for the pharmacy" htmlFor="co-notes" optional>
              <Textarea id="co-notes" name="notes" rows={3} maxLength={1000} />
            </Field>
          </div>
        </Card>

        {formError ? (
          <p
            className="rounded-xl border border-red-200 bg-danger-bg px-4 py-3 text-sm text-danger"
            role="alert"
          >
            {formError}
          </p>
        ) : null}

        <Button type="submit" size="lg" loading={submitting} disabled={!cart.ready}>
          Send request to the pharmacy
        </Button>
      </form>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <Card className="p-5">
          <h2 className="text-base font-semibold text-ink">Your items</h2>
          <ul className="mt-4 space-y-3">
            {cart.lines.map((line) => (
              <li key={line.productId} className="flex justify-between gap-3 text-sm">
                <span className="min-w-0">
                  <span className="block truncate font-medium text-ink">
                    {line.name}
                  </span>
                  <span className="tnum text-xs text-muted">× {line.quantity}</span>
                </span>
                {showPrices && line.priceFils !== null ? (
                  <span className="tnum shrink-0 font-medium text-ink">
                    {formatPrice(line.priceFils * line.quantity)}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
          {showPrices ? (
            <p className="mt-4 flex justify-between gap-4 border-t border-line pt-3 text-sm">
              <span className="font-semibold text-ink">Subtotal</span>
              <span className="tnum font-bold text-ink">
                {formatPrice(cart.subtotalFils)}
              </span>
            </p>
          ) : null}
          <p className="mt-4 text-xs leading-relaxed text-muted">
            No payment is taken on this website. The pharmacy confirms the final
            total with you directly.
          </p>
        </Card>
      </aside>
    </div>
  );
}
