"use client";

import { type FormEvent, type ReactNode, useState } from "react";
import {
  checkEligibility,
  type EligibilityResult,
  INCOME_RANGES,
  type IncomeRange,
  type WorkType,
} from "@/lib/eligibility";
import { formatInr } from "@/lib/emi";

export function EligibilityForm() {
  const [result, setResult] = useState<EligibilityResult | null>(null);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setResult(
      checkEligibility({
        amount: Number(data.get("amount")),
        workType: data.get("workType") as WorkType,
        pinCode: String(data.get("pinCode") ?? ""),
        monthlyIncome: data.get("monthlyIncome") as IncomeRange,
      }),
    );
  }

  return (
    <div>
      <form onSubmit={onSubmit} className="space-y-5 rounded-xl border border-line p-6">
        <Field label="How much do you need?" htmlFor="amount">
          <input
            id="amount"
            name="amount"
            type="number"
            inputMode="numeric"
            min={15000}
            max={300000}
            step={1000}
            defaultValue={50000}
            required
            className="w-full rounded-lg border border-line px-3 py-2"
          />
        </Field>
        <Field label="What work do you do?" htmlFor="workType">
          <select id="workType" name="workType" className="w-full rounded-lg border border-line px-3 py-2" defaultValue="trader">
            <option value="trader">Shop or small business</option>
            <option value="gig">Delivery, driving or other gig work</option>
            <option value="other">Other self-employed work</option>
          </select>
        </Field>
        <Field label="Your PIN code" htmlFor="pinCode">
          <input
            id="pinCode"
            name="pinCode"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            placeholder="e.g. 682001"
            className="w-full rounded-lg border border-line px-3 py-2"
          />
        </Field>
        <Field label="Money coming into your bank account each month" htmlFor="monthlyIncome">
          <select
            id="monthlyIncome"
            name="monthlyIncome"
            className="w-full rounded-lg border border-line px-3 py-2"
            defaultValue="25to50k"
          >
            {Object.entries(INCOME_RANGES).map(([value, { label }]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <button type="submit" className="w-full rounded-lg bg-action px-5 py-3 font-semibold text-white hover:bg-action-hover">
          Check eligibility
        </button>
        <p className="text-xs text-muted">This check does not affect your credit score.</p>
      </form>

      {result && (
        <div role="status" className="mt-6 rounded-xl bg-tint p-6">
          {result.status === "likely" && (
            <p className="text-2xl font-bold">Up to {formatInr(result.indicativeLimit)}</p>
          )}
          <p className={result.status === "likely" ? "mt-2 text-muted" : "font-semibold"}>{result.message}</p>
          {result.status === "likely" && (
            <p className="mt-4 text-sm text-muted">
              Applications open soon. The final amount depends on your full application and the lender&apos;s decision.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block font-semibold">
        {label}
      </label>
      {children}
    </div>
  );
}
