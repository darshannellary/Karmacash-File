import { OTP_LIMITS, SANDBOX } from "./config";

// Server-side counters for OTP limits. Each counter is a fixed window that expires a set
// time after its first hit. The in-memory store only works on a single server process, so
// live mode needs a shared store (Redis or Postgres) before it can run.

export type Counter = { count: number; expiresAt: number };

export interface CounterStore {
  /** Adds one to the counter, starting a new window of ttlMs if there is none. */
  hit(key: string, ttlMs: number): Promise<Counter>;
  peek(key: string): Promise<Counter | null>;
  set(key: string, count: number, ttlMs: number): Promise<void>;
}

export class MemoryStore implements CounterStore {
  private counters = new Map<string, Counter>();

  async hit(key: string, ttlMs: number): Promise<Counter> {
    const current = await this.peek(key);
    const next = current ? { ...current, count: current.count + 1 } : { count: 1, expiresAt: Date.now() + ttlMs };
    this.counters.set(key, next);
    return next;
  }

  async peek(key: string): Promise<Counter | null> {
    const counter = this.counters.get(key);
    if (!counter) return null;
    if (counter.expiresAt <= Date.now()) {
      this.counters.delete(key);
      return null;
    }
    return counter;
  }

  async set(key: string, count: number, ttlMs: number): Promise<void> {
    this.counters.set(key, { count, expiresAt: Date.now() + ttlMs });
  }
}

const globalForStore = globalThis as unknown as { karmacashCounters?: MemoryStore };

export function counterStore(): CounterStore {
  if (!SANDBOX) throw new Error("A shared rate-limit store must be configured when KARMACASH_MODE is live");
  // Kept on globalThis so dev hot reloads do not reset the counts.
  globalForStore.karmacashCounters ??= new MemoryStore();
  return globalForStore.karmacashCounters;
}

export type OtpScope = "signin" | "email" | "kyc" | "esign";

// Sign-in and email codes are ours and can be re-sent; KYC and eSign codes come from providers.
const resendable = (scope: OtpScope) => scope === "signin" || scope === "email";
export type Verdict = { ok: true } | { ok: false; error: string };

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** "30 seconds", "4 minutes" or "23 hours", rounded up. */
export function waitText(ms: number): string {
  const [unit, size] = ms < MINUTE ? ["second", SECOND] : ms < HOUR ? ["minute", MINUTE] : ["hour", HOUR];
  const n = Math.max(1, Math.ceil(ms / size));
  return `${n} ${unit}${n === 1 ? "" : "s"}`;
}

const keys = {
  cooldown: (phone: string) => `otp:send:cooldown:${phone}`,
  sends10m: (phone: string) => `otp:send:10m:${phone}`,
  sendsDay: (phone: string) => `otp:send:day:${phone}`,
  // Sign-in codes are identified by when they were sent; KYC and eSign codes come from
  // the provider, so their count runs over a fixed window instead.
  wrongCode: (scope: OtpScope, phone: string, codeId: string) => `otp:wrong:${scope}:${phone}:${codeId}`,
  wrongDay: (phone: string) => `otp:wrong:day:${phone}`,
  lock: (phone: string) => `otp:lock:${phone}`,
};

async function locked(phone: string, store: CounterStore): Promise<Verdict> {
  const lock = await store.peek(keys.lock(phone));
  if (!lock) return { ok: true };
  return { ok: false, error: `Too many wrong codes for this number. Try again in ${waitText(lock.expiresAt - Date.now())}.` };
}

/** Checks the send limits for a number and, if allowed, records the send. */
export async function allowSend(phone: string, store: CounterStore = counterStore()): Promise<Verdict> {
  const lock = await locked(phone, store);
  if (!lock.ok) return lock;
  const cooldown = await store.peek(keys.cooldown(phone));
  if (cooldown) return { ok: false, error: `Please wait ${waitText(cooldown.expiresAt - Date.now())} before asking for another code.` };
  for (const [key, max] of [
    [keys.sends10m(phone), OTP_LIMITS.sendsPer10Minutes],
    [keys.sendsDay(phone), OTP_LIMITS.sendsPerDay],
  ] as const) {
    const sent = await store.peek(key);
    if (sent && sent.count >= max) {
      return { ok: false, error: `You have asked for too many codes. Try again in ${waitText(sent.expiresAt - Date.now())}.` };
    }
  }
  await store.set(keys.cooldown(phone), 1, OTP_LIMITS.resendCooldownSeconds * SECOND);
  await store.hit(keys.sends10m(phone), 10 * MINUTE);
  await store.hit(keys.sendsDay(phone), DAY);
  return { ok: true };
}

/** Whether another guess at this code is allowed. Call before checking the code. */
export async function allowGuess(
  scope: OtpScope,
  phone: string,
  codeId = "",
  store: CounterStore = counterStore(),
): Promise<Verdict> {
  const lock = await locked(phone, store);
  if (!lock.ok) return lock;
  const wrong = await store.peek(keys.wrongCode(scope, phone, codeId));
  if (wrong && wrong.count >= OTP_LIMITS.wrongGuessesPerCode) {
    return {
      ok: false,
      error:
        resendable(scope)
          ? "Too many wrong tries for this code. Send a new code."
          : `Too many wrong tries. Try again in ${waitText(wrong.expiresAt - Date.now())}.`,
    };
  }
  return { ok: true };
}

/** Records a wrong guess and returns the message to show, including tries left. */
export async function recordWrongGuess(
  scope: OtpScope,
  phone: string,
  codeId = "",
  store: CounterStore = counterStore(),
): Promise<string> {
  const code = await store.hit(keys.wrongCode(scope, phone, codeId), OTP_LIMITS.codeWindowMinutes * MINUTE);
  const day = await store.hit(keys.wrongDay(phone), DAY);
  if (day.count >= OTP_LIMITS.wrongGuessesPerDay) {
    await store.set(keys.lock(phone), 1, OTP_LIMITS.lockHours * HOUR);
    return `Too many wrong codes for this number. Try again in ${waitText(OTP_LIMITS.lockHours * HOUR)}.`;
  }
  const left = Math.min(OTP_LIMITS.wrongGuessesPerCode - code.count, OTP_LIMITS.wrongGuessesPerDay - day.count);
  if (left <= 0) {
    return resendable(scope)
      ? "That code is not right, and it can't be used again. Send a new code."
      : `That code is not right. Try again in ${waitText(code.expiresAt - Date.now())}.`;
  }
  return `That code is not right. ${left} ${left === 1 ? "try" : "tries"} left.`;
}
