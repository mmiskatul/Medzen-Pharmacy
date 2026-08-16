import { CartProvider } from "@/components/site/cart-provider";
import { PageViewTracker } from "@/components/site/page-view-tracker";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { WhatsAppFab } from "@/components/site/whatsapp-fab";
import { publicEnv } from "@/lib/env";
import { getSettings } from "@/lib/site-settings.server";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings();
  const { general, contact, hours } = settings;

  // LocalBusiness data is emitted only for facts the pharmacy has
  // confirmed. Opening hours appear once they are set in admin; nothing
  // here is invented to satisfy a schema field.
  const openingHours = hours
    .filter((h) => h.isOpen)
    .map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: `https://schema.org/${h.day[0]!.toUpperCase()}${h.day.slice(1)}`,
      opens: h.opensAt,
      closes: h.closesAt,
    }));

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Pharmacy",
    name: general.pharmacyName,
    url: publicEnv.siteUrl,
    telephone: contact.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: [general.addressLine1, general.addressLine2]
        .filter(Boolean)
        .join(", "),
      addressLocality: general.city,
      addressCountry: "AE",
    },
    ...(general.email ? { email: general.email } : {}),
    ...(openingHours.length > 0
      ? { openingHoursSpecification: openingHours }
      : {}),
    ...(contact.mapsLink ? { hasMap: contact.mapsLink } : {}),
  };

  return (
    <CartProvider>
      <div className="flex min-h-dvh flex-col">
        <SiteHeader
          whatsapp={contact.whatsapp}
          phone={contact.phone}
          announcement={
            settings.home.announcementActive && settings.home.announcement
              ? settings.home.announcement
              : undefined
          }
        />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter settings={settings} />
        <WhatsAppFab whatsapp={contact.whatsapp} />
        <PageViewTracker />
      </div>
      <script
        type="application/ld+json"
        // Serialised server-side from validated settings; no user input reaches it.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </CartProvider>
  );
}
