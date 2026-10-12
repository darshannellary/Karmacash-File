import Link from "next/link";
import { SITE } from "@/lib/config";

const LINKS = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/lending-partner", label: "Our lending partner" },
  { href: "/grievance", label: "Grievance redressal" },
  { href: "/privacy", label: "Privacy policy" },
  { href: "/terms", label: "Terms of use" },
  { href: "/fair-practices", label: "Fair practices code" },
];

export function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-tint">
      <div className="mx-auto max-w-5xl px-4 py-10 text-sm text-muted">
        <nav aria-label="Footer" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-action">
              {link.label}
            </Link>
          ))}
        </nav>
        <p className="mt-8">
          Loans are made by {SITE.lendingPartner}, a non-banking financial company registered with the Reserve Bank
          of India. {SITE.name} is its lending service provider and does not lend money or collect payments.
        </p>
        <p className="mt-2">
          © 2026 {SITE.legalName}. Grievance officer:{" "}
          <a href={`mailto:${SITE.grievanceOfficer.email}`} className="underline">
            {SITE.grievanceOfficer.email}
          </a>
          .
        </p>
      </div>
    </footer>
  );
}
