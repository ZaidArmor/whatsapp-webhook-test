import { safeDivide } from "@/lib/utils";

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

export function roas(revenue: number, spend: number): number | null {
  return safeDivide(revenue, spend);
}

export function engagementRate(engagements: number, reach: number): number | null {
  const v = safeDivide(engagements, reach);
  return v === null ? null : v * 100;
}

export interface PeriodComparison {
  current: number;
  previous: number;
  changePercent: number | null;
  direction: "up" | "down" | "flat";
  isPositive: boolean | null;
}

/** Metrics where an increase is bad news (cost metrics). */
const INVERSE_METRICS = new Set(["cpc", "cpm", "spend"]);

export function comparePeriods(current: number, previous: number, metricKey?: string): PeriodComparison {
  const changePercent = safeDivide(current - previous, previous);
  const direction: PeriodComparison["direction"] = current === previous ? "flat" : current > previous ? "up" : "down";

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
