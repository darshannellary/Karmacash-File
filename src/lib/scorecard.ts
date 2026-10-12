import { CREDIT_POLICY, LOAN_TERMS } from "./config";
import { principalForEmi } from "./emi";

// Points-based scorecard, v0. Weights and cut-offs are starting values to be set with
// the NBFC's credit policy. Inputs come from Account Aggregator bank statements and the
// credit bureau; nothing here uses contacts, photos, files, SMS, religion, caste or gender.

export type Applicant = {
  age: number;
  kycPassed: boolean;
  bureauScore: number | null; // null when the applicant has no bureau record
  bureauWriteOffOr90Dpd12m: boolean;
  fraudFlag: boolean;
  hasActiveKarmacashLoan: boolean;
  onTimeKarmacashLoansRepaid: number;
  bankHistoryMonths: number;
  monthlyInflows: number[]; // oldest first, up to 12 months
  uniqueUpiPayersPerMonth: number;
  merchantUpiShare: number; // share of UPI receipts that are P2M, 0 to 1
  monthsWithPlatformPayouts6m: number; // gig platform payouts seen in the last 6 months
  bouncedEmisOrMandates12m: number;
  lowBalanceDaysPerMonth: number; // days below Rs 500
  existingMonthlyEmi: number;
  filesGst: boolean;
  hasUdyam: boolean;
  bettingDebitShare: number; // share of debits to betting or gaming, 0 to 1
};

export type PolicyContext = {
  // Share of this month's disbursed loans that went to borrowers scoring 700 or below.
  sleeveShareThisMonth: number;
};

export type Band = "A" | "B" | "C" | "D" | "E";
export type Decision = "offer" | "review" | "decline" | "waitlist";

export type ReasonCode =
  | "KYC_FAILED"
  | "AGE_OUT_OF_RANGE"
  | "SHORT_BANK_HISTORY"
  | "BUREAU_SERIOUS_DELINQUENCY"
  | "FRAUD_FLAG"
  | "ACTIVE_LOAN"
  | "LOW_INFLOW"
  | "IRREGULAR_INCOME"
  | "FEW_INCOME_SOURCES"
  | "PAST_BOUNCES"
  | "LOW_BALANCES"
  | "BETTING_SPEND"
  | "LOW_SCORE_BAND"
  | "SLEEVE_BAND_TOO_LOW"
  | "SLEEVE_FULL"
  | "LIMIT_BELOW_MINIMUM";

export const REASON_TEXT: Record<ReasonCode, string> = {
  KYC_FAILED: "We could not verify your identity.",
  AGE_OUT_OF_RANGE: "Applicants need to be between 21 and 60 years old.",
  SHORT_BANK_HISTORY: "Your bank account needs at least 6 months of history.",
  BUREAU_SERIOUS_DELINQUENCY: "Your credit report shows a loan written off or 90+ days overdue in the last 12 months.",
  FRAUD_FLAG: "We could not complete checks on this application.",
  ACTIVE_LOAN: "You already have an active Karmacash loan.",
  LOW_INFLOW: "Money coming into your account averages under Rs 15,000 a month.",
  IRREGULAR_INCOME: "Your income has been too irregular in the last 6 months.",
  FEW_INCOME_SOURCES: "Your account shows few regular customers or platform payouts.",
  PAST_BOUNCES: "EMIs or auto-debits bounced in the last 12 months.",
  LOW_BALANCES: "Your balance often drops below Rs 500.",
  BETTING_SPEND: "A noticeable share of spending goes to betting or gaming.",
  LOW_SCORE_BAND: "Your overall cash-flow score is below what we can lend on today.",
  SLEEVE_BAND_TOO_LOW: "Without a credit score above 700, we need a stronger cash-flow score.",
  SLEEVE_FULL: "We have reached this month's limit for applicants without a credit score above 700.",
  LIMIT_BELOW_MINIMUM: "The loan you can afford today is below our Rs 15,000 minimum.",
};

export type ScoreResult = {
  policyVersion: string;
  decision: Decision;
  band: Band | null;
  points: number | null;
  limit: number;
  inSleeve: boolean;
  avgMonthlyInflow: number;
  reasons: ReasonCode[];
};

function average(values: number[]): number {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

/** Coefficient of variation: standard deviation divided by mean. */
function variation(values: number[]): number {
  const mean = average(values);
  if (mean === 0) return Infinity;
  const variance = average(values.map((v) => (v - mean) ** 2));
  return Math.sqrt(variance) / mean;
}

export function knockouts(a: Applicant): ReasonCode[] {
  const reasons: ReasonCode[] = [];
  if (!a.kycPassed) reasons.push("KYC_FAILED");
  if (a.age < CREDIT_POLICY.minAge || a.age > CREDIT_POLICY.maxAge) reasons.push("AGE_OUT_OF_RANGE");
  if (a.bankHistoryMonths < CREDIT_POLICY.minBankHistoryMonths) reasons.push("SHORT_BANK_HISTORY");
  if (a.bureauWriteOffOr90Dpd12m) reasons.push("BUREAU_SERIOUS_DELINQUENCY");
  if (a.fraudFlag) reasons.push("FRAUD_FLAG");
  if (a.hasActiveKarmacashLoan) reasons.push("ACTIVE_LOAN");
  if (averageInflow(a) < CREDIT_POLICY.minMonthlyInflow) reasons.push("LOW_INFLOW");
  return reasons;
}

/** Conservative monthly inflow: the lower of the 6-month and 12-month averages. */
export function averageInflow(a: Applicant): number {
  const last6 = a.monthlyInflows.slice(-6);
  return Math.min(average(last6), average(a.monthlyInflows));
}

export function points(a: Applicant): { total: number; negatives: ReasonCode[] } {
  const negatives: ReasonCode[] = [];
  let total = 0;

  const inflow = averageInflow(a);
  total += inflow >= 60_000 ? 20 : inflow >= 35_000 ? 15 : inflow >= 25_000 ? 10 : 5;

  const cv = variation(a.monthlyInflows.slice(-6));
  const stability = cv <= 0.2 ? 20 : cv <= 0.35 ? 14 : cv <= 0.5 ? 8 : 0;
  total += stability;
  if (stability <= 8) negatives.push("IRREGULAR_INCOME");

  // Traders show breadth through UPI payers; gig workers through regular platform payouts.
  const upi = a.uniqueUpiPayersPerMonth >= 50 ? 15 : a.uniqueUpiPayersPerMonth >= 20 ? 10 : a.uniqueUpiPayersPerMonth >= 8 ? 5 : 0;
  const platform = a.monthsWithPlatformPayouts6m >= 6 ? 15 : a.monthsWithPlatformPayouts6m >= 4 ? 10 : a.monthsWithPlatformPayouts6m >= 2 ? 5 : 0;
  const sources = Math.max(upi, platform);
  total += sources;
  if (sources <= 5) negatives.push("FEW_INCOME_SOURCES");

  total += a.merchantUpiShare >= 0.5 ? 5 : a.merchantUpiShare >= 0.25 ? 3 : 0;

  const score = a.bureauScore ?? 0;
  total += score > 750 ? 15 : score > CREDIT_POLICY.scoreThreshold ? 10 : 0;

  const bounces = a.bouncedEmisOrMandates12m;
  total += bounces === 0 ? 15 : bounces === 1 ? 8 : bounces === 2 ? 3 : 0;
  if (bounces > 0) negatives.push("PAST_BOUNCES");

  if (a.lowBalanceDaysPerMonth > 10) {
    total -= 5;
    negatives.push("LOW_BALANCES");
  }

  total += (a.filesGst ? 5 : 0) + (a.hasUdyam ? 2 : 0);

  if (a.bettingDebitShare > 0.1) {
    total -= 10;
    negatives.push("BETTING_SPEND");
  } else if (a.bettingDebitShare > 0.03) {
    total -= 5;
    negatives.push("BETTING_SPEND");
  }

  return { total: Math.max(0, Math.min(100, total)), negatives };
}

export function band(total: number): Band {
  const { A, B, C, D } = CREDIT_POLICY.bands;
  return total >= A ? "A" : total >= B ? "B" : total >= C ? "C" : total >= D ? "D" : "E";
}

/** Highest amount the applicant can borrow, rounded down to the nearest Rs 1,000. */
export function limitFor(a: Applicant, inSleeve: boolean): number {
  const inflow = averageInflow(a);
  const maxEmi = CREDIT_POLICY.maxEmiToInflow * inflow - a.existingMonthlyEmi;
  const longest = Math.max(...LOAN_TERMS.tenuresMonths);
  const affordable = principalForEmi(maxEmi, LOAN_TERMS.annualRatePct.max, longest);
  const firstLoan = a.onTimeKarmacashLoansRepaid === 0;
  const cap = inSleeve
    ? CREDIT_POLICY.sleeveFirstLoanCap
    : firstLoan
      ? CREDIT_POLICY.firstLoanCap
      : LOAN_TERMS.maxAmount;
  const raw = Math.min(LOAN_TERMS.maxAmount, cap, CREDIT_POLICY.limitInflowMultiple * inflow, affordable);
  return Math.max(0, Math.floor(raw / 1000) * 1000);
}

export function score(a: Applicant, ctx: PolicyContext): ScoreResult {
  const base = {
    policyVersion: CREDIT_POLICY.version,
    avgMonthlyInflow: Math.round(averageInflow(a)),
  };

  const ko = knockouts(a);
  if (ko.length) {
    return { ...base, decision: "decline", band: null, points: null, limit: 0, inSleeve: false, reasons: ko };
  }

  const { total, negatives } = points(a);
  const b = band(total);
  const inSleeve = a.bureauScore === null || a.bureauScore <= CREDIT_POLICY.scoreThreshold;
  const result = { ...base, band: b, points: total, inSleeve };

  if (inSleeve) {
    if (b !== "A" && b !== "B") {
      return { ...result, decision: "decline", limit: 0, reasons: ["SLEEVE_BAND_TOO_LOW", ...negatives] };
    }
    if (ctx.sleeveShareThisMonth >= CREDIT_POLICY.sleeveMaxShare) {
      return { ...result, decision: "waitlist", limit: 0, reasons: ["SLEEVE_FULL"] };
    }
  }

  if (b === "E") {
    return { ...result, decision: "decline", limit: 0, reasons: ["LOW_SCORE_BAND", ...negatives] };
  }

  const limit = limitFor(a, inSleeve);
  if (limit < LOAN_TERMS.minAmount) {
    return { ...result, decision: "decline", limit: 0, reasons: ["LIMIT_BELOW_MINIMUM", ...negatives] };
  }

  return { ...result, decision: b === "D" ? "review" : "offer", limit, reasons: negatives };
}
