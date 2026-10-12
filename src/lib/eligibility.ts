import { ALLOWED_PIN_PREFIXES, CREDIT_POLICY, LAUNCH_REGION, LOAN_TERMS } from "./config";

// The two-minute soft check. It never pulls a credit report and only gives an
// indicative answer; the real decision comes from the scorecard after consent.

export type WorkType = "trader" | "gig" | "other";

export type IncomeRange = "under15k" | "15to25k" | "25to50k" | "over50k";

export const INCOME_RANGES: Record<IncomeRange, { label: string; floor: number }> = {
  under15k: { label: "Under Rs 15,000", floor: 0 },
  "15to25k": { label: "Rs 15,000 to Rs 25,000", floor: 15_000 },
  "25to50k": { label: "Rs 25,000 to Rs 50,000", floor: 25_000 },
  over50k: { label: "Over Rs 50,000", floor: 50_000 },
};

export type EligibilityInput = {
  amount: number;
  workType: WorkType;
  pinCode: string;
  monthlyIncome: IncomeRange;
};

export type EligibilityResult =
  | { status: "invalid"; message: string }
  | { status: "waitlist"; message: string }
  | { status: "unlikely"; message: string }
  | { status: "likely"; message: string; indicativeLimit: number };

export function isValidPin(pin: string): boolean {
  return /^[1-9][0-9]{5}$/.test(pin);
}

export function inLaunchRegion(pin: string): boolean {
  return ALLOWED_PIN_PREFIXES.some((prefix) => pin.startsWith(prefix));
}

export function checkEligibility(input: EligibilityInput): EligibilityResult {
  const pin = input.pinCode.trim();
  if (!isValidPin(pin)) {
    return { status: "invalid", message: "Please enter a valid 6-digit PIN code." };
  }
  if (!Number.isFinite(input.amount) || input.amount < LOAN_TERMS.minAmount || input.amount > LOAN_TERMS.maxAmount) {
    return { status: "invalid", message: "Choose an amount between Rs 15,000 and Rs 3,00,000." };
  }
  if (!inLaunchRegion(pin)) {
    return {
      status: "waitlist",
      message: `We are starting in ${LAUNCH_REGION}. Join the waitlist and we will tell you when we reach your area.`,
    };
  }
  const floor = INCOME_RANGES[input.monthlyIncome].floor;
  if (floor < CREDIT_POLICY.minMonthlyInflow) {
    return {
      status: "unlikely",
      message: "We need at least Rs 15,000 a month coming into your bank account to offer a loan today.",
    };
  }
  // First loans are capped at Rs 50,000 and at 1.5 times monthly income.
  const indicativeLimit = Math.min(
    input.amount,
    CREDIT_POLICY.firstLoanCap,
    Math.floor((CREDIT_POLICY.limitInflowMultiple * floor) / 1000) * 1000,
  );
  return {
    status: "likely",
    indicativeLimit,
    message:
      indicativeLimit < input.amount
        ? "You look likely to qualify for a first loan of up to this amount. Repay on time and your limit can grow."
        : "You look likely to qualify for this amount.",
  };
}
