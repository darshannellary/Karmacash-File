import type { ApplicationState } from "./application";
import { SITE } from "./config";
import type { Email } from "./email";
import { formatInr, loanCost } from "./emi";
import { REASON_TEXT } from "./scorecard";

// Plain, mobile-friendly emails: one column, inline styles, and a text version for every one.

const escape = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function layout(heading: string, paragraphs: string[], rows: [string, string][] = []): string {
  const table = rows.length
    ? `<table style="width:100%;border-collapse:collapse;margin:16px 0">${rows
        .map(
          ([k, v]) =>
            `<tr><td style="padding:8px 0;border-bottom:1px solid #ece4dd;color:#5b5b5b">${escape(k)}</td><td style="padding:8px 0;border-bottom:1px solid #ece4dd;text-align:right;font-weight:600">${escape(v)}</td></tr>`,
        )
        .join("")}</table>`
    : "";
  return `<!doctype html><html><body style="margin:0;background:#fff4ec;font-family:Arial,sans-serif;color:#1f1f1f">
<div style="max-width:520px;margin:0 auto;padding:24px">
<div style="background:#f5711f;color:#fff;font-weight:700;font-size:20px;padding:16px 20px;border-radius:12px 12px 0 0">Karmacash</div>
<div style="background:#fff;padding:24px 20px;border-radius:0 0 12px 12px">
<h1 style="font-size:22px;margin:0 0 12px">${escape(heading)}</h1>
${paragraphs.map((p) => `<p style="font-size:16px;line-height:1.5;margin:0 0 12px">${escape(p)}</p>`).join("")}
${table}
<p style="font-size:13px;color:#5b5b5b;margin-top:24px">Loans are made by ${escape(SITE.lendingPartner)}. Karmacash is its lending service provider and never asks for your OTP, PIN or password. Questions: ${escape(SITE.support.email)}</p>
</div></div></body></html>`;
}

function text(heading: string, paragraphs: string[], rows: [string, string][] = []): string {
  return [heading, "", ...paragraphs, "", ...rows.map(([k, v]) => `${k}: ${v}`), "", `Questions: ${SITE.support.email}`].join("\n");
}

function build(to: string, subject: string, heading: string, paragraphs: string[], rows?: [string, string][]): Email {
  return { to, subject, html: layout(heading, paragraphs, rows), text: text(heading, paragraphs, rows) };
}

export function verificationEmail(to: string, code: string): Email {
  return build(to, `${code} is your Karmacash email code`, "Confirm your email", [
    `Your code is ${code}. It expires in 10 minutes.`,
    "If you didn't start a Karmacash application, you can ignore this email.",
  ]);
}

export function decisionEmail(to: string, s: ApplicationState): Email | null {
  const d = s.decision;
  const name = s.details?.fullName.split(" ")[0] ?? "there";
  if (!d) return null;
  if (d.decision === "offer") {
    return build(to, "Your Karmacash loan offer", `Good news, ${name}`, [
      `You can borrow up to ${formatInr(d.limit)}. Open the Karmacash website to choose your amount and see the Key Fact Statement before you sign.`,
    ]);
  }
  if (d.decision === "review") {
    return build(to, "Your Karmacash application is being reviewed", `Thanks, ${name}`, [
      "Our lending partner is reviewing your application. We'll email you with the decision, usually within one working day.",
    ]);
  }
  if (d.decision === "waitlist") {
    return build(to, "Your Karmacash application", `Thanks, ${name}`, [REASON_TEXT.SLEEVE_FULL, "We'll email you when we can take your application."]);
  }
  return build(to, "Your Karmacash application", `Sorry, ${name}`, [
    "We can't offer you a loan right now. The main reasons are:",
    ...d.reasons.slice(0, 3).map((r) => `• ${REASON_TEXT[r]}`),
  ]);
}

export function loanSignedEmail(to: string, s: ApplicationState): Email | null {
  if (!s.offer || !s.loan) return null;
  const c = loanCost(s.offer.amount, s.offer.ratePct, s.offer.months);
  return build(
    to,
    `Your Karmacash loan ${s.loan.id} is signed`,
    "Your loan is signed",
    [
      `Here is a summary of loan ${s.loan.id}. Your signed agreement and Key Fact Statement are in your account on the Karmacash website.`,
      "You can exit within 3 days without penalty by repaying the principal and the interest for the days you had it.",
    ],
    [
      ["Loan amount", formatInr(c.principal)],
      ["Paid into your account", formatInr(c.netDisbursal)],
      ["Monthly EMI", `${formatInr(c.emi)} × ${c.months}`],
      ["Interest rate", `${c.annualRatePct}% a year`],
      ["APR", `${c.aprPct.toFixed(2)}%`],
      ["Total you repay", formatInr(c.totalRepayable)],
    ],
  );
}
