"use client";

import { useState } from "react";
import { LOAN_TERMS } from "@/lib/config";
import { formatInr, loanCost } from "@/lib/emi";

export function EmiCalculator() {
  const [amount, setAmount] = useState(50_000);
  const [months, setMonths] = useState<number>(LOAN_TERMS.tenuresMonths[0]);
  const [rate, setRate] = useState<number>(LOAN_TERMS.annualRatePct.max);
  const cost = loanCost(amount, rate, months);

  const rates: number[] = [];
  for (let r = LOAN_TERMS.annualRatePct.min; r <= LOAN_TERMS.annualRatePct.max; r += 2) rates.push(r);

  return (
    <div className="rounded-xl border border-line p-6">
      <label className="block font-semibold" htmlFor="amount">
        Loan amount: {formatInr(amount)}
      </label>
      <input
        id="amount"
        type="range"
        min={LOAN_TERMS.minAmount}
        max={LOAN_TERMS.maxAmount}
        step={5_000}
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
        className="mt-2 w-full accent-[var(--action)]"
      />
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <fieldset>
          <legend className="font-semibold">Repay over</legend>
          <div className="mt-2 flex gap-2">
            {LOAN_TERMS.tenuresMonths.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMonths(m)}
                aria-pressed={months === m}
                className={`rounded-lg border px-4 py-2 ${months === m ? "border-action bg-action text-white" : "border-line"}`}
              >
                {m} months
              </button>
            ))}
          </div>
        </fieldset>
        <div>
          <label className="font-semibold" htmlFor="rate">
            Interest rate
          </label>
          <select
            id="rate"
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="mt-2 block w-full rounded-lg border border-line px-3 py-2"
          >
            {rates.map((r) => (
              <option key={r} value={r}>
                {r}% a year
              </option>
            ))}
          </select>
        </div>
      </div>
      <dl className="mt-6 grid grid-cols-2 gap-4 rounded-lg bg-tint p-4 text-sm">
        <Stat term="Monthly EMI" value={formatInr(cost.emi)} strong />
        <Stat term="APR (all-in yearly cost)" value={`${cost.aprPct.toFixed(1)}%`} strong />
        <Stat term="Total interest" value={formatInr(cost.totalInterest)} />
        <Stat term="Processing fee (4%)" value={formatInr(cost.processingFee)} />
        <Stat term="GST on fee (18%)" value={formatInr(cost.gstOnFee)} />
        <Stat term="Amount you receive" value={formatInr(cost.netDisbursal)} />
        <Stat term="Total you repay" value={formatInr(cost.totalRepayable)} />
      </dl>
      <p className="mt-3 text-xs text-muted">
        Illustration only. Your actual rate depends on your application and is confirmed in your Key Fact Statement.
      </p>
    </div>
  );
}

function Stat({ term, value, strong }: { term: string; value: string; strong?: boolean }) {
  return (
    <div>
      <dt className="text-muted">{term}</dt>
      <dd className={strong ? "text-xl font-bold" : "font-semibold"}>{value}</dd>
    </div>
  );
}
