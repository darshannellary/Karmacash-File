import type { Metadata } from "next";
import { ButtonLink } from "@/components/ButtonLink";
import { PageShell } from "@/components/PageShell";

export const metadata: Metadata = { title: "Loans for small traders" };

export default function Traders() {
  return (
    <PageShell
      title="Loans for small traders"
      intro="For kirana stores, street vendors, small shops and home businesses that take payments by UPI."
    >
      <ul className="space-y-3 text-muted">
        <li>Borrow Rs 15,000 to Rs 3,00,000 for stock, equipment or a busy season.</li>
        <li>Your UPI receipts show how many customers pay you and how steady your sales are. That counts in your favour.</li>
        <li>GST filings and Udyam registration help but are not required.</li>
        <li>First loans go up to Rs 50,000. Repay on time and your limit can grow.</li>
        <li>Repay in equal monthly EMIs over 6 to 60 months, auto-debited from your bank account.</li>
      </ul>
      <div className="mt-10">
        <ButtonLink href="/eligibility">Check Eligibility</ButtonLink>
      </div>
    </PageShell>
  );
}
