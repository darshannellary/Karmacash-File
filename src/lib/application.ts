import { COOLING_OFF_DAYS, CREDIT_POLICY, LOAN_TERMS, type PricedBand, RATE_BY_BAND, type Tenure } from "./config";
import { principalForEmi } from "./emi";
import type { WorkType } from "./eligibility";
import type { Band, Decision, ReasonCode } from "./scorecard";

// Everything the borrower has done so far in one application. Release 1 keeps this in a
// signed cookie while the flow runs on sandbox services; it moves to Postgres before live lending.
export type ApplicationState = {
  phone?: string;
  otpSentAt?: string;
  signedInAt?: string;
  details?: { fullName: string; dob: string; age: number; panMasked: string; pinCode: string; workType: WorkType };
  waitlisted?: boolean;
  // The code is kept only as a keyed hash; codeSentAt identifies which code it is.
  email?: { address: string; codeHash: string; codeSentAt: string; verifiedAt?: string };
  kyc?: { aadhaarLast4: string; verifiedAt: string };
  consent?: { bureauAt: string; aaAt: string; aaRevokedAt?: string; wordingVersion: string };
  decision?: {
    decision: Decision;
    band: Band | null;
    limit: number;
    inSleeve: boolean;
    reasons: ReasonCode[];
    avgMonthlyInflow: number;
    maxEmi: number;
    policyVersion: string;
    dataSet: string;
    decidedAt: string;
  };
  offer?: { amount: number; months: number; ratePct: number; acceptedAt: string };
  account?: { last4: string; ifsc: string; holderName: string; verifiedAt: string };
  mandate?: { method: "enach" | "upi"; maxAmount: number; registeredAt: string };
  loan?: { id: string; signedAt: string };
};

export type Step =
  | "phone"
  | "otp"
  | "details"
  | "waitlist"
  | "email"
  | "emailCode"
  | "kyc"
  | "consent"
  | "outcome"
  | "offer"
  | "bank"
  | "mandate"
  | "sign"
  | "done";

export function currentStep(s: ApplicationState): Step {
  if (!s.phone || !s.otpSentAt) return "phone";
  if (!s.signedInAt) return "otp";
  if (!s.details) return "details";
  if (s.waitlisted) return "waitlist";
  if (!s.email) return "email";
  if (!s.email.verifiedAt) return "emailCode";
  if (!s.kyc) return "kyc";
  if (!s.consent || !s.decision) return "consent";
  if (s.decision.decision !== "offer") return "outcome";
  if (!s.offer) return "offer";
  if (!s.account) return "bank";
  if (!s.mandate) return "mandate";
  if (!s.loan) return "sign";
  return "done";
}

/** Progress shown to the borrower; several internal steps share one label. */
export const PROGRESS: { label: string; steps: Step[] }[] = [
  { label: "Sign in", steps: ["phone", "otp"] },
  { label: "Your details", steps: ["details", "waitlist", "email", "emailCode"] },
  { label: "Identity", steps: ["kyc"] },
  { label: "Bank data", steps: ["consent", "outcome"] },
  { label: "Offer", steps: ["offer"] },
  { label: "Repayment", steps: ["bank", "mandate"] },
  { label: "Sign", steps: ["sign", "done"] },
];

export function isTenure(months: number): months is Tenure {
  return (LOAN_TERMS.tenuresMonths as readonly number[]).includes(months);
}

export function pricedBand(band: Band | null, inSleeve: boolean): PricedBand {
  return inSleeve || band === null || band === "E" ? "D" : band;
}

export function rateFor(band: Band | null, inSleeve: boolean, months: Tenure): number {
  return RATE_BY_BAND[pricedBand(band, inSleeve)][months];
}

/**
 * Largest amount, in steps of Rs 1,000, that fits both the limit and the affordable EMI
 * at this tenure. The limit is sized for the longest tenure, so shorter ones can be lower.
 */
export function maxAmountFor(limit: number, maxEmi: number, ratePct: number, months: Tenure): number {
  const affordable = Math.floor(principalForEmi(maxEmi, ratePct, months) / 1000) * 1000;
  return Math.min(limit, affordable);
}

/** What the borrower can choose at each tenure; a tenure is unavailable if its max is below the minimum loan. */
export function offerTerms(decision: { band: Band | null; inSleeve: boolean; limit: number; maxEmi: number }) {
  return LOAN_TERMS.tenuresMonths.map((months) => {
    const ratePct = rateFor(decision.band, decision.inSleeve, months);
    const maxAmount = maxAmountFor(decision.limit, decision.maxEmi, ratePct, months);
    return { months, ratePct, maxAmount, available: maxAmount >= LOAN_TERMS.minAmount };
  });
}

export type OfferTerm = ReturnType<typeof offerTerms>[number];

export function coolingOffEnds(signedAt: string): Date {
  const d = new Date(signedAt);
  d.setUTCDate(d.getUTCDate() + COOLING_OFF_DAYS);
  return d;
}

export function reapplyDate(decidedAt: string): Date {
  const d = new Date(decidedAt);
  d.setUTCDate(d.getUTCDate() + CREDIT_POLICY.reapplyAfterDays);
  return d;
}

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/** EMI due dates: the same day each month after signing (in India time), starting next month. */
export function dueDates(signedAt: string, months: number): Date[] {
  const start = new Date(new Date(signedAt).getTime() + IST_OFFSET_MS);
  return Array.from({ length: months }, (_, i) => {
    const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + i + 1, 1));
    const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
    d.setUTCDate(Math.min(start.getUTCDate(), lastDay));
    return d;
  });
}

export function formatDate(d: Date | string): string {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }).format(
    typeof d === "string" ? new Date(d) : d,
  );
}
