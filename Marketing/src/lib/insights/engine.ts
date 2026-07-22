import type { InsightKind, InsightSeverity } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ctr as ctrOf, roas as roasOf } from "@/lib/metrics";
import { getBestTimes } from "@/lib/data/posts";

interface RuleResult {
  kind: InsightKind;
  severity: InsightSeverity;
  /** i18n key under insights.rules.* — the UI translates it with params. */
  ruleKey: string;
  params: Record<string, string>;
  campaignId?: string;
  postId?: string;
}

const AGGREGATE_FILTER = { adId: null, adSetId: null };

function pct(value: number): string {
  return `${(value * 100).toFixed(0)}%`;
}

/**
 * Rules-based analysis over local data. Re-running clears previous OPEN
 * insights and regenerates them; insights the team already moved to another
 * status are left untouched.
 */
export async function runInsightsEngine(workspaceId: string): Promise<{ created: number; scanned: number }> {
  const results: RuleResult[] = [];
  const now = Date.now();
  const day = 86_400_000;
  const last7 = new Date(now - 7 * day);
  const prior7 = new Date(now - 14 * day);

  // ---- Campaign rules -------------------------------------------------------
  const campaigns = await prisma.adCampaign.findMany({
    where: { workspaceId, deletedAt: null, status: { in: ["ACTIVE", "PAUSED"] } },
  });
  const totals = await prisma.adMetric.groupBy({
    by: ["campaignId"],
    where: { campaignId: { in: campaigns.map((c) => c.id) }, ...AGGREGATE_FILTER },
    _sum: { spend: true, revenue: true, impressions: true, clicks: true },
  });
  const totalsBy = new Map(totals.map((t) => [t.campaignId, t._sum]));

  for (const campaign of campaigns) {
    const sums = totalsBy.get(campaign.id);
    if (!sums) continue;
    const spend = Number(sums.spend ?? 0);
    const revenue = Number(sums.revenue ?? 0);
    const impressions = sums.impressions ?? 0;
    const clicks = sums.clicks ?? 0;
    const roas = roasOf(revenue, spend);
    const ctr = ctrOf(clicks, impressions);

    if (campaign.status === "ACTIVE" && spend > 2000 && roas !== null && roas < 1) {
      results.push({
        kind: "ALERT",
        severity: "CRITICAL",
        ruleKey: "lowRoas",
        params: { name: campaign.name, roas: `${roas.toFixed(2)}×`, spend: spend.toFixed(0) },
        campaignId: campaign.id,
      });
    } else if (campaign.status === "ACTIVE" && ctr !== null && ctr < 0.8 && impressions > 20_000) {
      results.push({
        kind: "ALERT",
        severity: "WARNING",
        ruleKey: "lowCtr",
        params: { name: campaign.name, ctr: `${ctr.toFixed(2)}%` },
        campaignId: campaign.id,
      });
    }
    if (campaign.status === "ACTIVE" && roas !== null && roas > 3 && spend > 1000) {
      results.push({
        kind: "RECOMMENDATION",
        severity: "OPPORTUNITY",
        ruleKey: "scaleWinner",
        params: { name: campaign.name, roas: `${roas.toFixed(2)}×` },
        campaignId: campaign.id,
      });
    }

    // CPC trend: last 7 days vs the 7 before.
    const [recent, prior] = await Promise.all([
      prisma.adMetric.aggregate({
        where: { campaignId: campaign.id, ...AGGREGATE_FILTER, date: { gte: last7 } },
        _sum: { spend: true, clicks: true },
      }),
      prisma.adMetric.aggregate({
        where: { campaignId: campaign.id, ...AGGREGATE_FILTER, date: { gte: prior7, lt: last7 } },
        _sum: { spend: true, clicks: true },
      }),
    ]);
    const recentCpc = (recent._sum.clicks ?? 0) > 0 ? Number(recent._sum.spend ?? 0) / recent._sum.clicks! : null;
    const priorCpc = (prior._sum.clicks ?? 0) > 0 ? Number(prior._sum.spend ?? 0) / prior._sum.clicks! : null;
    if (recentCpc !== null && priorCpc !== null && priorCpc > 0 && recentCpc / priorCpc > 1.3) {
      results.push({
        kind: "ALERT",
        severity: "WARNING",
        ruleKey: "cpcRising",
        params: {
          name: campaign.name,
          change: pct(recentCpc / priorCpc - 1),
          from: priorCpc.toFixed(2),
          to: recentCpc.toFixed(2),
        },
        campaignId: campaign.id,
      });
    }
  }

  // ---- Account engagement drop ---------------------------------------------
  const accounts = await prisma.socialAccount.findMany({
    where: { workspaceId, status: "CONNECTED" },
    select: { id: true, displayName: true, platform: true },
  });
  for (const account of accounts) {
    const [recent, prior] = await Promise.all([
      prisma.accountDailyStat.aggregate({
        where: { socialAccountId: account.id, date: { gte: last7 } },
        _sum: { engagements: true },
      }),
      prisma.accountDailyStat.aggregate({
        where: { socialAccountId: account.id, date: { gte: prior7, lt: last7 } },
        _sum: { engagements: true },
      }),
    ]);
    const recentEng = recent._sum.engagements ?? 0;
    const priorEng = prior._sum.engagements ?? 0;
    if (priorEng > 500 && recentEng < priorEng * 0.7) {
      results.push({
        kind: "ALERT",
        severity: "WARNING",
        ruleKey: "engagementDrop",
        params: { name: account.displayName, change: pct(1 - recentEng / priorEng) },
      });
    }
  }

  // ---- Top post -------------------------------------------------------------
  const topTargets = await prisma.postTarget.findMany({
    where: { post: { workspaceId, deletedAt: null }, status: "PUBLISHED", publishedAt: { gte: new Date(now - 30 * day) } },
    include: { post: { select: { id: true, body: true } } },
  });
  const byPost = new Map<string, { body: string; engagements: number }>();
  for (const target of topTargets) {
    const acc = byPost.get(target.post.id) ?? { body: target.post.body, engagements: 0 };
    acc.engagements += target.likes + target.comments + target.shares;
    byPost.set(target.post.id, acc);
  }
  const top = [...byPost.entries()].sort((a, b) => b[1].engagements - a[1].engagements)[0];
  if (top && top[1].engagements > 0) {
    results.push({
      kind: "RECOMMENDATION",
      severity: "INFO",
      ruleKey: "topPost",
      params: { excerpt: top[1].body.slice(0, 60), engagements: String(top[1].engagements) },
      postId: top[0],
    });
  }

  // ---- Best posting time -----------------------------------------------------
  const bestTimes = await getBestTimes(workspaceId);
  const best = bestTimes[0];
  if (best) {
    results.push({
      kind: "RECOMMENDATION",
      severity: "INFO",
      ruleKey: "bestTime",
      // Day/hour are rendered client-side via Intl from these raw values.
      params: { day: String(best.weekday), hour: String(best.hour) },
    });
  }

  // ---- Persist ---------------------------------------------------------------
  await prisma.$transaction([
    prisma.insight.deleteMany({ where: { workspaceId, status: "OPEN" } }),
    prisma.insight.createMany({
      data: results.map((r) => ({
        workspaceId,
        kind: r.kind,
        severity: r.severity,
        title: r.ruleKey,
        body: r.ruleKey,
        metricData: { ruleKey: r.ruleKey, params: r.params },
        campaignId: r.campaignId,
        postId: r.postId,
      })),
    }),
  ]);

  return { created: results.length, scanned: campaigns.length + accounts.length };
}
