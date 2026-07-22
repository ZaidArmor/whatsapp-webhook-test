import { prisma } from "@/lib/prisma";
import type { PlatformKind, Prisma } from "@prisma/client";
import { comparePeriods, engagementRate, roas as roasFormula, cpc as cpcFormula, type PeriodComparison } from "@/lib/metrics";

export interface DashboardFilters {
  days: number;
  platform?: PlatformKind;
  accountId?: string;
  campaignId?: string;
}

export interface DashboardKpis {
  followers: number;
  reach: number;
  impressions: number;
  engagements: number;
  engagementRate: number | null;
  clicks: number;
  adSpend: number;
  revenue: number;
  conversions: number;
  roas: number | null;
  cpc: number | null;
  publishedPosts: number;
  openConversations: number;
}

export interface DashboardComparisons {
  followers: PeriodComparison;
  reach: PeriodComparison;
  engagements: PeriodComparison;
  adSpend: PeriodComparison;
  revenue: PeriodComparison;
  roas: PeriodComparison;
}

export interface DashboardCharts {
  followersGrowth: Array<{ date: string; value: number }>;
  reachTrend: Array<{ date: string; value: number }>;
  engagementByPlatform: Array<{ platform: PlatformKind; value: number }>;
  spendVsRevenue: Array<{ date: string; spend: number; revenue: number }>;
  roasByPlatform: Array<{ platform: PlatformKind; value: number }>;
  topPosts: Array<{ id: string; body: string; platform: PlatformKind; engagement: number; impressions: number }>;
}

export interface DashboardFilterOptions {
  accounts: Array<{ id: string; label: string; platform: PlatformKind }>;
  campaigns: Array<{ id: string; label: string }>;
  platforms: PlatformKind[];
}

export interface DashboardData {
  kpis: DashboardKpis;
  comparisons: DashboardComparisons;
  charts: DashboardCharts;
  options: DashboardFilterOptions;
}

function rangeFor(days: number, offsetPeriods = 0): { from: Date; to: Date } {
  const to = new Date();
  to.setHours(23, 59, 59, 999);
  to.setDate(to.getDate() - offsetPeriods * days);
  const from = new Date(to);
  from.setDate(from.getDate() - (days - 1));
  from.setHours(0, 0, 0, 0);
  return { from, to };
}

const AGGREGATE_AD_FILTER = { adId: null, adSetId: null } as const;

interface StatTotals {
  reach: number;
  impressions: number;
  engagements: number;
  clicks: number;
  followersEnd: number;
}

async function statTotals(workspaceId: string, filters: DashboardFilters, offset: number): Promise<StatTotals> {
  const { from, to } = rangeFor(filters.days, offset);
  const accountWhere: Prisma.SocialAccountWhereInput = { workspaceId };
  if (filters.platform) accountWhere.platform = filters.platform;
  if (filters.accountId) accountWhere.id = filters.accountId;

  const rows = await prisma.accountDailyStat.findMany({
    where: { date: { gte: from, lte: to }, socialAccount: accountWhere },
    orderBy: { date: "asc" },
  });

  const totals: StatTotals = { reach: 0, impressions: 0, engagements: 0, clicks: 0, followersEnd: 0 };
  const latestByAccount = new Map<string, number>();
  for (const row of rows) {
    totals.reach += row.reach;
    totals.impressions += row.impressions;
    totals.engagements += row.engagements;
    totals.clicks += row.clicks;
    latestByAccount.set(row.socialAccountId, row.followers);
  }
  totals.followersEnd = Array.from(latestByAccount.values()).reduce((a, b) => a + b, 0);
  return totals;
}

interface AdTotals {
  spend: number;
  revenue: number;
  conversions: number;
  clicks: number;
}

function buildAdCampaignWhere(workspaceId: string, filters: DashboardFilters): Prisma.AdCampaignWhereInput {
  const where: Prisma.AdCampaignWhereInput = { workspaceId, deletedAt: null };
  if (filters.platform) where.platform = filters.platform;
  if (filters.campaignId) where.id = filters.campaignId;
  return where;
}

async function adTotals(workspaceId: string, filters: DashboardFilters, offset: number): Promise<AdTotals> {
  const { from, to } = rangeFor(filters.days, offset);
  const rows = await prisma.adMetric.findMany({
    where: {
      date: { gte: from, lte: to },
      ...AGGREGATE_AD_FILTER,
      campaign: buildAdCampaignWhere(workspaceId, filters),
    },
  });

  return rows.reduce<AdTotals>(
    (acc, row) => {
      acc.spend += Number(row.spend);
      acc.revenue += Number(row.revenue);
      acc.conversions += row.conversions;
      acc.clicks += row.clicks;
      return acc;
    },
    { spend: 0, revenue: 0, conversions: 0, clicks: 0 }
  );
}

export async function getDashboardData(workspaceId: string, filters: DashboardFilters): Promise<DashboardData> {
  const { from, to } = rangeFor(filters.days);

  const accountWhere: Prisma.SocialAccountWhereInput = { workspaceId };
  if (filters.platform) accountWhere.platform = filters.platform;
  if (filters.accountId) accountWhere.id = filters.accountId;

  const [currentStats, prevStats, currentAds, prevAds, statRows, adRows, publishedPosts, openConversations, accounts, campaigns] =
    await Promise.all([
      statTotals(workspaceId, filters, 0),
      statTotals(workspaceId, filters, 1),
      adTotals(workspaceId, filters, 0),
      adTotals(workspaceId, filters, 1),
      prisma.accountDailyStat.findMany({
        where: { date: { gte: from, lte: to }, socialAccount: accountWhere },
        include: { socialAccount: { select: { platform: true } } },
        orderBy: { date: "asc" },
      }),
      prisma.adMetric.findMany({
        where: { date: { gte: from, lte: to }, ...AGGREGATE_AD_FILTER, campaign: buildAdCampaignWhere(workspaceId, filters) },
        include: { campaign: { select: { platform: true } } },
        orderBy: { date: "asc" },
      }),
      prisma.postTarget.count({
        where: {
          status: "PUBLISHED",
          publishedAt: { gte: from, lte: to },
          post: { workspaceId },
          ...(filters.platform || filters.accountId
            ? { socialAccount: { ...(filters.platform ? { platform: filters.platform } : {}), ...(filters.accountId ? { id: filters.accountId } : {}) } }
            : {}),
        },
      }),
      prisma.conversation.count({ where: { workspaceId, status: "OPEN" } }),
      prisma.socialAccount.findMany({ where: { workspaceId }, orderBy: { platform: "asc" } }),
      prisma.adCampaign.findMany({ where: { workspaceId, deletedAt: null }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    ]);

  const kpis: DashboardKpis = {
    followers: currentStats.followersEnd,
    reach: currentStats.reach,
    impressions: currentStats.impressions,
    engagements: currentStats.engagements,
    engagementRate: engagementRate(currentStats.engagements, currentStats.reach),
    clicks: currentStats.clicks,
    adSpend: currentAds.spend,
    revenue: currentAds.revenue,
    conversions: currentAds.conversions,
    roas: roasFormula(currentAds.revenue, currentAds.spend),
    cpc: cpcFormula(currentAds.spend, currentAds.clicks),
    publishedPosts,
    openConversations,
  };

  const comparisons: DashboardComparisons = {
    followers: comparePeriods(currentStats.followersEnd, prevStats.followersEnd, "followers"),
    reach: comparePeriods(currentStats.reach, prevStats.reach, "reach"),
    engagements: comparePeriods(currentStats.engagements, prevStats.engagements, "engagements"),
    adSpend: comparePeriods(currentAds.spend, prevAds.spend, "spend"),
    revenue: comparePeriods(currentAds.revenue, prevAds.revenue, "revenue"),
    roas: comparePeriods(roasFormula(currentAds.revenue, currentAds.spend) ?? 0, roasFormula(prevAds.revenue, prevAds.spend) ?? 0, "roas"),
  };

  // Daily series
  const followersByDate = new Map<string, Map<string, number>>();
  const reachByDate = new Map<string, number>();
  const engByPlatform = new Map<PlatformKind, number>();
  for (const row of statRows) {
    const key = row.date.toISOString().slice(0, 10);
    const perAccount = followersByDate.get(key) ?? new Map<string, number>();
    perAccount.set(row.socialAccountId, row.followers);
    followersByDate.set(key, perAccount);
    reachByDate.set(key, (reachByDate.get(key) ?? 0) + row.reach);
    engByPlatform.set(row.socialAccount.platform, (engByPlatform.get(row.socialAccount.platform) ?? 0) + row.engagements);
  }

  const spendByDate = new Map<string, { spend: number; revenue: number }>();
  const adByPlatform = new Map<PlatformKind, { spend: number; revenue: number }>();
  for (const row of adRows) {
    const key = row.date.toISOString().slice(0, 10);
    const entry = spendByDate.get(key) ?? { spend: 0, revenue: 0 };
    entry.spend += Number(row.spend);
    entry.revenue += Number(row.revenue);
    spendByDate.set(key, entry);

    const p = adByPlatform.get(row.campaign.platform) ?? { spend: 0, revenue: 0 };
    p.spend += Number(row.spend);
    p.revenue += Number(row.revenue);
    adByPlatform.set(row.campaign.platform, p);
  }

  const topTargets = await prisma.postTarget.findMany({
    where: { status: "PUBLISHED", post: { workspaceId }, publishedAt: { gte: from, lte: to } },
    include: { post: { select: { body: true } }, socialAccount: { select: { platform: true } } },
    orderBy: [{ likes: "desc" }],
    take: 5,
  });

  const charts: DashboardCharts = {
    followersGrowth: Array.from(followersByDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, perAccount]) => ({
        date,
        value: Array.from(perAccount.values()).reduce((s, v) => s + v, 0),
      })),
    reachTrend: Array.from(reachByDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, value]) => ({ date, value })),
    engagementByPlatform: Array.from(engByPlatform.entries()).map(([platform, value]) => ({ platform, value })),
    spendVsRevenue: Array.from(spendByDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date, spend: Math.round(v.spend), revenue: Math.round(v.revenue) })),
    roasByPlatform: Array.from(adByPlatform.entries()).map(([platform, v]) => ({
      platform,
      value: v.spend > 0 ? Number((v.revenue / v.spend).toFixed(2)) : 0,
    })),
    topPosts: topTargets.map((target) => ({
      id: target.id,
      body: target.bodyOverride ?? target.post.body,
      platform: target.socialAccount.platform,
      engagement: target.likes + target.comments + target.shares,
      impressions: target.impressions,
    })),
  };

  const options: DashboardFilterOptions = {
    accounts: accounts.map((a) => ({ id: a.id, label: `${a.handle}`, platform: a.platform })),
    campaigns: campaigns.map((c) => ({ id: c.id, label: c.name })),
    platforms: Array.from(new Set(accounts.map((a) => a.platform))),
  };

  return { kpis, comparisons, charts, options };
}
