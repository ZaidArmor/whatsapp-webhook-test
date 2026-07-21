import { prisma } from "@/lib/prisma";
import type { RecommendationPriority, RecommendationStatus, RecommendationType } from "@prisma/client";

export interface RecommendationRow {
  id: string;
  type: RecommendationType;
  title: string;
  explanation: string;
  reason: string;
  supportingData: unknown;
  priority: RecommendationPriority;
  status: RecommendationStatus;
  suggestedAction: string;
  campaignName: string | null;
  assigneeName: string | null;
  assigneeId: string | null;
  createdAt: Date;
}

export async function getRecommendations(): Promise<RecommendationRow[]> {
  const rows = await prisma.recommendation.findMany({
    include: { campaign: true, assignee: true },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
  });

  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    title: r.title,
    explanation: r.explanation,
    reason: r.reason,
    supportingData: r.supportingData,
    priority: r.priority,
    status: r.status,
    suggestedAction: r.suggestedAction,
    campaignName: r.campaign?.name ?? null,
    assigneeName: r.assignee?.name ?? null,
    assigneeId: r.assigneeId,
    createdAt: r.createdAt,
  }));
}
