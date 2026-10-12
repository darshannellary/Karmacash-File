// Release 1 lending terms and credit policy, from the approved plan and PRD.
// Rates and fees are placeholders until the NBFC partner confirms them.

export const LOAN_TERMS = {
  minAmount: 15_000,
  maxAmount: 300_000,
  tenuresMonths: [6, 9, 12] as const,
  annualRatePct: { min: 9.5, max: 19.25 }, // lowest and highest in RATE_BY_BAND
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

// The all-in APR, fee included, stays within 18% to 24%. Each band has an APR ceiling, and
// its interest rate per tenure is the highest (in 0.25% steps) that keeps the APR under that
// ceiling for every loan amount; shorter tenures are lower because the fee weighs more.
// Applicants without a credit score above 700 (the 5% sleeve) are priced as band D.
export const APR_RANGE = { min: 18, max: 24 } as const;
export const APR_CEILING_BY_BAND = { A: 18, B: 20, C: 22, D: 24 } as const;
export const RATE_BY_BAND = {
  A: { 6: 9.5, 9: 12, 12: 13.25 },
  B: { 6: 11.5, 9: 14, 12: 15.25 },
  C: { 6: 13.5, 9: 16, 12: 17.25 },
  D: { 6: 15.5, 9: 18, 12: 19.25 },
} as const satisfies Record<keyof typeof APR_CEILING_BY_BAND, Record<Tenure, number>>;

export type Tenure = (typeof LOAN_TERMS.tenuresMonths)[number];
export type PricedBand = keyof typeof RATE_BY_BAND;

// Until the NBFC signs, every third-party service (OTP, KYC, Account Aggregator, bureau,
// penny drop, mandate, eSign) runs against sandbox stand-ins and no money moves.
export const SANDBOX = process.env.KARMACASH_MODE !== "live";
export const SANDBOX_OTP = "123456";

// RBI Digital Lending Directions: cooling-off period of at least 3 days for loans of 7 days or more.
export const COOLING_OFF_DAYS = 3;
