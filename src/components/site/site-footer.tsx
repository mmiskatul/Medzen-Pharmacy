import Link from "next/link";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";

import { Logo } from "@/components/site/logo";
import { DAY_LABELS, type SiteSettings } from "@/lib/settings";
import { telLink, whatsappLink } from "@/lib/whatsapp";

const QUICK_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/products", label: "Products" },
  { href: "/services", label: "Services" },
  { href: "/prescription", label: "Prescription" },
  { href: "/contact", label: "Contact" },
];

const LEGAL_LINKS = [
  { href: "/privacy", label: "Privacy policy" },
  { href: "/terms", label: "Terms of use" },
  { href: "/prescription-policy", label: "Prescription policy" },
  { href: "/order-policy", label: "Order & refund policy" },
];

export function SiteFooter({ settings }: { settings: SiteSettings }) {
  const { general, contact, hours, social } = settings;
  const openDays = hours.filter((h) => h.isOpen);
  const socials = Object.entries(social).filter(([, url]) => url);

  return (
    <footer className="mt-20 border-t border-line bg-wash">
      <div className="container-page grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
        <div className="lg:pr-6">
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
            {general.tagline
              ? `${general.tagline}. `
              : ""}
            A community pharmacy in Umm Ramool, Dubai. Message us for product
            availability, prescriptions and pharmacy support.
          </p>
          {socials.length > 0 ? (
            <div className="mt-5 flex gap-2">
              {socials.map(([platform, url]) => (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-medium capitalize text-ink-soft transition-colors hover:border-brand-200 hover:text-brand-800"
                >
                  {platform}
                </a>
              ))}
            </div>
          ) : null}
        </div>

        <nav aria-labelledby="footer-links">
          <h2
            id="footer-links"
            className="text-xs font-semibold uppercase tracking-[0.14em] text-muted"
          >
            Quick links
          </h2>
          <ul className="mt-4 space-y-2.5">
            {QUICK_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-ink-soft transition-colors hover:text-brand-800"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            Customer support
          </h2>
          <ul className="mt-4 space-y-3">
            <li>
              <a
                href={telLink(contact.phone)}
                className="flex items-start gap-2.5 text-sm text-ink-soft transition-colors hover:text-brand-800"
              >
                <Phone className="mt-0.5 size-4 shrink-0 text-brand-700" aria-hidden />
                <span className="tnum">{contact.phone}</span>
              </a>
            </li>
            <li>
              <a
                href={whatsappLink(contact.whatsapp, { kind: "general" })}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2.5 text-sm text-ink-soft transition-colors hover:text-brand-800"
              >
                <MessageCircle className="mt-0.5 size-4 shrink-0 text-brand-700" aria-hidden />
                Message on WhatsApp
              </a>
            </li>
            {general.email ? (
              <li>
                <a
                  href={`mailto:${general.email}`}
                  className="flex items-start gap-2.5 text-sm text-ink-soft transition-colors hover:text-brand-800"
                >
                  <Mail className="mt-0.5 size-4 shrink-0 text-brand-700" aria-hidden />
                  {general.email}
                </a>
              </li>
            ) : null}
          </ul>

          {openDays.length > 0 ? (
            <div className="mt-6">
              <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                Opening hours
              </h3>
              <ul className="mt-3 space-y-1">
                {openDays.map((day) => (
                  <li
                    key={day.day}
                    className="flex justify-between gap-4 text-sm text-ink-soft"
                  >
                    <span>{DAY_LABELS[day.day]}</span>
                    <span className="tnum text-muted">
                      {day.opensAt}–{day.closesAt}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            Location
          </h2>
          <address className="mt-4 flex items-start gap-2.5 text-sm not-italic leading-relaxed text-ink-soft">
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
          {contact.mapsLink ? (
            <a
              href={contact.mapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-sm font-medium text-brand-700 underline-offset-4 hover:underline"
            >
              Get directions
            </a>
          ) : null}
        </div>
      </div>

      <div className="border-t border-line">
        <div className="container-page flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between">
          <p className="text-xs text-muted">
            © {new Date().getFullYear()} {general.pharmacyName}. All rights reserved.
          </p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {LEGAL_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-xs text-muted transition-colors hover:text-brand-800"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="container-page pb-6">
          <p className="max-w-3xl text-xs leading-relaxed text-muted">
            Information on this website is general and does not replace advice
            from a pharmacist or doctor. Prescription medicines are dispensed
            only against a valid prescription, subject to applicable UAE pharmacy
            regulations and pharmacist approval.
          </p>
        </div>
      </div>
    </footer>
  );
}
