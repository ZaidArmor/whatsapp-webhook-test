"use client";

import * as React from "react";
import { Lightbulb, AlertTriangle, ShieldAlert, Sparkles, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDateTime } from "@/lib/utils";
import { updateRecommendationStatusAction } from "@/app/(app)/recommendations/actions";
import type { RecommendationRow } from "@/lib/data/recommendations";

const TYPE_META = {
  OPPORTUNITY: { label: "فرصة", icon: Lightbulb, className: "border-success/30 bg-success/5" },
  WARNING: { label: "تحذير", icon: AlertTriangle, className: "border-warning/30 bg-warning/5" },
  DANGER: { label: "خطر", icon: ShieldAlert, className: "border-destructive/30 bg-destructive/5" },
  EXCELLENT: { label: "أداء ممتاز", icon: Sparkles, className: "border-success/30 bg-success/5" },
  NEEDS_FOLLOW_UP: { label: "يحتاج متابعة", icon: Eye, className: "border-border bg-muted/30" },
} as const;

const PRIORITY_VARIANT = {
  LOW: "muted",
  MEDIUM: "secondary",
  HIGH: "warning",
  CRITICAL: "destructive",
} as const;

const PRIORITY_LABEL = { LOW: "منخفضة", MEDIUM: "متوسطة", HIGH: "عالية", CRITICAL: "حرجة" } as const;

const STATUS_LABEL = { OPEN: "مفتوحة", IN_PROGRESS: "قيد التنفيذ", RESOLVED: "تم الحل", DISMISSED: "تم التجاهل" } as const;

export function RecommendationCard({ recommendation }: { recommendation: RecommendationRow }) {
  const meta = TYPE_META[recommendation.type];
  const [pending, startTransition] = React.useTransition();

  return (
    <Card className={meta.className}>
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <meta.icon className="h-4 w-4" />
            <Badge variant={recommendation.type === "DANGER" ? "destructive" : recommendation.type === "EXCELLENT" || recommendation.type === "OPPORTUNITY" ? "success" : "warning"}>
              {meta.label}
            </Badge>
            <Badge variant={PRIORITY_VARIANT[recommendation.priority]}>{PRIORITY_LABEL[recommendation.priority]}</Badge>
            {recommendation.campaignName && <Badge variant="muted">{recommendation.campaignName}</Badge>}
          </div>
          <Select
            value={recommendation.status}
            disabled={pending}
            onValueChange={(value) =>
              startTransition(() => void updateRecommendationStatusAction({ id: recommendation.id, status: value as never }))
            }
          >
            <SelectTrigger className="h-7 w-36 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_LABEL).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <h3 className="font-semibold">{recommendation.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{recommendation.explanation}</p>
        </div>

        <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          <div>
            <span className="font-medium text-muted-foreground">السبب: </span>
            {recommendation.reason}
          </div>
          <div>
            <span className="font-medium text-muted-foreground">الإجراء المقترح: </span>
            {recommendation.suggestedAction}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatDateTime(recommendation.createdAt)}</span>
          <span>{recommendation.assigneeName ?? "غير مسندة"}</span>
        </div>
      </CardContent>
    </Card>
  );
}
