"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AdCampaignStatus, AdObjective, PlatformKind } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/workspace";
import { getAdapter } from "@/lib/integrations/registry";
import { logAudit } from "@/lib/audit";

export interface AdsActionState {
  ok: boolean;
  errorKey?: string;
  campaignId?: string;
}

const createSchema = z.object({
  name: z.string().min(2).max(150),
  platform: z.nativeEnum(PlatformKind),
  objective: z.nativeEnum(AdObjective),
  budget: z.number().positive().max(10_000_000),
  startDate: z.string().datetime(),
  audience: z.string().max(300).optional(),
});

export async function createCampaignAction(input: z.infer<typeof createSchema>): Promise<AdsActionState> {
  let ctx;
  try {
    ctx = await requirePermission("manage_ads");
  } catch {
    return { ok: false, errorKey: "common.permissionDenied" };
  }

  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errorKey: "common.error" };
  const data = parsed.data;

  const summary = await getAdapter(data.platform).createAdCampaign({
    workspaceId: ctx.workspaceId,
    name: data.name,
    objective: data.objective,
    budget: data.budget,
    startDate: new Date(data.startDate),
    audience: data.audience,
  });

  await logAudit({
    workspaceId: ctx.workspaceId,
    userId: ctx.userId,
    action: "CREATE",
    entityType: "AdCampaign",
    entityId: summary.id,
    metadata: { platform: data.platform, budget: data.budget },
  });

  revalidatePath("/ads");
  return { ok: true, campaignId: summary.id };
}

const statusSchema = z.object({
  campaignId: z.string().min(1),
  status: z.nativeEnum(AdCampaignStatus),
});

export async function setCampaignStatusAction(input: z.infer<typeof statusSchema>): Promise<AdsActionState> {
  let ctx;
  try {
    ctx = await requirePermission("manage_ads");
  } catch {
    return { ok: false, errorKey: "common.permissionDenied" };
  }

  const parsed = statusSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errorKey: "common.error" };

  const campaign = await prisma.adCampaign.findFirst({
    where: { id: parsed.data.campaignId, workspaceId: ctx.workspaceId, deletedAt: null },
  });
  if (!campaign) return { ok: false, errorKey: "common.error" };

  // TODO: connect real API here — pausing/activating must also hit the
  // platform's ads API through the adapter once real credentials exist.
  await prisma.adCampaign.update({ where: { id: campaign.id }, data: { status: parsed.data.status } });

  await logAudit({
    workspaceId: ctx.workspaceId,
    userId: ctx.userId,
    action: "UPDATE",
    entityType: "AdCampaign",
    entityId: campaign.id,
    metadata: { status: parsed.data.status },
  });

  revalidatePath("/ads");
  revalidatePath(`/ads/${campaign.id}`);
  return { ok: true };
}
