import Image from "next/image";
import Link from "next/link";
import { ButtonLink } from "./ButtonLink";

const NAV = [
  { href: "/how-it-works", label: "How It Works" },
  { href: "/loans/traders", label: "For Traders" },
  { href: "/loans/gig-workers", label: "For Gig Workers" },
  { href: "/rates", label: "Rates" },
  { href: "/faq", label: "FAQ" },
];

export function Header() {
  return (
    <header className="border-b border-line bg-page">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2" aria-label="Karmacash home">
          <Image src="/brand/karmacash-mark-96.png" alt="" width={36} height={36} className="rounded-md" priority />
          <span className="text-lg font-semibold tracking-tight">Karmacash</span>
        </Link>
        <nav aria-label="Main" className="hidden gap-5 text-sm md:flex">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="text-muted hover:text-action">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/apply" className="text-sm font-semibold text-action">
            Sign in
          </Link>
          <ButtonLink href="/eligibility" size="sm">
            Check eligibility
          </ButtonLink>
        </div>
      </div>
      <nav aria-label="Main, mobile" className="flex gap-4 overflow-x-auto border-t border-line px-4 py-2 text-sm md:hidden">
        {NAV.map((item) => (
          <Link key={item.href} href={item.href} className="shrink-0 text-muted">
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
