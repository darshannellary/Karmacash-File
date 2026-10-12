import { LOAN_TERMS } from "./config";

/** Equal monthly instalment for a reducing-balance loan, unrounded. */
export function emi(principal: number, annualRatePct: number, months: number): number {
  const r = annualRatePct / 100 / 12;
  if (r === 0) return principal / months;
  const f = Math.pow(1 + r, months);
  return (principal * r * f) / (f - 1);
}

/** Largest principal whose EMI does not exceed the given amount. */
export function principalForEmi(maxEmi: number, annualRatePct: number, months: number): number {
  if (maxEmi <= 0) return 0;
  const r = annualRatePct / 100 / 12;
  if (r === 0) return maxEmi * months;
  return (maxEmi * (1 - Math.pow(1 + r, -months))) / r;
}

export type ScheduleRow = {
  month: number;
  emi: number;
  interest: number;
  principal: number;
  balance: number;
};

/** Repayment schedule in whole rupees; the last EMI absorbs rounding. */
export function schedule(principal: number, annualRatePct: number, months: number): ScheduleRow[] {
  const r = annualRatePct / 100 / 12;
  const instalment = Math.round(emi(principal, annualRatePct, months));
  const rows: ScheduleRow[] = [];
  let balance = principal;
  for (let month = 1; month <= months; month++) {
    const interest = Math.round(balance * r);
    const isLast = month === months;
    const principalPart = isLast ? balance : instalment - interest;
    balance = Math.max(0, balance - principalPart);
    rows.push({ month, emi: principalPart + interest, interest, principal: principalPart, balance });
  }
  return rows;
}

export type LoanCost = {
  principal: number;
  months: number;
  annualRatePct: number;
  emi: number;
  /** The last EMI absorbs rounding and can exceed the first; mandates must cover it. */
  largestEmi: number;
  totalInterest: number;
  processingFee: number;
  gstOnFee: number;
  netDisbursal: number;
  totalRepayable: number;
  aprPct: number;
};

/**
 * Cost of a loan as shown in the Key Fact Statement. The processing fee and its GST
 * are deducted at disbursal, so the APR is the annualised internal rate of return
 * on the amount the borrower actually receives.
 */
export function loanCost(principal: number, annualRatePct: number, months: number): LoanCost {
  const rows = schedule(principal, annualRatePct, months);
  const totalRepayable = rows.reduce((sum, row) => sum + row.emi, 0);
  const processingFee = Math.round(principal * LOAN_TERMS.processingFeeRate);
  const gstOnFee = Math.round(processingFee * LOAN_TERMS.gstRate);
  const netDisbursal = principal - processingFee - gstOnFee;
  return {
    principal,
    months,
    annualRatePct,
    emi: rows[0].emi,
    largestEmi: Math.max(...rows.map((row) => row.emi)),
    totalInterest: totalRepayable - principal,
    processingFee,
    gstOnFee,
    netDisbursal,
    totalRepayable,
    aprPct: aprPct(netDisbursal, rows.map((row) => row.emi)),
  };
}

/** Annualised (monthly rate x 12) internal rate of return, found by bisection. */
export function aprPct(amountReceived: number, payments: number[]): number {
  const npv = (monthlyRate: number) =>
    payments.reduce((sum, p, i) => sum + p / Math.pow(1 + monthlyRate, i + 1), 0) - amountReceived;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (npv(mid) > 0) lo = mid;
    else hi = mid;
  }
  return Math.round(((lo + hi) / 2) * 12 * 100 * 100) / 100;
}

/** A rate such as 0.01 as "1%". */
export function formatPct(rate: number): string {
  return `${Math.round(rate * 10_000) / 100}%`;
}

export function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
