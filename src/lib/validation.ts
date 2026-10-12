// Format checks for what borrowers type in. These only check shape; the KYC, penny-drop
// and bureau services do the real verification.

export function normalisePhone(input: string): string | null {
  const digits = input.replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, "");
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}

/** Individual PANs have P as the fourth character, e.g. ABCPE1234F. */
export function isIndividualPan(pan: string): boolean {
  return /^[A-Z]{3}P[A-Z]\d{4}[A-Z]$/.test(pan);
}

export function isValidIfsc(ifsc: string): boolean {
  return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc);
}

export function isValidAccountNumber(account: string): boolean {
  return /^\d{9,18}$/.test(account);
}

/** Whole years between an ISO date of birth and a reference date, or null if invalid. */
export function ageOn(dob: string, on: Date): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob);
  if (!m) return null;
  const [year, month, day] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const birth = new Date(Date.UTC(year, month - 1, day));
  if (birth.getUTCMonth() !== month - 1 || birth > on) return null;
  let age = on.getUTCFullYear() - year;
  const beforeBirthday =
    on.getUTCMonth() < month - 1 || (on.getUTCMonth() === month - 1 && on.getUTCDate() < day);
  if (beforeBirthday) age--;
  return age;
}

export function last4(value: string): string {
  return value.slice(-4);
}
