"use client";

import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/locale-context";

export function LocaleToggle() {
  const { locale, setLocale } = useLocale();

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="تبديل اللغة"
      onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
      title={locale === "ar" ? "English" : "العربية"}
    >
      <Languages className="h-4.5 w-4.5" />
    </Button>
  );
}
