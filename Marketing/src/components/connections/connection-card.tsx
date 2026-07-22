"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Link2, Link2Off, RefreshCw, Users } from "lucide-react";
import type { PlatformKind } from "@prisma/client";
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
import { PlatformIcon } from "@/components/shared/platform-icon";
import { useT } from "@/lib/i18n/client";
import { cn, formatCompact, formatDateTime } from "@/lib/utils";
import { connectAccountAction, disconnectAccountAction, syncAccountAction } from "@/app/(app)/connections/actions";

export interface ConnectionInfo {
  platform: PlatformKind;
  status: "CONNECTED" | "DISCONNECTED" | "EXPIRED" | "ERROR" | "NONE";
  handle: string | null;
  displayName: string | null;
  followers: number;
  lastSyncAt: string | null;
  tokenExpiresAt: string | null;
  externalId: string | null;
  errorMessage: string | null;
}

interface ConnectionCardProps {
  info: ConnectionInfo;
  canManage: boolean;
}

export function ConnectionCard({ info, canManage }: ConnectionCardProps) {
  const { t, locale } = useT();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; ok: boolean } | null>(null);

  const connected = info.status === "CONNECTED";

  const run = (action: () => Promise<{ ok: boolean; errorKey?: string; syncedCount?: number }>, doneKey?: string) => {
    setFeedback(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setFeedback({ text: t(result.errorKey ?? "common.error"), ok: false });
      } else if (doneKey) {
        setFeedback({ text: t(doneKey, { count: String(result.syncedCount ?? 0) }), ok: true });
      }
      router.refresh();
    });
  };

  const statusBadge = () => {
    switch (info.status) {
      case "CONNECTED":
        return <Badge variant="success">{t("connections.connected")}</Badge>;
      case "EXPIRED":
        return <Badge variant="warning">{t("connections.expired")}</Badge>;
      case "ERROR":
        return <Badge variant="destructive">{t("connections.error")}</Badge>;
      default:
        return <Badge variant="muted">{t("connections.disconnected")}</Badge>;
    }
  };

  return (
    <Card className={cn("flex h-full flex-col", !connected && "opacity-90")}>
      <CardHeader className="flex-row items-center gap-3 space-y-0 pb-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
          <PlatformIcon platform={info.platform} className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{t(`platforms.${info.platform}`)}</div>
          {info.handle ? <div className="truncate text-xs text-muted-foreground" dir="ltr">{info.handle}</div> : null}
        </div>
        {statusBadge()}
      </CardHeader>

      <CardContent className="flex-1 space-y-2 text-xs text-muted-foreground">
        {connected ? (
          <>
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              <span>{t("connections.followersCount", { count: formatCompact(info.followers, locale) })}</span>
            </div>
            {info.lastSyncAt ? (
              <div>
                {t("connections.lastSync")}: <span className="tabular-nums">{formatDateTime(info.lastSyncAt, locale)}</span>
              </div>
            ) : null}
            {info.tokenExpiresAt ? (
              <div>
                {t("connections.tokenExpires")}: <span className="tabular-nums">{formatDateTime(info.tokenExpiresAt, locale)}</span>
              </div>
            ) : null}
            {info.externalId ? (
              <div className="truncate">
                {t("connections.accountId")}: <span dir="ltr">{info.externalId}</span>
              </div>
            ) : null}
          </>
        ) : (
          <div>{t("common.notConnectedYet")}</div>
        )}
        {info.errorMessage ? <div className="text-destructive">{info.errorMessage}</div> : null}
        {feedback ? <div className={cn("font-medium", feedback.ok ? "text-success" : "text-destructive")}>{feedback.text}</div> : null}
      </CardContent>

      {canManage ? (
        <CardFooter className="gap-2 pt-0">
          {connected ? (
            <>
              <Button size="sm" variant="outline" disabled={isPending} onClick={() => run(() => syncAccountAction(info.platform), "connections.syncDone")}>
                <RefreshCw className={cn("h-3.5 w-3.5", isPending && "animate-spin")} />
                {t("connections.sync")}
              </Button>
              <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" disabled={isPending} onClick={() => setConfirmOpen(true)}>
                <Link2Off className="h-3.5 w-3.5" />
                {t("connections.disconnect")}
              </Button>
            </>
          ) : (
            <Button size="sm" disabled={isPending} onClick={() => run(() => connectAccountAction(info.platform))}>
              <Link2 className="h-3.5 w-3.5" />
              {info.status === "NONE" ? t("connections.connect") : t("connections.reconnect")}
            </Button>
          )}
        </CardFooter>
      ) : null}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("connections.disconnectConfirmTitle")}</DialogTitle>
            <DialogDescription>{t("connections.disconnectConfirmBody")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              disabled={isPending}
              onClick={() => {
                setConfirmOpen(false);
                run(() => disconnectAccountAction(info.platform));
              }}
            >
              {t("connections.disconnect")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
