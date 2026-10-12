import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ cookies: vi.fn() }));
const { decodeState, encodeState } = await import("./session");

describe("signed application cookie", () => {
  it("round-trips state", () => {
    const state = { phone: "9847012345", otpSentAt: "2026-10-12T10:00:00.000Z" };
    expect(decodeState(encodeState(state))).toEqual(state);
  });

  it("rejects tampered state", () => {
    const [payload, sig] = encodeState({ phone: "9847012345" }).split(".");
    const forged = Buffer.from(JSON.stringify({ phone: "9847012345", loan: { id: "x", signedAt: "" } })).toString("base64url");
    expect(decodeState(`${forged}.${sig}`)).toEqual({});
    expect(decodeState(`${payload}.bad`)).toEqual({});
    expect(decodeState("garbage")).toEqual({});
  });
});
