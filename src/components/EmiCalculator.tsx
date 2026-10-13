"use client";

import { useState } from "react";
import { LOAN_TERMS, type PricedBand, RATE_BY_BAND, type Tenure } from "@/lib/config";
import { formatInr, formatPct, loanCost } from "@/lib/emi";

const BANDS = Object.keys(RATE_BY_BAND) as PricedBand[];

export function EmiCalculator() {
  const [amount, setAmount] = useState(50_000);
  const [months, setMonths] = useState<Tenure>(LOAN_TERMS.tenuresMonths[0]);
  const [band, setBand] = useState<PricedBand>("D");
  const cost = loanCost(amount, RATE_BY_BAND[band][months], months);

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
      <div className="mt-6 grid gap-4">
        <fieldset>
          <legend className="font-semibold">Repay over</legend>
          <div className="mt-2 flex flex-wrap gap-2">
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
            value={band}
            onChange={(e) => setBand(e.target.value as PricedBand)}
            className="mt-2 block w-full rounded-lg border border-line px-3 py-2"
          >
            {BANDS.map((b) => (
              <option key={b} value={b}>
                {RATE_BY_BAND[b][months]}% a year
              </option>
            ))}
          </select>
        </div>
      </div>
      <dl className="mt-6 grid grid-cols-2 gap-4 rounded-lg bg-tint p-4 text-sm">
        <Stat term="Monthly EMI" value={formatInr(cost.emi)} strong />
        <Stat term="APR (all-in yearly cost)" value={`${cost.aprPct.toFixed(1)}%`} strong />
        <Stat term="Total interest" value={formatInr(cost.totalInterest)} />
        <Stat term={`Processing fee (up to ${formatPct(LOAN_TERMS.processingFeeRate)})`} value={formatInr(cost.processingFee)} />
        <Stat term={`GST on fee (${formatPct(LOAN_TERMS.gstRate)})`} value={formatInr(cost.gstOnFee)} />
        <Stat term="Amount you receive" value={formatInr(cost.netDisbursal)} />
        <Stat term="Total you repay" value={formatInr(cost.totalRepayable)} />
      </dl>
      <p className="mt-3 text-xs text-muted">
        Illustration only. Rates are indicative until our lending partner confirms them. Your actual rate depends on your application and is confirmed in your Key Fact Statement.
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
