import type { Metadata } from "next";

import { CheckoutForm } from "@/components/site/checkout-form";
import { getSettings } from "@/lib/site-settings.server";

export const metadata: Metadata = {
  title: "Confirm your request",
  description: "Send your product request to Medzen Pharmacy.",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const settings = await getSettings();

  return (
    <div className="container-page py-10 lg:py-14">
      <header className="max-w-2xl">
        <span className="eyebrow">Step 2 of 3</span>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Where should we send it?
        </h1>
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
          Tell us how to reach you and whether you would like delivery or
          collection. We will confirm everything before preparing your order.
        </p>
      </header>

      <div className="mt-9">
        <CheckoutForm
          whatsapp={settings.contact.whatsapp}
          showPrices={settings.commerce.showPrices}
        />
      </div>
    </div>
  );
}
