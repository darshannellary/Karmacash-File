import type { Metadata } from "next";
import { EligibilityForm } from "@/components/EligibilityForm";
import { PageShell } from "@/components/PageShell";

export const metadata: Metadata = { title: "Check eligibility" };

export default function Eligibility() {
  return (
    <PageShell title="Check your eligibility" intro="Four questions, two minutes, and no effect on your credit score.">
      <EligibilityForm />
    </PageShell>
  );
}
