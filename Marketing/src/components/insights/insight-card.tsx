"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, Lightbulb, CheckCircle2, XCircle, RotateCcw, Megaphone } from "lucide-react";
import type { InsightKind, InsightSeverity, InsightStatus } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import { setInsightStatusAction } from "@/app/(app)/insights/actions";

export interface InsightCardData {
  id: string;
  kind: InsightKind;
  severity: InsightSeverity;
  status: InsightStatus;
  ruleKey: string;
  params: Record<string, string>;
  campaignId: string | null;
  createdAt: string;
}

const SEVERITY_STYLES: Record<InsightSeverity, { border: string; badge: "muted" | "success" | "warning" | "destructive" }> = {
  INFO: { border: "border-s-sky-500", badge: "muted" },
  OPPORTUNITY: { border: "border-s-success", badge: "success" },
  WARNING: { border: "border-s-warning", badge: "warning" },
  CRITICAL: { border: "border-s-destructive", badge: "destructive" },
};

/** bestTime stores raw weekday/hour — render them via Intl in the viewer's locale. */
function localizeParams(ruleKey: string, params: Record<string, string>, locale: string): Record<string, string> {
  if (ruleKey !== "bestTime") return params;
  const intl = locale === "ar" ? "ar-SA-u-nu-latn-ca-gregory" : "en-US";
  const date = new Date(2024, 8, 1 + Number(params.day ?? 0), Number(params.hour ?? 0), 0, 0);
  return {
    day: new Intl.DateTimeFormat(intl, { weekday: "long" }).format(date),
    hour: new Intl.DateTimeFormat(intl, { hour: "numeric" }).format(date),
  };
}

export function InsightCard({ insight }: { insight: InsightCardData }) {
  const { t, locale } = useT();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const styles = SEVERITY_STYLES[insight.severity];
  const params = localizeParams(insight.ruleKey, insight.params, locale);

  const setStatus = (status: InsightStatus) =>
    startTransition(async () => {
      await setInsightStatusAction({ insightId: insight.id, status });
      router.refresh();
    });

  const resolved = insight.status === "RESOLVED" || insight.status === "DISMISSED";

  return (
    <Card className={cn("border-s-4", styles.border, resolved && "opacity-60")}>
      <CardContent className="space-y-2 p-4">
        <div className="flex flex-wrap items-center gap-2">
          {insight.kind === "ALERT" ? (
            <AlertTriangle className="h-4 w-4 text-warning" />
          ) : (
            <Lightbulb className="h-4 w-4 text-accent" />
          )}
          <span className="text-sm font-semibold">{t(`insights.rules.${insight.ruleKey}.title`, params)}</span>
          <Badge variant={styles.badge}>{t(`insights.severities.${insight.severity}`)}</Badge>
          <Badge variant="outline">{t(`insights.kinds.${insight.kind}`)}</Badge>
          {resolved ? <Badge variant="muted">{t(`insights.statuses.${insight.status}`)}</Badge> : null}
        </div>

        <p className="text-sm leading-6 text-muted-foreground">{t(`insights.rules.${insight.ruleKey}.body`, params)}</p>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {insight.campaignId ? (
            <Button size="sm" variant="outline" asChild>
              <Link href={`/ads/${insight.campaignId}`}>
                <Megaphone className="h-3.5 w-3.5" />
                {t("common.details")}
              </Link>
            </Button>
          ) : null}
          {!resolved ? (
            <>
              <Button size="sm" variant="ghost" className="text-success" disabled={isPending} onClick={() => setStatus("RESOLVED")}>
                <CheckCircle2 className="h-3.5 w-3.5" />
                {t("insights.markResolved")}
              </Button>
              <Button size="sm" variant="ghost" className="text-muted-foreground" disabled={isPending} onClick={() => setStatus("DISMISSED")}>
                <XCircle className="h-3.5 w-3.5" />
                {t("insights.dismiss")}
              </Button>
            </>
          ) : (
            <Button size="sm" variant="ghost" disabled={isPending} onClick={() => setStatus("OPEN")}>
              <RotateCcw className="h-3.5 w-3.5" />
              {t("insights.reopen")}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
