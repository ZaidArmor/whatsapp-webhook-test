"use client";

import { Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/lib/i18n/client";
import type { BestTimeSlot } from "@/lib/data/posts";

/** Formats a weekday index + hour via Intl so no day/time names live in code. */
function slotLabel(weekday: number, hour: number, locale: string): string {
  // 2024-09-01 was a Sunday; offset from it to hit the wanted weekday.
  const date = new Date(2024, 8, 1 + weekday, hour, 0, 0);
  const day = new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-nu-latn-ca-gregory" : "en-US", { weekday: "long" }).format(date);
  const time = new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-nu-latn-ca-gregory" : "en-US", { hour: "numeric", minute: "2-digit" }).format(date);
  return `${day} · ${time}`;
}

export function BestTimesPanel({ slots }: { slots: BestTimeSlot[] }) {
  const { t, locale } = useT();

  if (slots.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Sparkles className="h-4 w-4 text-accent" />
          {t("posts.bestTimes")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {slots.map((slot, i) => (
          <div key={`${slot.weekday}-${slot.hour}`} className="flex items-center justify-between text-sm">
            <span>{slotLabel(slot.weekday, slot.hour, locale)}</span>
            <Badge variant={i === 0 ? "success" : "muted"} className="text-[10px]">
              #{i + 1}
            </Badge>
          </div>
        ))}
        <p className="pt-1 text-xs text-muted-foreground">{t("posts.bestTimeHint")}</p>
      </CardContent>
    </Card>
  );
}
