import { prisma } from "@/lib/prisma";
import type { CampaignObjective, CampaignStatus, Platform } from "@prisma/client";
import {
  ctr as ctrFormula,
  cpc as cpcFormula,
  cpm as cpmFormula,
  cpl as cplFormula,
  roas as roasFormula,
  conversionRate as conversionRateFormula,
  frequency as frequencyFormula,
} from "@/lib/analytics/formulas";

const AGGREGATE_ROW_FILTER = {
  device: null,
  region: null,
  ageRange: null,
  gender: null,
  hour: null,
  adId: null,
  adSetId: null,
} as const;

export type CampaignRating = "excellent" | "good" | "average" | "poor";

export interface CampaignListRow {
  id: string;
  name: string;
  platform: Platform;
  adAccountName: string | null;
  objective: CampaignObjective;
  status: CampaignStatus;
  startDate: Date;
  endDate: Date | null;
  budget: number;
  spend: number;
  impressions: number;
  reach: number;
  frequency: number | null;
  clicks: number;
  ctr: number | null;
  cpc: number | null;
  cpm: number | null;
  leads: number;
  cpl: number | null;
  conversations: number;
  bookings: number;
  sales: number;
  revenue: number;
  roas: number | null;
  conversionRate: number | null;
  branchName: string | null;
  serviceName: string | null;
  rating: CampaignRating;
}

function rateCampaign(roas: number | null, targetRoas: number): CampaignRating {
  if (roas === null || targetRoas <= 0) return "average";
  const ratio = roas / targetRoas;
  if (ratio >= 1.3) return "excellent";
  if (ratio >= 0.9) return "good";
  if (ratio >= 0.5) return "average";
  return "poor";
}

export async function getCampaignsList(): Promise<CampaignListRow[]> {
  const campaigns = await prisma.campaign.findMany({
    where: { deletedAt: null },
    include: {
      branch: true,
      service: true,
      adAccount: true,
      metrics: { where: AGGREGATE_ROW_FILTER },
    },
    orderBy: { startDate: "desc" },
  });

  return campaigns.map((campaign) => {
    const totals = campaign.metrics.reduce(
      (acc, m) => {
        acc.spend += Number(m.spend);
        acc.revenue += Number(m.revenue);
        acc.impressions += m.impressions;
        acc.reach += m.reach;
        acc.clicks += m.clicks;
        acc.leads += m.leads;
        acc.conversations += m.conversations;
        acc.bookings += m.bookings;
        acc.sales += m.sales;
        return acc;
      },
      { spend: 0, revenue: 0, impressions: 0, reach: 0, clicks: 0, leads: 0, conversations: 0, bookings: 0, sales: 0 }
    );

    const roasValue = roasFormula(totals.revenue, totals.spend);

    return {
      id: campaign.id,
      name: campaign.name,
      platform: campaign.platform,
      adAccountName: campaign.adAccount?.name ?? null,
      objective: campaign.objective,
      status: campaign.status,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      budget: Number(campaign.budget),
      spend: totals.spend,
      impressions: totals.impressions,
      reach: totals.reach,
      frequency: frequencyFormula(totals.impressions, totals.reach),
      clicks: totals.clicks,
      ctr: ctrFormula(totals.clicks, totals.impressions),
      cpc: cpcFormula(totals.spend, totals.clicks),
      cpm: cpmFormula(totals.spend, totals.impressions),
      leads: totals.leads,
      cpl: cplFormula(totals.spend, totals.leads),
      conversations: totals.conversations,
      bookings: totals.bookings,
      sales: totals.sales,
      revenue: totals.revenue,
      roas: roasValue,
      conversionRate: conversionRateFormula(totals.sales, totals.leads),
      branchName: campaign.branch?.name ?? null,
      serviceName: campaign.service?.nameAr ?? null,
      rating: rateCampaign(roasValue, campaign.service ? Number(campaign.service.targetRoas) : 3),
    };
  });
}

export interface CampaignDailyPoint {
  date: string;
  spend: number;
  revenue: number;
  leads: number;
  clicks: number;
  impressions: number;
}

export interface CampaignDetail extends CampaignListRow {
  dailyPerformance: CampaignDailyPoint[];
  byAd: Array<{ id: string; name: string; creativeType: string | null; headline: string | null; spend: number; leads: number; sales: number; revenue: number; roas: number | null }>;
  byDevice: Array<{ device: string; spend: number; leads: number; sales: number }>;
  byRegion: Array<{ region: string; spend: number; leads: number; sales: number }>;
  byAgeGender: Array<{ ageRange: string; gender: string; leads: number; sales: number }>;
  byHour: Array<{ hour: number; leads: number; clicks: number }>;
  bestAd: { name: string; revenue: number } | null;
  bestDay: { date: string; revenue: number } | null;
  bestHour: { hour: number; leads: number } | null;
  insights: CampaignInsight[];
}

export interface CampaignInsight {
  type: "warning" | "opportunity" | "info";
  title: string;
  description: string;
}

function buildInsights(row: CampaignListRow, avgFrequency: number | null): CampaignInsight[] {
  const insights: CampaignInsight[] = [];

  if (row.ctr !== null && row.ctr < 1) {
    insights.push({
      type: "warning",
      title: "معدل النقر (CTR) منخفض",
      description: `CTR الحالي ${row.ctr.toFixed(2)}% وهو أقل من المعدل الصحي (1%). يُنصح بمراجعة التصميم أو النص الإعلاني.`,
    });
  }
  if (row.cpl !== null && row.serviceName && row.cpl > 0) {
    insights.push({
      type: row.rating === "poor" ? "warning" : "info",
      title: "تكلفة العميل المحتمل",
      description: `تكلفة العميل المحتمل الحالية ${row.cpl.toFixed(0)} ر.س.`,
    });
  }
  if (avgFrequency !== null && avgFrequency > 3.5) {
    insights.push({
      type: "warning",
      title: "ارتفاع معدل التكرار (Frequency)",
      description: `متوسط التكرار ${avgFrequency.toFixed(1)}× قد يشير إلى إرهاق الجمهور المستهدف. يُنصح بتحديث الجمهور أو التصاميم.`,
    });
  }
  if (row.leads > 20 && row.sales === 0) {
    insights.push({
      type: "warning",
      title: "عملاء محتملون بدون مبيعات",
      description: `الحملة حققت ${row.leads} عميلاً محتملاً دون أي عملية بيع حتى الآن. يُنصح بمراجعة متابعة فريق المبيعات لهذه الحملة.`,
    });
  }
  if (row.roas !== null && row.roas > 5) {
    insights.push({
      type: "opportunity",
      title: "أداء ممتاز — فرصة لزيادة الميزانية",
      description: `العائد على الإنفاق ${row.roas.toFixed(1)}x. يمكن دراسة زيادة الميزانية للاستفادة من هذا الأداء.`,
    });
  }
  if (insights.length === 0) {
    insights.push({ type: "info", title: "الأداء ضمن المعدل الطبيعي", description: "لا توجد مشاكل واضحة في بيانات الحملة الحالية." });
  }

  return insights;
}

export async function getCampaignDetail(id: string): Promise<CampaignDetail | null> {
  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      branch: true,
      service: true,
      adAccount: true,
      metrics: { where: AGGREGATE_ROW_FILTER, orderBy: { date: "asc" } },
      adSets: { include: { ads: true } },
    },
  });
  if (!campaign) return null;

  const [deviceRows, regionRows, ageGenderRows, hourRows, adMetrics] = await Promise.all([
    prisma.campaignMetric.findMany({ where: { campaignId: id, device: { not: null } } }),
    prisma.campaignMetric.findMany({ where: { campaignId: id, region: { not: null } } }),
    prisma.campaignMetric.findMany({ where: { campaignId: id, ageRange: { not: null } } }),
    prisma.campaignMetric.findMany({ where: { campaignId: id, hour: { not: null } } }),
    prisma.campaignMetric.findMany({ where: { campaignId: id, adId: { not: null } } }),
  ]);

  const totals = campaign.metrics.reduce(
    (acc, m) => {
      acc.spend += Number(m.spend);
      acc.revenue += Number(m.revenue);
      acc.impressions += m.impressions;
      acc.reach += m.reach;
      acc.clicks += m.clicks;
      acc.leads += m.leads;
      acc.conversations += m.conversations;
      acc.bookings += m.bookings;
      acc.sales += m.sales;
      return acc;
    },
    { spend: 0, revenue: 0, impressions: 0, reach: 0, clicks: 0, leads: 0, conversations: 0, bookings: 0, sales: 0 }
  );
  const roasValue = roasFormula(totals.revenue, totals.spend);
  const targetRoas = campaign.service ? Number(campaign.service.targetRoas) : 3;

  const listRow: CampaignListRow = {
    id: campaign.id,
    name: campaign.name,
    platform: campaign.platform,
    adAccountName: campaign.adAccount?.name ?? null,
    objective: campaign.objective,
    status: campaign.status,
    startDate: campaign.startDate,
    endDate: campaign.endDate,
    budget: Number(campaign.budget),
    spend: totals.spend,
    impressions: totals.impressions,
    reach: totals.reach,
    frequency: frequencyFormula(totals.impressions, totals.reach),
    clicks: totals.clicks,
    ctr: ctrFormula(totals.clicks, totals.impressions),
    cpc: cpcFormula(totals.spend, totals.clicks),
    cpm: cpmFormula(totals.spend, totals.impressions),
    leads: totals.leads,
    cpl: cplFormula(totals.spend, totals.leads),
    conversations: totals.conversations,
    bookings: totals.bookings,
    sales: totals.sales,
    revenue: totals.revenue,
    roas: roasValue,
    conversionRate: conversionRateFormula(totals.sales, totals.leads),
    branchName: campaign.branch?.name ?? null,
    serviceName: campaign.service?.nameAr ?? null,
    rating: rateCampaign(roasValue, targetRoas),
  };

  const dailyPerformance: CampaignDailyPoint[] = campaign.metrics.map((m) => ({
    date: m.date.toISOString().slice(0, 10),
    spend: Number(m.spend),
    revenue: Number(m.revenue),
    leads: m.leads,
    clicks: m.clicks,
    impressions: m.impressions,
  }));

  const adNameById = new Map(campaign.adSets.flatMap((as) => as.ads.map((ad) => [ad.id, ad] as const)));
  const adAgg = new Map<string, { spend: number; leads: number; sales: number; revenue: number }>();
  for (const m of adMetrics) {
    if (!m.adId) continue;
    const entry = adAgg.get(m.adId) ?? { spend: 0, leads: 0, sales: 0, revenue: 0 };
    entry.spend += Number(m.spend);
    entry.leads += m.leads;
    entry.sales += m.sales;
    entry.revenue += Number(m.revenue);
    adAgg.set(m.adId, entry);
  }
  const byAd = Array.from(adAgg.entries()).map(([adId, agg]) => {
    const ad = adNameById.get(adId);
    return {
      id: adId,
      name: ad?.name ?? adId,
      creativeType: ad?.creativeType ?? null,
      headline: ad?.headline ?? null,
      spend: agg.spend,
      leads: agg.leads,
      sales: agg.sales,
      revenue: agg.revenue,
      roas: roasFormula(agg.revenue, agg.spend),
    };
  });

  function aggregateBy<K extends string>(rows: typeof deviceRows, keyFn: (r: (typeof deviceRows)[number]) => K) {
    const map = new Map<K, { spend: number; leads: number; sales: number; clicks: number }>();
    for (const row of rows) {
      const key = keyFn(row);
      const entry = map.get(key) ?? { spend: 0, leads: 0, sales: 0, clicks: 0 };
      entry.spend += Number(row.spend);
      entry.leads += row.leads;
      entry.sales += row.sales;
      entry.clicks += row.clicks;
      map.set(key, entry);
    }
    return map;
  }

  const deviceMap = aggregateBy(deviceRows, (r) => r.device as string);
  const byDevice = Array.from(deviceMap.entries()).map(([device, v]) => ({ device, ...v }));

  const regionMap = aggregateBy(regionRows, (r) => r.region as string);
  const byRegion = Array.from(regionMap.entries())
    .map(([region, v]) => ({ region, ...v }))
    .sort((a, b) => b.spend - a.spend);

  const ageGenderMap = new Map<string, { ageRange: string; gender: string; leads: number; sales: number }>();
  for (const row of ageGenderRows) {
    const key = `${row.ageRange}-${row.gender}`;
    const entry = ageGenderMap.get(key) ?? { ageRange: row.ageRange!, gender: row.gender!, leads: 0, sales: 0 };
    entry.leads += row.leads;
    entry.sales += row.sales;
    ageGenderMap.set(key, entry);
  }
  const byAgeGender = Array.from(ageGenderMap.values());

  const hourMap = new Map<number, { leads: number; clicks: number }>();
  for (const row of hourRows) {
    if (row.hour === null) continue;
    const entry = hourMap.get(row.hour) ?? { leads: 0, clicks: 0 };
    entry.leads += row.leads;
    entry.clicks += row.clicks;
    hourMap.set(row.hour, entry);
  }
  const byHour = Array.from(hourMap.entries())
    .map(([hour, v]) => ({ hour, ...v }))
    .sort((a, b) => a.hour - b.hour);

  const bestAd = byAd.length > 0 ? byAd.reduce((a, b) => (b.revenue > a.revenue ? b : a)) : null;
  const bestDayPoint =
    dailyPerformance.length > 0 ? dailyPerformance.reduce((a, b) => (b.revenue > a.revenue ? b : a)) : null;
  const bestHourPoint = byHour.length > 0 ? byHour.reduce((a, b) => (b.leads > a.leads ? b : a)) : null;

  return {
    ...listRow,
    dailyPerformance,
    byAd,
    byDevice,
    byRegion,
    byAgeGender,
    byHour,
    bestAd: bestAd ? { name: bestAd.name, revenue: bestAd.revenue } : null,
    bestDay: bestDayPoint ? { date: bestDayPoint.date, revenue: bestDayPoint.revenue } : null,
    bestHour: bestHourPoint ? { hour: bestHourPoint.hour, leads: bestHourPoint.leads } : null,
    insights: buildInsights(listRow, listRow.frequency),
  };
}
