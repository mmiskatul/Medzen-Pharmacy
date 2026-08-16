import type { Metadata } from "next";
import { MapPin, MessageCircle, Navigation, Phone } from "lucide-react";

import { ContactForm } from "@/components/site/contact-form";
import { Button } from "@/components/ui/button";
import { DAY_LABELS } from "@/lib/settings";
import { getSettings } from "@/lib/site-settings.server";
import { telLink, whatsappLink } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Call, WhatsApp or visit Medzen Pharmacy at Showroom S1, Ramool New Building, Nad Al Hamr Road, Umm Ramool, Dubai.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const settings = await getSettings();
  const { general, contact, hours } = settings;
  const openDays = hours.filter((day) => day.isOpen);

  return (
    <div className="container-page py-10 lg:py-14">
      <header className="max-w-2xl">
        <span className="eyebrow">Get in touch</span>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Contact Medzen Pharmacy
        </h1>
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
          Call us, message us on WhatsApp, or send the form below. For
          prescriptions, use the secure upload so your document stays private.
        </p>
      </header>

      <div className="mt-9 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
        <div className="space-y-6">
          <div className="rounded-2xl border border-line bg-white p-6">
            <h2 className="text-base font-semibold text-ink">
              {general.pharmacyName}
            </h2>
            <address className="mt-3 flex items-start gap-2.5 text-sm not-italic leading-relaxed text-muted">
              <MapPin className="mt-0.5 size-4 shrink-0 text-brand-700" aria-hidden />
              <span>
                {general.addressLine1}
                <br />
                {general.addressLine2}
                <br />
                {general.city}
                <br />
                {general.country}
              </span>
            </address>

            <div className="mt-5 flex flex-wrap gap-2.5">
              <Button asChild>
                <a href={telLink(contact.phone)}>
                  <Phone />
                  Call now
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
              {contact.mapsLink ? (
                <Button asChild variant="secondary">
                  <a
                    href={contact.mapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Navigation />
                    Get directions
                  </a>
                </Button>
              ) : null}
            </div>

            <dl className="mt-6 space-y-2.5 border-t border-line pt-5 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Phone</dt>
                <dd className="tnum font-medium text-ink">{contact.phone}</dd>
              </div>
              {general.email ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Email</dt>
                  <dd className="font-medium text-ink">{general.email}</dd>
                </div>
              ) : null}
            </dl>
          </div>

          {openDays.length > 0 ? (
            <div className="rounded-2xl border border-line bg-white p-6">
              <h2 className="text-base font-semibold text-ink">Opening hours</h2>
              <dl className="mt-4 space-y-2">
                {hours.map((day) => (
                  <div key={day.day} className="flex justify-between gap-4 text-sm">
                    <dt className="text-muted">{DAY_LABELS[day.day]}</dt>
                    <dd
                      className={
                        day.isOpen ? "tnum font-medium text-ink" : "text-muted"
                      }
                    >
                      {day.isOpen ? `${day.opensAt} – ${day.closesAt}` : "Closed"}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}

          {contact.mapsEmbedUrl ? (
            <div className="overflow-hidden rounded-2xl border border-line">
              <iframe
                src={contact.mapsEmbedUrl}
                title={`Map showing ${general.pharmacyName}`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-[300px] w-full border-0"
              />
            </div>
          ) : null}
        </div>

        <div>
          <h2 className="sr-only">Send a message</h2>
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
