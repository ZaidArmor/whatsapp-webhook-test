"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { PermissionKey } from "@prisma/client";
import { auth } from "@/lib/auth/auth";
import { saveThresholds } from "@/lib/analysis/thresholds";

async function requirePermission(permission: PermissionKey) {
  const session = await auth();
  if (!session?.user || !session.user.permissions.includes(permission)) {
    throw new Error("PERMISSION_DENIED");
  }
  return session.user;
}

const thresholdsSchema = z.object({
  targetCpl: z.number().min(0),
  targetCac: z.number().min(0),
  targetRoas: z.number().min(0),
  minCtr: z.number().min(0),
  maxCpm: z.number().min(0),
  maxFrequency: z.number().min(0),
  targetConversionRate: z.number().min(0),
  minDataPoints: z.number().min(0),
});

export async function saveThresholdsAction(input: z.infer<typeof thresholdsSchema>) {
  await requirePermission(PermissionKey.EDIT_ANALYSIS_SETTINGS);
  const thresholds = thresholdsSchema.parse(input);
  await saveThresholds(thresholds);
  revalidatePath("/settings");
}
