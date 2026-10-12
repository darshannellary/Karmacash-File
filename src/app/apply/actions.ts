"use server";

import { redirect } from "next/navigation";
import { type ApplicationState, currentStep, rateFor } from "@/lib/application";
import { LOAN_TERMS, SANDBOX } from "@/lib/config";
import { inLaunchRegion, isValidPin, type WorkType } from "@/lib/eligibility";
import { loanCost } from "@/lib/emi";
import type { FormState } from "@/lib/form-state";
import { fetchApplicantData, isDataSetId, namesMatch, pennyDrop, sleeveShareThisMonth, verifyOtp } from "@/lib/sandbox";
import { score } from "@/lib/scorecard";
import { clearState, readState, writeState } from "@/lib/session";
import { ageOn, isIndividualPan, isValidAccountNumber, isValidIfsc, last4, normalisePhone } from "@/lib/validation";

// Each action re-reads the signed state and checks the borrower is on the step it
// handles, so a replayed or out-of-order POST cannot skip a check.

const now = () => new Date().toISOString();
const text = (data: FormData, key: string) => String(data.get(key) ?? "").trim();

async function stateAt(step: ReturnType<typeof currentStep>): Promise<ApplicationState | null> {
  const s = await readState();
  return currentStep(s) === step ? s : null;
}

const OUT_OF_STEP: FormState = { error: "This step has changed. Please reload the page." };

export async function sendOtp(_: FormState, data: FormData): Promise<FormState> {
  const phone = normalisePhone(text(data, "phone"));
  if (!phone) return { error: "Enter a 10-digit Indian mobile number." };
  await writeState({ phone, otpSentAt: now() });
  return undefined;
}

export async function confirmOtp(_: FormState, data: FormData): Promise<FormState> {
  const s = await stateAt("otp");
  if (!s) return OUT_OF_STEP;
  if (!verifyOtp(text(data, "otp"))) return { error: "That code is not right. Check the SMS and try again." };
  await writeState({ ...s, signedInAt: now() });
  return undefined;
}

export async function saveDetails(_: FormState, data: FormData): Promise<FormState> {
  const s = await stateAt("details");
  if (!s) return OUT_OF_STEP;
  const fullName = text(data, "fullName").replace(/\s+/g, " ");
  const dob = text(data, "dob");
  const pan = text(data, "pan").toUpperCase();
  const pinCode = text(data, "pinCode");
  const workType = text(data, "workType") as WorkType;

  if (fullName.length < 3) return { error: "Enter your full name as it appears on your PAN card." };
  const age = ageOn(dob, new Date());
  if (age === null) return { error: "Enter a valid date of birth." };
  if (!isIndividualPan(pan)) return { error: "Enter a valid personal PAN, for example ABCPE1234F." };
  if (!isValidPin(pinCode)) return { error: "Enter a valid 6-digit PIN code." };
  if (!["trader", "gig", "other"].includes(workType)) return { error: "Choose the kind of work you do." };

  await writeState({
    ...s,
    details: { fullName, dob, age, panMasked: `XXXXXX${last4(pan)}`, pinCode, workType },
    waitlisted: !inLaunchRegion(pinCode),
  });
  return undefined;
}

export async function verifyKyc(_: FormState, data: FormData): Promise<FormState> {
  const s = await stateAt("kyc");
  if (!s) return OUT_OF_STEP;
  const aadhaarLast4 = text(data, "aadhaarLast4");
  if (!/^\d{4}$/.test(aadhaarLast4)) return { error: "Enter the last 4 digits of your Aadhaar." };
  if (!verifyOtp(text(data, "otp"))) return { error: "That Aadhaar OTP is not right." };
  await writeState({ ...s, kyc: { aadhaarLast4, verifiedAt: now() } });
  return undefined;
}

export async function giveConsentAndDecide(_: FormState, data: FormData): Promise<FormState> {
  const s = await stateAt("consent");
  if (!s?.details) return OUT_OF_STEP;
  if (data.get("bureau") !== "on" || data.get("aa") !== "on") {
    return { error: "We need both consents to assess your application." };
  }
  const dataSet = text(data, "dataSet");
  if (!isDataSetId(dataSet)) return { error: "Choose a test data set." };

  const result = score(fetchApplicantData(dataSet, s.details.age), { sleeveShareThisMonth: sleeveShareThisMonth() });
  const at = now();
  await writeState({
    ...s,
    consent: { bureauAt: at, aaAt: at, wordingVersion: "consent-v1-2026-10" },
    decision: {
      decision: result.decision,
      band: result.band,
      limit: result.limit,
      inSleeve: result.inSleeve,
      reasons: result.reasons,
      avgMonthlyInflow: result.avgMonthlyInflow,
      policyVersion: result.policyVersion,
      dataSet,
      decidedAt: at,
    },
  });
  return undefined;
}

/** Sandbox only: stands in for the NBFC reviewer approving a referred application. */
export async function simulateReviewerApproval(): Promise<void> {
  const s = await stateAt("outcome");
  if (!SANDBOX || !s?.decision || s.decision.decision !== "review") return;
  await writeState({ ...s, decision: { ...s.decision, decision: "offer" } });
}

export async function acceptOffer(_: FormState, data: FormData): Promise<FormState> {
  const s = await stateAt("offer");
  if (!s?.decision) return OUT_OF_STEP;
  const amount = Number(text(data, "amount"));
  const months = Number(text(data, "months"));
  if (!Number.isInteger(amount) || amount < LOAN_TERMS.minAmount || amount > s.decision.limit || amount % 1000 !== 0) {
    return { error: "Choose an amount within your limit." };
  }
  if (!(LOAN_TERMS.tenuresMonths as readonly number[]).includes(months)) return { error: "Choose 6, 9 or 12 months." };
  if (data.get("kfs") !== "on") return { error: "Please confirm you have read the Key Fact Statement." };
  const ratePct = rateFor(s.decision.band, s.decision.inSleeve);
  await writeState({ ...s, offer: { amount, months, ratePct, acceptedAt: now() } });
  return undefined;
}

export async function verifyBankAccount(_: FormState, data: FormData): Promise<FormState> {
  const s = await stateAt("bank");
  if (!s?.details) return OUT_OF_STEP;
  const account = text(data, "account").replace(/\s/g, "");
  const confirm = text(data, "confirmAccount").replace(/\s/g, "");
  const ifsc = text(data, "ifsc").toUpperCase();
  if (!isValidAccountNumber(account)) return { error: "Enter a valid account number (9 to 18 digits)." };
  if (account !== confirm) return { error: "The two account numbers do not match." };
  if (!isValidIfsc(ifsc)) return { error: "Enter a valid IFSC, for example SBIN0070123." };
  const { holderName } = pennyDrop(s.details.fullName);
  if (!namesMatch(holderName, s.details.fullName)) {
    return { error: "The name on this account does not match your KYC. Use an account in your own name." };
  }
  await writeState({ ...s, account: { last4: last4(account), ifsc, holderName, verifiedAt: now() } });
  return undefined;
}

export async function registerMandate(_: FormState, data: FormData): Promise<FormState> {
  const s = await stateAt("mandate");
  if (!s?.offer) return OUT_OF_STEP;
  const method = text(data, "method");
  if (method !== "enach" && method !== "upi") return { error: "Choose e-NACH or UPI AutoPay." };
  const { emi } = loanCost(s.offer.amount, s.offer.ratePct, s.offer.months);
  await writeState({ ...s, mandate: { method, maxAmount: emi, registeredAt: now() } });
  return undefined;
}

export async function signAgreement(_: FormState, data: FormData): Promise<FormState> {
  const s = await stateAt("sign");
  if (!s) return OUT_OF_STEP;
  if (data.get("agree") !== "on") return { error: "Please confirm you agree to the loan agreement." };
  if (!verifyOtp(text(data, "otp"))) return { error: "That eSign OTP is not right." };
  const id = `KC${Date.now().toString(36).toUpperCase()}`;
  await writeState({ ...s, loan: { id, signedAt: now() } });
  redirect("/account");
}

/** Cooling-off exit: in the sandbox this just closes the test loan. */
export async function exitDuringCoolingOff(): Promise<void> {
  const s = await readState();
  if (!s.loan) return;
  await writeState({ phone: s.phone, otpSentAt: s.otpSentAt, signedInAt: s.signedInAt });
  redirect("/apply");
}

export async function withdrawAaConsent(): Promise<void> {
  const s = await readState();
  if (!s.consent || s.consent.aaRevokedAt) return;
  await writeState({ ...s, consent: { ...s.consent, aaRevokedAt: now() } });
}

export async function startOver(): Promise<void> {
  const s = await readState();
  await writeState({ phone: s.phone, otpSentAt: s.otpSentAt, signedInAt: s.signedInAt });
}

export async function signOut(): Promise<void> {
  await clearState();
  redirect("/");
}

export async function changeNumber(): Promise<void> {
  await clearState();
}
