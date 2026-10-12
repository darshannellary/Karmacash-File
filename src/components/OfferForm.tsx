"use client";

import { useState } from "react";
import { Field, StepForm } from "@/components/forms";
import { LOAN_TERMS, SITE } from "@/lib/config";
import { formatInr, loanCost } from "@/lib/emi";
import type { FormState } from "@/lib/form-state";

/** Borrower picks amount and tenure within the limit and sees the Key Fact Statement update live. */
export function OfferForm({
  limit,
  ratePct,
  action,
}: {
  limit: number;
  ratePct: number;
  action: (state: FormState, data: FormData) => Promise<FormState>;
}) {
  const [amount, setAmount] = useState(limit);
  const [months, setMonths] = useState<number>(LOAN_TERMS.tenuresMonths[0]);
  const cost = loanCost(amount, ratePct, months);
  const rows: [string, string][] = [
    ["Lender", SITE.lendingPartner],
    ["Loan amount", formatInr(cost.principal)],
    ["Interest rate", `${ratePct}% a year, reducing balance`],
    ["Tenure", `${months} monthly EMIs`],
    ["Monthly EMI", formatInr(cost.emi)],
    ["Total interest", formatInr(cost.totalInterest)],
    ["Processing fee (4%)", formatInr(cost.processingFee)],
    ["GST on processing fee (18%)", formatInr(cost.gstOnFee)],
    ["Amount paid into your account", formatInr(cost.netDisbursal)],
    ["Total amount you repay", formatInr(cost.totalRepayable)],
    ["Annual percentage rate (APR)", `${cost.aprPct.toFixed(2)}%`],
    ["Failed EMI auto-debit", `${formatInr(LOAN_TERMS.failedEmiCharge)} per failed debit`],
    ["Cooling-off period", "3 days to exit without penalty"],
  ];

  return (
    <StepForm action={action} submitLabel="Accept this offer">
      <Field label={`Amount: ${formatInr(amount)}`} htmlFor="amount" hint={`You can borrow up to ${formatInr(limit)}.`}>
        <input
          id="amount"
          name="amount"
          type="range"
          min={LOAN_TERMS.minAmount}
          max={limit}
          step={1000}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-full accent-[var(--action)]"
        />
      </Field>
      <fieldset>
        <legend className="mb-2 font-semibold">Repay over</legend>
        <div className="flex gap-2">
          {LOAN_TERMS.tenuresMonths.map((m) => (
            <label
              key={m}
              className={`cursor-pointer rounded-lg border px-4 py-2 ${months === m ? "border-action bg-action text-white" : "border-line"}`}
            >
              <input
                type="radio"
                name="months"
                value={m}
                checked={months === m}
                onChange={() => setMonths(m)}
                className="sr-only"
              />
              {m} months
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
