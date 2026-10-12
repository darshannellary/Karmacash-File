import type { Metadata } from "next";
import { DraftNotice, PageShell } from "@/components/PageShell";
import { SITE } from "@/lib/config";

export const metadata: Metadata = { title: "Grievance redressal" };

export default function Grievance() {
  return (
    <PageShell title="Grievance redressal" intro="If something has gone wrong, tell us and we will fix it.">
      <DraftNotice />
      <div className="prose-legal mt-6">
        <h2>1. Contact our support team</h2>
        <p>
          Email {SITE.support.email}, or call or WhatsApp {SITE.support.phone}. We aim to reply within one working day.
        </p>
        <h2>2. Escalate to our grievance officer</h2>
        <ul>
          <li>Name: {SITE.grievanceOfficer.name}</li>
          <li>Email: {SITE.grievanceOfficer.email}</li>
          <li>Phone: {SITE.grievanceOfficer.phone}</li>
        </ul>
        <p>We resolve every complaint within 30 days.</p>
        <h2>3. Escalate to the RBI</h2>
        <p>
          If your complaint is not resolved within 30 days, or you are not satisfied with our reply, you can complain to
          the RBI under the Reserve Bank - Integrated Ombudsman Scheme at{" "}
          <a href="https://cms.rbi.org.in" className="text-action underline">
            cms.rbi.org.in
          </a>
          .
        </p>
      </div>
    </PageShell>
  );
}
