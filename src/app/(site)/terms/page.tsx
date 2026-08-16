import type { Metadata } from "next";

import { LegalPage } from "@/components/site/legal-page";

export const metadata: Metadata = {
  title: "Terms of use",
  description: "The terms that apply when you use the Medzen Pharmacy website.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of use"
      updated="August 2026"
      intro="These terms apply when you browse this website or send us a request through it."
    >
      <section>
        <h2>What this website is</h2>
        <p>
          This website lets you see what Medzen Pharmacy lists, send an order
          request, upload a prescription and contact our team. It is an
          information and request service — it is not a medical service.
        </p>
      </section>

      <section>
        <h2>No medical advice</h2>
        <p>
          Product information here is general and comes from manufacturers. It
          does not replace advice from a pharmacist or doctor, and nothing on
          this website diagnoses a condition or recommends a prescription
          medicine. Always read the label and speak to a qualified professional
          about what is right for you.
        </p>
      </section>

      <section>
        <h2>Availability and pricing</h2>
        <ul>
          <li>
            Listings show what we normally carry. Stock changes, and an item
            being listed is not a guarantee that it is on the shelf today.
          </li>
          <li>
            Prices shown are indicative. The pharmacy confirms the final total
            with you before preparing anything.
          </li>
          <li>
            Prescription medicines are dispensed only against a valid
            prescription, subject to applicable UAE pharmacy regulations and
            pharmacist approval.
          </li>
        </ul>
      </section>

      <section>
        <h2>Using this website</h2>
        <p>
          Please give accurate contact details so we can reach you, and do not
          attempt to disrupt the website, access areas you are not authorised to
          use, or submit content that is not yours to send.
        </p>
      </section>

      <section>
        <h2>Changes</h2>
        <p>
          We may update these terms as the service changes. The date at the top
          of this page shows when it was last revised.
        </p>
      </section>
    </LegalPage>
  );
}
