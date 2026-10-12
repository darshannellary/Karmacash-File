import { describe, expect, it } from "vitest";
import { DATA_SETS, type DataSetId, fetchApplicantData, namesMatch } from "./sandbox";
import { score } from "./scorecard";

const ctx = { sleeveShareThisMonth: 0.02 };
const run = (id: DataSetId) => score(fetchApplicantData(id, 32), ctx);

describe("sandbox data sets", () => {
  it("cover each scorecard path", () => {
    expect(run("trader")).toMatchObject({ decision: "offer", band: "A", limit: 50_000, inSleeve: false });
    expect(run("gig")).toMatchObject({ decision: "offer", inSleeve: false });
    expect(run("newToCredit")).toMatchObject({ decision: "offer", inSleeve: true, limit: 25_000 });
    expect(run("review")).toMatchObject({ decision: "review", band: "D" });
    expect(run("decline").decision).toBe("decline");
  });

  it("has a label for every set", () => {
    for (const set of Object.values(DATA_SETS)) expect(set.label).not.toBe("");
  });
});

describe("namesMatch", () => {
  it("ignores case, spacing and word order", () => {
    expect(namesMatch("Anitha  K. Menon", "MENON ANITHA K")).toBe(true);
    expect(namesMatch("Anitha Menon", "Anil Menon")).toBe(false);
  });
});
