import type { PostStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type PostWithRelations = Awaited<ReturnType<typeof getPosts>>[number];

export async function getPosts(workspaceId: string, status?: PostStatus) {
  return prisma.post.findMany({
    where: { workspaceId, deletedAt: null, ...(status ? { status } : {}) },
    include: {
      author: { select: { id: true, name: true } },
      approvedBy: { select: { id: true, name: true } },
      media: { include: { mediaAsset: true }, orderBy: { sortOrder: "asc" } },
      targets: { include: { socialAccount: { select: { platform: true, handle: true } } } },
    },
    orderBy: [{ scheduledAt: "desc" }, { createdAt: "desc" }],
    take: 100,
  });
}

export async function getPostStatusCounts(workspaceId: string): Promise<Record<string, number>> {
  const groups = await prisma.post.groupBy({
    by: ["status"],
    where: { workspaceId, deletedAt: null },
    _count: { _all: true },
  });
  return Object.fromEntries(groups.map((g) => [g.status, g._count._all]));
}

export async function getConnectedAccounts(workspaceId: string) {
  return prisma.socialAccount.findMany({
    where: { workspaceId, status: "CONNECTED" },
    select: { id: true, platform: true, handle: true, displayName: true },
    orderBy: { platform: "asc" },
  });
}

export async function getMediaLibrary(workspaceId: string) {
  return prisma.mediaAsset.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    take: 24,
  });
}

export interface BestTimeSlot {
  /** 0 = Sunday … 6 = Saturday */
  weekday: number;
  hour: number;
  score: number;
}

/**
 * Suggests posting slots by weighting each published target's engagement
 * (likes + comments + shares) by the weekday/hour it went live, over the
 * last 30 days. Purely rules-based on local mock data.
 */
export async function getBestTimes(workspaceId: string): Promise<BestTimeSlot[]> {
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const targets = await prisma.postTarget.findMany({
    where: { post: { workspaceId, deletedAt: null }, status: "PUBLISHED", publishedAt: { gte: since } },
    select: { publishedAt: true, likes: true, comments: true, shares: true },
  });

  const buckets = new Map<string, { weekday: number; hour: number; score: number }>();
  for (const target of targets) {
    if (!target.publishedAt) continue;
    const weekday = target.publishedAt.getDay();
    // Bucket into 3 daily windows that make sense for the Saudi audience.
    const rawHour = target.publishedAt.getHours();
    const hour = rawHour < 12 ? 10 : rawHour < 18 ? 15 : 21;
    const key = `${weekday}-${hour}`;
    const engagement = target.likes + target.comments * 2 + target.shares * 3;
    const bucket = buckets.get(key) ?? { weekday, hour, score: 0 };
    bucket.score += engagement;
    buckets.set(key, bucket);
  }

  return [...buckets.values()].sort((a, b) => b.score - a.score).slice(0, 3);
}

export async function getQueue(workspaceId: string) {
  return prisma.post.findMany({
    where: { workspaceId, deletedAt: null, status: "SCHEDULED", scheduledAt: { gte: new Date() } },
    include: { targets: { include: { socialAccount: { select: { platform: true } } } } },
    orderBy: { scheduledAt: "asc" },
    take: 10,
  });
}

export async function getMonthPosts(workspaceId: string, year: number, month: number) {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 1);
  return prisma.post.findMany({
    where: {
      workspaceId,
      deletedAt: null,
      status: { in: ["SCHEDULED", "PUBLISHED"] },
      OR: [
        { scheduledAt: { gte: start, lt: end } },
        { publishedAt: { gte: start, lt: end } },
      ],
    },
    include: { targets: { include: { socialAccount: { select: { platform: true } } } } },
  });
}
