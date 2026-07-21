import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Formats a number using Arabic-Indic locale grouping with Western digits (common in Saudi business UIs). */
export function formatNumber(value: number, locale: "ar" | "en" = "ar"): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-SA-u-nu-latn" : "en-US").format(value);
}

export function formatCurrency(value: number, locale: "ar" | "en" = "ar"): string {
  const formatted = new Intl.NumberFormat(locale === "ar" ? "ar-SA-u-nu-latn" : "en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
  return locale === "ar" ? `${formatted} ر.س` : `SAR ${formatted}`;
}

export function formatPercent(value: number, locale: "ar" | "en" = "ar"): string {
  return `${new Intl.NumberFormat(locale === "ar" ? "ar-SA-u-nu-latn" : "en-US", {
    maximumFractionDigits: 1,
  }).format(value)}%`;
}

const RIYADH_TZ = "Asia/Riyadh";

export function formatDate(date: Date | string, locale: "ar" | "en" = "ar"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-nu-latn" : "en-US", {
    timeZone: RIYADH_TZ,
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(d);
}

export function formatDateTime(date: Date | string, locale: "ar" | "en" = "ar"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-nu-latn" : "en-US", {
    timeZone: RIYADH_TZ,
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/** Safe division that never throws and returns null when the result is not meaningful (e.g. divide by zero). */
export function safeDivide(numerator: number, denominator: number): number | null {
  if (!denominator || Number.isNaN(numerator) || Number.isNaN(denominator)) return null;
  return numerator / denominator;
}

/** Renders a metric value, falling back to a dash when data is insufficient — never show misleading zeros. */
export function displayMetric(
  value: number | null | undefined,
  formatter: (v: number) => string = (v) => v.toFixed(2)
): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return formatter(value);
}
