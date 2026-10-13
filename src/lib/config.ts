// Release 1 lending terms and credit policy, from the approved plan and PRD.
// Rates and fees are placeholders until the NBFC partner confirms them.

export const LOAN_TERMS = {
  minAmount: 15_000,
  maxAmount: 300_000,
  tenuresMonths: [6, 9, 12] as const,
  annualRatePct: { min: 12, max: 28 }, // lowest and highest in RATE_BY_BAND
  processingFeeRate: 0.02,
  gstRate: 0.18,
  failedEmiCharge: 250,
} as const;

export const CREDIT_POLICY = {
  version: "v0-2026-10-12",
  scoreThreshold: 700, // "above 700" means a score of 701 or more
  sleeveMaxShare: 0.05,
  firstLoanCap: 50_000,
  sleeveFirstLoanCap: 25_000,
  limitInflowMultiple: 1.5,
  maxEmiToInflow: 0.35,
  minMonthlyInflow: 15_000,
  minAge: 21,
  maxAge: 60,
  minBankHistoryMonths: 6,
  reapplyAfterDays: 90,
  bands: { A: 75, B: 60, C: 45, D: 35 }, // minimum points per band; below D is E
} as const;

// Kerala PIN codes run from 670001 to 695615, so they start with 67, 68 or 69.
export const ALLOWED_PIN_PREFIXES = ["67", "68", "69"] as const;
export const LAUNCH_REGION = "Kerala";

export const SITE = {
  name: "Karmacash",
  domain: "karmacashai.com",
  url: "https://karmacashai.com",
  // Placeholders until the company is registered and the NBFC partnership is signed.
  legalName: "Karmacash (company registration in progress)",
  lendingPartner: "our NBFC lending partner (to be announced)",
  grievanceOfficer: {
    name: "To be appointed",
    email: "grievance@karmacashai.com",
    phone: "To be announced",
  },
  support: {
    email: "support@karmacashai.com",
    phone: "To be announced",
    whatsapp: "To be announced",
  },
} as const;

// Interest runs from 12% to 28% a year, set by band; the all-in APR is higher because it
// includes the processing fee (see aprRange in emi.ts). Rates are indicative until the NBFC
// partner confirms them. Applicants without a credit score above 700 (the 5% sleeve) are
// priced as band D.
export const RATE_BY_BAND = {
  A: { 6: 12, 9: 12, 12: 12 },
  B: { 6: 17, 9: 17, 12: 17 },
  C: { 6: 23, 9: 23, 12: 23 },
  D: { 6: 28, 9: 28, 12: 28 },
} as const satisfies Record<"A" | "B" | "C" | "D", Record<Tenure, number>>;

export type Tenure = (typeof LOAN_TERMS.tenuresMonths)[number];
export type PricedBand = keyof typeof RATE_BY_BAND;

// Until the NBFC signs, every third-party service (OTP, KYC, Account Aggregator, bureau,
// penny drop, mandate, eSign) runs against sandbox stand-ins and no money moves.
export const SANDBOX = process.env.KARMACASH_MODE !== "live";
export const SANDBOX_OTP = "123456";

// Limits on one-time codes, per mobile number. Counted on the server so clearing cookies
// does not reset them. The daily wrong-guess count covers sign-in, KYC and eSign together.
export const OTP_LIMITS = {
  resendCooldownSeconds: 30,
  sendsPer10Minutes: 3,
  sendsPerDay: 10,
  wrongGuessesPerCode: 5,
  codeWindowMinutes: 10,
  wrongGuessesPerDay: 10,
  lockHours: 24,
} as const;

// RBI Digital Lending Directions: cooling-off period of at least 3 days for loans of 7 days or more.
export const COOLING_OFF_DAYS = 3;
