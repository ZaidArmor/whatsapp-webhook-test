"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { WorkspaceRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/workspace";
import { logAudit } from "@/lib/audit";

export interface TeamActionState {
  ok: boolean;
  errorKey?: string;
}

const workspaceSchema = z.object({ name: z.string().min(2).max(80) });

export async function createWorkspaceAction(input: z.infer<typeof workspaceSchema>): Promise<TeamActionState> {
  let ctx;
  try {
    ctx = await requirePermission("manage_team");
  } catch {
    return { ok: false, errorKey: "common.permissionDenied" };
  }

  const parsed = workspaceSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errorKey: "common.error" };

  const slug =
    parsed.data.name
      .toLowerCase()
      .replace(/[^a-z0-9؀-ۿ]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || `ws-${Date.now()}`;

  const workspace = await prisma.workspace.create({
    data: {
      name: parsed.data.name,
      slug: `${slug}-${Math.random().toString(36).slice(2, 6)}`,
      members: { create: { userId: ctx.userId, role: "OWNER" } },
    },
  });

  await logAudit({
    workspaceId: workspace.id,
    userId: ctx.userId,
    action: "CREATE",
    entityType: "Workspace",
    entityId: workspace.id,
  });

  revalidatePath("/team");
  return { ok: true };
}

const memberSchema = z.object({
  email: z.string().email().max(160),
  role: z.nativeEnum(WorkspaceRole),
});

export async function addMemberAction(input: z.infer<typeof memberSchema>): Promise<TeamActionState> {
  let ctx;
  try {
    ctx = await requirePermission("manage_team");
  } catch {
    return { ok: false, errorKey: "common.permissionDenied" };
  }

  const parsed = memberSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errorKey: "common.error" };

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (!user) return { ok: false, errorKey: "common.noResults" };

  await prisma.workspaceMember.upsert({
    where: { workspaceId_userId: { workspaceId: ctx.workspaceId, userId: user.id } },
    create: { workspaceId: ctx.workspaceId, userId: user.id, role: parsed.data.role },
    update: { role: parsed.data.role },
  });

  await logAudit({
    workspaceId: ctx.workspaceId,
    userId: ctx.userId,
    action: "UPDATE",
    entityType: "WorkspaceMember",
    entityId: user.id,
    metadata: { role: parsed.data.role },
  });

  revalidatePath("/team");
  return { ok: true };
}

const removeSchema = z.object({ userId: z.string().min(1) });

export async function removeMemberAction(input: z.infer<typeof removeSchema>): Promise<TeamActionState> {
  let ctx;
  try {
    ctx = await requirePermission("manage_team");
  } catch {
    return { ok: false, errorKey: "common.permissionDenied" };
  }

  const parsed = removeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errorKey: "common.error" };
  // Never allow removing yourself — avoids locking the workspace out.
  if (parsed.data.userId === ctx.userId) return { ok: false, errorKey: "common.error" };

  const member = await prisma.workspaceMember.findFirst({
    where: { workspaceId: ctx.workspaceId, userId: parsed.data.userId },
  });
  if (!member) return { ok: false, errorKey: "common.error" };
  if (member.role === "OWNER") return { ok: false, errorKey: "common.permissionDenied" };

  await prisma.workspaceMember.delete({ where: { id: member.id } });

  await logAudit({
    workspaceId: ctx.workspaceId,
    userId: ctx.userId,
    action: "DELETE",
    entityType: "WorkspaceMember",
    entityId: parsed.data.userId,
  });

  revalidatePath("/team");
  return { ok: true };
}
