import { ReportKind, type PlatformKind } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ctr, roas, cpc } from "@/lib/metrics";
import { getPlatformComparison, getCampaignsList } from "@/lib/data/ads";

export interface ReportTable {
  kind: ReportKind;
  /** Column definitions; labelKey is an i18n key, platform columns get translated upstream. */
  columns: Array<{ key: string; labelKey: string }>;
  rows: Array<Record<string, string | number | null>>;
}

const AGGREGATE_FILTER = { adId: null, adSetId: null };

/** Builds the table for a report template from local data (last 30 days where relevant). */
export async function generateReport(workspaceId: string, kind: ReportKind): Promise<ReportTable> {
  const since = new Date();
  since.setDate(since.getDate() - 30);

  switch (kind) {
    case ReportKind.MONTHLY_CLIENT: {
      const accounts = await prisma.socialAccount.findMany({
        where: { workspaceId },
        select: { id: true, platform: true, displayName: true, handle: true },
      });
      const stats = await prisma.accountDailyStat.groupBy({
        by: ["socialAccountId"],
        where: { socialAccountId: { in: accounts.map((a) => a.id) }, date: { gte: since } },
        _sum: { reach: true, impressions: true, engagements: true, clicks: true },
        _max: { followers: true },
      });
      const byAccount = new Map(stats.map((s) => [s.socialAccountId, s]));
      return {
        kind,
        columns: [
          { key: "platform", labelKey: "common.platform" },
          { key: "account", labelKey: "common.account" },
          { key: "followers", labelKey: "dashboard.kpis.followers" },
          { key: "reach", labelKey: "dashboard.kpis.reach" },
          { key: "engagements", labelKey: "dashboard.kpis.engagements" },
          { key: "clicks", labelKey: "dashboard.kpis.clicks" },
        ],
        rows: accounts.map((account) => {
          const s = byAccount.get(account.id);
          return {
            platform: `platforms.${account.platform}`,
            account: account.handle,
            followers: s?._max.followers ?? 0,
            reach: s?._sum.reach ?? 0,
            engagements: s?._sum.engagements ?? 0,
            clicks: s?._sum.clicks ?? 0,
          };
        }),
      };
    }

    case ReportKind.CAMPAIGN_PERFORMANCE: {
      const campaigns = await getCampaignsList(workspaceId);
      return {
        kind,
        columns: [
          { key: "name", labelKey: "ads.campaignName" },
          { key: "platform", labelKey: "common.platform" },
          { key: "status", labelKey: "common.status" },
          { key: "budget", labelKey: "ads.budget" },
          { key: "spend", labelKey: "ads.spend" },
          { key: "revenue", labelKey: "ads.revenue" },
          { key: "roas", labelKey: "ads.roas" },
          { key: "ctr", labelKey: "ads.ctr" },
          { key: "cpc", labelKey: "ads.cpc" },
        ],
        rows: campaigns.map((c) => ({
          name: c.name,
          platform: `platforms.${c.platform}`,
          status: `ads.statuses.${c.status}`,
          budget: c.budget,
          spend: Number(c.spend.toFixed(2)),
          revenue: Number(c.revenue.toFixed(2)),
          roas: c.roas === null ? null : Number(c.roas.toFixed(2)),
          ctr: c.ctr === null ? null : Number(c.ctr.toFixed(2)),
          cpc: c.cpc === null ? null : Number(c.cpc.toFixed(2)),
        })),
      };
    }

    case ReportKind.PLATFORM_COMPARISON: {
      const comparison = await getPlatformComparison(workspaceId);
      return {
        kind,
        columns: [
          { key: "platform", labelKey: "common.platform" },
          { key: "spend", labelKey: "ads.spend" },
          { key: "revenue", labelKey: "ads.revenue" },
          { key: "conversions", labelKey: "ads.conversions" },
          { key: "roas", labelKey: "ads.roas" },
        ],
        rows: comparison.map((row) => ({
          platform: `platforms.${row.platform}`,
          spend: Number(row.spend.toFixed(2)),
          revenue: Number(row.revenue.toFixed(2)),
          conversions: row.conversions,
          roas: row.roas === null ? null : Number(row.roas.toFixed(2)),
        })),
      };
    }

    case ReportKind.CONTENT_PERFORMANCE: {
      const targets = await prisma.postTarget.findMany({
        where: { post: { workspaceId, deletedAt: null }, status: "PUBLISHED", publishedAt: { gte: since } },
        include: {
          post: { select: { body: true } },
          socialAccount: { select: { platform: true } },
        },
      });
      const byPost = new Map<
        string,
        { body: string; platforms: Set<PlatformKind>; impressions: number; likes: number; comments: number; shares: number; clicks: number }
      >();
      for (const target of targets) {
        const key = target.postId;
        const acc =
          byPost.get(key) ?? { body: target.post.body, platforms: new Set<PlatformKind>(), impressions: 0, likes: 0, comments: 0, shares: 0, clicks: 0 };
        acc.platforms.add(target.socialAccount.platform);
        acc.impressions += target.impressions;
        acc.likes += target.likes;
        acc.comments += target.comments;
        acc.shares += target.shares;
        acc.clicks += target.clicks;
        byPost.set(key, acc);
      }
      return {
        kind,
        columns: [
          { key: "body", labelKey: "posts.postBody" },
          { key: "impressions", labelKey: "posts.metrics.impressions" },
          { key: "likes", labelKey: "posts.metrics.likes" },
          { key: "comments", labelKey: "posts.metrics.comments" },
          { key: "shares", labelKey: "posts.metrics.shares" },
          { key: "clicks", labelKey: "posts.metrics.clicks" },
        ],
        rows: [...byPost.values()]
          .sort((a, b) => b.likes + b.comments + b.shares - (a.likes + a.comments + a.shares))
          .slice(0, 25)
          .map((post) => ({
            body: post.body.slice(0, 80),
            impressions: post.impressions,
            likes: post.likes,
            comments: post.comments,
            shares: post.shares,
            clicks: post.clicks,
          })),
      };
    }

    case ReportKind.INBOX_ACTIVITY: {
      const groups = await prisma.conversation.groupBy({
        by: ["status", "kind"],
        where: { workspaceId },
        _count: { _all: true },
      });
      return {
        kind,
        columns: [
          { key: "status", labelKey: "common.status" },
          { key: "kind", labelKey: "reports.columns.kind" },
          { key: "count", labelKey: "reports.columns.count" },
        ],
        rows: groups.map((g) => ({
          status: `inbox.statuses.${g.status}`,
          kind: `inbox.kinds.${g.kind}`,
          count: g._count._all,
        })),
      };
    }

    case ReportKind.CRM_PIPELINE: {
      const groups = await prisma.contact.groupBy({
        by: ["stage"],
        where: { workspaceId, deletedAt: null },
        _count: { _all: true },
        _sum: { value: true },
      });
      return {
        kind,
        columns: [
          { key: "stage", labelKey: "crm.stage" },
          { key: "count", labelKey: "reports.columns.count" },
          { key: "value", labelKey: "crm.value" },
        ],
        rows: groups.map((g) => ({
          stage: `crm.stages.${g.stage}`,
          count: g._count._all,
          value: Number(g._sum.value ?? 0),
        })),
      };
    }
  }
}

export { ctr, roas, cpc };
