import { describe, expect, it } from "vitest";
import { ageOn, isIndividualPan, isValidAccountNumber, isValidIfsc, normalisePhone } from "./validation";

describe("normalisePhone", () => {
  it("accepts Indian mobiles with or without +91", () => {
    expect(normalisePhone("98470 12345")).toBe("9847012345");
    expect(normalisePhone("+91 9847012345")).toBe("9847012345");
    expect(normalisePhone("09847012345")).toBe("9847012345");
  });
  it("rejects landlines and short numbers", () => {
    expect(normalisePhone("4842345678")).toBeNull();
    expect(normalisePhone("98470")).toBeNull();
  });
});

describe("format checks", () => {
  it("accepts only individual PANs", () => {
    expect(isIndividualPan("ABCPE1234F")).toBe(true);
    expect(isIndividualPan("ABCCE1234F")).toBe(false);
  });
  it("checks IFSC and account number shape", () => {
    expect(isValidIfsc("SBIN0070123")).toBe(true);
    expect(isValidIfsc("SBIN1070123")).toBe(false);
    expect(isValidAccountNumber("123456789012")).toBe(true);
    expect(isValidAccountNumber("12345")).toBe(false);
  });
});

describe("ageOn", () => {
  const on = new Date(Date.UTC(2026, 9, 12));
  it("counts whole years", () => {
    expect(ageOn("2000-10-12", on)).toBe(26);
    expect(ageOn("2000-10-13", on)).toBe(25);
  });
  it("rejects impossible dates", () => {
    expect(ageOn("2000-02-31", on)).toBeNull();
    expect(ageOn("2030-01-01", on)).toBeNull();
  });
});
