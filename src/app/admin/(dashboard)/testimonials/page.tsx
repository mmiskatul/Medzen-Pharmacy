import { ShieldAlert } from "lucide-react";

import { PageHeader } from "@/components/admin/page-header";
import { requireUser } from "@/lib/auth";

import { TestimonialsManager } from "./testimonials-manager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Testimonials" };

export default async function TestimonialsPage() {
  await requireUser("cms.write");

  return (
    <>
      <PageHeader
        title="Testimonials"
        description="Reviews shown on the homepage. Enter only what real customers have actually said."
      />

      <div className="mb-4 flex gap-3 rounded-xl border border-rx-line bg-rx-bg px-4 py-3">
        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-rx" aria-hidden />
        <p className="text-sm leading-relaxed text-rx">
          A testimonial only goes live once it is marked verified. Nothing on
          this page is generated — if a customer did not say it, do not publish
          it.
        </p>
      </div>

      <TestimonialsManager canWrite />
    </>
  );
}
