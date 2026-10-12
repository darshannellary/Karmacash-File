import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { PageShell } from "@/components/PageShell";
import { SITE } from "@/lib/config";

export const metadata: Metadata = { title: "Contact" };

export default function Contact() {
  return (
    <PageShell title="Contact us" intro="Our own team answers every message.">
      <dl className="divide-y divide-line rounded-xl border border-line">
        <Row term="Email" detail={<a href={`mailto:${SITE.support.email}`} className="text-action underline">{SITE.support.email}</a>} />
        <Row term="Phone" detail={SITE.support.phone} />
        <Row term="WhatsApp" detail={SITE.support.whatsapp} />
        <Row term="Complaints" detail={<Link href="/grievance" className="text-action underline">Grievance redressal</Link>} />
      </dl>
    </PageShell>
  );
}

function Row({ term, detail }: { term: string; detail: ReactNode }) {
  return (
    <div className="grid gap-1 p-4 sm:grid-cols-3">
      <dt className="font-semibold">{term}</dt>
      <dd className="text-muted sm:col-span-2">{detail}</dd>
    </div>
  );
}
