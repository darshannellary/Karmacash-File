import { describe, expect, it } from "vitest";
import { aprPct, emi, loanCost, principalForEmi, schedule } from "./emi";

describe("emi", () => {
  it("matches the standard formula for Rs 50,000 at 24% over 6 months", () => {
    expect(emi(50_000, 24, 6)).toBeCloseTo(8926.29, 1);
  });

  it("inverts with principalForEmi", () => {
    const instalment = emi(120_000, 18, 12);
    expect(principalForEmi(instalment, 18, 12)).toBeCloseTo(120_000, 4);
  });

  it("returns zero principal when nothing is affordable", () => {
    expect(principalForEmi(-100, 24, 12)).toBe(0);
  });
});

describe("schedule", () => {
  it("repays the principal exactly", () => {
    const rows = schedule(75_000, 21, 9);
    expect(rows).toHaveLength(9);
    expect(rows.reduce((sum, r) => sum + r.principal, 0)).toBe(75_000);
    expect(rows.at(-1)?.balance).toBe(0);
  });
});

describe("loanCost", () => {
  it("deducts the 4% fee and 18% GST at disbursal", () => {
    const cost = loanCost(50_000, 24, 6);
    expect(cost.processingFee).toBe(2_000);
    expect(cost.gstOnFee).toBe(360);
    expect(cost.netDisbursal).toBe(47_640);
  });

  it("gives an APR above the interest rate once the fee is included", () => {
    const cost = loanCost(50_000, 24, 6);
    expect(cost.aprPct).toBeGreaterThan(24);
    expect(cost.aprPct).toBeLessThan(45);
  });

  it("gives a lower APR uplift on 12 months than on 6 months", () => {
    const six = loanCost(50_000, 18, 6).aprPct - 18;
    const twelve = loanCost(50_000, 18, 12).aprPct - 18;
    expect(twelve).toBeLessThan(six);
  });
});

describe("aprPct", () => {
  it("equals the nominal rate when there is no fee", () => {
    const rows = schedule(100_000, 18, 12);
    expect(aprPct(100_000, rows.map((r) => r.emi))).toBeCloseTo(18, 0);
  });
});
