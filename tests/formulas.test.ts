import { describe, expect, it } from "vitest";
import {
  ctr,
  cpc,
  cpm,
  cpl,
  cac,
  roas,
  conversionRate,
  bookingRate,
  leadToSaleRate,
  averageOrderValue,
  frequency,
  comparePeriods,
} from "@/lib/analytics/formulas";

describe("marketing formulas", () => {
  it("computes CTR as clicks/impressions * 100", () => {
    expect(ctr(50, 1000)).toBeCloseTo(5);
  });

  it("computes CPC as spend/clicks", () => {
    expect(cpc(500, 100)).toBeCloseTo(5);
  });

  it("computes CPM as spend/impressions * 1000", () => {
    expect(cpm(200, 10000)).toBeCloseTo(20);
  });

  it("computes CPL as spend/leads", () => {
    expect(cpl(800, 10)).toBeCloseTo(80);
  });

  it("computes CAC as spend/customers acquired", () => {
    expect(cac(4000, 10)).toBeCloseTo(400);
  });

  it("computes ROAS as revenue/spend", () => {
    expect(roas(9000, 3000)).toBeCloseTo(3);
  });

  it("computes conversion rate as sales/leads * 100", () => {
    expect(conversionRate(15, 100)).toBeCloseTo(15);
  });

  it("computes booking rate as bookings/leads * 100", () => {
    expect(bookingRate(30, 100)).toBeCloseTo(30);
  });

  it("computes lead-to-sale rate identically to conversion rate", () => {
    expect(leadToSaleRate(15, 100)).toBe(conversionRate(15, 100));
  });

  it("computes average order value as revenue/number of sales", () => {
    expect(averageOrderValue(45000, 15)).toBeCloseTo(3000);
  });

  it("computes frequency as impressions/reach", () => {
    expect(frequency(500000, 100000)).toBeCloseTo(5);
  });

  describe("safe division by zero", () => {
    it("returns null instead of Infinity/NaN for every formula when the denominator is zero", () => {
      expect(ctr(10, 0)).toBeNull();
      expect(cpc(10, 0)).toBeNull();
      expect(cpm(10, 0)).toBeNull();
      expect(cpl(10, 0)).toBeNull();
      expect(cac(10, 0)).toBeNull();
      expect(roas(10, 0)).toBeNull();
      expect(conversionRate(10, 0)).toBeNull();
      expect(bookingRate(10, 0)).toBeNull();
      expect(averageOrderValue(10, 0)).toBeNull();
      expect(frequency(10, 0)).toBeNull();
    });
  });

  describe("comparePeriods", () => {
    it("treats an increase in revenue as positive (revenue is not an inverse metric)", () => {
      const result = comparePeriods(1200, 1000, "revenue");
      expect(result.direction).toBe("up");
      expect(result.isPositive).toBe(true);
      expect(result.changePercent).toBeCloseTo(20);
    });

    it("treats an increase in CPL as negative (CPL is an inverse metric)", () => {
      const result = comparePeriods(120, 100, "cpl");
      expect(result.direction).toBe("up");
      expect(result.isPositive).toBe(false);
    });

    it("treats a decrease in CPL as positive", () => {
      const result = comparePeriods(80, 100, "cpl");
      expect(result.direction).toBe("down");
      expect(result.isPositive).toBe(true);
    });

    it("treats an increase in ROAS as positive", () => {
      const result = comparePeriods(6, 3, "roas");
      expect(result.isPositive).toBe(true);
    });

    it("reports a flat direction with no changePercent when current equals previous", () => {
      const result = comparePeriods(100, 100, "spend");
      expect(result.direction).toBe("flat");
      expect(result.isPositive).toBeNull();
    });

    it("returns a null changePercent when the previous value was zero", () => {
      const result = comparePeriods(100, 0, "leads");
      expect(result.changePercent).toBeNull();
    });
  });
});
