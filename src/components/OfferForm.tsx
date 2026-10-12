"use client";

import { useState } from "react";
import { Field, StepForm } from "@/components/forms";
import type { OfferTerm } from "@/lib/application";
import { COOLING_OFF_DAYS, LOAN_TERMS, SITE } from "@/lib/config";
import { formatInr, formatPct, loanCost } from "@/lib/emi";
import type { FormState } from "@/lib/form-state";

/**
 * Borrower picks amount and tenure within the limit and sees the Key Fact Statement update live.
 * The rate and the affordable maximum both depend on the tenure.
 */
export function OfferForm({
  limit,
  terms,
  action,
}: {
  limit: number;
  terms: OfferTerm[];
  action: (state: FormState, data: FormData) => Promise<FormState>;
}) {
  const available = terms.filter((t) => t.available);
  // Start on the shortest tenure that allows the full limit; the longest always does.
  const initial = available.find((t) => t.maxAmount === limit) ?? available[available.length - 1];
  const [months, setMonths] = useState<number>(initial.months);
  const [amount, setAmount] = useState(initial.maxAmount);
  const term = terms.find((t) => t.months === months)!;
  const ratePct = term.ratePct;
  const cost = loanCost(amount, ratePct, months);

  function chooseTenure(t: OfferTerm) {
    setMonths(t.months);
    setAmount((a) => Math.min(a, t.maxAmount));
  }
  const rows: [string, string][] = [
    ["Lender", SITE.lendingPartner],
    ["Loan amount", formatInr(cost.principal)],
    ["Interest rate", `${ratePct}% a year, reducing balance`],
    ["Tenure", `${months} monthly EMIs`],
    ["Monthly EMI", formatInr(cost.emi)],
    ["Total interest", formatInr(cost.totalInterest)],
    [`Processing fee (${formatPct(LOAN_TERMS.processingFeeRate)})`, formatInr(cost.processingFee)],
    [`GST on processing fee (${formatPct(LOAN_TERMS.gstRate)})`, formatInr(cost.gstOnFee)],
    ["Amount paid into your account", formatInr(cost.netDisbursal)],
    ["Total amount you repay", formatInr(cost.totalRepayable)],
    ["Annual percentage rate (APR)", `${cost.aprPct.toFixed(2)}%`],
    ["Failed EMI auto-debit", `${formatInr(LOAN_TERMS.failedEmiCharge)} per failed debit`],
    ["Cooling-off period", `${COOLING_OFF_DAYS} days to exit without penalty`],
  ];

  return (
    <StepForm action={action} submitLabel="Accept this offer">
      <Field
        label={`Amount: ${formatInr(amount)}`}
        htmlFor="amount"
        hint={
          term.maxAmount < limit
            ? `Up to ${formatInr(term.maxAmount)} over ${months} months, so the EMI stays affordable. Choose a longer tenure to borrow up to ${formatInr(limit)}.`
            : `You can borrow up to ${formatInr(limit)}.`
        }
      >
        <input
          id="amount"
          name="amount"
          type="range"
          min={LOAN_TERMS.minAmount}
          max={term.maxAmount}
          step={1000}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-full accent-[var(--action)]"
        />
      </Field>
      <fieldset>
        <legend className="mb-2 font-semibold">Repay over</legend>
        <div className="flex gap-2">
          {terms.map((t) => (
            <label
              key={t.months}
              className={`rounded-lg border px-4 py-2 ${
                !t.available
                  ? "cursor-not-allowed border-line text-muted line-through"
                  : months === t.months
                    ? "cursor-pointer border-action bg-action text-white"
                    : "cursor-pointer border-line"
              }`}
            >
              <input
                type="radio"
                name="months"
                value={t.months}
                checked={months === t.months}
                disabled={!t.available}
                onChange={() => chooseTenure(t)}
                className="sr-only"
              />
              {t.months} months
            </label>
          ))}
        </div>
      </fieldset>
      <section aria-labelledby="kfs-title" className="rounded-xl border border-line">
        <h3 id="kfs-title" className="border-b border-line bg-tint px-4 py-3 font-semibold">
          Key Fact Statement
        </h3>
        <table className="w-full text-left text-sm">
          <tbody className="divide-y divide-line">
            {rows.map(([label, value]) => (
              <tr key={label}>
                <th scope="row" className="px-4 py-2 font-medium">
                  {label}
                </th>
                <td className="px-4 py-2 text-right">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <label className="flex gap-3 text-sm">
        <input type="checkbox" name="kfs" className="mt-1" required />
        <span>I have read the Key Fact Statement and understand the cost of this loan.</span>
      </label>
    </StepForm>
  );
}
