// Email through Resend (https://resend.com/docs/api-reference/emails/send-email).
// Set RESEND_API_KEY in Vercel to send real email. Without it, test mode skips sending
// and the email code is the test OTP; live mode refuses to run without it.

const RESEND_URL = "https://api.resend.com/emails";

export type Email = { to: string; subject: string; html: string; text: string };
export type SendResult = { ok: true; id: string } | { ok: false; error: string };

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

/** Sender on a domain verified in Resend; karmacashai.com needs its DNS records added first. */
export function emailFrom(): string {
  return process.env.EMAIL_FROM ?? "Karmacash <noreply@karmacashai.com>";
}

export async function sendEmail(email: Email, fetchImpl: typeof fetch = fetch): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, error: "RESEND_API_KEY is not set" };
  try {
    const res = await fetchImpl(RESEND_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: emailFrom(), to: [email.to], subject: email.subject, html: email.html, text: email.text }),
    });
    const body = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!res.ok || !body.id) return { ok: false, error: body.message ?? `Resend returned ${res.status}` };
    return { ok: true, id: body.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

export function isValidEmail(address: string): boolean {
  return address.length <= 254 && /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(address);
}

/** a****@gmail.com, for showing an address back without spelling it out. */
export function maskEmail(address: string): string {
  const [user, domain] = address.split("@");
  return `${user.slice(0, 1)}${"*".repeat(Math.max(1, Math.min(4, user.length - 1)))}@${domain}`;
}
