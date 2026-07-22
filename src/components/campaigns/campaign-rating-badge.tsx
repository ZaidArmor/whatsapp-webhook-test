import { Badge } from "@/components/ui/badge";
import type { CampaignRating } from "@/lib/data/campaigns";

const RATING_META: Record<CampaignRating, { label: string; variant: "success" | "secondary" | "warning" | "destructive" }> = {
  excellent: { label: "ممتاز", variant: "success" },
  good: { label: "جيد", variant: "secondary" },
  average: { label: "متوسط", variant: "warning" },
  poor: { label: "ضعيف", variant: "destructive" },
};

export function CampaignRatingBadge({ rating }: { rating: CampaignRating }) {
  const meta = RATING_META[rating];
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}
