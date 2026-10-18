import { describe, expect, it } from "vitest";
import { LOAN_TERMS } from "./config";
import { emi } from "./emi";
import { type Applicant, averageInflow, band, limitFor, score } from "./scorecard";

const trader: Applicant = {
  age: 34,
  kycPassed: true,
  bureauScore: 742,
  bureauWriteOffOr90Dpd12m: false,
  fraudFlag: false,
  hasActiveKarmacashLoan: false,
  onTimeKarmacashLoansRepaid: 0,
  bankHistoryMonths: 12,
  monthlyInflows: [40_000, 42_000, 38_000, 41_000, 45_000, 39_000, 43_000, 40_000, 44_000, 42_000, 41_000, 43_000],
  uniqueUpiPayersPerMonth: 60,
  merchantUpiShare: 0.7,
  monthsWithPlatformPayouts6m: 0,
  bouncedEmisOrMandates12m: 0,
  lowBalanceDaysPerMonth: 2,
  existingMonthlyEmi: 0,
  filesGst: false,
  hasUdyam: true,
  bettingDebitShare: 0,
};

const open = { sleeveShareThisMonth: 0 };

describe("knockouts", () => {
  it("declines an applicant with an active Karmacash loan", () => {
    const r = score({ ...trader, hasActiveKarmacashLoan: true }, open);
    expect(r.decision).toBe("decline");
    expect(r.reasons).toContain("ACTIVE_LOAN");
  });

  it("declines when average inflow is under Rs 15,000", () => {
    const r = score({ ...trader, monthlyInflows: Array(12).fill(12_000) }, open);
    expect(r.reasons).toContain("LOW_INFLOW");
  });

  it("declines outside the 21 to 60 age range", () => {
    expect(score({ ...trader, age: 61 }, open).reasons).toContain("AGE_OUT_OF_RANGE");
    expect(score({ ...trader, age: 20 }, open).reasons).toContain("AGE_OUT_OF_RANGE");
  });

  it("declines with under 6 months of bank history", () => {
    expect(score({ ...trader, bankHistoryMonths: 5 }, open).reasons).toContain("SHORT_BANK_HISTORY");
  });
});

describe("main book (score above 700)", () => {
  it("gives a steady trader an instant offer capped at Rs 50,000 for a first loan", () => {
    const r = score(trader, open);
    expect(r.decision).toBe("offer");
    expect(r.inSleeve).toBe(false);
    expect(r.limit).toBe(50_000);
  });

  it("lifts the first-loan cap after an on-time repayment", () => {
    const r = score({ ...trader, onTimeKarmacashLoansRepaid: 1 }, open);
    expect(r.limit).toBeGreaterThan(50_000);
    expect(r.limit).toBeLessThanOrEqual(1.5 * averageInflow(trader));
  });

  it("treats exactly 700 as not above 700", () => {
    expect(score({ ...trader, bureauScore: 700 }, open).inSleeve).toBe(true);
    expect(score({ ...trader, bureauScore: 701 }, open).inSleeve).toBe(false);
  });

  it("keeps EMIs under 35% of inflow after existing EMIs", () => {
    const applicant = { ...trader, onTimeKarmacashLoansRepaid: 2, existingMonthlyEmi: 12_000 };
    const limit = limitFor(applicant, false);
    const maxEmi = Math.floor(0.35 * averageInflow(trader) - 12_000);
    expect(emi(limit, LOAN_TERMS.annualRatePct.max, Math.max(...LOAN_TERMS.tenuresMonths))).toBeLessThanOrEqual(maxEmi);
  });

  it("reports the new EMI the applicant can afford, net of existing EMIs", () => {
    const r = score({ ...trader, existingMonthlyEmi: 5_000 }, open);
    expect(r.maxEmi).toBe(Math.floor(0.35 * averageInflow(trader) - 5_000));
  });

  it("declines when the affordable amount is below Rs 15,000", () => {
    // Rs 300 a month over 60 months at 28% repays about Rs 9,000.
    const r = score({ ...trader, existingMonthlyEmi: Math.floor(0.35 * averageInflow(trader)) - 300 }, open);
    expect(r.decision).toBe("decline");
    expect(r.reasons[0]).toBe("LIMIT_BELOW_MINIMUM");
  });
});

describe("sleeve (score 700 or below, or no score)", () => {
  const noScore = { ...trader, bureauScore: null, filesGst: true };

  it("caps a strong no-score applicant at Rs 25,000", () => {
    const r = score(noScore, open);
    expect(r.inSleeve).toBe(true);
    expect(r.decision).toBe("offer");
    expect(r.limit).toBe(25_000);
  });

  it("waitlists once 5% of this month's loans are in the sleeve", () => {
    const r = score(noScore, { sleeveShareThisMonth: 0.05 });
    expect(r.decision).toBe("waitlist");
    expect(r.reasons).toEqual(["SLEEVE_FULL"]);
  });

  it("declines sleeve applicants below band B", () => {
    const weak = { ...noScore, filesGst: false, hasUdyam: false, uniqueUpiPayersPerMonth: 10, merchantUpiShare: 0 };
    const r = score(weak, open);
    expect(r.band).not.toMatch(/[AB]/);
    expect(r.decision).toBe("decline");
    expect(r.reasons[0]).toBe("SLEEVE_BAND_TOO_LOW");
  });
});

describe("bands", () => {
  it("maps points to bands", () => {
    expect(band(80)).toBe("A");
    expect(band(60)).toBe("B");
    expect(band(45)).toBe("C");
    expect(band(35)).toBe("D");
    expect(band(34)).toBe("E");
  });

  it("sends band D to review and band E to decline", () => {
    const shaky: Applicant = {
      ...trader,
      bureauScore: 705,
      monthlyInflows: [15_000, 35_000, 16_000, 34_000, 15_000, 35_000],
      bankHistoryMonths: 6,
      uniqueUpiPayersPerMonth: 10,
      merchantUpiShare: 0.3,
      bouncedEmisOrMandates12m: 1,
      hasUdyam: false,
    };
    const r = score(shaky, open);
    expect(r.band).toBe("D");
    expect(r.decision).toBe("review");

    const worse = score({ ...shaky, bouncedEmisOrMandates12m: 3, bettingDebitShare: 0.2 }, open);
    expect(worse.band).toBe("E");
    expect(worse.decision).toBe("decline");
    expect(worse.reasons).toContain("BETTING_SPEND");
  });
});
