import { Lightbulb } from "lucide-react";
import { getT } from "@/lib/i18n/server";
import { requirePermission } from "@/lib/auth/workspace";
import { prisma } from "@/lib/prisma";
import { EmptyState } from "@/components/shared/empty-state";
import { InsightCard, type InsightCardData } from "@/components/insights/insight-card";
import { RunInsightsButton } from "@/components/insights/run-insights-button";

export default async function InsightsPage() {
  const { t } = await getT();
  const ctx = await requirePermission("run_insights");

  const insights = await prisma.insight.findMany({
    where: { workspaceId: ctx.workspaceId },
    orderBy: [{ status: "asc" }, { severity: "desc" }, { createdAt: "desc" }],
    take: 60,
  });

  const SEVERITY_ORDER = { CRITICAL: 0, WARNING: 1, OPPORTUNITY: 2, INFO: 3 } as const;
  const cards: InsightCardData[] = insights
    .map((insight) => {
      const metric = (insight.metricData ?? {}) as { ruleKey?: string; params?: Record<string, string> };
      return {
        id: insight.id,
        kind: insight.kind,
        severity: insight.severity,
        status: insight.status,
        ruleKey: metric.ruleKey ?? insight.title,
        params: metric.params ?? {},
        campaignId: insight.campaignId,
        createdAt: insight.createdAt.toISOString(),
      };
    })
    .sort((a, b) => {
      const open = (s: string) => (s === "OPEN" || s === "IN_PROGRESS" ? 0 : 1);
      return open(a.status) - open(b.status) || SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t("insights.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("insights.subtitle")}</p>
        </div>
        <RunInsightsButton />
      </div>

      {cards.length === 0 ? (
        <EmptyState icon={<Lightbulb className="h-5 w-5" />} title={t("insights.empty")} />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {cards.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      )}
    </div>
  );
}
