import { SANDBOX_OTP } from "./config";
import type { Applicant } from "./scorecard";

// Sandbox stand-ins for the services the NBFC will provide: OTP, Aadhaar KYC, Account
// Aggregator bank statements, credit bureau, penny drop and eSign. Each data set is a
// made-up borrower used to exercise one path through the scorecard.

export type DataSetId = "trader" | "gig" | "newToCredit" | "review" | "decline";

type DataSet = {
  label: string;
  description: string;
  data: Omit<Applicant, "age" | "kycPassed" | "hasActiveKarmacashLoan" | "onTimeKarmacashLoansRepaid">;
};

const clean = {
  bureauWriteOffOr90Dpd12m: false,
  fraudFlag: false,
  bankHistoryMonths: 12,
  bouncedEmisOrMandates12m: 0,
  lowBalanceDaysPerMonth: 2,
  existingMonthlyEmi: 0,
  filesGst: false,
  hasUdyam: false,
  bettingDebitShare: 0,
};

export const DATA_SETS: Record<DataSetId, DataSet> = {
  trader: {
    label: "Kirana shop, score 742",
    description: "Steady UPI sales from many customers, files GST.",
    data: {
      ...clean,
      bureauScore: 742,
      monthlyInflows: [52_000, 58_000, 61_000, 55_000, 63_000, 60_000, 57_000, 62_000, 59_000, 64_000, 61_000, 63_000],
      uniqueUpiPayersPerMonth: 85,
      merchantUpiShare: 0.7,
      monthsWithPlatformPayouts6m: 0,
      filesGst: true,
      hasUdyam: true,
    },
  },
  gig: {
    label: "Delivery rider, score 718",
    description: "Weekly platform payouts every month.",
    data: {
      ...clean,
      bureauScore: 718,
      monthlyInflows: [31_000, 33_000, 32_000, 34_000, 30_000, 35_000, 33_000, 32_000, 34_000, 33_000, 31_000, 35_000],
      uniqueUpiPayersPerMonth: 6,
      merchantUpiShare: 0.05,
      monthsWithPlatformPayouts6m: 6,
    },
  },
  newToCredit: {
    label: "Tailor, no credit score",
    description: "No bureau record, but steady UPI income. Falls in the 5% sleeve.",
    data: {
      ...clean,
      bureauScore: null,
      monthlyInflows: [38_000, 41_000, 40_000, 39_000, 42_000, 40_000, 41_000, 39_000, 40_000, 42_000, 41_000, 40_000],
      uniqueUpiPayersPerMonth: 30,
      merchantUpiShare: 0.6,
      monthsWithPlatformPayouts6m: 0,
      hasUdyam: true,
    },
  },
  review: {
    label: "Seasonal seller, score 708",
    description: "Income swings month to month and one bounced EMI. Goes to lender review.",
    data: {
      ...clean,
      bureauScore: 708,
      monthlyInflows: [20_000, 44_000, 19_000, 45_000, 21_000, 43_000, 18_000, 45_000, 20_000, 42_000, 19_000, 46_000],
      uniqueUpiPayersPerMonth: 12,
      merchantUpiShare: 0.3,
      monthsWithPlatformPayouts6m: 0,
      bouncedEmisOrMandates12m: 1,
      lowBalanceDaysPerMonth: 12,
    },
  },
  decline: {
    label: "Auto driver, score 655",
    description: "Three bounced EMIs and betting spends. Declined.",
    data: {
      ...clean,
      bureauScore: 655,
      monthlyInflows: [24_000, 26_000, 22_000, 27_000, 25_000, 23_000, 26_000, 24_000, 22_000, 25_000, 27_000, 24_000],
      uniqueUpiPayersPerMonth: 10,
      merchantUpiShare: 0.1,
      monthsWithPlatformPayouts6m: 0,
      bouncedEmisOrMandates12m: 3,
      lowBalanceDaysPerMonth: 14,
      bettingDebitShare: 0.12,
    },
  },
};

export function isDataSetId(value: string): value is DataSetId {
  return Object.hasOwn(DATA_SETS, value);
}

/** Bureau pull plus Account Aggregator fetch, as the scorecard sees them. */
export function fetchApplicantData(dataSet: DataSetId, age: number): Applicant {
  return {
    ...DATA_SETS[dataSet].data,
    age,
    kycPassed: true,
    hasActiveKarmacashLoan: false,
    onTimeKarmacashLoansRepaid: 0,
  };
}

export function verifyOtp(code: string): boolean {
  return code.trim() === SANDBOX_OTP;
}

/** Penny drop: deposits Rs 1 and returns the account holder's name as the bank reports it. */
export function pennyDrop(kycName: string): { holderName: string } {
  return { holderName: kycName.toUpperCase() };
}

/** Same person if the names match ignoring case, spacing and initials order. */
export function namesMatch(a: string, b: string): boolean {
  const tokens = (s: string) => s.toUpperCase().replace(/[^A-Z ]/g, " ").split(/\s+/).filter(Boolean).sort().join(" ");
  return tokens(a) === tokens(b);
}

/** Share of this month's loans already in the sleeve; a fixed value in the sandbox. */
export function sleeveShareThisMonth(): number {
  return 0.02;
}
