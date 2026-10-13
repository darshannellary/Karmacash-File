import { ButtonLink } from "@/components/ButtonLink";
import { LOAN_TERMS } from "@/lib/config";
import { aprRange, formatPct } from "@/lib/emi";

const STEPS = [
  {
    title: "Check in two minutes",
    body: "Tell us the amount, your work and your PIN code. No credit check, no documents.",
  },
  {
    title: "Share your bank data safely",
    body: "Approve a one-time fetch of your bank statement through the RBI Account Aggregator. We never ask for passwords.",
  },
  {
    title: "Get a decision and your money",
    body: "See your amount, EMI and every charge before you sign. Our lending partner pays straight into your bank account.",
  },
];

export default function Home() {
  const apr = aprRange();
  return (
    <>
      <section className="bg-tint">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:py-24">
          <p className="text-sm font-semibold uppercase tracking-wide text-action">Now starting in Kerala</p>
          <h1 className="mt-3 max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">
            Small loans for traders and gig workers, judged on how you actually earn.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted">
            Borrow Rs 15,000 to Rs 3,00,000 and repay in equal monthly EMIs over 6 to 60{" "}
            months. Your UPI and bank payments count, not just your credit score.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/eligibility">Check eligibility</ButtonLink>
            <ButtonLink href="/rates" variant="secondary">
              See rates and EMIs
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="text-2xl font-bold">How it works</h2>
        <ol className="mt-8 grid gap-6 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.title} className="rounded-xl border border-line p-6">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
                {i + 1}
              </span>
              <h3 className="mt-4 font-semibold">{step.title}</h3>
              <p className="mt-2 text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-4 sm:grid-cols-3">
        <Fact
          value={`${LOAN_TERMS.annualRatePct.min}% to ${LOAN_TERMS.annualRatePct.max}%`}
          label={`interest a year, indicative until our lending partner confirms. APR with fees about ${apr.min}% to ${apr.max}%.`}
        />
        <Fact value={`Up to ${formatPct(LOAN_TERMS.processingFeeRate)} + GST`} label="one-time processing fee" />
        <Fact value="No hidden charges" label="every rupee shown before you sign" />
      </section>
    </>
  );
}

function Fact({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl bg-tint p-6">
      <p className="text-2xl font-bold">{value}</p>
      <p className="mt-1 text-muted">{label}</p>
    </div>
  );
}
