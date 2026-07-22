"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { PipelineStage, PlatformKind } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/workspace";
import { logAudit } from "@/lib/audit";

export interface CrmActionState {
  ok: boolean;
  errorKey?: string;
  contactId?: string;
}

const createSchema = z.object({
  name: z.string().min(2).max(120),
  phone: z.string().max(20).optional(),
  email: z.string().email().max(160).optional().or(z.literal("")),
  source: z.nativeEnum(PlatformKind).optional(),
  stage: z.nativeEnum(PipelineStage),
  value: z.number().min(0).max(100_000_000),
  ownerId: z.string().optional(),
  campaignId: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

export async function createContactAction(input: z.infer<typeof createSchema>): Promise<CrmActionState> {
  let ctx;
  try {
    ctx = await requirePermission("manage_crm");
  } catch {
    return { ok: false, errorKey: "common.permissionDenied" };
  }

  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errorKey: "common.error" };
  const data = parsed.data;

  if (data.campaignId) {
    const campaign = await prisma.adCampaign.findFirst({ where: { id: data.campaignId, workspaceId: ctx.workspaceId } });
    if (!campaign) return { ok: false, errorKey: "common.error" };
  }
  if (data.ownerId) {
    const member = await prisma.workspaceMember.findFirst({ where: { workspaceId: ctx.workspaceId, userId: data.ownerId } });
    if (!member) return { ok: false, errorKey: "common.error" };
  }

  const contact = await prisma.contact.create({
    data: {
      workspaceId: ctx.workspaceId,
      name: data.name,
      phone: data.phone || null,
      email: data.email || null,
      source: data.source ?? null,
      stage: data.stage,
      value: data.value,
      ownerId: data.ownerId ?? ctx.userId,
      campaignId: data.campaignId ?? null,
      notes: data.notes || null,
    },
  });

  await logAudit({
    workspaceId: ctx.workspaceId,
    userId: ctx.userId,
    action: "CREATE",
    entityType: "Contact",
    entityId: contact.id,
  });

  revalidatePath("/crm");
  return { ok: true, contactId: contact.id };
}

const stageSchema = z.object({
  contactId: z.string().min(1),
  stage: z.nativeEnum(PipelineStage),
});

export async function setContactStageAction(input: z.infer<typeof stageSchema>): Promise<CrmActionState> {
  let ctx;
  try {
    ctx = await requirePermission("manage_crm");
  } catch {
    return { ok: false, errorKey: "common.permissionDenied" };
  }

  const parsed = stageSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errorKey: "common.error" };

  const contact = await prisma.contact.findFirst({
    where: { id: parsed.data.contactId, workspaceId: ctx.workspaceId, deletedAt: null },
  });
  if (!contact) return { ok: false, errorKey: "common.error" };
  if (contact.stage === parsed.data.stage) return { ok: true };

  await prisma.$transaction([
    prisma.contact.update({ where: { id: contact.id }, data: { stage: parsed.data.stage } }),
    prisma.contactActivity.create({
      data: {
        contactId: contact.id,
        type: "STAGE_CHANGE",
        description: `${contact.stage} → ${parsed.data.stage}`,
        createdById: ctx.userId,
      },
    }),
  ]);

  await logAudit({
    workspaceId: ctx.workspaceId,
    userId: ctx.userId,
    action: "UPDATE",
    entityType: "Contact",
    entityId: contact.id,
    metadata: { from: contact.stage, to: parsed.data.stage },
  });

  revalidatePath("/crm");
  revalidatePath(`/crm/${contact.id}`);
  return { ok: true };
}

const noteSchema = z.object({
  contactId: z.string().min(1),
  type: z.enum(["NOTE", "CALL", "MEETING"]),
  description: z.string().min(1).max(1000),
});

export async function addContactActivityAction(input: z.infer<typeof noteSchema>): Promise<CrmActionState> {
  let ctx;
  try {
    ctx = await requirePermission("manage_crm");
  } catch {
    return { ok: false, errorKey: "common.permissionDenied" };
  }

  const parsed = noteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errorKey: "common.error" };

  const contact = await prisma.contact.findFirst({
    where: { id: parsed.data.contactId, workspaceId: ctx.workspaceId, deletedAt: null },
  });
  if (!contact) return { ok: false, errorKey: "common.error" };

  await prisma.contactActivity.create({
    data: {
      contactId: contact.id,
      type: parsed.data.type,
      description: parsed.data.description,
      createdById: ctx.userId,
    },
  });

  revalidatePath(`/crm/${contact.id}`);
  return { ok: true };
}
