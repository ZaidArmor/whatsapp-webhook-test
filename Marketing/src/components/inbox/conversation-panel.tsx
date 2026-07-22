"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send, CircleDot, CheckCircle2, RotateCcw, UserRound } from "lucide-react";
import type { ConversationKind, InboxStatus, PlatformKind } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlatformIcon } from "@/components/shared/platform-icon";
import { useT } from "@/lib/i18n/client";
import { cn, formatDateTime } from "@/lib/utils";
import { replyAction, setConversationStatusAction, assignConversationAction } from "@/app/(app)/inbox/actions";

export interface ConversationDetail {
  id: string;
  kind: ConversationKind;
  status: InboxStatus;
  authorName: string;
  authorHandle: string;
  platform: PlatformKind;
  accountHandle: string;
  assignedToId: string | null;
  postBody: string | null;
  messages: Array<{
    id: string;
    direction: "INBOUND" | "OUTBOUND";
    body: string;
    sentAt: string;
    sentByName: string | null;
  }>;
}

interface ConversationPanelProps {
  conversation: ConversationDetail;
  members: Array<{ id: string; name: string }>;
}

const UNASSIGNED = "__none__";

export function ConversationPanel({ conversation, members }: ConversationPanelProps) {
  const { t, locale } = useT();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [reply, setReply] = useState("");
  const [feedback, setFeedback] = useState<{ text: string; ok: boolean } | null>(null);

  const run = (action: () => Promise<{ ok: boolean; errorKey?: string }>, successKey?: string) => {
    setFeedback(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setFeedback({ text: t(result.errorKey ?? "common.error"), ok: false });
      else if (successKey) setFeedback({ text: t(successKey), ok: true });
      router.refresh();
    });
  };

  const sendReply = () => {
    if (!reply.trim()) return;
    const body = reply;
    setReply("");
    run(() => replyAction({ conversationId: conversation.id, body }), "inbox.replySent");
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b p-4">
        <Avatar className="h-9 w-9">
          <AvatarFallback>{conversation.authorName.slice(0, 2)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold">{conversation.authorName}</span>
            <PlatformIcon platform={conversation.platform} className="h-3.5 w-3.5" />
          </div>
          <div className="truncate text-xs text-muted-foreground" dir="ltr">
            {conversation.authorHandle}
          </div>
        </div>
        <Badge variant={conversation.status === "OPEN" ? "warning" : conversation.status === "IN_PROGRESS" ? "default" : "muted"}>
          {t(`inbox.statuses.${conversation.status}`)}
        </Badge>
        <Badge variant="outline">{t(`inbox.kinds.${conversation.kind}`)}</Badge>
      </div>

      {conversation.postBody ? (
        <div className="border-b bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
          <span className="font-medium">{t("inbox.onPost")}: </span>
          <span className="line-clamp-1">{conversation.postBody}</span>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 border-b p-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <UserRound className="h-3.5 w-3.5" />
          {t("inbox.assignTo")}
        </div>
        <Select
          value={conversation.assignedToId ?? UNASSIGNED}
          onValueChange={(value) =>
            run(() => assignConversationAction({ conversationId: conversation.id, userId: value === UNASSIGNED ? null : value }))
          }
        >
          <SelectTrigger className="h-8 w-44 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UNASSIGNED}>{t("inbox.unassigned")}</SelectItem>
            {members.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {member.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="ms-auto flex gap-2">
          {conversation.status !== "IN_PROGRESS" && conversation.status !== "CLOSED" ? (
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => run(() => setConversationStatusAction({ conversationId: conversation.id, status: "IN_PROGRESS" }))}
            >
              <CircleDot className="h-3.5 w-3.5" />
              {t("inbox.markInProgress")}
            </Button>
          ) : null}
          {conversation.status !== "CLOSED" ? (
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => run(() => setConversationStatusAction({ conversationId: conversation.id, status: "CLOSED" }))}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {t("inbox.markClosed")}
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => run(() => setConversationStatusAction({ conversationId: conversation.id, status: "OPEN" }))}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {t("inbox.reopen")}
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {conversation.messages.map((message) => (
          <div key={message.id} className={cn("flex", message.direction === "OUTBOUND" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm leading-6",
                message.direction === "OUTBOUND" ? "rounded-es-md bg-primary text-primary-foreground" : "rounded-ss-md bg-muted"
              )}
            >
              <p className="whitespace-pre-line">{message.body}</p>
              <div
                className={cn(
                  "mt-1 text-[10px] tabular-nums",
                  message.direction === "OUTBOUND" ? "text-primary-foreground/70" : "text-muted-foreground"
                )}
              >
                {message.sentByName ? `${message.sentByName} · ` : null}
                {formatDateTime(message.sentAt, locale)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {feedback ? (
        <div className={cn("px-4 pb-1 text-xs font-medium", feedback.ok ? "text-success" : "text-destructive")}>{feedback.text}</div>
      ) : null}

      <div className="flex items-end gap-2 border-t p-3">
        <textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendReply();
            }
          }}
          placeholder={t("inbox.replyPlaceholder")}
          rows={2}
          className="flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <Button disabled={isPending || !reply.trim()} onClick={sendReply}>
          <Send className="h-4 w-4" />
          {t("inbox.send")}
        </Button>
      </div>
    </div>
  );
}
