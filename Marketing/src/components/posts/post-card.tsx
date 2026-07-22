"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Send, Trash2, CalendarClock, Eye, ThumbsUp, MessageCircle, Share2, MousePointerClick } from "lucide-react";
import type { PostStatus, PlatformKind } from "@prisma/client";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PlatformIcon } from "@/components/shared/platform-icon";
import { useT } from "@/lib/i18n/client";
import { cn, formatCompact, formatDateTime } from "@/lib/utils";
import { reviewPostAction, publishPostNowAction, deletePostAction } from "@/app/(app)/posts/actions";

export interface PostCardData {
  id: string;
  title: string | null;
  body: string;
  status: PostStatus;
  authorName: string;
  scheduledAt: string | null;
  publishedAt: string | null;
  approvalNote: string | null;
  platforms: PlatformKind[];
  mediaUrls: string[];
  metrics: { impressions: number; likes: number; comments: number; shares: number; clicks: number };
}

const STATUS_VARIANT: Record<PostStatus, "success" | "warning" | "destructive" | "muted" | "secondary" | "default"> = {
  DRAFT: "muted",
  PENDING_APPROVAL: "warning",
  APPROVED: "secondary",
  REJECTED: "destructive",
  SCHEDULED: "default",
  PUBLISHED: "success",
  FAILED: "destructive",
};

interface PostCardProps {
  post: PostCardData;
  canApprove: boolean;
  canPublish: boolean;
}

export function PostCard({ post, canApprove, canPublish }: PostCardProps) {
  const { t, locale } = useT();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const run = (action: () => Promise<{ ok: boolean; errorKey?: string }>) => {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(t(result.errorKey ?? "common.error"));
      router.refresh();
    });
  };

  const published = post.status === "PUBLISHED";

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-row items-start justify-between gap-2 space-y-0 pb-2">
        <div className="flex items-center gap-1.5">
          {post.platforms.map((p) => (
            <span key={p} className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted">
              <PlatformIcon platform={p} className="h-3.5 w-3.5" />
            </span>
          ))}
        </div>
        <Badge variant={STATUS_VARIANT[post.status]}>{t(`posts.statuses.${post.status}`)}</Badge>
      </CardHeader>

      <CardContent className="flex-1 space-y-3">
        {post.title ? <div className="text-sm font-semibold">{post.title}</div> : null}
        <p className="line-clamp-3 whitespace-pre-line text-sm leading-6">{post.body}</p>

        {post.mediaUrls.length > 0 ? (
          <div className="flex gap-2">
            {post.mediaUrls.slice(0, 3).map((url) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={url} src={url} alt="" className="h-14 w-14 rounded-lg border object-cover" />
            ))}
          </div>
        ) : null}

        <div className="space-y-1 text-xs text-muted-foreground">
          <div>
            {t("posts.author")}: {post.authorName}
          </div>
          {post.scheduledAt && !published ? (
            <div className="flex items-center gap-1">
              <CalendarClock className="h-3.5 w-3.5" />
              {t("posts.scheduledFor")}: <span className="tabular-nums">{formatDateTime(post.scheduledAt, locale)}</span>
            </div>
          ) : null}
          {published && post.publishedAt ? (
            <div>
              {t("posts.publishedAt")}: <span className="tabular-nums">{formatDateTime(post.publishedAt, locale)}</span>
            </div>
          ) : null}
          {post.approvalNote ? <div className="text-destructive">{post.approvalNote}</div> : null}
        </div>

        {published ? (
          <div className="flex flex-wrap gap-x-4 gap-y-1 border-t pt-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{formatCompact(post.metrics.impressions, locale)}</span>
            <span className="inline-flex items-center gap-1"><ThumbsUp className="h-3.5 w-3.5" />{formatCompact(post.metrics.likes, locale)}</span>
            <span className="inline-flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" />{formatCompact(post.metrics.comments, locale)}</span>
            <span className="inline-flex items-center gap-1"><Share2 className="h-3.5 w-3.5" />{formatCompact(post.metrics.shares, locale)}</span>
            <span className="inline-flex items-center gap-1"><MousePointerClick className="h-3.5 w-3.5" />{formatCompact(post.metrics.clicks, locale)}</span>
          </div>
        ) : null}

        {error ? <div className="text-xs font-medium text-destructive">{error}</div> : null}
      </CardContent>

      <CardFooter className="flex-wrap gap-2 pt-0">
        {post.status === "PENDING_APPROVAL" && canApprove ? (
          <>
            <Button size="sm" variant="success" disabled={isPending} onClick={() => run(() => reviewPostAction({ postId: post.id, decision: "approve" }))}>
              <CheckCircle2 className="h-3.5 w-3.5" />
              {t("posts.approve")}
            </Button>
            <Button size="sm" variant="outline" className="text-destructive" disabled={isPending} onClick={() => setRejectOpen(true)}>
              <XCircle className="h-3.5 w-3.5" />
              {t("posts.reject")}
            </Button>
          </>
        ) : null}
        {(post.status === "APPROVED" || post.status === "SCHEDULED" || post.status === "DRAFT") && canPublish ? (
          <Button size="sm" variant="outline" disabled={isPending} onClick={() => run(() => publishPostNowAction(post.id))}>
            <Send className="h-3.5 w-3.5" />
            {t("posts.publishNow")}
          </Button>
        ) : null}
        {!published ? (
          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground hover:text-destructive"
            disabled={isPending}
            onClick={() => run(() => deletePostAction(post.id))}
          >
            <Trash2 className="h-3.5 w-3.5" />
            {t("common.delete")}
          </Button>
        ) : null}
      </CardFooter>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("posts.reject")}</DialogTitle>
            <DialogDescription>{t("posts.approvalNote")}</DialogDescription>
          </DialogHeader>
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("posts.approvalNote")} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              disabled={isPending}
              onClick={() => {
                setRejectOpen(false);
                run(() => reviewPostAction({ postId: post.id, decision: "reject", note }));
              }}
            >
              {t("posts.reject")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
