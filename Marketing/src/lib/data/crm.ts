import type { PipelineStage } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function getContacts(workspaceId: string, stage?: PipelineStage) {
  return prisma.contact.findMany({
    where: { workspaceId, deletedAt: null, ...(stage ? { stage } : {}) },
    include: {
      owner: { select: { id: true, name: true } },
      campaign: { select: { id: true, name: true, platform: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });
}

export interface PipelineSummaryRow {
  stage: PipelineStage;
  count: number;
  value: number;
}

export async function getPipelineSummary(workspaceId: string): Promise<PipelineSummaryRow[]> {
  const groups = await prisma.contact.groupBy({
    by: ["stage"],
    where: { workspaceId, deletedAt: null },
    _count: { _all: true },
    _sum: { value: true },
  });
  const byStage = new Map(groups.map((g) => [g.stage, g]));
  const ORDER: PipelineStage[] = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "WON", "LOST"];
  return ORDER.map((stage) => ({
    stage,
    count: byStage.get(stage)?._count._all ?? 0,
    value: Number(byStage.get(stage)?._sum.value ?? 0),
  }));
}

export async function getContactDetail(workspaceId: string, contactId: string) {
  return prisma.contact.findFirst({
    where: { id: contactId, workspaceId, deletedAt: null },
    include: {
      owner: { select: { id: true, name: true } },
      campaign: { select: { id: true, name: true, platform: true } },
      activities: { orderBy: { createdAt: "desc" }, take: 30 },
    },
  });
}

export async function getCrmOptions(workspaceId: string) {
  const [members, campaigns] = await Promise.all([
    prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: { user: { select: { id: true, name: true } } },
    }),
    prisma.adCampaign.findMany({
      where: { workspaceId, deletedAt: null },
      select: { id: true, name: true, platform: true },
      orderBy: { startDate: "desc" },
    }),
  ]);
  return {
    owners: members.map((m) => ({ id: m.user.id, name: m.user.name })),
    campaigns,
  };
}
