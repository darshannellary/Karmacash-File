import type { Metadata } from "next";
import Link from "next/link";
import { type ReactNode, Suspense } from "react";
import { Field, InlineAction, StepForm } from "@/components/forms";
import { inputClass } from "@/components/styles";
import { OfferForm } from "@/components/OfferForm";
import {
  type ApplicationState,
  currentStep,
  formatDate,
  offerTerms,
  PROGRESS,
  reapplyDate,
  type Step,
} from "@/lib/application";
import { LAUNCH_REGION, SANDBOX, SANDBOX_OTP, SITE } from "@/lib/config";
import { formatInr, loanCost } from "@/lib/emi";
import { emailConfigured } from "@/lib/email";
import { DATA_SETS } from "@/lib/sandbox";
import { REASON_TEXT } from "@/lib/scorecard";
import { readState } from "@/lib/session";
import {
  acceptOffer,
  changeEmail,
  changeNumber,
  confirmEmailCode,
  confirmOtp,
  giveConsentAndDecide,
  registerMandate,
  resendOtp,
  resendEmailCode,
  saveDetails,
  sendEmailCode,
  sendOtp,
  signAgreement,
  simulateReviewerApproval,
  startOver,
  verifyBankAccount,
  verifyKyc,
} from "./actions";

export const metadata: Metadata = { title: "Apply", robots: { index: false } };

export default function Apply() {
  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <Suspense fallback={<p className="text-muted">Loading your application…</p>}>
        <Flow />
      </Suspense>
    </div>
  );
}

async function Flow() {
  const s = await readState();
  const step = currentStep(s);
  return (
    <>
      <Progress step={step} />
      <StepView step={step} s={s} />
    </>
  );
}

function Progress({ step }: { step: Step }) {
  const active = PROGRESS.findIndex((p) => p.steps.includes(step));
  return (
    <ol aria-label="Application progress" className="mb-8 flex gap-1">
      {PROGRESS.map((p, i) => (
        <li key={p.label} className="flex-1" aria-current={i === active ? "step" : undefined}>
          <span className={`block h-1.5 rounded-full ${i <= active ? "bg-brand" : "bg-line"}`} />
          <span className={`mt-1 hidden text-xs sm:block ${i === active ? "font-semibold" : "text-muted"}`}>{p.label}</span>
        </li>
      ))}
    </ol>
  );
}

function Heading({ title, intro }: { title: string; intro?: ReactNode }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold">{title}</h1>
      {intro && <p className="mt-2 text-muted">{intro}</p>}
    </div>
  );
}

function StepView({ step, s }: { step: Step; s: ApplicationState }) {
  switch (step) {
    case "phone":
      return (
        <>
          <Heading title="Sign in with your mobile number" intro="We'll send a one-time code by SMS. Use the number linked to your bank account." />
          <StepForm action={sendOtp} submitLabel="Send code">
            <Field label="Mobile number" htmlFor="phone">
              <input id="phone" name="phone" type="tel" inputMode="numeric" autoComplete="tel-national" required placeholder="98470 12345" className={inputClass} />
            </Field>
          </StepForm>
        </>
      );

    case "otp":
      return (
        <>
          <Heading title="Enter the code" intro={`We sent a 6-digit code to +91 ${s.phone}.`} />
          <StepForm action={confirmOtp} submitLabel="Verify">
            <Field label="One-time code" htmlFor="otp">
              <input id="otp" name="otp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required className={inputClass} />
            </Field>
          </StepForm>
          <div className="mt-4 space-y-2">
            <InlineAction action={resendOtp} label="Resend code" />
            <form action={changeNumber} className="text-sm">
              <span className="text-muted">Wrong number? </span>
              <button type="submit" className="font-semibold text-action underline">
                Change it
              </button>
            </form>
          </div>
        </>
      );

    case "details":
      return (
        <>
          <Heading title="About you" intro="Enter your details exactly as they appear on your PAN card." />
          <StepForm action={saveDetails} submitLabel="Continue">
            <Field label="Full name" htmlFor="fullName">
              <input id="fullName" name="fullName" autoComplete="name" required className={inputClass} />
            </Field>
            <Field label="Date of birth" htmlFor="dob">
              <input id="dob" name="dob" type="date" required className={inputClass} />
            </Field>
            <Field label="PAN" htmlFor="pan" hint="We use this for your credit report. We store only the last four characters.">
              <input id="pan" name="pan" autoCapitalize="characters" maxLength={10} required placeholder="ABCPE1234F" className={`${inputClass} uppercase`} />
            </Field>
            <Field label="Home or shop PIN code" htmlFor="pinCode">
              <input id="pinCode" name="pinCode" inputMode="numeric" maxLength={6} required className={inputClass} />
            </Field>
            <Field label="What work do you do?" htmlFor="workType">
              <select id="workType" name="workType" defaultValue="trader" className={inputClass}>
                <option value="trader">Shop or small business</option>
                <option value="gig">Delivery, driving or other gig work</option>
                <option value="other">Other self-employed work</option>
              </select>
            </Field>
          </StepForm>
        </>
      );

    case "waitlist":
      return (
        <>
          <Heading
            title="You're on the waitlist"
            intro={`Karmacash is starting in ${LAUNCH_REGION}. We'll send an SMS to +91 ${s.phone} when we reach PIN code ${s.details?.pinCode}.`}
          />
          <StartOver label="Use a different PIN code" />
        </>
      );

    case "email":
      return (
        <>
          <Heading title="Your email address" intro="We'll email your decision, your Key Fact Statement and your loan documents here." />
          <StepForm action={sendEmailCode} submitLabel="Send code">
            <Field label="Email" htmlFor="email">
              <input id="email" name="email" type="email" autoComplete="email" inputMode="email" required placeholder="name@gmail.com" className={inputClass} />
            </Field>
          </StepForm>
        </>
      );

    case "emailCode":
      return (
        <>
          <Heading
            title="Check your email"
            intro={
              emailConfigured()
                ? `We sent a 6-digit code to ${s.email?.address}. It may take a minute, and can land in spam.`
                : `Test mode: no email was sent to ${s.email?.address}. Use ${SANDBOX_OTP}.`
            }
          />
          <StepForm action={confirmEmailCode} submitLabel="Verify email">
            <Field label="Email code" htmlFor="code">
              <input id="code" name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required className={inputClass} />
            </Field>
          </StepForm>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <InlineAction action={resendEmailCode} label="Send a new code" />
            <form action={changeEmail}>
              <button type="submit" className="font-semibold text-action underline">
                Use a different email
              </button>
            </form>
          </div>
        </>
      );

    case "kyc":
      return (
        <>
          <Heading title="Verify your identity" intro="Our lending partner verifies you with an Aadhaar OTP. We keep only the last 4 digits of your Aadhaar." />
          <StepForm action={verifyKyc} submitLabel="Verify with Aadhaar">
            <Field label="Last 4 digits of your Aadhaar" htmlFor="aadhaarLast4">
              <input id="aadhaarLast4" name="aadhaarLast4" inputMode="numeric" maxLength={4} required className={inputClass} />
            </Field>
            <Field label="Aadhaar OTP" htmlFor="kycOtp" hint="Sent by UIDAI to the mobile linked to your Aadhaar.">
              <input id="kycOtp" name="otp" inputMode="numeric" maxLength={6} required className={inputClass} />
            </Field>
          </StepForm>
        </>
      );

    case "consent":
      return (
        <>
          <Heading
            title="Let us see how you earn"
            intro="We look at your bank statements and credit report together, so your UPI income counts and not just your credit score."
          />
          <StepForm action={giveConsentAndDecide} submitLabel="Share and get my decision">
            <label className="flex gap-3 rounded-lg border border-line p-4 text-sm">
              <input type="checkbox" name="bureau" className="mt-1" required />
              <span>
                I allow {SITE.lendingPartner} to fetch my credit report from a credit bureau to assess this loan application.
              </span>
            </label>
            <label className="flex gap-3 rounded-lg border border-line p-4 text-sm">
              <input type="checkbox" name="aa" className="mt-1" required />
              <span>
                I allow a one-time fetch of the last 12 months of statements from my bank account through the RBI Account Aggregator
                network, used only for this application. I can withdraw this consent at any time.
              </span>
            </label>
            {SANDBOX && (
              <fieldset className="rounded-lg border border-dashed border-amber-400 p-4">
                <legend className="px-1 text-sm font-semibold text-amber-900">Test data set (test mode only)</legend>
                <div className="space-y-2">
                  {Object.entries(DATA_SETS).map(([id, set], i) => (
                    <label key={id} className="flex gap-3 text-sm">
                      <input type="radio" name="dataSet" value={id} defaultChecked={i === 0} className="mt-1" />
                      <span>
                        <span className="font-semibold">{set.label}.</span> <span className="text-muted">{set.description}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
          </StepForm>
        </>
      );

    case "outcome":
      return <Outcome s={s} />;

    case "offer": {
      const d = s.decision!;
      if (d.maxEmi === undefined) {
        return (
          <>
            <Heading title="Please start again" intro="Your application was decided before an update to how we check what you can afford." />
            <StartOver label="Start a new application" />
          </>
        );
      }
      return (
        <>
          <Heading
            title={`You can borrow up to ${formatInr(d.limit)}`}
            intro={`Based on average monthly income of ${formatInr(d.avgMonthlyInflow)} into your account. Choose what you need.`}
          />
          <OfferForm limit={d.limit} terms={offerTerms(d)} action={acceptOffer} />
        </>
      );
    }

    case "bank":
      return (
        <>
          <Heading
            title="Your bank account"
            intro="The loan is paid into this account and EMIs are auto-debited from it. It must be in your own name."
          />
          <StepForm action={verifyBankAccount} submitLabel="Verify account">
            <Field label="Account number" htmlFor="account">
              <input id="account" name="account" inputMode="numeric" autoComplete="off" required className={inputClass} />
            </Field>
            <Field label="Re-enter account number" htmlFor="confirmAccount">
              <input id="confirmAccount" name="confirmAccount" inputMode="numeric" autoComplete="off" required className={inputClass} />
            </Field>
            <Field label="IFSC" htmlFor="ifsc" hint="Printed on your cheque book or passbook.">
              <input id="ifsc" name="ifsc" maxLength={11} required placeholder="SBIN0070123" className={`${inputClass} uppercase`} />
            </Field>
            <p className="text-sm text-muted">
              We&apos;ll deposit Rs 1 to check the account is active and the name matches your KYC.
            </p>
          </StepForm>
        </>
      );

    case "mandate": {
      const o = s.offer!;
      const { emi } = loanCost(o.amount, o.ratePct, o.months);
      return (
        <>
          <Heading
            title="Set up AutoPay"
            intro={`Your EMI of ${formatInr(emi)} will be debited each month from account ending ${s.account?.last4}. You approve this once in your bank or UPI app.`}
          />
          <StepForm action={registerMandate} submitLabel="Set up AutoPay">
            <fieldset className="space-y-2">
              <legend className="mb-2 font-semibold">How would you like to approve it?</legend>
              <label className="flex gap-3 rounded-lg border border-line p-4">
                <input type="radio" name="method" value="upi" defaultChecked className="mt-1" />
                <span>
                  <span className="font-semibold">UPI AutoPay</span>
                  <span className="block text-sm text-muted">Approve in your UPI app with your UPI PIN.</span>
                </span>
              </label>
              <label className="flex gap-3 rounded-lg border border-line p-4">
                <input type="radio" name="method" value="enach" className="mt-1" />
                <span>
                  <span className="font-semibold">e-NACH</span>
                  <span className="block text-sm text-muted">Approve with net banking or your debit card.</span>
                </span>
              </label>
            </fieldset>
            <p className="text-sm text-muted">
              If a debit fails, the lender charges a flat Rs 250. We remind you before every EMI.
            </p>
          </StepForm>
        </>
      );
    }

    case "sign": {
      const o = s.offer!;
      const cost = loanCost(o.amount, o.ratePct, o.months);
      return (
        <>
          <Heading title="Sign your loan agreement" intro={`Your loan agreement is with ${SITE.lendingPartner}. Sign it with an Aadhaar OTP.`} />
          <dl className="mb-6 grid grid-cols-2 gap-4 rounded-xl bg-tint p-4 text-sm">
            <Summary term="Loan amount" value={formatInr(cost.principal)} />
            <Summary term="You receive" value={formatInr(cost.netDisbursal)} />
            <Summary term="Monthly EMI" value={`${formatInr(cost.emi)} × ${o.months}`} />
            <Summary term="APR" value={`${cost.aprPct.toFixed(2)}%`} />
          </dl>
          <StepForm action={signAgreement} submitLabel="Sign with Aadhaar OTP">
            <label className="flex gap-3 text-sm">
              <input type="checkbox" name="agree" className="mt-1" required />
              <span>
                I have read the loan agreement, the Key Fact Statement and the{" "}
                <Link href="/fair-practices" className="underline">
                  fair practices code
                </Link>
                , and I agree to them.
              </span>
            </label>
            <Field label="Aadhaar OTP" htmlFor="signOtp">
              <input id="signOtp" name="otp" inputMode="numeric" maxLength={6} required className={inputClass} />
            </Field>
          </StepForm>
        </>
      );
    }

    case "done":
      return (
        <>
          <Heading title="Your loan is signed" />
          <Link href="/account" className="font-semibold text-action underline">
            Go to your loan
          </Link>
        </>
      );
  }
}

function Outcome({ s }: { s: ApplicationState }) {
  const d = s.decision!;
  if (d.decision === "review") {
    return (
      <>
        <Heading
          title="Your application is with our lending partner"
          intro="A credit reviewer will look at it and we'll send you an SMS with the decision, usually within one working day."
        />
        {SANDBOX && (
          <form action={simulateReviewerApproval}>
            <button type="submit" className="rounded-lg border border-dashed border-amber-500 px-4 py-2 text-sm text-amber-900">
              Test mode: approve as the reviewer
            </button>
          </form>
        )}
      </>
    );
  }
  if (d.decision === "waitlist") {
    return (
      <>
        <Heading title="We can't take your application this month" intro={REASON_TEXT.SLEEVE_FULL} />
        <p className="text-muted">We&apos;ll send you an SMS when we can. Nothing has been added to your credit report.</p>
      </>
    );
  }
  return (
    <>
      <Heading title="We can't offer you a loan right now" intro="These are the main reasons:" />
      <ul className="mb-6 list-disc space-y-1 pl-5">
        {d.reasons.slice(0, 3).map((r) => (
          <li key={r}>{REASON_TEXT[r]}</li>
        ))}
      </ul>
      <p className="mb-6 text-muted">You can apply again from {formatDate(reapplyDate(d.decidedAt))}.</p>
      <StartOver label="Start a new test application" />
    </>
  );
}

function StartOver({ label }: { label: string }) {
  return (
    <form action={startOver}>
      <button type="submit" className="font-semibold text-action underline">
        {label}
      </button>
    </form>
  );
}

function Summary({ term, value }: { term: string; value: string }) {
  return (
    <div>
      <dt className="text-muted">{term}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}
