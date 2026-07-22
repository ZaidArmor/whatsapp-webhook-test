import type { ConversationKind, InboxStatus, PlatformKind } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { roleHasPermission } from "@/lib/auth/permissions";

export interface InboxFilters {
  status?: InboxStatus;
  kind?: ConversationKind;
  platform?: PlatformKind;
}

export async function getConversations(workspaceId: string, filters: InboxFilters) {
  return prisma.conversation.findMany({
    where: {
      workspaceId,
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.kind ? { kind: filters.kind } : {}),
      ...(filters.platform ? { socialAccount: { platform: filters.platform } } : {}),
    },
    include: {
      socialAccount: { select: { platform: true, handle: true } },
      assignedTo: { select: { id: true, name: true } },
      messages: { orderBy: { sentAt: "desc" }, take: 1 },
    },
    orderBy: { lastMessageAt: "desc" },
    take: 60,
  });
}

export async function getConversation(workspaceId: string, id: string) {
  return prisma.conversation.findFirst({
    where: { id, workspaceId },
    include: {
      socialAccount: { select: { platform: true, handle: true, displayName: true } },
      assignedTo: { select: { id: true, name: true } },
      postTarget: { include: { post: { select: { id: true, body: true } } } },
      messages: { orderBy: { sentAt: "asc" }, include: { sentBy: { select: { name: true } } } },
    },
  });
}

export async function getInboxStatusCounts(workspaceId: string): Promise<Record<string, number>> {
  const groups = await prisma.conversation.groupBy({
    by: ["status"],
    where: { workspaceId },
    _count: { _all: true },
  });
  return Object.fromEntries(groups.map((g) => [g.status, g._count._all]));
}

/** Members whose role can work the inbox — the assignable pool. */
export async function getAssignableMembers(workspaceId: string) {
  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId },
    include: { user: { select: { id: true, name: true } } },
  });
  return members
    .filter((m) => roleHasPermission(m.role, "manage_inbox"))
    .map((m) => ({ id: m.user.id, name: m.user.name }));
}
