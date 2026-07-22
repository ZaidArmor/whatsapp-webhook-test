import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Locale } from "@/lib/i18n";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

function intlLocale(locale: Locale): string {
  // Gregorian calendar + western digits explicitly (ar-SA defaults to Hijri otherwise).
  return locale === "ar" ? "ar-SA-u-nu-latn-ca-gregory" : "en-US";
}

export function formatNumber(value: number, locale: Locale = "ar"): string {
  return new Intl.NumberFormat(intlLocale(locale)).format(value);
}

export function formatCompact(value: number, locale: Locale = "ar"): string {
  return new Intl.NumberFormat(intlLocale(locale), { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export function formatCurrency(value: number, locale: Locale = "ar"): string {
  const formatted = new Intl.NumberFormat(intlLocale(locale), { maximumFractionDigits: 0 }).format(value);
  return locale === "ar" ? `${formatted} ر.س` : `SAR ${formatted}`;
}

export function formatPercent(value: number, locale: Locale = "ar"): string {
  return `${new Intl.NumberFormat(intlLocale(locale), { maximumFractionDigits: 1 }).format(value)}%`;
}

const RIYADH_TZ = "Asia/Riyadh";

export function formatDate(date: Date | string, locale: Locale = "ar"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(intlLocale(locale), {
    timeZone: RIYADH_TZ,
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(d);
}

export function formatDateTime(date: Date | string, locale: Locale = "ar"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(intlLocale(locale), {
    timeZone: RIYADH_TZ,
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function formatTime(date: Date | string, locale: Locale = "ar"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(intlLocale(locale), {
    timeZone: RIYADH_TZ,
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function safeDivide(numerator: number, denominator: number): number | null {
  if (!denominator || Number.isNaN(numerator) || Number.isNaN(denominator)) return null;
  return numerator / denominator;
}

export function displayMetric(value: number | null | undefined, formatter: (v: number) => string): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return formatter(value);
}
