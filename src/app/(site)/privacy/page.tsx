import type { Metadata } from "next";

import { LegalPage } from "@/components/site/legal-page";
import { getSettings } from "@/lib/site-settings.server";

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "How Medzen Pharmacy collects, uses and protects the information you send through this website.",
  alternates: { canonical: "/privacy" },
};

export default async function PrivacyPage() {
  const settings = await getSettings();

  return (
    <LegalPage
      title="Privacy policy"
      updated="August 2026"
      intro="This policy explains what we collect when you use this website, why we collect it, and how we look after it."
    >
      <section>
        <h2>What we collect</h2>
        <ul>
          <li>
            Contact details you enter in a form: your name, phone number and, if
            you provide one, your email address.
          </li>
          <li>
            The contents of a message, order request or prescription note you
            send us.
          </li>
          <li>
            Prescription files you upload, stored in private storage that is not
            reachable from the public internet.
          </li>
          <li>
            Aggregate page and search counts. We record which pages were viewed
            and which terms were searched, without any visitor identifier, IP
            address or profile.
          </li>
        </ul>
      </section>

      <section>
        <h2>Why we collect it</h2>
        <p>
          To answer your question, prepare a request, review a prescription and
          contact you about it. We do not sell your information, and we do not
          use it for advertising.
        </p>
      </section>

      <section>
        <h2>Who can see it</h2>
        <p>
          Authorised pharmacy staff only, and only the areas their role gives
          them access to. Access to prescription files is limited to staff with
          the prescription permission, and every view and download is recorded
          in an internal audit log.
        </p>
      </section>

      <section>
        <h2>How long we keep it</h2>
        <p>
          We keep prescription requests and order records for as long as needed
          to serve you and to meet applicable UAE record-keeping requirements,
          then remove them. Contact messages are kept while they are being
          handled and for a reasonable period afterwards.
        </p>
      </section>

      <section>
        <h2>Cookies</h2>
        <p>
          This website does not use advertising or tracking cookies. Your basket
          and recent searches are stored in your own browser and are never sent
          to us. Staff signing in to the admin area receive one essential,
          HTTP-only session cookie.
        </p>
      </section>

      <section>
        <h2>Your choices</h2>
        <p>
          You can ask us what we hold about you, ask us to correct it, or ask us
          to delete it where we are not required to keep it. Call or message the
          pharmacy on {settings.contact.phone} and we will help.
        </p>
      </section>
    </LegalPage>
  );
}
