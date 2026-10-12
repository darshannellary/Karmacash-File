import type { Metadata } from "next";
import { DraftNotice, PageShell } from "@/components/PageShell";
import { SITE } from "@/lib/config";

export const metadata: Metadata = { title: "Terms of use" };

export default function Terms() {
  return (
    <PageShell title="Terms of use">
      <DraftNotice />
      <div className="prose-legal mt-6">
        <p>
          These terms govern your use of {SITE.domain}, run by {SITE.legalName}. Your loan itself is governed by the
          loan agreement and Key Fact Statement from our lending partner.
        </p>
        <h2>Eligibility checks are indicative</h2>
        <p>The eligibility check is a guide, not an offer. Only the lender&apos;s decision after your full application is final.</p>
        <h2>Your account</h2>
        <p>Keep your mobile number and one-time passwords private. Tell us at once if you think someone else used your account.</p>
        <h2>Accurate information</h2>
        <p>Give true and complete information. Applications with false information will be declined.</p>
        <h2>Changes</h2>
        <p>We may update these terms and will show the date of the latest version here.</p>
      </div>
    </PageShell>
  );
}
