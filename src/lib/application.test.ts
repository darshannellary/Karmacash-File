import { describe, expect, it } from "vitest";
import { type ApplicationState, coolingOffEnds, currentStep, dueDates, offerTerms, rateFor } from "./application";
import { emi } from "./emi";

const at = "2026-10-12T10:00:00.000Z";

describe("currentStep", () => {
  it("walks the flow in order", () => {
    const s: ApplicationState = {};
    expect(currentStep(s)).toBe("phone");
    s.phone = "9847012345";
    s.otpSentAt = at;
    expect(currentStep(s)).toBe("otp");
    s.signedInAt = at;
    expect(currentStep(s)).toBe("details");
    s.details = { fullName: "A", dob: "1990-01-01", age: 36, panMasked: "XXXXXX234F", pinCode: "682001", workType: "trader" };
    expect(currentStep(s)).toBe("kyc");
    s.kyc = { aadhaarLast4: "1234", verifiedAt: at };
    expect(currentStep(s)).toBe("consent");
    s.consent = { bureauAt: at, aaAt: at, wordingVersion: "v1" };
    s.decision = { decision: "review", band: "D", limit: 30_000, inSleeve: false, reasons: [], avgMonthlyInflow: 30_000, maxEmi: 10_500, policyVersion: "v0", dataSet: "review", decidedAt: at };
    expect(currentStep(s)).toBe("outcome");
    s.decision.decision = "offer";
    expect(currentStep(s)).toBe("offer");
  });

  it("sends out-of-region applicants to the waitlist", () => {
    expect(currentStep({ phone: "9847012345", otpSentAt: at, signedInAt: at, details: { fullName: "A", dob: "1990-01-01", age: 36, panMasked: "", pinCode: "560001", workType: "gig" }, waitlisted: true })).toBe("waitlist");
  });
});

describe("pricing and dates", () => {
  it("prices by band and puts the sleeve at the top rate", () => {
    expect(rateFor("A", false, 12)).toBe(12);
    expect(rateFor("C", false, 6)).toBe(23);
    expect(rateFor("A", true, 12)).toBe(28);
  });

  it("keeps due dates inside short months", () => {
    const dates = dueDates("2026-01-31T06:00:00.000Z", 3).map((d) => d.toISOString().slice(0, 10));
    expect(dates).toEqual(["2026-02-28", "2026-03-31", "2026-04-30"]);
  });

  it("takes the due day from the signing date in India time", () => {
    // 20:00 UTC on 12 Oct is 01:30 IST on 13 Oct.
    const [first] = dueDates("2026-10-12T20:00:00.000Z", 1);
    expect(first.toISOString().slice(0, 10)).toBe("2026-11-13");
  });

  it("ends the cooling-off period 3 days after signing", () => {
    expect(coolingOffEnds("2026-10-12T10:00:00.000Z").toISOString()).toBe("2026-10-15T10:00:00.000Z");
  });
});

describe("offerTerms", () => {
  it("offers the full limit at every tenure when the EMI is affordable", () => {
    const terms = offerTerms({ band: "A", inSleeve: false, limit: 50_000, maxEmi: 20_000 });
    expect(terms.map((t) => t.maxAmount)).toEqual([50_000, 50_000, 50_000]);
  });

  it("caps shorter tenures so the EMI stays within what the borrower can afford", () => {
    // Rs 40,000 inflow with a Rs 9,000 existing EMI leaves Rs 5,000 a month.
    const terms = offerTerms({ band: "B", inSleeve: false, limit: 50_000, maxEmi: 5_000 });
    for (const t of terms) {
      expect(emi(t.maxAmount, t.ratePct, t.months)).toBeLessThanOrEqual(5_000);
    }
    expect(terms[0].maxAmount).toBeLessThan(50_000);
    expect(terms.at(-1)!.maxAmount).toBe(50_000);
  });

  it("marks a tenure unavailable when even the minimum loan is unaffordable", () => {
    const terms = offerTerms({ band: "D", inSleeve: false, limit: 20_000, maxEmi: 2_000 });
    expect(terms.find((t) => t.months === 6)!.available).toBe(false);
    expect(terms.find((t) => t.months === 12)!.available).toBe(true);
  });
});
