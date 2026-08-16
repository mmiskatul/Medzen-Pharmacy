import type { Metadata } from "next";

import { LegalPage } from "@/components/site/legal-page";

export const metadata: Metadata = {
  title: "Order & refund policy",
  description:
    "How order requests, collection, delivery and returns work at Medzen Pharmacy.",
  alternates: { canonical: "/order-policy" },
};

export default function OrderPolicyPage() {
  return (
    <LegalPage
      title="Order & refund policy"
      updated="August 2026"
      intro="How a request becomes an order, and what happens if something is wrong with it."
    >
      <section>
        <h2>Requests, not payments</h2>
        <p>
          This website takes order requests. No payment is collected online. Once
          you send a request, our team checks availability and contacts you to
          confirm the items and the final total before preparing anything.
        </p>
      </section>

      <section>
        <h2>Order statuses</h2>
        <ul>
          <li>Pending — received, waiting for our team to review.</li>
          <li>Confirmed — items and total agreed with you.</li>
          <li>Preparing — being picked and packed.</li>
          <li>Ready — waiting at the counter for collection.</li>
          <li>Out for delivery — on its way to your address.</li>
          <li>Completed — collected or delivered.</li>
          <li>Cancelled — withdrawn by you or by the pharmacy.</li>
        </ul>
      </section>

      <section>
        <h2>Collection and delivery</h2>
        <p>
          Collection is from our counter at Showroom S1, Ramool New Building,
          Nad Al Hamr Road, Umm Ramool. Where delivery is available, our team
          confirms the area, timing and any fee with you before dispatch.
        </p>
      </section>

      <section>
        <h2>Cancelling</h2>
        <p>
          You can cancel any request before it is prepared — call or message us
          with your reference. We may also cancel a request if an item is
          unavailable or if a prescription requirement is not met.
        </p>
      </section>

      <section>
        <h2>Returns and refunds</h2>
        <p>
          If an item is damaged, incorrect or expired, contact us with your
          reference and we will put it right. For health and safety reasons,
          medicines and some personal-care items cannot be returned once they
          have left the pharmacy, except where they are faulty or where UAE
          consumer law provides otherwise.
        </p>
      </section>
    </LegalPage>
  );
}
