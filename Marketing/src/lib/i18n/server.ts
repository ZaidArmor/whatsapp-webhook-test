import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, getMessages, isLocale, translate, type Locale, type Messages } from "./index";

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export interface ServerTranslator {
  locale: Locale;
  messages: Messages;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

/** Server-side translator for Server Components and Server Actions. */
export async function getT(): Promise<ServerTranslator> {
  const locale = await getLocale();
  const messages = getMessages(locale);
  return {
    locale,
    messages,
    t: (key, vars) => translate(messages, key, vars),
  };
}
