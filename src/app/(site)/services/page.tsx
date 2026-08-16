import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MessageCircle, Stethoscope } from "lucide-react";

import { ServiceIcon } from "@/components/site/service-icon";
import { Button } from "@/components/ui/button";
import { Card, EmptyState } from "@/components/ui/primitives";
import { getActiveServices } from "@/lib/queries";
import { getSettings } from "@/lib/site-settings.server";
import { whatsappLink } from "@/lib/whatsapp";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Services",
  description:
    "Prescription support, pharmacy consultation and everyday health products at Medzen Pharmacy in Umm Ramool, Dubai.",
  alternates: { canonical: "/services" },
};

export default async function ServicesPage() {
  const [services, settings] = await Promise.all([
    getActiveServices(),
    getSettings(),
  ]);

  return (
    <div className="container-page py-10 lg:py-14">
      <header className="max-w-2xl">
        <span className="eyebrow">How we help</span>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Pharmacy services
        </h1>
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
          These are the services our team confirms it offers. If you need
          something that is not listed, ask — we will tell you honestly whether
          we can help.
        </p>
      </header>

      {services.length > 0 ? (
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <Card key={service.id} className="flex flex-col p-6">
              <span className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-700">
                <ServiceIcon name={service.icon} className="size-5" />
              </span>
              <h2 className="mt-4 text-base font-semibold text-ink">
                {service.title}
              </h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                {service.description}
              </p>
              <a
                href={
                  service.ctaHref ||
                  whatsappLink(settings.contact.whatsapp, {
                    kind: "service",
                    serviceName: service.title,
                  })
                }
                target={service.ctaHref ? undefined : "_blank"}
                rel={service.ctaHref ? undefined : "noopener noreferrer"}
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 underline-offset-4 hover:underline"
              >
                {service.ctaLabel || "Ask about this"}
                <ArrowRight className="size-3.5" aria-hidden />
              </a>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          className="mt-10"
          icon={Stethoscope}
          title="Services are being confirmed"
          description="We are checking exactly which services to list here. In the meantime, message the pharmacy and we will answer directly."
          action={
            <Button asChild variant="whatsapp">
              <a
                href={whatsappLink(settings.contact.whatsapp, { kind: "general" })}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle />
                Ask on WhatsApp
              </a>
            </Button>
          }
        />
      )}

      <div className="mt-12 rounded-[20px] border border-line bg-wash p-8 lg:p-10">
        <h2 className="font-display text-xl font-bold text-ink">
          Have a prescription ready?
        </h2>
        <p className="mt-2 max-w-xl text-[0.9375rem] leading-relaxed text-muted">
          Send it through the secure upload and our pharmacy team will review it
          and contact you. Dispensing is subject to a valid prescription and
          pharmacist approval.
        </p>
        <Button asChild className="mt-5">
          <Link href="/prescription">
            Upload prescription
            <ArrowRight />
          </Link>
        </Button>
      </div>
    </div>
  );
}
