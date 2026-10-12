import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { ApplicationState } from "./application";
import { SANDBOX } from "./config";

const COOKIE = "kc_application";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function secret(): string {
  const value = process.env.SESSION_SECRET;
  if (value) return value;
  if (SANDBOX) return "karmacash-sandbox-only-secret";
  throw new Error("SESSION_SECRET must be set when KARMACASH_MODE is live");
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function encodeState(state: ApplicationState): string {
  const payload = Buffer.from(JSON.stringify(state)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function decodeState(value: string | undefined): ApplicationState {
  if (!value) return {};
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return {};
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return {};
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString()) as ApplicationState;
  } catch {
    return {};
  }
}

export async function readState(): Promise<ApplicationState> {
  return decodeState((await cookies()).get(COOKIE)?.value);
}

/** Only callable from Server Functions, where response headers can still be set. */
export async function writeState(state: ApplicationState): Promise<void> {
  (await cookies()).set(COOKIE, encodeState(state), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearState(): Promise<void> {
  (await cookies()).delete(COOKIE);
}
