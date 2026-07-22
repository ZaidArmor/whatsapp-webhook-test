import {
  Users,
  Eye,
  MousePointerClick,
  Heart,
  Percent,
  Banknote,
  TrendingUp,
  Target,
  Gauge,
  Coins,
  FileCheck,
  Inbox,
} from "lucide-react";
import type { PlatformKind } from "@prisma/client";
import { getT } from "@/lib/i18n/server";
import { getWorkspaceContext } from "@/lib/auth/workspace";
import { getDashboardData } from "@/lib/data/dashboard";
import { KpiCard } from "@/components/shared/kpi-card";
import { ChartCard } from "@/components/shared/chart-card";
import { DashboardFilters } from "@/components/dashboard/dashboard-filters";
import {
  FollowersGrowthChart,
  ReachTrendChart,
  EngagementByPlatformChart,
  SpendVsRevenueChart,
  RoasByPlatformChart,
  TopPostsList,
} from "@/components/dashboard/charts";

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { t } = await getT();
  const ctx = await getWorkspaceContext();

  const days = [7, 30, 90].includes(Number(params.days)) ? Number(params.days) : 30;
  const data = await getDashboardData(ctx.workspaceId, {
    days,
    platform: params.platform as PlatformKind | undefined,
    accountId: params.accountId,
    campaignId: params.campaignId,
  });

  const { kpis, comparisons, charts } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("dashboard.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("dashboard.subtitle")}</p>
      </div>

      <DashboardFilters options={data.options} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        <KpiCard label={t("dashboard.kpis.followers")} value={kpis.followers} format="compact" icon={<Users className="h-4 w-4" />} comparison={comparisons.followers} />
        <KpiCard label={t("dashboard.kpis.reach")} value={kpis.reach} format="compact" icon={<Eye className="h-4 w-4" />} comparison={comparisons.reach} />
        <KpiCard label={t("dashboard.kpis.engagements")} value={kpis.engagements} format="compact" icon={<Heart className="h-4 w-4" />} comparison={comparisons.engagements} />
        <KpiCard label={t("dashboard.kpis.engagementRate")} value={kpis.engagementRate} format="percent" icon={<Percent className="h-4 w-4" />} />
        <KpiCard label={t("dashboard.kpis.clicks")} value={kpis.clicks} format="compact" icon={<MousePointerClick className="h-4 w-4" />} />
        <KpiCard label={t("dashboard.kpis.adSpend")} value={kpis.adSpend} format="currency" icon={<Banknote className="h-4 w-4" />} comparison={comparisons.adSpend} />
        <KpiCard label={t("dashboard.kpis.revenue")} value={kpis.revenue} format="currency" icon={<TrendingUp className="h-4 w-4" />} comparison={comparisons.revenue} />
        <KpiCard label={t("dashboard.kpis.conversions")} value={kpis.conversions} format="compact" icon={<Target className="h-4 w-4" />} />
        <KpiCard label={t("dashboard.kpis.roas")} value={kpis.roas} format="multiplier" icon={<Gauge className="h-4 w-4" />} comparison={comparisons.roas} />
        <KpiCard label={t("dashboard.kpis.cpc")} value={kpis.cpc} format="currency" icon={<Coins className="h-4 w-4" />} />
        <KpiCard label={t("dashboard.kpis.publishedPosts")} value={kpis.publishedPosts} icon={<FileCheck className="h-4 w-4" />} />
        <KpiCard label={t("dashboard.kpis.openConversations")} value={kpis.openConversations} icon={<Inbox className="h-4 w-4" />} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title={t("dashboard.charts.spendVsRevenue")} className="lg:col-span-2">
          <SpendVsRevenueChart data={charts.spendVsRevenue} />
        </ChartCard>

        <ChartCard title={t("dashboard.charts.followersGrowth")}>
          <FollowersGrowthChart data={charts.followersGrowth} />
        </ChartCard>

        <ChartCard title={t("dashboard.charts.reachTrend")}>
          <ReachTrendChart data={charts.reachTrend} />
        </ChartCard>

        <ChartCard title={t("dashboard.charts.engagementByPlatform")}>
          <EngagementByPlatformChart data={charts.engagementByPlatform} />
        </ChartCard>

        <ChartCard title={t("dashboard.charts.roasByPlatform")}>
          <RoasByPlatformChart data={charts.roasByPlatform} />
        </ChartCard>

        <ChartCard title={t("dashboard.charts.topPosts")} className="lg:col-span-2">
          <TopPostsList data={charts.topPosts} />
        </ChartCard>
      </div>
    </div>
  );
}
