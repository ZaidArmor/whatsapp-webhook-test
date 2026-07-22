"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ReportKind } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/workspace";
import { logAudit } from "@/lib/audit";

export interface ReportActionState {
  ok: boolean;
  errorKey?: string;
}

const scheduleSchema = z.object({ kind: z.nativeEnum(ReportKind) });

/** Registers a monthly scheduled report (config record only — no real cron in mock mode). */
export async function scheduleMonthlyReportAction(input: z.infer<typeof scheduleSchema>): Promise<ReportActionState> {
  let ctx;
  try {
    ctx = await requirePermission("view_reports");
  } catch {
    return { ok: false, errorKey: "common.permissionDenied" };
  }

  const parsed = scheduleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errorKey: "common.error" };

  const existing = await prisma.report.findFirst({
    where: { workspaceId: ctx.workspaceId, kind: parsed.data.kind, scheduleCron: { not: null } },
  });
  if (!existing) {
    // TODO: connect real API here — hook a real scheduler (cron/queue) that
    // generates and emails the report when this record's cron fires.
    await prisma.report.create({
      data: {
        workspaceId: ctx.workspaceId,
        name: parsed.data.kind,
        kind: parsed.data.kind,
        scheduleCron: "0 9 1 * *",
        lastGeneratedAt: new Date(),
      },
    });
    await logAudit({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      action: "CREATE",
      entityType: "Report",
      metadata: { kind: parsed.data.kind, scheduled: true },
    });
  }

  revalidatePath("/reports");
  return { ok: true };
}
