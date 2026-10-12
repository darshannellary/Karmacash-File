import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";

export const metadata: Metadata = { title: "About" };

export default function About() {
  return (
    <PageShell
      title="About Karmacash"
      intro="Millions of traders and gig workers earn steadily through UPI but still struggle to get a fair small loan quickly."
    >
      <div className="space-y-4 text-muted">
        <p>
          Karmacash looks at how you actually earn: the customers who pay you by UPI and the payouts that reach your
          account every week. Together with your credit report, that lets our lending partner offer fair loans to
          people who are often turned away.
        </p>
        <p>We show every rupee of cost before you sign, and we never hide charges or use your phone data.</p>
        <p>We are starting in Kerala and will expand across India.</p>
      </div>
    </PageShell>
  );
}
