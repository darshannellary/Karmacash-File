import type { Metadata } from "next";
import { DraftNotice, PageShell } from "@/components/PageShell";
import { SITE } from "@/lib/config";

export const metadata: Metadata = { title: "Privacy policy" };

export default function Privacy() {
  return (
    <PageShell title="Privacy policy">
      <DraftNotice />
      <div className="prose-legal mt-6">
        <p>
          This policy explains what personal data {SITE.legalName} collects, why, how long we keep it and how you can
          withdraw your consent, under the Digital Personal Data Protection Act, 2023.
        </p>
        <h2>What we collect, and why</h2>
        <ul>
          <li>Mobile number: to sign you in and contact you about your application and loan.</li>
          <li>KYC details (name, date of birth, address, PAN, last four Aadhaar digits, selfie): to verify your identity for the lender.</li>
          <li>Bank statements for 12 months, fetched once through the RBI Account Aggregator: to assess your income and repayment capacity.</li>
          <li>Credit report: to check your credit history.</li>
          <li>Bank account details for disbursal and auto-debit: to pay you and collect EMIs.</li>
        </ul>
        <h2>What we never collect</h2>
        <p>Your contacts, photos, files, call logs or SMS. Camera and location are used once, for KYC, with your permission.</p>
        <h2>Consent</h2>
        <p>
          We ask for each consent separately and record when you gave it and the exact words you saw. You can withdraw
          consent from your account or your Account Aggregator app as easily as you gave it. A Hindi version of this
          notice is available on request.
        </p>
        <h2>How long we keep it</h2>
        <p>
          Raw bank statements are deleted after the loan decision, or after the period the lender&apos;s policy requires.
          Data needed for your loan is kept for the life of the loan and as long as the law requires afterwards.
        </p>
        <h2>Where it is stored</h2>
        <p>All personal data is stored on servers in India and encrypted in storage and in transit.</p>
        <h2>Who we share it with</h2>
        <p>Our NBFC lending partner, credit bureaus, and the service providers that run KYC, e-sign and payments for us. We never sell your data.</p>
        <h2>Contact</h2>
        <p>Grievance officer: {SITE.grievanceOfficer.email}</p>
      </div>
    </PageShell>
  );
}
