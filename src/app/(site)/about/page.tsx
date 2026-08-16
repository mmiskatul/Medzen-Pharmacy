import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MapPin, MessageCircle, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, SectionHeading } from "@/components/ui/primitives";
import { getSettings } from "@/lib/site-settings.server";
import { telLink, whatsappLink } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "About",
  description:
    "Medzen Pharmacy is a community pharmacy in Umm Ramool, Dubai, offering everyday health essentials, prescription support and pharmacy advice.",
  alternates: { canonical: "/about" },
};

const REASONS = [
  {
    title: "Professional support",
    body: "Prescription requests are reviewed by our pharmacy team before anything is prepared or dispensed.",
  },
  {
    title: "Convenient communication",
    body: "Reach us the way that suits you — WhatsApp, a phone call, or a message through this website.",
  },
  {
    title: "Quality products",
    body: "Everyday health, personal care and wellness ranges, kept current on the shelf.",
  },
  {
    title: "Customer-centred service",
    body: "Clear answers about what we stock, what we can order, and how long it takes.",
  },
  {
    title: "Easy prescription requests",
    body: "Send a photo or PDF from your phone in under a minute. No account required.",
  },
];

export default async function AboutPage() {
  const settings = await getSettings();
  const { general, contact, about } = settings;

  return (
    <>
      <section className="border-b border-line">
        <div className="container-page py-14 lg:py-20">
          <div className="max-w-3xl">
            <span className="eyebrow">
              <MapPin className="size-3.5" aria-hidden />
              {general.city}
            </span>
            <h1 className="mt-4 font-display text-3xl font-bold leading-tight tracking-tight sm:text-[2.75rem]">
              A neighbourhood pharmacy on Nad Al Hamr Road
            </h1>
            <p className="mt-5 text-base leading-relaxed text-muted sm:text-[1.0625rem]">
              {about.intro}
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-wash">
        <div className="container-page grid gap-10 py-16 lg:grid-cols-2 lg:gap-16 lg:py-20">
          <div>
            <SectionHeading eyebrow="Who we are" title="Built around the counter" />
            <p className="mt-5 text-[0.9375rem] leading-relaxed text-muted">
              Medzen Pharmacy serves Umm Ramool and the surrounding Nad Al Hamar
              and Al Rashidiya neighbourhoods. Our team helps with everyday
              health needs — from a question about a supplement to filling a
              prescription — and we try to answer quickly so you are not left
              guessing whether to make the trip.
            </p>
            <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted">
              This website exists to make that easier. Browse what we list, send
              a prescription securely, or put together a request and we will
              confirm it with you before anything is prepared.
            </p>
          </div>

          <div>
            <SectionHeading eyebrow="Our mission" title="Accessible pharmacy support" />
            <p className="mt-5 text-[0.9375rem] leading-relaxed text-muted">
              {about.mission}
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <Button asChild>
                <Link href="/services">
                  What we offer
                  <ArrowRight />
                </Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/prescription">Send a prescription</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-16 lg:py-20">
        <SectionHeading
          eyebrow="Why choose Medzen"
          title="What you can expect from us"
          align="center"
        />
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {REASONS.map((reason) => (
            <Card key={reason.title} className="p-5">
              <h3 className="text-[0.9375rem] font-semibold text-ink">
                {reason.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {reason.body}
              </p>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-t border-line bg-wash">
        <div className="container-page grid gap-8 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:py-20">
          <div>
            <SectionHeading eyebrow="Location" title="Come and see us" />
            <address className="mt-6 space-y-1 text-[0.9375rem] not-italic leading-relaxed text-ink-soft">
              <p className="font-semibold text-ink">{general.pharmacyName}</p>
              <p>{general.addressLine1}</p>
              <p>{general.addressLine2}</p>
              <p>{general.city}</p>
              <p>{general.country}</p>
            </address>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <Button asChild>
                <a href={telLink(contact.phone)}>
                  <Phone />
                  {contact.phone}
                </a>
              </Button>
              <Button asChild variant="whatsapp">
                <a
                  href={whatsappLink(contact.whatsapp, { kind: "general" })}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle />
                  WhatsApp
                </a>
              </Button>
            </div>
          </div>

          {contact.mapsEmbedUrl ? (
            <div className="overflow-hidden rounded-2xl border border-line">
              <iframe
                src={contact.mapsEmbedUrl}
                title={`Map showing ${general.pharmacyName} in ${general.city}`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-[320px] w-full border-0 lg:h-[400px]"
              />
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}
