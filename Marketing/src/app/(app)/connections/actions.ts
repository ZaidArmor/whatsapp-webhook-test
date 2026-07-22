"use server";

import { revalidatePath } from "next/cache";
import type { PlatformKind } from "@prisma/client";
import { requirePermission } from "@/lib/auth/workspace";
import { getAdapter, ALL_PLATFORMS } from "@/lib/integrations/registry";
import { logAudit } from "@/lib/audit";

export interface ActionState {
  ok: boolean;
  errorKey?: string;
  syncedCount?: number;
}

function assertPlatform(value: string): PlatformKind {
  if (!ALL_PLATFORMS.includes(value as PlatformKind)) throw new Error("INVALID_PLATFORM");
  return value as PlatformKind;
}

export async function connectAccountAction(platformRaw: string): Promise<ActionState> {
  try {
    const ctx = await requirePermission("manage_connections");
    const platform = assertPlatform(platformRaw);
    const result = await getAdapter(platform).connect(ctx.workspaceId);
    if (!result.success) return { ok: false, errorKey: "common.error" };
    await logAudit({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      action: "CONNECT",
      entityType: "SocialAccount",
      metadata: { platform },
    });
    revalidatePath("/connections");
    return { ok: true };
  } catch (error) {
    return { ok: false, errorKey: error instanceof Error && error.message === "PERMISSION_DENIED" ? "common.permissionDenied" : "common.error" };
  }
}

export async function disconnectAccountAction(platformRaw: string): Promise<ActionState> {
  try {
    const ctx = await requirePermission("manage_connections");
    const platform = assertPlatform(platformRaw);
    const result = await getAdapter(platform).disconnect(ctx.workspaceId);
    if (!result.success) return { ok: false, errorKey: "common.error" };
    await logAudit({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      action: "DISCONNECT",
      entityType: "SocialAccount",
      metadata: { platform },
    });
    revalidatePath("/connections");
    return { ok: true };
  } catch (error) {
    return { ok: false, errorKey: error instanceof Error && error.message === "PERMISSION_DENIED" ? "common.permissionDenied" : "common.error" };
  }
}

export async function syncAccountAction(platformRaw: string): Promise<ActionState> {
  try {
    const ctx = await requirePermission("manage_connections");
    const platform = assertPlatform(platformRaw);
    const adapter = getAdapter(platform);
    const insights = await adapter.fetchInsights(ctx.workspaceId);
    const comments = await adapter.fetchComments(ctx.workspaceId);
    const syncedCount = comments.length + (insights.followers > 0 ? 1 : 0);
    await logAudit({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      action: "UPDATE",
      entityType: "SocialAccount",
      metadata: { platform, sync: true, syncedCount },
    });
    revalidatePath("/connections");
    return { ok: true, syncedCount };
  } catch (error) {
    return { ok: false, errorKey: error instanceof Error && error.message === "PERMISSION_DENIED" ? "common.permissionDenied" : "common.error" };
  }
}
