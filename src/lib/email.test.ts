import { afterEach, describe, expect, it, vi } from "vitest";
import { isValidEmail, maskEmail, sendEmail } from "./email";
import { decisionEmail, loanSignedEmail, verificationEmail } from "./email-templates";

afterEach(() => vi.unstubAllEnvs());

const email = { to: "anitha@example.com", subject: "s", html: "<p>h</p>", text: "t" };

describe("sendEmail", () => {
  it("does nothing without an API key", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const fetchImpl = vi.fn();
    expect(await sendEmail(email, fetchImpl)).toEqual({ ok: false, error: "RESEND_API_KEY is not set" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("posts to Resend with the key and sender", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    const fetchImpl = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: "em_1" }), { status: 200 }));
    expect(await sendEmail(email, fetchImpl)).toEqual({ ok: true, id: "em_1" });
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.headers.Authorization).toBe("Bearer re_test");
    expect(JSON.parse(init.body)).toMatchObject({ from: "Karmacash <noreply@karmacashai.com>", to: ["anitha@example.com"] });
  });

  it("reports Resend's error message", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    const fetchImpl = vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: "Domain not verified" }), { status: 403 }));
    expect(await sendEmail(email, fetchImpl)).toEqual({ ok: false, error: "Domain not verified" });
  });
});

describe("addresses", () => {
  it("validates and masks", () => {
    expect(isValidEmail("anitha.menon@gmail.com")).toBe(true);
    expect(isValidEmail("anitha@gmail")).toBe(false);
    expect(maskEmail("anitha@gmail.com")).toBe("a****@gmail.com");
  });
});

describe("templates", () => {
  const at = "2026-10-12T10:00:00.000Z";
  it("puts the code in the subject and escapes names", () => {
    expect(verificationEmail("a@b.co", "482913").subject).toContain("482913");
    const mail = decisionEmail("a@b.co", {
      details: { fullName: "<b>Anitha</b> Menon", dob: "", age: 30, panMasked: "", pinCode: "682001", workType: "trader" },
      decision: { decision: "offer", band: "A", limit: 50_000, inSleeve: false, reasons: [], avgMonthlyInflow: 60_000, maxEmi: 20_000, policyVersion: "v0", dataSet: "trader", decidedAt: at },
    });
    expect(mail?.html).not.toContain("<b>Anitha");
    expect(mail?.text).toContain("₹50,000");
  });

  it("summarises a signed loan", () => {
    const mail = loanSignedEmail("a@b.co", { offer: { amount: 50_000, months: 6, ratePct: 18, acceptedAt: at }, loan: { id: "KC1", signedAt: at } });
    expect(mail?.subject).toContain("KC1");
    expect(mail?.text).toContain("Monthly EMI");
  });
});
