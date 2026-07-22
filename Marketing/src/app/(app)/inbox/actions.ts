"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { InboxStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/workspace";
import { getAdapter } from "@/lib/integrations/registry";
import { logAudit } from "@/lib/audit";

export interface InboxActionState {
  ok: boolean;
  errorKey?: string;
}

const replySchema = z.object({
  conversationId: z.string().min(1),
  body: z.string().min(1).max(2000),
});

export async function replyAction(input: z.infer<typeof replySchema>): Promise<InboxActionState> {
  let ctx;
  try {
    ctx = await requirePermission("manage_inbox");
  } catch {
    return { ok: false, errorKey: "common.permissionDenied" };
  }

  const parsed = replySchema.safeParse(input);
  if (!parsed.success) return { ok: false, errorKey: "common.error" };

  const conversation = await prisma.conversation.findFirst({
    where: { id: parsed.data.conversationId, workspaceId: ctx.workspaceId },
    include: { socialAccount: { select: { platform: true } } },
  });
  if (!conversation) return { ok: false, errorKey: "common.error" };

  const result = await getAdapter(conversation.socialAccount.platform).sendMessage({
    conversationId: conversation.id,
    body: parsed.data.body,
    senderUserId: ctx.userId,
  });
  if (!result.success) return { ok: false, errorKey: "common.error" };

  // Replying to an open thread implicitly claims it.
  if (conversation.status === "OPEN") {
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { status: "IN_PROGRESS", assignedToId: conversation.assignedToId ?? ctx.userId },
    });
  }

  await logAudit({
    workspaceId: ctx.workspaceId,
    userId: ctx.userId,
    action: "UPDATE",
    entityType: "Conversation",
    entityId: conversation.id,
    metadata: { reply: true },
  });

  revalidatePath("/inbox");
  return { ok: true };
}

const statusSchema = z.object({
  conversationId: z.string().min(1),
  status: z.nativeEnum(InboxStatus),
});

export async function setConversationStatusAction(input: z.infer<typeof statusSchema>): Promise<InboxActionState> {
  let ctx;
  try {
    ctx = await requirePermission("manage_inbox");
  } catch {
    return { ok: false, errorKey: "common.permissionDenied" };
  }

  const parsed = statusSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errorKey: "common.error" };

  const conversation = await prisma.conversation.findFirst({
    where: { id: parsed.data.conversationId, workspaceId: ctx.workspaceId },
  });
  if (!conversation) return { ok: false, errorKey: "common.error" };

  await prisma.conversation.update({ where: { id: conversation.id }, data: { status: parsed.data.status } });
  await logAudit({
    workspaceId: ctx.workspaceId,
    userId: ctx.userId,
    action: "UPDATE",
    entityType: "Conversation",
    entityId: conversation.id,
    metadata: { status: parsed.data.status },
  });

  revalidatePath("/inbox");
  return { ok: true };
}

const assignSchema = z.object({
  conversationId: z.string().min(1),
  userId: z.string().min(1).nullable(),
});

export async function assignConversationAction(input: z.infer<typeof assignSchema>): Promise<InboxActionState> {
  let ctx;
  try {
    ctx = await requirePermission("manage_inbox");
  } catch {
    return { ok: false, errorKey: "common.permissionDenied" };
  }

  const parsed = assignSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errorKey: "common.error" };

  const conversation = await prisma.conversation.findFirst({
    where: { id: parsed.data.conversationId, workspaceId: ctx.workspaceId },
  });
  if (!conversation) return { ok: false, errorKey: "common.error" };

  if (parsed.data.userId) {
    const member = await prisma.workspaceMember.findFirst({
      where: { workspaceId: ctx.workspaceId, userId: parsed.data.userId },
    });
    if (!member) return { ok: false, errorKey: "common.error" };
  }

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { assignedToId: parsed.data.userId },
  });
  await logAudit({
    workspaceId: ctx.workspaceId,
    userId: ctx.userId,
    action: "UPDATE",
    entityType: "Conversation",
    entityId: conversation.id,
    metadata: { assignedTo: parsed.data.userId },
  });

  revalidatePath("/inbox");
  return { ok: true };
}
