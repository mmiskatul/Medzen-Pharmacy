import type { Metadata } from "next";

import { LegalPage } from "@/components/site/legal-page";

export const metadata: Metadata = {
  title: "Prescription policy",
  description:
    "How Medzen Pharmacy receives, reviews and stores prescriptions submitted through this website.",
  alternates: { canonical: "/prescription-policy" },
};

export default function PrescriptionPolicyPage() {
  return (
    <LegalPage
      title="Prescription policy"
      updated="August 2026"
      intro="What happens to a prescription you send us, and what we can and cannot do with it."
    >
      <section>
        <h2>How your file is handled</h2>
        <ul>
          <li>
            Uploads are written to private storage under a random, unguessable
            key. They are never given a public link and never appear anywhere on
            this website.
          </li>
          <li>
            Only signed-in pharmacy staff with the prescription permission can
            open a file, and each view or download is recorded in our audit log.
          </li>
          <li>
            We accept JPG, PNG and PDF files. Every upload is checked by its
            actual file contents, not just its name or extension.
          </li>
        </ul>
      </section>

      <section>
        <h2>Review and dispensing</h2>
        <p>
          A pharmacist reviews each request and decides what can be dispensed.
          Prescription medicines are supplied only against a valid prescription,
          subject to applicable UAE pharmacy regulations and pharmacist approval.
          We may contact you for clarification, or ask to see the original.
        </p>
        <p>
          Submitting a prescription through this website is a request. It is not
          a confirmation that the medicine is available or that it will be
          dispensed.
        </p>
      </section>

      <section>
        <h2>What we will not do</h2>
        <ul>
          <li>Diagnose a condition or interpret symptoms online.</li>
          <li>
            Recommend or supply a prescription medicine without a valid
            prescription and pharmacist review.
          </li>
          <li>Share your prescription with anyone outside the pharmacy team.</li>
        </ul>
      </section>

      <section>
        <h2>Request statuses</h2>
        <p>
          Your request moves through pending, under review, and then approved,
          rejected or completed. If we need more information, we mark it as
          clarification requested and contact you on the number you gave.
        </p>
      </section>

      <section>
        <h2>Withdrawing a request</h2>
        <p>
          Call or message the pharmacy with your reference and we will withdraw
          the request and remove the file, unless we are required to retain it
          under applicable regulations.
        </p>
      </section>
    </LegalPage>
  );
}
