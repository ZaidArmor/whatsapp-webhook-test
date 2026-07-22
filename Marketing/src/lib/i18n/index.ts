import ar from "@/messages/ar.json";
import en from "@/messages/en.json";

export const locales = ["ar", "en"] as const;
export type Locale = (typeof locales)[number];

export const LOCALE_COOKIE = "mktg_locale";
export const DEFAULT_LOCALE: Locale = "ar";

export type Messages = typeof ar;

const dictionaries: Record<Locale, Messages> = { ar, en: en as Messages };

export function isLocale(value: string | undefined): value is Locale {
  return locales.includes(value as Locale);
}

export function getMessages(locale: Locale): Messages {
  return dictionaries[locale];
}

export function dir(locale: Locale): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr";
}

/**
 * Resolves a dot-path key (e.g. "nav.dashboard") against a messages object.
 * Falls back to the key itself so a missing translation is visible, not a crash.
 */
export function translate(messages: Messages, key: string, vars?: Record<string, string | number>): string {
  const parts = key.split(".");
  let node: unknown = messages;
  for (const part of parts) {
    if (node && typeof node === "object" && part in (node as Record<string, unknown>)) {
      node = (node as Record<string, unknown>)[part];
    } else {
      return key;
    }
  }
  if (typeof node !== "string") return key;
  if (!vars) return node;
  return node.replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? `{${name}}`));
}
