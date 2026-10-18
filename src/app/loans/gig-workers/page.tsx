import type { Metadata } from "next";
import { ButtonLink } from "@/components/ButtonLink";
import { PageShell } from "@/components/PageShell";

export const metadata: Metadata = { title: "Loans for gig workers" };

export default function GigWorkers() {
  return (
    <PageShell
      title="Loans for gig workers"
      intro="For delivery partners, ride-hailing drivers, home-service professionals and freelancers."
    >
      <ul className="space-y-3 text-muted">
        <li>Borrow Rs 15,000 to Rs 3,00,000 for a vehicle repair, a phone, tools or a gap between payouts.</li>
        <li>Regular payouts from platforms into your bank account show your earning pattern. That counts in your favour.</li>
        <li>No salary slip needed. We read your bank statement through the RBI Account Aggregator, with your consent.</li>
        <li>First loans go up to Rs 50,000. Repay on time and your limit can grow.</li>
        <li>Repay in equal monthly EMIs over 6 to 60 months, auto-debited from your bank account.</li>
      </ul>
      <div className="mt-10">
        <ButtonLink href="/eligibility">Check Eligibility</ButtonLink>
      </div>
    </PageShell>
  );
}
