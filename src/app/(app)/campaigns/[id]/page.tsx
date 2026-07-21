import { notFound } from "next/navigation";
import { AlertTriangle, Info, Lightbulb, Star, CalendarDays, Clock } from "lucide-react";
import { getCampaignDetail } from "@/lib/data/campaigns";
import { PlatformBadge } from "@/components/shared/platform-badge";
import { CampaignStatusBadge } from "@/components/shared/campaign-status-badge";
import { CampaignRatingBadge } from "@/components/campaigns/campaign-rating-badge";
import { KpiCard } from "@/components/shared/kpi-card";
import { ChartCard } from "@/components/shared/chart-card";
import { SpendVsRevenueChart } from "@/components/dashboard/charts/spend-vs-revenue-chart";
import {
  DeviceBreakdownChart,
  RegionBreakdownChart,
  AgeGenderBreakdownChart,
  HourBreakdownChart,
} from "@/components/campaigns/campaign-breakdown-charts";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatCurrency, formatDate, formatNumber, formatPercent } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

const INSIGHT_ICON = { warning: AlertTriangle, opportunity: Lightbulb, info: Info } as const;
const INSIGHT_STYLE = {
  warning: "border-warning/30 bg-warning/5 text-warning",
  opportunity: "border-success/30 bg-success/5 text-success",
  info: "border-border bg-muted/30 text-muted-foreground",
} as const;

export default async function CampaignDetailPage({ params }: PageProps) {
  const { id } = await params;
  const campaign = await getCampaignDetail(id);
  if (!campaign) notFound();

  const spendVsRevenueData = campaign.dailyPerformance.map((d) => ({
    date: formatDate(d.date),
    spend: Math.round(d.spend),
    revenue: Math.round(d.revenue),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <PlatformBadge platform={campaign.platform} />
            <CampaignStatusBadge status={campaign.status} />
            <CampaignRatingBadge rating={campaign.rating} />
          </div>
          <h1 className="text-2xl font-bold">{campaign.name}</h1>
          <p className="text-sm text-muted-foreground">
            {campaign.branchName ?? "—"} · {campaign.serviceName ?? "—"} · {formatDate(campaign.startDate)}
            {campaign.endDate ? ` — ${formatDate(campaign.endDate)}` : " (مستمرة)"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <KpiCard label="الميزانية" value={campaign.budget} format="currency" />
        <KpiCard label="المصروف" value={campaign.spend} format="currency" />
        <KpiCard label="الإيرادات" value={campaign.revenue} format="currency" />
        <KpiCard label="ROAS" value={campaign.roas} format="number" />
        <KpiCard label="CPL" value={campaign.cpl} format="currency" />
        <KpiCard label="معدل التحويل" value={campaign.conversionRate} format="percent" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryStat label="مرات الظهور" value={formatNumber(campaign.impressions)} />
        <SummaryStat label="النقرات" value={formatNumber(campaign.clicks)} />
        <SummaryStat label="CTR" value={campaign.ctr !== null ? formatPercent(campaign.ctr) : "—"} />
        <SummaryStat label="التكرار" value={campaign.frequency !== null ? `${campaign.frequency.toFixed(2)}x` : "—"} />
        <SummaryStat label="Leads" value={formatNumber(campaign.leads)} />
        <SummaryStat label="الحجوزات" value={formatNumber(campaign.bookings)} />
        <SummaryStat label="المبيعات" value={formatNumber(campaign.sales)} />
        <SummaryStat label="CPC" value={campaign.cpc !== null ? formatCurrency(campaign.cpc) : "—"} />
      </div>

      <ChartCard title="الأداء اليومي">
        <SpendVsRevenueChart data={spendVsRevenueData} />
      </ChartCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Star className="h-5 w-5 text-warning" />
            <div>
              <p className="text-xs text-muted-foreground">أفضل إعلان</p>
              <p className="font-medium">{campaign.bestAd?.name ?? "—"}</p>
              {campaign.bestAd && <p className="text-xs text-muted-foreground">{formatCurrency(campaign.bestAd.revenue)}</p>}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <CalendarDays className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">أفضل يوم</p>
              <p className="font-medium">{campaign.bestDay ? formatDate(campaign.bestDay.date) : "—"}</p>
              {campaign.bestDay && <p className="text-xs text-muted-foreground">{formatCurrency(campaign.bestDay.revenue)}</p>}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Clock className="h-5 w-5 text-success" />
            <div>
              <p className="text-xs text-muted-foreground">أفضل ساعة</p>
              <p className="font-medium">{campaign.bestHour ? `${campaign.bestHour.hour}:00` : "—"}</p>
              {campaign.bestHour && (
                <p className="text-xs text-muted-foreground">{formatNumber(campaign.bestHour.leads)} عميل محتمل</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="الأداء حسب الجهاز">
          <DeviceBreakdownChart data={campaign.byDevice} />
        </ChartCard>
        <ChartCard title="الأداء حسب المنطقة">
          <RegionBreakdownChart data={campaign.byRegion} />
        </ChartCard>
        <ChartCard title="الأداء حسب العمر والجنس">
          <AgeGenderBreakdownChart data={campaign.byAgeGender} />
        </ChartCard>
        <ChartCard title="الأداء حسب الساعة">
          <HourBreakdownChart data={campaign.byHour} />
        </ChartCard>
      </div>

      <ChartCard title="الأداء حسب الإعلان">
        <div className="scroll-x-container" dir="rtl">
          <table className="w-full text-sm">
            <thead className="border-b text-start text-muted-foreground">
              <tr>
                <th className="p-2 text-start">الإعلان</th>
                <th className="p-2 text-start">النوع</th>
                <th className="p-2 text-start">النص الإعلاني</th>
                <th className="p-2 text-start">الإنفاق</th>
                <th className="p-2 text-start">Leads</th>
                <th className="p-2 text-start">المبيعات</th>
                <th className="p-2 text-start">الإيرادات</th>
                <th className="p-2 text-start">ROAS</th>
              </tr>
            </thead>
            <tbody>
              {campaign.byAd.map((ad) => (
                <tr key={ad.id} className="border-b last:border-0">
                  <td className="p-2 font-medium">{ad.name}</td>
                  <td className="p-2">{ad.creativeType ?? "—"}</td>
                  <td className="max-w-xs truncate p-2 text-muted-foreground">{ad.headline ?? "—"}</td>
                  <td className="p-2">{formatCurrency(ad.spend)}</td>
                  <td className="p-2">{formatNumber(ad.leads)}</td>
                  <td className="p-2">{formatNumber(ad.sales)}</td>
                  <td className="p-2">{formatCurrency(ad.revenue)}</td>
                  <td className="p-2">{ad.roas !== null ? `${ad.roas.toFixed(2)}x` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>

      <div>
        <h2 className="mb-3 text-lg font-semibold">تحليل المشاكل والتوصيات</h2>
        <div className="space-y-2">
          {campaign.insights.map((insight) => {
            const Icon = INSIGHT_ICON[insight.type];
            return (
              <div key={insight.title} className={cn("flex items-start gap-3 rounded-lg border p-3", INSIGHT_STYLE[insight.type])}>
                <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">{insight.title}</p>
                  <p className="text-sm text-muted-foreground">{insight.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}
