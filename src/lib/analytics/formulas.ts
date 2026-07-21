import { safeDivide } from "@/lib/utils";

/**
 * Marketing KPI formulas. All divisions are safe (return null instead of Infinity/NaN)
 * so the UI can render "N/A" instead of a misleading number when data is insufficient.
 */

export function ctr(clicks: number, impressions: number): number | null {
  const v = safeDivide(clicks, impressions);
  return v === null ? null : v * 100;
}

export function cpc(spend: number, clicks: number): number | null {
  return safeDivide(spend, clicks);
}

export function cpm(spend: number, impressions: number): number | null {
  const v = safeDivide(spend, impressions);
  return v === null ? null : v * 1000;
}

export function cpl(spend: number, leads: number): number | null {
  return safeDivide(spend, leads);
}

export function cac(spend: number, customersAcquired: number): number | null {
  return safeDivide(spend, customersAcquired);
}

export function roas(revenue: number, spend: number): number | null {
  return safeDivide(revenue, spend);
}

export function conversionRate(sales: number, leads: number): number | null {
  const v = safeDivide(sales, leads);
  return v === null ? null : v * 100;
}

export function bookingRate(bookings: number, leads: number): number | null {
  const v = safeDivide(bookings, leads);
  return v === null ? null : v * 100;
}

export function leadToSaleRate(sales: number, leads: number): number | null {
  return conversionRate(sales, leads);
}

export function averageOrderValue(revenue: number, numberOfSales: number): number | null {
  return safeDivide(revenue, numberOfSales);
}

export function frequency(impressions: number, reach: number): number | null {
  return safeDivide(impressions, reach);
}

export interface PeriodComparison {
  current: number;
  previous: number;
  changePercent: number | null;
  direction: "up" | "down" | "flat";
  /** Whether an "up" direction is good news for this particular metric (e.g. false for CPL/CAC). */
  isPositive: boolean | null;
}

/** Metrics where an increase is bad news (cost/inefficiency metrics). Everything else defaults to "up is good". */
const INVERSE_METRICS = new Set(["cpl", "cac", "cpc", "cpm", "spend", "frequency"]);

export function comparePeriods(
  current: number,
  previous: number,
  metricKey?: string
): PeriodComparison {
  const changePercent = safeDivide(current - previous, previous);
  const direction: PeriodComparison["direction"] =
    current === previous ? "flat" : current > previous ? "up" : "down";

  let isPositive: boolean | null = null;
  if (direction !== "flat") {
    const increaseIsGood = !metricKey || !INVERSE_METRICS.has(metricKey);
    isPositive = direction === "up" ? increaseIsGood : !increaseIsGood;
  }

  return {
    current,
    previous,
    changePercent: changePercent === null ? null : changePercent * 100,
    direction,
    isPositive,
  };
}
