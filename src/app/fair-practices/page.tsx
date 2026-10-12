import type { Metadata } from "next";
import { DraftNotice, PageShell } from "@/components/PageShell";

export const metadata: Metadata = { title: "Fair practices code" };

export default function FairPractices() {
  return (
    <PageShell title="Fair practices code">
      <DraftNotice />
      <div className="prose-legal mt-6">
        <h2>Before you borrow</h2>
        <ul>
          <li>You see a Key Fact Statement with the APR, interest, processing fee and every other charge before you sign.</li>
          <li>Nothing is charged that is not in the Key Fact Statement.</li>
          <li>If we decline, we tell you the main reasons in plain language.</li>
        </ul>
        <h2>After you borrow</h2>
        <ul>
          <li>You can exit during the cooling-off period by repaying the principal and the interest for the days used, with no penalty.</li>
          <li>Your credit limit is never raised without your consent.</li>
          <li>We remind you before each EMI.</li>
        </ul>
        <h2>Recovery</h2>
        <ul>
          <li>No harassment, threats or abusive language, and no calls before 8 am or after 7 pm.</li>
          <li>We never contact your family, friends or employer about your loan.</li>
          <li>Recovery agents, if any, are named to you in advance and follow the lender&apos;s code of conduct.</li>
        </ul>
      </div>
    </PageShell>
  );
}
