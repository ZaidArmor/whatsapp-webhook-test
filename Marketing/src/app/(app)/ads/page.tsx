import Link from "next/link";
import { Banknote, TrendingUp, Target, Gauge } from "lucide-react";
import type { PlatformKind } from "@prisma/client";
import { getT } from "@/lib/i18n/server";
import { requirePermission } from "@/lib/auth/workspace";
import { getCampaignsList, getPlatformComparison } from "@/lib/data/ads";
import { KpiCard } from "@/components/shared/kpi-card";
import { ChartCard } from "@/components/shared/chart-card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { PlatformIcon } from "@/components/shared/platform-icon";
import { PlatformComparisonChart } from "@/components/ads/ads-charts";
import { NewCampaignDialog } from "@/components/ads/campaign-form";
import { CampaignStatusButton } from "@/components/ads/campaign-status-button";
import { cn, displayMetric, formatCompact, formatCurrency } from "@/lib/utils";

const STATUS_VARIANT: Record<string, "success" | "warning" | "muted" | "secondary"> = {
  ACTIVE: "success",
  PAUSED: "warning",
  COMPLETED: "muted",
  DRAFT: "secondary",
};

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function AdsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { t, locale } = await getT();
  const ctx = await requirePermission("manage_ads");

  const platformFilter = params.platform as PlatformKind | undefined;
  const [campaigns, comparison] = await Promise.all([
    getCampaignsList(ctx.workspaceId, platformFilter),
    getPlatformComparison(ctx.workspaceId),
  ]);

  const totals = campaigns.reduce(
    (acc, c) => ({
      spend: acc.spend + c.spend,
      revenue: acc.revenue + c.revenue,
      conversions: acc.conversions + c.conversions,
    }),
    { spend: 0, revenue: 0, conversions: 0 }
  );
  const overallRoas = totals.spend > 0 ? totals.revenue / totals.spend : null;

  const platforms = [...new Set(comparison.map((row) => row.platform))];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t("ads.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("ads.subtitle")}</p>
        </div>
        <NewCampaignDialog />
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <KpiCard label={t("ads.spend")} value={totals.spend} format="currency" icon={<Banknote className="h-4 w-4" />} />
        <KpiCard label={t("ads.revenue")} value={totals.revenue} format="currency" icon={<TrendingUp className="h-4 w-4" />} />
        <KpiCard label={t("ads.conversions")} value={totals.conversions} format="compact" icon={<Target className="h-4 w-4" />} />
        <KpiCard label={t("ads.roas")} value={overallRoas} format="multiplier" icon={<Gauge className="h-4 w-4" />} />
      </div>

      <ChartCard title={t("ads.platformComparison")}>
        <PlatformComparisonChart data={comparison} />
      </ChartCard>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/ads"
          className={cn(
            "inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
            !platformFilter ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted"
          )}
        >
          {t("common.all")}
        </Link>
        {platforms.map((platform) => (
          <Link
            key={platform}
            href={`/ads?platform=${platform}`}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              platformFilter === platform ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted"
            )}
          >
            <PlatformIcon platform={platform} className="h-3.5 w-3.5" colored={platformFilter !== platform} />
            {t(`platforms.${platform}`)}
          </Link>
        ))}
      </div>

      {campaigns.length === 0 ? (
        <EmptyState title={t("common.noData")} />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-xs text-muted-foreground">
                <th className="px-3 py-2.5 text-start font-medium">{t("ads.campaignName")}</th>
                <th className="px-3 py-2.5 text-start font-medium">{t("common.status")}</th>
                <th className="px-3 py-2.5 text-start font-medium">{t("ads.objective")}</th>
                <th className="px-3 py-2.5 text-start font-medium">{t("ads.budget")}</th>
                <th className="px-3 py-2.5 text-start font-medium">{t("ads.spend")}</th>
                <th className="px-3 py-2.5 text-start font-medium">{t("ads.revenue")}</th>
                <th className="px-3 py-2.5 text-start font-medium">{t("ads.roas")}</th>
                <th className="px-3 py-2.5 text-start font-medium">{t("ads.ctr")}</th>
                <th className="px-3 py-2.5 text-start font-medium">{t("ads.cpc")}</th>
                <th className="px-3 py-2.5 text-start font-medium">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => (
                <tr key={campaign.id} className="border-b transition-colors last:border-b-0 hover:bg-muted/40">
                  <td className="px-3 py-2.5">
                    <Link href={`/ads/${campaign.id}`} className="flex items-center gap-2 font-medium hover:underline">
                      <PlatformIcon platform={campaign.platform} className="h-4 w-4 shrink-0" />
                      <span className="line-clamp-1">{campaign.name}</span>
                    </Link>
                  </td>
                  <td className="px-3 py-2.5">
                    <Badge variant={STATUS_VARIANT[campaign.status] ?? "muted"}>{t(`ads.statuses.${campaign.status}`)}</Badge>
                  </td>
                  <td className="px-3 py-2.5 text-xs">{t(`ads.objectives.${campaign.objective}`)}</td>
                  <td className="px-3 py-2.5 tabular-nums">{formatCurrency(campaign.budget, locale)}</td>
                  <td className="px-3 py-2.5 tabular-nums">{formatCurrency(campaign.spend, locale)}</td>
                  <td className="px-3 py-2.5 tabular-nums">{formatCurrency(campaign.revenue, locale)}</td>
                  <td className="px-3 py-2.5 tabular-nums font-medium">
                    {displayMetric(campaign.roas, (v) => `${v.toFixed(2)}×`)}
                  </td>
                  <td className="px-3 py-2.5 tabular-nums">{displayMetric(campaign.ctr, (v) => `${v.toFixed(2)}%`)}</td>
                  <td className="px-3 py-2.5 tabular-nums">
                    {displayMetric(campaign.cpc, (v) => formatCompact(Number(v.toFixed(2)), locale))}
                  </td>
                  <td className="px-3 py-2.5">
                    <CampaignStatusButton campaignId={campaign.id} status={campaign.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
