import { describe, expect, it } from "vitest";
import { checkEligibility } from "./eligibility";

const base = { amount: 40_000, workType: "trader" as const, pinCode: "682001", monthlyIncome: "25to50k" as const };

describe("checkEligibility", () => {
  it("accepts a Kochi applicant within the first-loan cap", () => {
    const r = checkEligibility(base);
    expect(r.status).toBe("likely");
    if (r.status === "likely") expect(r.indicativeLimit).toBe(37_000);
  });

  it("waitlists PIN codes outside Kerala", () => {
    expect(checkEligibility({ ...base, pinCode: "560001" }).status).toBe("waitlist");
  });

  it("rejects amounts below Rs 15,000", () => {
    expect(checkEligibility({ ...base, amount: 10_000 }).status).toBe("invalid");
  });

  it("rejects malformed PIN codes", () => {
    expect(checkEligibility({ ...base, pinCode: "68200" }).status).toBe("invalid");
  });

  it("flags income under Rs 15,000 as unlikely", () => {
    expect(checkEligibility({ ...base, monthlyIncome: "under15k" }).status).toBe("unlikely");
  });

  it("caps first loans at Rs 50,000", () => {
    const r = checkEligibility({ ...base, amount: 200_000, monthlyIncome: "over50k" });
    if (r.status === "likely") expect(r.indicativeLimit).toBe(50_000);
  });
});
