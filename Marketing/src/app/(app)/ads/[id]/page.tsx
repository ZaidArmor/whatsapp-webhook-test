import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ArrowLeft, Banknote, TrendingUp, Target, Gauge, MousePointerClick, Users } from "lucide-react";
import { getT } from "@/lib/i18n/server";
import { requirePermission } from "@/lib/auth/workspace";
import { getCampaignDetail } from "@/lib/data/ads";
import { KpiCard } from "@/components/shared/kpi-card";
import { ChartCard } from "@/components/shared/chart-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlatformIcon } from "@/components/shared/platform-icon";
import { CampaignDailyChart } from "@/components/ads/ads-charts";
import { CampaignStatusButton } from "@/components/ads/campaign-status-button";
import { displayMetric, formatCompact, formatCurrency, formatDate } from "@/lib/utils";

const STATUS_VARIANT: Record<string, "success" | "warning" | "muted" | "secondary"> = {
  ACTIVE: "success",
  PAUSED: "warning",
  COMPLETED: "muted",
  DRAFT: "secondary",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CampaignDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { t, locale } = await getT();
  const ctx = await requirePermission("manage_ads");

  const detail = await getCampaignDetail(ctx.workspaceId, id);
  if (!detail) notFound();

  const { campaign, totals, daily, adPerformance } = detail;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <Link href="/ads" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowRight className="h-3.5 w-3.5 rtl:block ltr:hidden" />
            <ArrowLeft className="h-3.5 w-3.5 rtl:hidden ltr:block" />
            {t("common.back")}
          </Link>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <PlatformIcon platform={campaign.platform} className="h-6 w-6" />
            {campaign.name}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge variant={STATUS_VARIANT[campaign.status] ?? "muted"}>{t(`ads.statuses.${campaign.status}`)}</Badge>
            <span>{t(`ads.objectives.${campaign.objective}`)}</span>
            <span>·</span>
            <span className="tabular-nums">
              {t("ads.startDate")}: {formatDate(campaign.startDate, locale)}
            </span>
            {campaign.endDate ? (
              <span className="tabular-nums">
                · {t("ads.endDate")}: {formatDate(campaign.endDate, locale)}
              </span>
            ) : null}
          </div>
        </div>
        <CampaignStatusButton campaignId={campaign.id} status={campaign.status} />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard label={t("ads.budget")} value={Number(campaign.budget)} format="currency" icon={<Banknote className="h-4 w-4" />} />
        <KpiCard label={t("ads.spend")} value={totals.spend} format="currency" icon={<Banknote className="h-4 w-4" />} />
        <KpiCard label={t("ads.revenue")} value={totals.revenue} format="currency" icon={<TrendingUp className="h-4 w-4" />} />
        <KpiCard label={t("ads.roas")} value={totals.roas} format="multiplier" icon={<Gauge className="h-4 w-4" />} />
        <KpiCard label={t("ads.conversions")} value={totals.conversions} format="compact" icon={<Target className="h-4 w-4" />} />
        <KpiCard label={t("ads.clicks")} value={totals.clicks} format="compact" icon={<MousePointerClick className="h-4 w-4" />} />
      </div>

      <ChartCard title={t("ads.dailyPerformance")}>
        <CampaignDailyChart data={daily} />
      </ChartCard>

      <div className="space-y-4">
        {campaign.adSets.map((adSet) => (
          <Card key={adSet.id}>
            <CardHeader className="pb-3">
              <CardTitle className="flex flex-wrap items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-accent" />
                {adSet.name}
                {adSet.audience ? (
                  <span className="text-xs font-normal text-muted-foreground">
                    {t("ads.audience")}: {adSet.audience}
                  </span>
                ) : null}
                <span className="ms-auto text-xs font-normal tabular-nums text-muted-foreground">
                  {t("ads.budget")}: {formatCurrency(Number(adSet.budget), locale)}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="px-3 py-2 text-start font-medium">{t("ads.adsList")}</th>
                    <th className="px-3 py-2 text-start font-medium">{t("ads.impressions")}</th>
                    <th className="px-3 py-2 text-start font-medium">{t("ads.clicks")}</th>
                    <th className="px-3 py-2 text-start font-medium">{t("ads.ctr")}</th>
                    <th className="px-3 py-2 text-start font-medium">{t("ads.cpc")}</th>
                    <th className="px-3 py-2 text-start font-medium">{t("ads.spend")}</th>
                    <th className="px-3 py-2 text-start font-medium">{t("ads.conversions")}</th>
                    <th className="px-3 py-2 text-start font-medium">{t("ads.roas")}</th>
                  </tr>
                </thead>
                <tbody>
                  {adPerformance
                    .filter((ad) => ad.adSetId === adSet.id)
                    .map((ad) => (
                      <tr key={ad.adId} className="border-b last:border-b-0">
                        <td className="px-3 py-2.5">
                          <div className="font-medium">{ad.name}</div>
                          {ad.headline ? <div className="text-xs text-muted-foreground">{ad.headline}</div> : null}
                        </td>
                        <td className="px-3 py-2.5 tabular-nums">{formatCompact(ad.impressions, locale)}</td>
                        <td className="px-3 py-2.5 tabular-nums">{formatCompact(ad.clicks, locale)}</td>
                        <td className="px-3 py-2.5 tabular-nums">{displayMetric(ad.ctr, (v) => `${v.toFixed(2)}%`)}</td>
                        <td className="px-3 py-2.5 tabular-nums">{displayMetric(ad.cpc, (v) => v.toFixed(2))}</td>
                        <td className="px-3 py-2.5 tabular-nums">{formatCurrency(ad.spend, locale)}</td>
                        <td className="px-3 py-2.5 tabular-nums">{formatCompact(ad.conversions, locale)}</td>
                        <td className="px-3 py-2.5 tabular-nums font-medium">{displayMetric(ad.roas, (v) => `${v.toFixed(2)}×`)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
