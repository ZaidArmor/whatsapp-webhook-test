"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { InsightStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/workspace";
import { runInsightsEngine } from "@/lib/insights/engine";
import { logAudit } from "@/lib/audit";

export interface InsightActionState {
  ok: boolean;
  errorKey?: string;
  created?: number;
  scanned?: number;
}

export async function runInsightsAction(): Promise<InsightActionState> {
  let ctx;
  try {
    ctx = await requirePermission("run_insights");
  } catch {
    return { ok: false, errorKey: "common.permissionDenied" };
  }

  const result = await runInsightsEngine(ctx.workspaceId);

  await logAudit({
    workspaceId: ctx.workspaceId,
    userId: ctx.userId,
    action: "CREATE",
    entityType: "Insight",
    metadata: result,
  });

  revalidatePath("/insights");
  return { ok: true, ...result };
}

const statusSchema = z.object({
  insightId: z.string().min(1),
  status: z.nativeEnum(InsightStatus),
});

export async function setInsightStatusAction(input: z.infer<typeof statusSchema>): Promise<InsightActionState> {
  let ctx;
  try {
    ctx = await requirePermission("run_insights");
  } catch {
    return { ok: false, errorKey: "common.permissionDenied" };
  }

  const parsed = statusSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errorKey: "common.error" };

  const insight = await prisma.insight.findFirst({
    where: { id: parsed.data.insightId, workspaceId: ctx.workspaceId },
  });
  if (!insight) return { ok: false, errorKey: "common.error" };

  await prisma.insight.update({ where: { id: insight.id }, data: { status: parsed.data.status } });

  revalidatePath("/insights");
  return { ok: true };
}
