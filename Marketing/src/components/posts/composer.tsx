"use client";

import { useMemo, useState, useTransition } from "react";
import { Send, CalendarClock, FileEdit, CheckSquare, ImagePlus } from "lucide-react";
import type { MediaKind, PlatformKind } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { PlatformIcon } from "@/components/shared/platform-icon";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import { composePostAction, type ComposeInput } from "@/app/(app)/posts/actions";

interface AccountOption {
  id: string;
  platform: PlatformKind;
  handle: string;
  displayName: string;
}

interface MediaOption {
  id: string;
  url: string;
  fileName: string;
  kind: MediaKind;
}

interface ComposerProps {
  accounts: AccountOption[];
  media: MediaOption[];
  canPublish: boolean;
}

/** Platform character caps used for the live counter (X is the binding one). */
const CHAR_LIMITS: Partial<Record<PlatformKind, number>> = {
  X_TWITTER: 280,
  INSTAGRAM: 2200,
  FACEBOOK: 63206,
  TIKTOK: 2200,
  LINKEDIN: 3000,
  SNAPCHAT: 250,
  YOUTUBE: 5000,
};

export function Composer({ accounts, media, canPublish }: ComposerProps) {
  const { t } = useT();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<string[]>([]);
  const [scheduledAt, setScheduledAt] = useState("");
  const [error, setError] = useState<string | null>(null);

  const minLimit = useMemo(() => {
    const limits = selectedAccounts
      .map((id) => accounts.find((a) => a.id === id)?.platform)
      .map((p) => (p ? CHAR_LIMITS[p] : undefined))
      .filter((n): n is number => typeof n === "number");
    return limits.length > 0 ? Math.min(...limits) : null;
  }, [selectedAccounts, accounts]);

  const overLimit = minLimit !== null && body.length > minLimit;

  const toggle = (list: string[], id: string, max?: number) => {
    if (list.includes(id)) return list.filter((x) => x !== id);
    if (max && list.length >= max) return list;
    return [...list, id];
  };

  const submit = (mode: ComposeInput["mode"]) => {
    setError(null);
    if (!body.trim()) return setError(t("posts.bodyRequired"));
    if (selectedAccounts.length === 0) return setError(t("posts.accountsRequired"));
    if (mode === "schedule" && !scheduledAt) return setError(t("posts.scheduleAt"));

    startTransition(async () => {
      const result = await composePostAction({
        title: title || undefined,
        body,
        accountIds: selectedAccounts,
        mediaIds: selectedMedia,
        mode,
        scheduledAt: mode === "schedule" ? new Date(scheduledAt).toISOString() : undefined,
      });
      // On success the action redirects; reaching here means failure.
      if (result && !result.ok) setError(t(result.errorKey ?? "common.error"));
    });
  };

  const selectedPlatforms = [...new Set(selectedAccounts.map((id) => accounts.find((a) => a.id === id)?.platform).filter(Boolean))] as PlatformKind[];

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="space-y-1.5">
            <Label htmlFor="post-title">{t("posts.postTitle")}</Label>
            <Input id="post-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="post-body">{t("posts.postBody")}</Label>
            <textarea
              id="post-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <div dir="ltr" className={cn("text-end text-xs tabular-nums", overLimit ? "font-medium text-destructive" : "text-muted-foreground")}>
              {body.length}
              {minLimit !== null ? ` / ${minLimit}` : null}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">{t("posts.selectAccounts")}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {accounts.map((account) => {
            const checked = selectedAccounts.includes(account.id);
            return (
              <label
                key={account.id}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors",
                  checked ? "border-primary bg-primary/5" : "hover:bg-muted"
                )}
              >
                <Checkbox checked={checked} onCheckedChange={() => setSelectedAccounts((prev) => toggle(prev, account.id))} />
                <PlatformIcon platform={account.platform} className="h-4 w-4" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{t(`platforms.${account.platform}`)}</span>
                  <span className="block truncate text-xs text-muted-foreground" dir="ltr">
                    {account.handle}
                  </span>
                </span>
              </label>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <ImagePlus className="h-4 w-4 text-accent" />
            {t("posts.media")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {media.map((asset) => {
            const checked = selectedMedia.includes(asset.id);
            return (
              <button
                key={asset.id}
                type="button"
                onClick={() => setSelectedMedia((prev) => toggle(prev, asset.id, 4))}
                className={cn(
                  "relative h-20 w-20 overflow-hidden rounded-lg border-2 transition-all",
                  checked ? "border-primary ring-2 ring-primary/30" : "border-transparent hover:border-muted-foreground/30"
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={asset.url} alt={asset.fileName} className="h-full w-full object-cover" />
                {checked ? (
                  <span className="absolute end-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <CheckSquare className="h-3 w-3" />
                  </span>
                ) : null}
              </button>
            );
          })}
        </CardContent>
      </Card>

      {selectedPlatforms.length > 0 && body ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{t("posts.preview")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {selectedPlatforms.slice(0, 3).map((platform) => (
              <div key={platform} className="rounded-lg border p-3">
                <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <PlatformIcon platform={platform} className="h-3.5 w-3.5" />
                  {t("posts.previewFor", { platform: t(`platforms.${platform}`) })}
                  {CHAR_LIMITS[platform] && body.length > CHAR_LIMITS[platform]! ? (
                    <Badge variant="destructive" className="text-[10px]">
                      {body.length} / {CHAR_LIMITS[platform]}
                    </Badge>
                  ) : null}
                </div>
                <p className="whitespace-pre-line text-sm leading-6">
                  {CHAR_LIMITS[platform] ? body.slice(0, CHAR_LIMITS[platform]) : body}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="post-schedule">{t("posts.scheduleAt")}</Label>
              <Input
                id="post-schedule"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-56"
              />
            </div>
          </div>

          {error ? <div className="text-sm font-medium text-destructive">{error}</div> : null}

          <div className="flex flex-wrap gap-2">
            {canPublish ? (
              <>
                <Button disabled={isPending || overLimit} onClick={() => submit("publish")}>
                  <Send className="h-4 w-4" />
                  {t("posts.publishNow")}
                </Button>
                <Button variant="secondary" disabled={isPending || overLimit || !scheduledAt} onClick={() => submit("schedule")}>
                  <CalendarClock className="h-4 w-4" />
                  {t("posts.schedule")}
                </Button>
              </>
            ) : null}
            <Button variant="outline" disabled={isPending} onClick={() => submit("approval")}>
              <CheckSquare className="h-4 w-4" />
              {t("posts.submitForApproval")}
            </Button>
            <Button variant="ghost" disabled={isPending} onClick={() => submit("draft")}>
              <FileEdit className="h-4 w-4" />
              {t("posts.saveDraft")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
