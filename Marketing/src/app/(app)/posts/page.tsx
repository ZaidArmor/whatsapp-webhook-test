import Link from "next/link";
import { PenSquare, Clock } from "lucide-react";
import type { PostStatus } from "@prisma/client";
import { getT } from "@/lib/i18n/server";
import { getWorkspaceContext } from "@/lib/auth/workspace";
import { getPosts, getPostStatusCounts, getQueue, getBestTimes } from "@/lib/data/posts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { PlatformIcon } from "@/components/shared/platform-icon";
import { PostCard, type PostCardData } from "@/components/posts/post-card";
import { BestTimesPanel } from "@/components/posts/best-times";
import { cn, formatDateTime } from "@/lib/utils";

const STATUS_TABS: PostStatus[] = ["PUBLISHED", "SCHEDULED", "PENDING_APPROVAL", "APPROVED", "DRAFT", "REJECTED"];

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function PostsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { t, locale } = await getT();
  const ctx = await getWorkspaceContext();

  const activeStatus = STATUS_TABS.includes(params.status as PostStatus) ? (params.status as PostStatus) : undefined;

  const [posts, counts, queue, bestTimes] = await Promise.all([
    getPosts(ctx.workspaceId, activeStatus),
    getPostStatusCounts(ctx.workspaceId),
    getQueue(ctx.workspaceId),
    getBestTimes(ctx.workspaceId),
  ]);

  const totalCount = Object.values(counts).reduce((s, n) => s + n, 0);

  const cards: PostCardData[] = posts.map((post) => ({
    id: post.id,
    title: post.title,
    body: post.body,
    status: post.status,
    authorName: post.author.name,
    scheduledAt: post.scheduledAt?.toISOString() ?? null,
    publishedAt: post.publishedAt?.toISOString() ?? null,
    approvalNote: post.approvalNote,
    platforms: [...new Set(post.targets.map((target) => target.socialAccount.platform))],
    mediaUrls: post.media.map((m) => m.mediaAsset.url),
    metrics: post.targets.reduce(
      (acc, target) => ({
        impressions: acc.impressions + target.impressions,
        likes: acc.likes + target.likes,
        comments: acc.comments + target.comments,
        shares: acc.shares + target.shares,
        clicks: acc.clicks + target.clicks,
      }),
      { impressions: 0, likes: 0, comments: 0, shares: 0, clicks: 0 }
    ),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t("posts.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("posts.subtitle")}</p>
        </div>
        {ctx.can("create_posts") ? (
          <Button asChild>
            <Link href="/posts/new">
              <PenSquare className="h-4 w-4" />
              {t("posts.newPost")}
            </Link>
          </Button>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <TabLink href="/posts" active={!activeStatus} label={t("common.all")} count={totalCount} />
        {STATUS_TABS.map((status) => (
          <TabLink
            key={status}
            href={`/posts?status=${status}`}
            active={activeStatus === status}
            label={t(`posts.statuses.${status}`)}
            count={counts[status] ?? 0}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_300px]">
        <div>
          {cards.length === 0 ? (
            <EmptyState title={t("common.noData")} />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {cards.map((post) => (
                <PostCard key={post.id} post={post} canApprove={ctx.can("approve_posts")} canPublish={ctx.can("publish_posts")} />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <BestTimesPanel slots={bestTimes} />

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-accent" />
                {t("posts.queue")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {queue.length === 0 ? (
                <p className="text-xs text-muted-foreground">{t("posts.emptyQueue")}</p>
              ) : (
                queue.map((post) => (
                  <div key={post.id} className="space-y-1 border-b pb-2 text-xs last:border-b-0 last:pb-0">
                    <div className="line-clamp-1 font-medium">{post.title ?? post.body}</div>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="tabular-nums">{post.scheduledAt ? formatDateTime(post.scheduledAt, locale) : null}</span>
                      <span className="flex gap-1">
                        {[...new Set(post.targets.map((target) => target.socialAccount.platform))].map((p) => (
                          <PlatformIcon key={p} platform={p} className="h-3 w-3" />
                        ))}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function TabLink({ href, active, label, count }: { href: string; active: boolean; label: string; count: number }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        active ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted"
      )}
    >
      {label}
      <Badge variant={active ? "secondary" : "muted"} className="px-1.5 py-0 text-[10px]">
        {count}
      </Badge>
    </Link>
  );
}
