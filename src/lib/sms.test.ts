import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendSmsOtp, smsConfigured, verifySmsOtp } from "./sms";

const reply = (body: object, status = 200) => vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }));

beforeEach(() => {
  vi.stubEnv("MSG91_AUTH_KEY", "key123");
  vi.stubEnv("MSG91_OTP_TEMPLATE_ID", "tmpl1");
});
afterEach(() => vi.unstubAllEnvs());

describe("MSG91 OTP", () => {
  it("needs both the key and the template", () => {
    expect(smsConfigured()).toBe(true);
    vi.stubEnv("MSG91_OTP_TEMPLATE_ID", "");
    expect(smsConfigured()).toBe(false);
  });

  it("sends to +91 with the template, length and expiry", async () => {
    const fetchImpl = reply({ type: "success", request_id: "r1" });
    expect(await sendSmsOtp("9847012345", fetchImpl)).toEqual({ ok: true });
    const [url, init] = fetchImpl.mock.calls[0];
    const u = new URL(url);
    expect(u.origin + u.pathname).toBe("https://control.msg91.com/api/v5/otp");
    expect(Object.fromEntries(u.searchParams)).toEqual({ template_id: "tmpl1", mobile: "919847012345", otp_length: "6", otp_expiry: "10" });
    expect(init.method).toBe("POST");
    expect(init.headers.authkey).toBe("key123");
  });

  it("reports send errors", async () => {
    expect(await sendSmsOtp("9847012345", reply({ type: "error", message: "Invalid authkey" }, 401))).toEqual({
      ok: false,
      error: "Invalid authkey",
    });
  });

  it("classifies verify results", async () => {
    expect(await verifySmsOtp("9847012345", "482913", reply({ type: "success", message: "OTP verified success" }))).toEqual({ ok: true });
    expect(await verifySmsOtp("9847012345", "482913", reply({ type: "error", message: "OTP not match" }))).toMatchObject({ reason: "wrong" });
    expect(await verifySmsOtp("9847012345", "482913", reply({ type: "error", message: "OTP expired" }))).toMatchObject({ reason: "expired" });
    expect(await verifySmsOtp("9847012345", "482913", reply({ type: "error", message: "Invalid authkey" }, 401))).toMatchObject({ reason: "service" });
  });

  it("rejects malformed codes without calling MSG91", async () => {
    const fetchImpl = vi.fn();
    expect(await verifySmsOtp("9847012345", "12ab", fetchImpl)).toMatchObject({ reason: "wrong" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
