import { CREDIT_POLICY, RATE_BY_BAND } from "./config";
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
  kyc?: { aadhaarLast4: string; verifiedAt: string };
  consent?: { bureauAt: string; aaAt: string; aaRevokedAt?: string; wordingVersion: string };
  decision?: {
    decision: Decision;
    band: Band | null;
    limit: number;
    inSleeve: boolean;
    reasons: ReasonCode[];
    avgMonthlyInflow: number;
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
  { label: "Your details", steps: ["details", "waitlist"] },
  { label: "Identity", steps: ["kyc"] },
  { label: "Bank data", steps: ["consent", "outcome"] },
  { label: "Offer", steps: ["offer"] },
  { label: "Repayment", steps: ["bank", "mandate"] },
  { label: "Sign", steps: ["sign", "done"] },
];

export function rateFor(band: Band | null, inSleeve: boolean): number {
  if (inSleeve || band === null || band === "E") return RATE_BY_BAND.D;
  return RATE_BY_BAND[band];
}

export function reapplyDate(decidedAt: string): Date {
  const d = new Date(decidedAt);
  d.setUTCDate(d.getUTCDate() + CREDIT_POLICY.reapplyAfterDays);
  return d;
}

/** EMI due dates: the same day each month after signing, starting next month. */
export function dueDates(signedAt: string, months: number): Date[] {
  const start = new Date(signedAt);
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
