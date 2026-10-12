import { describe, expect, it } from "vitest";
import { type ApplicationState, currentStep, dueDates, rateFor } from "./application";

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
    s.decision = { decision: "review", band: "D", limit: 30_000, inSleeve: false, reasons: [], avgMonthlyInflow: 30_000, policyVersion: "v0", dataSet: "review", decidedAt: at };
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
    expect(rateFor("A", false)).toBe(18);
    expect(rateFor("C", false)).toBe(22);
    expect(rateFor("A", true)).toBe(24);
  });

  it("keeps due dates inside short months", () => {
    const dates = dueDates("2026-01-31T06:00:00.000Z", 3).map((d) => d.toISOString().slice(0, 10));
    expect(dates).toEqual(["2026-02-28", "2026-03-31", "2026-04-30"]);
  });
});
