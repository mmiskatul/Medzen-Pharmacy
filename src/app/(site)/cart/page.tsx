import type { Metadata } from "next";

import { CartView } from "@/components/site/cart-view";
import { getSettings } from "@/lib/site-settings.server";

export const metadata: Metadata = {
  title: "Your request",
  description: "Review the items you would like Medzen Pharmacy to prepare.",
  robots: { index: false, follow: false },
};

export default async function CartPage() {
  const settings = await getSettings();

  return (
    <div className="container-page py-10 lg:py-14">
      <header className="max-w-2xl">
        <span className="eyebrow">Step 1 of 3</span>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Your request
        </h1>
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
          Check the items and quantities. Nothing is charged here — we confirm
          availability and the total with you first.
        </p>
      </header>

      <div className="mt-9">
        <CartView
          whatsapp={settings.contact.whatsapp}
          showPrices={settings.commerce.showPrices}
          deliveryFeeFils={settings.commerce.deliveryFeeFils}
          freeDeliveryOverFils={settings.commerce.freeDeliveryOverFils}
        />
      </div>
    </div>
  );
}
