"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getWorkspaceContext } from "@/lib/auth/workspace";
import { logAudit } from "@/lib/audit";

export interface SettingsActionState {
  ok: boolean;
  errorKey?: string;
}

const profileSchema = z.object({ name: z.string().min(2).max(80) });

export async function updateProfileAction(input: z.infer<typeof profileSchema>): Promise<SettingsActionState> {
  let ctx;
  try {
    ctx = await getWorkspaceContext();
  } catch {
    return { ok: false, errorKey: "common.permissionDenied" };
  }

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errorKey: "common.error" };

  await prisma.user.update({ where: { id: ctx.userId }, data: { name: parsed.data.name } });
  await logAudit({ workspaceId: ctx.workspaceId, userId: ctx.userId, action: "UPDATE", entityType: "User", entityId: ctx.userId });

  revalidatePath("/settings");
  return { ok: true };
}

const NOTIFY_KEYS = ["approvals", "inbox", "alerts"] as const;
const notifySchema = z.object({
  key: z.enum(NOTIFY_KEYS),
  enabled: z.boolean(),
});

/** Per-browser notification preferences (cookie-backed in mock mode). */
export async function setNotificationPrefAction(input: z.infer<typeof notifySchema>): Promise<SettingsActionState> {
  try {
    await getWorkspaceContext();
  } catch {
    return { ok: false, errorKey: "common.permissionDenied" };
  }

  const parsed = notifySchema.safeParse(input);
  if (!parsed.success) return { ok: false, errorKey: "common.error" };

  const store = await cookies();
  store.set(`mktg_notify_${parsed.data.key}`, parsed.data.enabled ? "1" : "0", {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath("/settings");
  return { ok: true };
}
