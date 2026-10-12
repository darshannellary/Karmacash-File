import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { allowGuess, allowSend, MemoryStore, recordWrongGuess, waitText } from "./rate-limit";

const phone = "9847012345";
let store: MemoryStore;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-12T10:00:00.000Z"));
  store = new MemoryStore();
});

afterEach(() => {
  vi.useRealTimers();
});

const minutes = (n: number) => vi.advanceTimersByTime(n * 60_000);

describe("allowSend", () => {
  it("makes the borrower wait 30 seconds between codes", async () => {
    expect((await allowSend(phone, store)).ok).toBe(true);
    const again = await allowSend(phone, store);
    expect(again).toEqual({ ok: false, error: "Please wait 30 seconds before asking for another code." });
    vi.advanceTimersByTime(30_000);
    expect((await allowSend(phone, store)).ok).toBe(true);
  });

  it("allows 3 codes in 10 minutes", async () => {
    for (let i = 0; i < 3; i++) {
      expect((await allowSend(phone, store)).ok).toBe(true);
      minutes(1);
    }
    const fourth = await allowSend(phone, store);
    expect(fourth.ok).toBe(false);
    expect(!fourth.ok && fourth.error).toBe("You have asked for too many codes. Try again in 7 minutes.");
    minutes(7);
    expect((await allowSend(phone, store)).ok).toBe(true);
  });

  it("allows 10 codes a day", async () => {
    for (let i = 0; i < 10; i++) {
      expect((await allowSend(phone, store)).ok).toBe(true);
      minutes(11);
    }
    expect((await allowSend(phone, store)).ok).toBe(false);
    minutes(24 * 60);
    expect((await allowSend(phone, store)).ok).toBe(true);
  });

  it("counts each number separately", async () => {
    await allowSend(phone, store);
    expect((await allowSend("9847099999", store)).ok).toBe(true);
  });
});

describe("wrong guesses", () => {
  it("counts down tries and kills a sign-in code on the 5th wrong guess", async () => {
    const code = "2026-10-12T10:00:00.000Z";
    expect(await recordWrongGuess("signin", phone, code, store)).toBe("That code is not right. 4 tries left.");
    for (let i = 0; i < 3; i++) await recordWrongGuess("signin", phone, code, store);
    expect(await recordWrongGuess("signin", phone, code, store)).toBe(
      "That code is not right, and it can't be used again. Send a new code.",
    );
    const blocked = await allowGuess("signin", phone, code, store);
    expect(!blocked.ok && blocked.error).toBe("Too many wrong tries for this code. Send a new code.");
    // A resent code has a new id, so it can be tried again.
    expect((await allowGuess("signin", phone, "2026-10-12T10:01:00.000Z", store)).ok).toBe(true);
  });

  it("blocks KYC for 10 minutes after 5 wrong guesses", async () => {
    for (let i = 0; i < 5; i++) await recordWrongGuess("kyc", phone, "", store);
    const blocked = await allowGuess("kyc", phone, "", store);
    expect(!blocked.ok && blocked.error).toBe("Too many wrong tries. Try again in 10 minutes.");
    minutes(10);
    expect((await allowGuess("kyc", phone, "", store)).ok).toBe(true);
  });

  it("locks the number for 24 hours after 10 wrong guesses across steps", async () => {
    for (let i = 0; i < 4; i++) await recordWrongGuess("signin", phone, "a", store);
    for (let i = 0; i < 4; i++) await recordWrongGuess("kyc", phone, "", store);
    expect(await recordWrongGuess("esign", phone, "", store)).toBe("That code is not right. 1 try left.");
    expect(await recordWrongGuess("esign", phone, "", store)).toBe(
      "Too many wrong codes for this number. Try again in 24 hours.",
    );
    expect((await allowGuess("esign", phone, "", store)).ok).toBe(false);
    expect((await allowGuess("signin", phone, "new", store)).ok).toBe(false);
    expect((await allowSend(phone, store)).ok).toBe(false);
    minutes(24 * 60);
    expect((await allowGuess("signin", phone, "new", store)).ok).toBe(true);
    expect((await allowSend(phone, store)).ok).toBe(true);
  });
});

describe("waitText", () => {
  it("rounds up to a readable unit", () => {
    expect(waitText(1_500)).toBe("2 seconds");
    expect(waitText(60_000)).toBe("1 minute");
    expect(waitText(3 * 60 * 60_000 - 1)).toBe("3 hours");
  });
});

describe("counterStore", () => {
  it("refuses to run live without a shared store", async () => {
    vi.stubEnv("KARMACASH_MODE", "live");
    vi.resetModules();
    const { counterStore } = await import("./rate-limit");
    expect(() => counterStore()).toThrow(/shared rate-limit store/);
    vi.unstubAllEnvs();
    vi.resetModules();
  });
});
