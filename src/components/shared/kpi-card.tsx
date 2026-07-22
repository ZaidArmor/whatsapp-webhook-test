import type { ReactNode } from "react";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn, displayMetric, formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import type { PeriodComparison } from "@/lib/analytics/formulas";

export type KpiFormat = "number" | "currency" | "percent" | "text";

interface KpiCardProps {
  label: string;
  value: number | string | null;
  format?: KpiFormat;
  icon?: ReactNode;
  comparison?: PeriodComparison;
  tooltip?: string;
}

function formatValue(value: number | string | null, format: KpiFormat): string {
  if (value === null) return "—";
  if (typeof value === "string") return value;
  if (format === "currency") return displayMetric(value, (v) => formatCurrency(v));
  if (format === "percent") return displayMetric(value, (v) => formatPercent(v));
  return displayMetric(value, (v) => formatNumber(Math.round(v)));
}

export function KpiCard({ label, value, format = "number", icon, comparison, tooltip }: KpiCardProps) {
  const content = (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col justify-between gap-3 p-4">
        <div className="flex items-start justify-between">
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
          {icon ? <span className="text-muted-foreground/70">{icon}</span> : null}
        </div>
        <div className="space-y-1">
          <div className="text-xl font-bold tabular-nums">{formatValue(value, format)}</div>
          {comparison ? <ComparisonBadge comparison={comparison} /> : null}
        </div>
      </CardContent>
    </Card>
  );

  if (!tooltip) return content;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}

export function ComparisonBadge({ comparison }: { comparison: PeriodComparison }) {
  const { changePercent, direction, isPositive } = comparison;
  if (direction === "flat" || changePercent === null) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Minus className="h-3 w-3" /> بدون تغيير
      </span>
    );
  }

  const colorClass =
    isPositive === null ? "text-muted-foreground" : isPositive ? "text-success" : "text-destructive";

  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium", colorClass)}>
      {direction === "up" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
      {formatPercent(Math.abs(changePercent))}
      <span className="text-muted-foreground">مقارنة بالفترة السابقة</span>
    </span>
  );
}
