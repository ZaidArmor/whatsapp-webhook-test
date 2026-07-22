import { describe, expect, it } from "vitest";
import { ctr, cpc, cpm, roas, engagementRate, comparePeriods } from "@/lib/metrics";

describe("metrics", () => {
  it("computes ctr as percentage", () => {
    expect(ctr(50, 1000)).toBeCloseTo(5);
  });

  it("returns null on division by zero", () => {
    expect(ctr(10, 0)).toBeNull();
    expect(cpc(100, 0)).toBeNull();
    expect(cpm(100, 0)).toBeNull();
    expect(roas(100, 0)).toBeNull();
    expect(engagementRate(10, 0)).toBeNull();
  });

  it("computes cpc / cpm / roas", () => {
    expect(cpc(200, 100)).toBeCloseTo(2);
    expect(cpm(50, 10_000)).toBeCloseTo(5);
    expect(roas(300, 100)).toBeCloseTo(3);
  });
});

describe("comparePeriods", () => {
  it("flags an increase as positive for normal metrics", () => {
    const cmp = comparePeriods(120, 100);
    expect(cmp.direction).toBe("up");
    expect(cmp.isPositive).toBe(true);
    expect(cmp.changePercent).toBeCloseTo(20);
  });

  it("treats a cost increase as negative (inverse metric)", () => {
    const cmp = comparePeriods(130, 100, "cpc");
    expect(cmp.direction).toBe("up");
    expect(cmp.isPositive).toBe(false);
  });

  it("reports flat when nothing changed", () => {
    expect(comparePeriods(100, 100).direction).toBe("flat");
  });

  it("handles a zero baseline without dividing by zero", () => {
    const cmp = comparePeriods(50, 0);
    expect(cmp.changePercent).toBeNull();
  });
});
