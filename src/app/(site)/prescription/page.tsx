import type { Metadata } from "next";
import { EyeOff, Lock, ShieldCheck, UserCheck } from "lucide-react";

import { PrescriptionForm } from "@/components/site/prescription-form";
import { env } from "@/lib/env";
import { getSettings } from "@/lib/site-settings.server";

export const metadata: Metadata = {
  title: "Upload your prescription",
  description:
    "Send your prescription to Medzen Pharmacy in Umm Ramool, Dubai. Upload a JPG, PNG or PDF and our pharmacy team will review it and contact you.",
  alternates: { canonical: "/prescription" },
};

const ASSURANCES = [
  {
    icon: Lock,
    title: "Private by default",
    body: "Files are stored in private storage and are never published on this website or given a public link.",
  },
  {
    icon: UserCheck,
    title: "Reviewed by our team",
    body: "A pharmacist reviews every request before anything is prepared or dispensed.",
  },
  {
    icon: EyeOff,
    title: "Seen only by staff",
    body: "Access is limited to authorised pharmacy staff, and every view is recorded in our audit log.",
  },
];

export default async function PrescriptionPage() {
  const settings = await getSettings();

  return (
    <div className="container-page py-10 lg:py-14">
      <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
        <div>
          <header className="max-w-xl">
            <span className="eyebrow">
              <ShieldCheck className="size-3.5" aria-hidden />
              Secure upload
            </span>
            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Upload your prescription
            </h1>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
              Send us a clear photo or PDF and we will review it, check what we
              can dispense, and contact you on the number you give below.
            </p>
          </header>

          <div className="mt-8">
            <PrescriptionForm
              whatsapp={settings.contact.whatsapp}
              maxBytes={env.MAX_UPLOAD_BYTES}
            />
          </div>
        </div>

        <aside className="space-y-4 lg:pt-16">
          <div className="rounded-2xl border border-line bg-wash p-5">
            <h2 className="text-base font-semibold text-ink">
              How we handle your prescription
            </h2>
            <ul className="mt-4 space-y-4">
              {ASSURANCES.map((item) => (
                <li key={item.title} className="flex gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white text-brand-700">
                    <item.icon className="size-4" aria-hidden />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink">{item.title}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-muted">
                      {item.body}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-rx-line bg-rx-bg p-5">
            <h2 className="text-sm font-semibold text-rx">
              What we cannot do online
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-rx/90">
              We do not diagnose conditions or recommend prescription medicines
              through this website. Dispensing is subject to a valid prescription,
              applicable UAE pharmacy regulations and pharmacist approval.
            </p>
          </div>

          <div className="rounded-2xl border border-line p-5">
            <h2 className="text-sm font-semibold text-ink">Emergencies</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              This form is not monitored around the clock. For urgent medical
              help call 998 or go to the nearest emergency department.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
