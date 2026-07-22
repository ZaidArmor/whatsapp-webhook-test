import type { PlatformKind } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ctr, cpc, roas } from "@/lib/metrics";

/** Aggregate rows carry campaign totals; per-ad splits have adId/adSetId set. */
const AGGREGATE_FILTER = { adId: null, adSetId: null };

export interface CampaignListItem {
  id: string;
  name: string;
  platform: PlatformKind;
  objective: string;
  status: string;
  budget: number;
  startDate: Date;
  endDate: Date | null;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  ctr: number | null;
  cpc: number | null;
  roas: number | null;
}

export async function getCampaignsList(workspaceId: string, platform?: PlatformKind): Promise<CampaignListItem[]> {
  const campaigns = await prisma.adCampaign.findMany({
    where: { workspaceId, deletedAt: null, ...(platform ? { platform } : {}) },
    orderBy: { startDate: "desc" },
  });

  const totals = await prisma.adMetric.groupBy({
    by: ["campaignId"],
    where: { campaignId: { in: campaigns.map((c) => c.id) }, ...AGGREGATE_FILTER },
    _sum: { spend: true, impressions: true, clicks: true, conversions: true, revenue: true },
  });
  const byCampaign = new Map(totals.map((t) => [t.campaignId, t._sum]));

  return campaigns.map((campaign) => {
    const sums = byCampaign.get(campaign.id);
    const spend = Number(sums?.spend ?? 0);
    const impressions = sums?.impressions ?? 0;
    const clicks = sums?.clicks ?? 0;
    const revenue = Number(sums?.revenue ?? 0);
    return {
      id: campaign.id,
      name: campaign.name,
      platform: campaign.platform,
      objective: campaign.objective,
      status: campaign.status,
      budget: Number(campaign.budget),
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      spend,
      impressions,
      clicks,
      conversions: sums?.conversions ?? 0,
      revenue,
      ctr: ctr(clicks, impressions),
      cpc: cpc(spend, clicks),
      roas: roas(revenue, spend),
    };
  });
}

export interface PlatformComparisonRow {
  platform: PlatformKind;
  spend: number;
  revenue: number;
  conversions: number;
  roas: number | null;
}

export async function getPlatformComparison(workspaceId: string): Promise<PlatformComparisonRow[]> {
  const campaigns = await prisma.adCampaign.findMany({
    where: { workspaceId, deletedAt: null },
    select: { id: true, platform: true },
  });
  const byId = new Map(campaigns.map((c) => [c.id, c.platform]));

  const totals = await prisma.adMetric.groupBy({
    by: ["campaignId"],
    where: { campaignId: { in: campaigns.map((c) => c.id) }, ...AGGREGATE_FILTER },
    _sum: { spend: true, revenue: true, conversions: true },
  });

  const perPlatform = new Map<PlatformKind, { spend: number; revenue: number; conversions: number }>();
  for (const row of totals) {
    const platform = byId.get(row.campaignId);
    if (!platform) continue;
    const acc = perPlatform.get(platform) ?? { spend: 0, revenue: 0, conversions: 0 };
    acc.spend += Number(row._sum.spend ?? 0);
    acc.revenue += Number(row._sum.revenue ?? 0);
    acc.conversions += row._sum.conversions ?? 0;
    perPlatform.set(platform, acc);
  }

  return [...perPlatform.entries()]
    .map(([platform, sums]) => ({ platform, ...sums, roas: roas(sums.revenue, sums.spend) }))
    .sort((a, b) => b.spend - a.spend);
}

export async function getCampaignDetail(workspaceId: string, campaignId: string) {
  const campaign = await prisma.adCampaign.findFirst({
    where: { id: campaignId, workspaceId, deletedAt: null },
    include: {
      socialAccount: { select: { handle: true, displayName: true } },
      adSets: { include: { ads: true }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!campaign) return null;

  const daily = await prisma.adMetric.findMany({
    where: { campaignId, ...AGGREGATE_FILTER },
    orderBy: { date: "asc" },
  });

  const perAdTotals = await prisma.adMetric.groupBy({
    by: ["adId"],
    where: { campaignId, adId: { not: null } },
    _sum: { spend: true, impressions: true, clicks: true, conversions: true, revenue: true },
  });
  const byAd = new Map(perAdTotals.map((t) => [t.adId, t._sum]));

  const totals = daily.reduce(
    (acc, row) => ({
      spend: acc.spend + Number(row.spend),
      impressions: acc.impressions + row.impressions,
      clicks: acc.clicks + row.clicks,
      leads: acc.leads + row.leads,
      conversions: acc.conversions + row.conversions,
      revenue: acc.revenue + Number(row.revenue),
    }),
    { spend: 0, impressions: 0, clicks: 0, leads: 0, conversions: 0, revenue: 0 }
  );

  return {
    campaign,
    totals: {
      ...totals,
      ctr: ctr(totals.clicks, totals.impressions),
      cpc: cpc(totals.spend, totals.clicks),
      roas: roas(totals.revenue, totals.spend),
    },
    daily: daily.map((row) => ({
      date: row.date.toISOString(),
      spend: Number(row.spend),
      revenue: Number(row.revenue),
      clicks: row.clicks,
      conversions: row.conversions,
    })),
    adPerformance: campaign.adSets.flatMap((adSet) =>
      adSet.ads.map((ad) => {
        const sums = byAd.get(ad.id);
        const spend = Number(sums?.spend ?? 0);
        const impressions = sums?.impressions ?? 0;
        const clicks = sums?.clicks ?? 0;
        const revenue = Number(sums?.revenue ?? 0);
        return {
          adId: ad.id,
          adSetId: adSet.id,
          name: ad.name,
          headline: ad.headline,
          spend,
          impressions,
          clicks,
          conversions: sums?.conversions ?? 0,
          revenue,
          ctr: ctr(clicks, impressions),
          cpc: cpc(spend, clicks),
          roas: roas(revenue, spend),
        };
      })
    ),
  };
}
