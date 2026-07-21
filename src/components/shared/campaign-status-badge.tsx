import type { CampaignStatus } from "@prisma/client";
import { Badge, type BadgeProps } from "@/components/ui/badge";

const STATUS_META: Record<CampaignStatus, { label: string; variant: BadgeProps["variant"] }> = {
  DRAFT: { label: "مسودة", variant: "muted" },
  ACTIVE: { label: "نشطة", variant: "success" },
  PAUSED: { label: "متوقفة", variant: "warning" },
  COMPLETED: { label: "منتهية", variant: "secondary" },
  ARCHIVED: { label: "مؤرشفة", variant: "muted" },
};

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  const meta = STATUS_META[status];
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}
