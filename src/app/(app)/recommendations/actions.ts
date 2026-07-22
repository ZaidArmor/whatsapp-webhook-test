"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { PermissionKey, RecommendationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth";
import { runAnalysisEngine } from "@/lib/analysis/engine";

async function requirePermission(permission: PermissionKey) {
  const session = await auth();
  if (!session?.user || !session.user.permissions.includes(permission)) {
    throw new Error("PERMISSION_DENIED");
  }
  return session.user;
}

export async function runAnalysisAction() {
  await requirePermission(PermissionKey.EDIT_ANALYSIS_SETTINGS);
  const summary = await runAnalysisEngine();
  revalidatePath("/recommendations");
  revalidatePath("/alerts");
  revalidatePath("/dashboard");
  return summary;
}

const updateStatusSchema = z.object({
  id: z.string().min(1),
  status: z.nativeEnum(RecommendationStatus),
});

export async function updateRecommendationStatusAction(input: z.infer<typeof updateStatusSchema>) {
  await requirePermission(PermissionKey.VIEW_DASHBOARD);
  const { id, status } = updateStatusSchema.parse(input);
  await prisma.recommendation.update({ where: { id }, data: { status } });
  revalidatePath("/recommendations");
}

const assignSchema = z.object({ id: z.string().min(1), assigneeId: z.string().nullable() });

export async function assignRecommendationAction(input: z.infer<typeof assignSchema>) {
  await requirePermission(PermissionKey.VIEW_DASHBOARD);
  const { id, assigneeId } = assignSchema.parse(input);
  await prisma.recommendation.update({ where: { id }, data: { assigneeId } });
  revalidatePath("/recommendations");
}
