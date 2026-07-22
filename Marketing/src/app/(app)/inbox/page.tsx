import Link from "next/link";
import { MessageSquareText } from "lucide-react";
import type { ConversationKind, InboxStatus, PlatformKind } from "@prisma/client";
import { getT } from "@/lib/i18n/server";
import { requirePermission } from "@/lib/auth/workspace";
import { getConversations, getConversation, getInboxStatusCounts, getAssignableMembers } from "@/lib/data/inbox";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { PlatformIcon } from "@/components/shared/platform-icon";
import { ConversationPanel, type ConversationDetail } from "@/components/inbox/conversation-panel";
import { cn, formatTime } from "@/lib/utils";

const STATUSES: InboxStatus[] = ["OPEN", "IN_PROGRESS", "CLOSED"];
const KINDS: ConversationKind[] = ["COMMENT", "MESSAGE"];

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function InboxPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { t, locale } = await getT();
  const ctx = await requirePermission("manage_inbox");

  const status = STATUSES.includes(params.status as InboxStatus) ? (params.status as InboxStatus) : undefined;
  const kind = KINDS.includes(params.kind as ConversationKind) ? (params.kind as ConversationKind) : undefined;

  const [conversations, counts, members] = await Promise.all([
    getConversations(ctx.workspaceId, { status, kind, platform: params.platform as PlatformKind | undefined }),
    getInboxStatusCounts(ctx.workspaceId),
    getAssignableMembers(ctx.workspaceId),
  ]);

  const selectedId = params.c ?? conversations[0]?.id;
  const selected = selectedId ? await getConversation(ctx.workspaceId, selectedId) : null;

  const detail: ConversationDetail | null = selected
    ? {
        id: selected.id,
        kind: selected.kind,
        status: selected.status,
        authorName: selected.authorName,
        authorHandle: selected.authorHandle,
        platform: selected.socialAccount.platform,
        accountHandle: selected.socialAccount.handle,
        assignedToId: selected.assignedTo?.id ?? null,
        postBody: selected.postTarget?.post.body ?? null,
        messages: selected.messages.map((message) => ({
          id: message.id,
          direction: message.direction,
          body: message.body,
          sentAt: message.sentAt.toISOString(),
          sentByName: message.sentBy?.name ?? null,
        })),
      }
    : null;

  const totalCount = Object.values(counts).reduce((s, n) => s + n, 0);

  const filterHref = (nextStatus?: InboxStatus, nextKind?: ConversationKind) => {
    const query = new URLSearchParams();
    if (nextStatus) query.set("status", nextStatus);
    if (nextKind) query.set("kind", nextKind);
    const qs = query.toString();
    return qs ? `/inbox?${qs}` : "/inbox";
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{t("inbox.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("inbox.subtitle")}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterChip href={filterHref(undefined, kind)} active={!status} label={t("common.all")} count={totalCount} />
        {STATUSES.map((s) => (
          <FilterChip key={s} href={filterHref(s, kind)} active={status === s} label={t(`inbox.statuses.${s}`)} count={counts[s] ?? 0} />
        ))}
        <span className="mx-1 border-s" />
        {KINDS.map((k) => (
          <FilterChip key={k} href={filterHref(status, kind === k ? undefined : k)} active={kind === k} label={t(`inbox.kinds.${k}`)} />
        ))}
      </div>

      <div className="grid h-[calc(100vh-16rem)] min-h-[480px] grid-cols-1 overflow-hidden rounded-xl border bg-card lg:grid-cols-[340px_1fr]">
        <div className="overflow-y-auto border-e">
          {conversations.length === 0 ? (
            <EmptyState title={t("inbox.emptyInbox")} className="h-full" />
          ) : (
            conversations.map((conversation) => {
              const lastMessage = conversation.messages[0];
              const isActive = conversation.id === selectedId;
              return (
                <Link
                  key={conversation.id}
                  href={`/inbox?${new URLSearchParams({
                    ...(status ? { status } : {}),
                    ...(kind ? { kind } : {}),
                    c: conversation.id,
                  }).toString()}`}
                  className={cn(
                    "flex gap-3 border-b p-3 transition-colors hover:bg-muted/60",
                    isActive && "bg-muted"
                  )}
                >
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarFallback>{conversation.authorName.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-medium">{conversation.authorName}</span>
                      <PlatformIcon platform={conversation.socialAccount.platform} className="h-3 w-3" />
                      <span className="ms-auto text-[10px] tabular-nums text-muted-foreground">
                        {formatTime(conversation.lastMessageAt, locale)}
                      </span>
                    </div>
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{lastMessage?.body}</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <Badge
                        variant={conversation.status === "OPEN" ? "warning" : conversation.status === "IN_PROGRESS" ? "default" : "muted"}
                        className="px-1.5 py-0 text-[10px]"
                      >
                        {t(`inbox.statuses.${conversation.status}`)}
                      </Badge>
                      {conversation.assignedTo ? (
                        <span className="truncate text-[10px] text-muted-foreground">{conversation.assignedTo.name}</span>
                      ) : null}
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>

        <div className="hidden lg:block">
          {detail ? (
            <ConversationPanel conversation={detail} members={members} />
          ) : (
            <EmptyState icon={<MessageSquareText className="h-5 w-5" />} title={t("inbox.selectConversation")} className="h-full" />
          )}
        </div>
      </div>
    </div>
  );
}

function FilterChip({ href, active, label, count }: { href: string; active: boolean; label: string; count?: number }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        active ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted"
      )}
    >
      {label}
      {typeof count === "number" ? (
        <Badge variant={active ? "secondary" : "muted"} className="px-1.5 py-0 text-[10px]">
          {count}
        </Badge>
      ) : null}
    </Link>
  );
}
