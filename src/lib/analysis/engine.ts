import { prisma } from "@/lib/prisma";
import { resolveDateRange, previousPeriod } from "@/lib/data/date-ranges";
import { getThresholds } from "./thresholds";
import {
  runCampaignRules,
  branchNotConverting,
  bestPlatformInsight,
  type CampaignAnalysisContext,
  type CampaignMetricsSnapshot,
  type RecommendationDraft,
} from "./rules";

const AGGREGATE_ROW_FILTER = {
  device: null,
  region: null,
  ageRange: null,
  gender: null,
  hour: null,
  adId: null,
  adSetId: null,
} as const;

function emptySnapshot(): CampaignMetricsSnapshot {
  return { spend: 0, revenue: 0, impressions: 0, clicks: 0, reach: 0, leads: 0, bookings: 0, sales: 0, conversations: 0 };
}

function sumMetrics(rows: Array<Record<string, unknown>>): CampaignMetricsSnapshot {
  const snapshot = emptySnapshot();
  for (const row of rows) {
    snapshot.spend += Number(row.spend);
    snapshot.revenue += Number(row.revenue);
    snapshot.impressions += Number(row.impressions);
    snapshot.clicks += Number(row.clicks);
    snapshot.reach += Number(row.reach);
    snapshot.leads += Number(row.leads);
    snapshot.bookings += Number(row.bookings);
    snapshot.sales += Number(row.sales);
    snapshot.conversations += Number(row.conversations);
  }
  return snapshot;
}

export interface AnalysisRunSummary {
  recommendationsCreated: number;
  alertsCreated: number;
  campaignsAnalyzed: number;
}

export async function runAnalysisEngine(): Promise<AnalysisRunSummary> {
  const thresholds = await getThresholds();
  const currentRange = resolveDateRange("last30Days");
  const previousRange = previousPeriod(currentRange);

  const campaigns = await prisma.campaign.findMany({
    where: { deletedAt: null, status: { in: ["ACTIVE", "PAUSED"] } },
    include: { branch: true, service: true },
  });

  const drafts: Array<{ campaignId: string | null; draft: RecommendationDraft }> = [];

  const branchTotals = new Map<string, { branchId: string; branchName: string; leads: number; sales: number }>();
  const platformTotals = new Map<string, { spend: number; revenue: number }>();

  for (const campaign of campaigns) {
    const [currentRows, previousRows, adRows] = await Promise.all([
      prisma.campaignMetric.findMany({
        where: { campaignId: campaign.id, date: { gte: currentRange.from, lte: currentRange.to }, ...AGGREGATE_ROW_FILTER },
      }),
      prisma.campaignMetric.findMany({
        where: { campaignId: campaign.id, date: { gte: previousRange.from, lte: previousRange.to }, ...AGGREGATE_ROW_FILTER },
      }),
      prisma.campaignMetric.findMany({
        where: { campaignId: campaign.id, date: { gte: currentRange.from, lte: currentRange.to }, adId: { not: null } },
      }),
    ]);

    const current = sumMetrics(currentRows);
    const previous = sumMetrics(previousRows);

    const adAgg = new Map<string, { spend: number; leads: number }>();
    for (const row of adRows) {
      if (!row.adId) continue;
      const entry = adAgg.get(row.adId) ?? { spend: 0, leads: 0 };
      entry.spend += Number(row.spend);
      entry.leads += row.leads;
      adAgg.set(row.adId, entry);
    }
    let worstAd: CampaignAnalysisContext["worstAd"] = null;
    for (const [adId, agg] of adAgg.entries()) {
      if (agg.leads === 0 && (!worstAd || agg.spend > worstAd.spend)) {
        const ad = await prisma.ad.findUnique({ where: { id: adId } });
        if (ad) worstAd = { name: ad.name, spend: agg.spend, leads: agg.leads };
      }
    }

    const ctx: CampaignAnalysisContext = {
      campaignId: campaign.id,
      campaignName: campaign.name,
      current,
      previous,
      worstAd,
    };

    for (const draft of runCampaignRules(ctx, thresholds)) {
      drafts.push({ campaignId: campaign.id, draft });
    }

    if (campaign.branchId && campaign.branch) {
      const entry = branchTotals.get(campaign.branchId) ?? {
        branchId: campaign.branchId,
        branchName: campaign.branch.name,
        leads: 0,
        sales: 0,
      };
      entry.leads += current.leads;
      entry.sales += current.sales;
      branchTotals.set(campaign.branchId, entry);
    }

    const platformEntry = platformTotals.get(campaign.platform) ?? { spend: 0, revenue: 0 };
    platformEntry.spend += current.spend;
    platformEntry.revenue += current.revenue;
    platformTotals.set(campaign.platform, platformEntry);
  }

  for (const branch of branchTotals.values()) {
    const draft = branchNotConverting(branch, thresholds);
    if (draft) drafts.push({ campaignId: null, draft });
  }

  const platformRoas = Array.from(platformTotals.entries())
    .filter(([, v]) => v.spend > 0)
    .map(([platform, v]) => ({ platform, roas: v.revenue / v.spend }));
  const platformDraft = bestPlatformInsight(platformRoas);
  if (platformDraft) drafts.push({ campaignId: null, draft: platformDraft });

  // Regenerate recommendations from scratch each run — this is a stateless
  // rules re-evaluation, not an incremental feed.
  await prisma.recommendation.deleteMany({});

  if (drafts.length > 0) {
    await prisma.recommendation.createMany({
      data: drafts.map(({ campaignId, draft }) => ({
        type: draft.type,
        title: draft.title,
        explanation: draft.explanation,
        reason: draft.reason,
        supportingData: draft.supportingData as never,
        priority: draft.priority,
        suggestedAction: draft.suggestedAction,
        campaignId: campaignId ?? undefined,
      })),
    });
  }

  const alertsCreated = await generateAlertsFromDrafts(drafts);

  return { recommendationsCreated: drafts.length, alertsCreated, campaignsAnalyzed: campaigns.length };
}

async function generateAlertsFromDrafts(drafts: Array<{ campaignId: string | null; draft: RecommendationDraft }>) {
  let created = 0;
  const alertWorthy = drafts.filter(
    ({ draft }) => draft.type === "DANGER" || draft.priority === "CRITICAL" || draft.priority === "HIGH"
  );

  for (const { campaignId, draft } of alertWorthy) {
    const existing = await prisma.alert.findFirst({
      where: { campaignId: campaignId ?? undefined, title: draft.title, status: "ACTIVE" },
    });
    if (existing) continue;

    await prisma.alert.create({
      data: {
        severity: draft.type === "DANGER" ? "CRITICAL" : draft.priority === "CRITICAL" ? "CRITICAL" : "WARNING",
        title: draft.title,
        message: draft.explanation,
        campaignId: campaignId ?? undefined,
      },
    });
    created += 1;
  }

  // Data-quality alerts: high invalid-phone rate / high duplicate rate among customers.
  const [totalCustomers, invalidPhones, duplicates] = await Promise.all([
    prisma.customer.count({ where: { deletedAt: null } }),
    prisma.customer.count({ where: { deletedAt: null, phoneValidity: "INVALID" } }),
    prisma.customer.count({ where: { deletedAt: null, isDuplicate: true } }),
  ]);

  if (totalCustomers > 0) {
    const invalidRate = invalidPhones / totalCustomers;
    if (invalidRate > 0.15) {
      const title = "نسبة الأرقام غير الصحيحة مرتفعة";
      const existing = await prisma.alert.findFirst({ where: { title, status: "ACTIVE" } });
      if (!existing) {
        await prisma.alert.create({
          data: {
            severity: "WARNING",
            title,
            message: `${(invalidRate * 100).toFixed(0)}% من أرقام العملاء غير صحيحة (${invalidPhones} من ${totalCustomers}).`,
          },
        });
        created += 1;
      }
    }

    const duplicateRate = duplicates / totalCustomers;
    if (duplicateRate > 0.03) {
      const title = "وجود عدد كبير من العملاء المكررين";
      const existing = await prisma.alert.findFirst({ where: { title, status: "ACTIVE" } });
      if (!existing) {
        await prisma.alert.create({
          data: {
            severity: "WARNING",
            title,
            message: `تم رصد ${duplicates} سجل عميل مكرر. راجع صفحة العملاء المكررين لدمجها.`,
          },
        });
        created += 1;
      }
    }
  }

  return created;
}
