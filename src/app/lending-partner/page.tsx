import type { Metadata } from "next";
import { DraftNotice, PageShell } from "@/components/PageShell";
import { SITE } from "@/lib/config";

export const metadata: Metadata = { title: "Our lending partner" };

export default function LendingPartner() {
  return (
    <PageShell title="Our lending partner">
      <DraftNotice />
      <div className="prose-legal mt-6">
        <p>
          Every Karmacash loan is made by {SITE.lendingPartner}, a non-banking financial company (NBFC) registered with
          the Reserve Bank of India. The lender&apos;s name, RBI registration number and website will appear here
          before lending starts.
        </p>
        <h2>What Karmacash does</h2>
        <ul>
          <li>Runs this website, checks eligibility and helps you apply.</li>
          <li>Prepares your application for the lender&apos;s credit decision.</li>
          <li>Answers your questions and complaints.</li>
        </ul>
        <h2>What Karmacash never does</h2>
        <ul>
          <li>Lend money, or receive your loan amount or EMIs. Money moves only between the lender and your own bank account.</li>
          <li>Charge you any fee. The processing fee is charged by the lender in its own name and shown in your Key Fact Statement.</li>
        </ul>
        <p>The lender pays Karmacash a commission out of its processing fee for each loan.</p>
      </div>
    </PageShell>
  );
}
