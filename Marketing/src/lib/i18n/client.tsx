"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import { LOCALE_COOKIE, dir, translate, type Locale, type Messages } from "./index";

interface I18nContextValue {
  locale: Locale;
  dir: "rtl" | "ltr";
  t: (key: string, vars?: Record<string, string | number>) => string;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  locale,
  messages,
  children,
}: {
  locale: Locale;
  messages: Messages;
  children: React.ReactNode;
}) {
  const setLocale = useCallback((next: Locale) => {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000`;
    // Full reload so Server Components re-render with the new locale.
    window.location.reload();
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      dir: dir(locale),
      t: (key, vars) => translate(messages, key, vars),
      setLocale,
    }),
    [locale, messages, setLocale]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useT(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useT must be used within I18nProvider");
  return ctx;
}
