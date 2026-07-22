import { prisma } from "@/lib/prisma";
import { Prisma, type Platform } from "@prisma/client";
import type { DashboardFilters, SelectOption } from "@/types";
import { previousPeriod } from "./date-ranges";
import {
  ctr as ctrFormula,
  cpc as cpcFormula,
  cpl as cplFormula,
  cac as cacFormula,
  roas as roasFormula,
  conversionRate as conversionRateFormula,
  averageOrderValue as aovFormula,
  comparePeriods,
  type PeriodComparison,
} from "@/lib/analytics/formulas";
import { formatDate } from "@/lib/utils";

export interface LabeledValue {
  label: string;
  value: number;
}

export interface DashboardKpis {
  spend: number;
  revenue: number;
  leads: number;
  conversations: number;
  bookings: number;
  sales: number;
  cpl: number | null;
  cac: number | null;
  roas: number | null;
  conversionRate: number | null;
  aov: number | null;
  newCustomers: number;
  returningCustomers: number;
  bestPlatform: LabeledValue | null;
  bestCampaign: LabeledValue | null;
  bestBranch: LabeledValue | null;
  bestService: LabeledValue | null;
}

export interface DashboardComparison {
  spend: PeriodComparison;
  revenue: PeriodComparison;
  roas: PeriodComparison;
  cpl: PeriodComparison;
  leads: PeriodComparison;
  sales: PeriodComparison;
}

export interface DashboardCharts {
  spendVsRevenue: Array<{ date: string; spend: number; revenue: number }>;
  leadsByDay: Array<{ date: string; leads: number }>;
  salesByPlatform: LabeledValue[];
  conversionRateByDay: Array<{ date: string; rate: number | null }>;
  branchPerformance: Array<{ branch: string; revenue: number; spend: number }>;
  budgetDistribution: LabeledValue[];
  newVsReturning: Array<{ date: string; newCustomers: number; returningCustomers: number }>;
  servicePerformance: Array<{ service: string; revenue: number; sales: number }>;
  campaignRanking: Array<{ name: string; roas: number | null; spend: number }>;
  funnel: LabeledValue[];
}

export interface DashboardFilterOptions {
  branches: SelectOption[];
  platforms: SelectOption[];
  campaigns: SelectOption[];
  services: SelectOption[];
  cities: SelectOption[];
}

export interface DashboardData {
  kpis: DashboardKpis;
  comparison: DashboardComparison;
  charts: DashboardCharts;
  filterOptions: DashboardFilterOptions;
}

function buildCampaignWhere(filters: DashboardFilters): Prisma.CampaignWhereInput {
  const where: Prisma.CampaignWhereInput = { deletedAt: null };
  if (filters.branchId) where.branchId = filters.branchId;
  if (filters.platform) where.platform = filters.platform as Platform;
  if (filters.campaignId) where.id = filters.campaignId;
  if (filters.serviceId) where.serviceId = filters.serviceId;
  if (filters.campaignObjective) where.objective = filters.campaignObjective as never;
  return where;
}

/**
 * CampaignMetric stores both daily aggregate rows (all breakdown dimensions
 * null) and dimension-breakdown rows (device/region/ageRange/gender/hour) for
 * the campaign detail page. Dashboard-level totals must only read the
 * aggregate rows, or breakdown rows would double-count spend/revenue/etc.
 */
const AGGREGATE_ROW_FILTER = {
  device: null,
  region: null,
  ageRange: null,
  gender: null,
  hour: null,
  adId: null,
  adSetId: null,
} as const;

async function loadMetricRows(filters: DashboardFilters) {
  return prisma.campaignMetric.findMany({
    where: {
      date: { gte: filters.range.from, lte: filters.range.to },
      campaign: buildCampaignWhere(filters),
      ...AGGREGATE_ROW_FILTER,
    },
    include: {
      campaign: { include: { branch: true, service: true } },
    },
  });
}

type MetricRow = Awaited<ReturnType<typeof loadMetricRows>>[number];

function sum(rows: MetricRow[], key: "spend" | "revenue" | "leads" | "conversations" | "bookings" | "sales" | "impressions" | "clicks" | "reach"): number {
  return rows.reduce((total, row) => {
    const value = row[key];
    return total + (typeof value === "number" ? value : Number(value));
  }, 0);
}

function groupSumBy<K extends string>(
  rows: MetricRow[],
  keyFn: (row: MetricRow) => K | null,
  valueKey: "revenue" | "spend" | "sales"
): Map<K, number> {
  const map = new Map<K, number>();
  for (const row of rows) {
    const key = keyFn(row);
    if (key === null) continue;
    const value = Number(row[valueKey]);
    map.set(key, (map.get(key) ?? 0) + value);
  }
  return map;
}

function topEntry(map: Map<string, number>): LabeledValue | null {
  let best: LabeledValue | null = null;
  for (const [label, value] of map.entries()) {
    if (!best || value > best.value) best = { label, value };
  }
  return best;
}

const PLATFORM_LABELS: Record<Platform, string> = {
  META_ADS: "Meta Ads",
  FACEBOOK: "Facebook",
  INSTAGRAM: "Instagram",
  TIKTOK_ADS: "TikTok Ads",
  TIKTOK: "TikTok",
  SNAPCHAT_ADS: "Snapchat Ads",
  GOOGLE_ADS: "Google Ads",
  GA4: "GA4",
  GOOGLE_SEARCH_CONSOLE: "Search Console",
  YOUTUBE: "YouTube",
  WHATSAPP_BUSINESS: "WhatsApp Business",
  GOOGLE_BUSINESS_PROFILE: "Google Business Profile",
  LINKEDIN: "LinkedIn",
  X_TWITTER: "X",
};

async function computeKpisForRange(filters: DashboardFilters): Promise<{
  kpis: Omit<DashboardKpis, "newCustomers" | "returningCustomers">;
  rows: MetricRow[];
}> {
  const rows = await loadMetricRows(filters);

  const spend = sum(rows, "spend");
  const revenue = sum(rows, "revenue");
  const leads = sum(rows, "leads");
  const conversations = sum(rows, "conversations");
  const bookings = sum(rows, "bookings");
  const sales = sum(rows, "sales");

  const byPlatform = groupSumBy(rows, (r) => PLATFORM_LABELS[r.campaign.platform], "revenue");
  const byCampaignRoas = new Map<string, number>();
  const spendByCampaign = groupSumBy(rows, (r) => r.campaign.name, "spend");
  const revenueByCampaign = groupSumBy(rows, (r) => r.campaign.name, "revenue");
  for (const [name, campaignSpend] of spendByCampaign.entries()) {
    const campaignRevenue = revenueByCampaign.get(name) ?? 0;
    if (campaignSpend > 0) byCampaignRoas.set(name, campaignRevenue / campaignSpend);
  }
  const byBranch = groupSumBy(rows, (r) => r.campaign.branch?.name ?? null, "revenue");
  const byServiceSales = groupSumBy(rows, (r) => r.campaign.service?.nameAr ?? null, "sales");

  return {
    kpis: {
      spend,
      revenue,
      leads,
      conversations,
      bookings,
      sales,
      cpl: cplFormula(spend, leads),
      cac: cacFormula(spend, sales),
      roas: roasFormula(revenue, spend),
      conversionRate: conversionRateFormula(sales, leads),
      aov: aovFormula(revenue, sales),
      bestPlatform: topEntry(byPlatform),
      bestCampaign: topEntry(byCampaignRoas),
      bestBranch: topEntry(byBranch),
      bestService: topEntry(byServiceSales),
    },
    rows,
  };
}

function buildCustomerWhere(filters: DashboardFilters): Prisma.CustomerWhereInput {
  const where: Prisma.CustomerWhereInput = { deletedAt: null };
  if (filters.branchId) where.branchId = filters.branchId;
  if (filters.serviceId) where.serviceId = filters.serviceId;
  if (filters.platform) where.platform = filters.platform as Platform;
  if (filters.campaignId) where.campaignId = filters.campaignId;
  if (filters.city) where.city = filters.city;
  if (filters.source) where.source = filters.source as never;
  return where;
}

async function computeCustomerCounts(filters: DashboardFilters) {
  const where = buildCustomerWhere(filters);

  const [newCustomers, returningCustomers] = await Promise.all([
    prisma.customer.count({
      where: { ...where, firstContactAt: { gte: filters.range.from, lte: filters.range.to } },
    }),
    prisma.customer.count({
      where: {
        ...where,
        status: "PAST_CUSTOMER",
        lastContactAt: { gte: filters.range.from, lte: filters.range.to },
      },
    }),
  ]);

  return { newCustomers, returningCustomers };
}

async function computeNewVsReturningByDay(
  filters: DashboardFilters
): Promise<DashboardCharts["newVsReturning"]> {
  const where = buildCustomerWhere(filters);
  const [newCustomers, returningCustomers] = await Promise.all([
    prisma.customer.findMany({
      where: { ...where, firstContactAt: { gte: filters.range.from, lte: filters.range.to } },
      select: { firstContactAt: true },
    }),
    prisma.customer.findMany({
      where: {
        ...where,
        status: "PAST_CUSTOMER",
        lastContactAt: { gte: filters.range.from, lte: filters.range.to },
      },
      select: { lastContactAt: true },
    }),
  ]);

  const byDate = new Map<string, { newCustomers: number; returningCustomers: number; date: Date }>();
  for (const customer of newCustomers) {
    if (!customer.firstContactAt) continue;
    const key = customer.firstContactAt.toISOString().slice(0, 10);
    const entry = byDate.get(key) ?? { newCustomers: 0, returningCustomers: 0, date: customer.firstContactAt };
    entry.newCustomers += 1;
    byDate.set(key, entry);
  }
  for (const customer of returningCustomers) {
    if (!customer.lastContactAt) continue;
    const key = customer.lastContactAt.toISOString().slice(0, 10);
    const entry = byDate.get(key) ?? { newCustomers: 0, returningCustomers: 0, date: customer.lastContactAt };
    entry.returningCustomers += 1;
    byDate.set(key, entry);
  }

  return Array.from(byDate.keys())
    .sort()
    .map((key) => {
      const entry = byDate.get(key)!;
      return { date: formatDate(entry.date), newCustomers: entry.newCustomers, returningCustomers: entry.returningCustomers };
    });
}

function buildDailySeries(rows: MetricRow[]): {
  spendVsRevenue: DashboardCharts["spendVsRevenue"];
  leadsByDay: DashboardCharts["leadsByDay"];
  conversionRateByDay: DashboardCharts["conversionRateByDay"];
} {
  const byDate = new Map<string, { spend: number; revenue: number; leads: number; sales: number; date: Date }>();
  for (const row of rows) {
    const key = row.date.toISOString().slice(0, 10);
    const existing = byDate.get(key) ?? { spend: 0, revenue: 0, leads: 0, sales: 0, date: row.date };
    existing.spend += Number(row.spend);
    existing.revenue += Number(row.revenue);
    existing.leads += row.leads;
    existing.sales += row.sales;
    byDate.set(key, existing);
  }

  const sortedKeys = Array.from(byDate.keys()).sort();

  return {
    spendVsRevenue: sortedKeys.map((key) => {
      const entry = byDate.get(key)!;
      return { date: formatDate(entry.date), spend: Math.round(entry.spend), revenue: Math.round(entry.revenue) };
    }),
    leadsByDay: sortedKeys.map((key) => {
      const entry = byDate.get(key)!;
      return { date: formatDate(entry.date), leads: entry.leads };
    }),
    conversionRateByDay: sortedKeys.map((key) => {
      const entry = byDate.get(key)!;
      return { date: formatDate(entry.date), rate: conversionRateFormula(entry.sales, entry.leads) };
    }),
  };
}

async function loadFilterOptions(): Promise<DashboardFilterOptions> {
  const [branches, services, campaigns, cities] = await Promise.all([
    prisma.branch.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } }),
    prisma.service.findMany({ where: { deletedAt: null }, orderBy: { nameAr: "asc" } }),
    prisma.campaign.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.customer.findMany({
      where: { deletedAt: null, city: { not: null } },
      distinct: ["city"],
      select: { city: true },
    }),
  ]);

  const platforms = Object.entries(PLATFORM_LABELS)
    .filter(([key]) => ["META_ADS", "FACEBOOK", "INSTAGRAM", "TIKTOK_ADS", "SNAPCHAT_ADS", "GOOGLE_ADS"].includes(key))
    .map(([value, label]) => ({ label, value }));

  return {
    branches: branches.map((b) => ({ label: b.name, value: b.id })),
    services: services.map((s) => ({ label: s.nameAr, value: s.id })),
    campaigns: campaigns.map((c) => ({ label: c.name, value: c.id })),
    cities: cities.filter((c): c is { city: string } => Boolean(c.city)).map((c) => ({ label: c.city, value: c.city })),
    platforms,
  };
}

export async function getDashboardData(filters: DashboardFilters): Promise<DashboardData> {
  const [{ kpis: rangeKpis, rows }, customerCounts, newVsReturning, previousRangeResult, filterOptions] =
    await Promise.all([
      computeKpisForRange(filters),
      computeCustomerCounts(filters),
      computeNewVsReturningByDay(filters),
      computeKpisForRange({ ...filters, range: previousPeriod(filters.range) }),
      loadFilterOptions(),
    ]);

  const kpis: DashboardKpis = { ...rangeKpis, ...customerCounts };

  const comparison: DashboardComparison = {
    spend: comparePeriods(rangeKpis.spend, previousRangeResult.kpis.spend, "spend"),
    revenue: comparePeriods(rangeKpis.revenue, previousRangeResult.kpis.revenue, "revenue"),
    roas: comparePeriods(rangeKpis.roas ?? 0, previousRangeResult.kpis.roas ?? 0, "roas"),
    cpl: comparePeriods(rangeKpis.cpl ?? 0, previousRangeResult.kpis.cpl ?? 0, "cpl"),
    leads: comparePeriods(rangeKpis.leads, previousRangeResult.kpis.leads, "leads"),
    sales: comparePeriods(rangeKpis.sales, previousRangeResult.kpis.sales, "sales"),
  };

  const daily = buildDailySeries(rows);

  const salesByPlatformMap = groupSumBy(rows, (r) => PLATFORM_LABELS[r.campaign.platform], "sales");
  const branchRevenueMap = groupSumBy(rows, (r) => r.campaign.branch?.name ?? null, "revenue");
  const branchSpendMap = groupSumBy(rows, (r) => r.campaign.branch?.name ?? null, "spend");
  const budgetByPlatform = new Map<string, number>();
  for (const row of rows) {
    const label = PLATFORM_LABELS[row.campaign.platform];
    budgetByPlatform.set(label, (budgetByPlatform.get(label) ?? 0) + Number(row.campaign.budget) / 1000);
  }
  const serviceRevenueMap = groupSumBy(rows, (r) => r.campaign.service?.nameAr ?? null, "revenue");
  const serviceSalesMap = groupSumBy(rows, (r) => r.campaign.service?.nameAr ?? null, "sales");

  const campaignAgg = new Map<string, { spend: number; revenue: number }>();
  for (const row of rows) {
    const entry = campaignAgg.get(row.campaign.name) ?? { spend: 0, revenue: 0 };
    entry.spend += Number(row.spend);
    entry.revenue += Number(row.revenue);
    campaignAgg.set(row.campaign.name, entry);
  }
  const campaignRanking = Array.from(campaignAgg.entries())
    .map(([name, agg]) => ({ name, spend: Math.round(agg.spend), roas: roasFormula(agg.revenue, agg.spend) }))
    .sort((a, b) => (b.roas ?? -Infinity) - (a.roas ?? -Infinity));

  const impressions = sum(rows, "impressions");
  const clicks = sum(rows, "clicks");

  const charts: DashboardCharts = {
    spendVsRevenue: daily.spendVsRevenue,
    leadsByDay: daily.leadsByDay,
    conversionRateByDay: daily.conversionRateByDay,
    salesByPlatform: Array.from(salesByPlatformMap.entries()).map(([label, value]) => ({ label, value })),
    branchPerformance: Array.from(branchRevenueMap.entries()).map(([branch, revenue]) => ({
      branch,
      revenue: Math.round(revenue),
      spend: Math.round(branchSpendMap.get(branch) ?? 0),
    })),
    budgetDistribution: Array.from(budgetByPlatform.entries()).map(([label, value]) => ({
      label,
      value: Math.round(value),
    })),
    newVsReturning,
    servicePerformance: Array.from(serviceRevenueMap.entries()).map(([service, revenue]) => ({
      service,
      revenue: Math.round(revenue),
      sales: serviceSalesMap.get(service) ?? 0,
    })),
    campaignRanking,
    funnel: [
      { label: "مرات الظهور", value: impressions },
      { label: "النقرات", value: clicks },
      { label: "العملاء المحتملون", value: rangeKpis.leads },
      { label: "الحجوزات", value: rangeKpis.bookings },
      { label: "المبيعات", value: rangeKpis.sales },
    ],
  };

  return { kpis, comparison, charts, filterOptions };
}
