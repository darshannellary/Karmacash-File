// Sign-in OTPs by SMS through MSG91's OTP API (https://docs.msg91.com/otp). MSG91 makes,
// sends and checks the code, so it is never stored here. The SMS template must be
// approved on the DLT platform and in MSG91 before codes reach Indian numbers.
// Set MSG91_AUTH_KEY and MSG91_OTP_TEMPLATE_ID in Vercel; without them test mode uses 123456.

const BASE = "https://control.msg91.com/api/v5/otp";
export const OTP_EXPIRY_MINUTES = 10;

export type SendResult = { ok: true } | { ok: false; error: string };
export type VerifyResult = { ok: true } | { ok: false; reason: "wrong" | "expired" | "service"; error: string };

export function smsConfigured(): boolean {
  return Boolean(process.env.MSG91_AUTH_KEY && process.env.MSG91_OTP_TEMPLATE_ID);
}

type Msg91Response = { type?: string; message?: string };

async function call(url: string, init: RequestInit, fetchImpl: typeof fetch): Promise<Msg91Response & { httpOk: boolean }> {
  const res = await fetchImpl(url, {
    ...init,
    headers: { authkey: process.env.MSG91_AUTH_KEY ?? "", "Content-Type": "application/json", accept: "application/json" },
  });
  const body = (await res.json().catch(() => ({}))) as Msg91Response;
  return { ...body, httpOk: res.ok };
}

/** Sends a new 6-digit code to an Indian mobile number (10 digits, no country code). */
export async function sendSmsOtp(phone: string, fetchImpl: typeof fetch = fetch): Promise<SendResult> {
  if (!smsConfigured()) return { ok: false, error: "MSG91 is not configured" };
  const params = new URLSearchParams({
    template_id: process.env.MSG91_OTP_TEMPLATE_ID!,
    mobile: `91${phone}`,
    otp_length: "6",
    otp_expiry: String(OTP_EXPIRY_MINUTES),
  });
  try {
    const r = await call(`${BASE}?${params}`, { method: "POST", body: "{}" }, fetchImpl);
    return r.httpOk && r.type === "success" ? { ok: true } : { ok: false, error: r.message ?? "MSG91 send failed" };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

export async function verifySmsOtp(phone: string, code: string, fetchImpl: typeof fetch = fetch): Promise<VerifyResult> {
  if (!/^\d{6}$/.test(code)) return { ok: false, reason: "wrong", error: "Code must be 6 digits" };
  const params = new URLSearchParams({ otp: code, mobile: `91${phone}` });
  try {
    const r = await call(`${BASE}/verify?${params}`, { method: "GET" }, fetchImpl);
    if (r.type === "success") return { ok: true };
    const message = r.message ?? "MSG91 verify failed";
    if (/expire/i.test(message)) return { ok: false, reason: "expired", error: message };
    if (/not match|invalid otp|incorrect/i.test(message)) return { ok: false, reason: "wrong", error: message };
    return { ok: false, reason: "service", error: message };
  } catch (err) {
    return { ok: false, reason: "service", error: err instanceof Error ? err.message : "Network error" };
  }
}
