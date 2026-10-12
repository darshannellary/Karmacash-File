import type { Metadata } from "next";
import { ButtonLink } from "@/components/ButtonLink";
import { PageShell } from "@/components/PageShell";

export const metadata: Metadata = { title: "How it works" };

const STEPS = [
  ["Check eligibility", "Amount, type of work, PIN code and rough monthly income. No credit check."],
  ["Sign in with your mobile", "We send a one-time password. Your progress is saved if you stop halfway."],
  ["Verify your identity", "Aadhaar OTP or DigiLocker, a PAN check and a quick selfie. We keep only the last four Aadhaar digits."],
  ["Give consent", "Approve a one-time fetch of 12 months of bank statements in your Account Aggregator app, and a credit report check."],
  ["Get a decision", "Most applicants get an answer right away. If we say no, we tell you why in plain words."],
  ["Review and sign", "See the amount, EMI, interest, processing fee and every charge in the Key Fact Statement, then e-sign with Aadhaar."],
  ["Set up AutoPay", "We verify your bank account with a Rs 1 deposit, then set up monthly EMIs by e-NACH or UPI AutoPay."],
  ["Receive the money", "Our lending partner pays directly into your verified bank account."],
  ["Repay monthly", "Equal EMIs over 6, 9 or 12 months. You can prepay or exit during the cooling-off period."],
];

const DATA = [
  ["What we use", "Bank statements through the Account Aggregator, your credit report, and your KYC details."],
  ["Why", "Steady UPI receipts and platform payouts show how reliably you earn, even with a thin credit history."],
  ["What we never use", "Your contacts, photos, files, SMS, religion, caste or gender."],
  ["Where it is stored", "On servers in India, encrypted."],
];

export default function HowItWorks() {
  return (
    <PageShell title="How it works" intro="From eligibility check to money in your account, step by step.">
      <ol className="space-y-4">
        {STEPS.map(([title, body], i) => (
          <li key={title} className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
              {i + 1}
            </span>
            <div>
              <h2 className="font-semibold">{title}</h2>
              <p className="text-muted">{body}</p>
            </div>
          </li>
        ))}
      </ol>
      <h2 className="mt-12 text-2xl font-bold">Your data</h2>
      <dl className="mt-4 divide-y divide-line rounded-xl border border-line">
        {DATA.map(([term, detail]) => (
          <div key={term} className="grid gap-1 p-4 sm:grid-cols-3">
            <dt className="font-semibold">{term}</dt>
            <dd className="text-muted sm:col-span-2">{detail}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-10">
        <ButtonLink href="/eligibility">Check eligibility</ButtonLink>
      </div>
    </PageShell>
  );
}
