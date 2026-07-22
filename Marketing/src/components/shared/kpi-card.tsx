"use client";

import type { ReactNode } from "react";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn, displayMetric, formatCompact, formatCurrency, formatPercent } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";
import type { PeriodComparison } from "@/lib/metrics";

export type KpiFormat = "number" | "compact" | "currency" | "percent" | "multiplier";

interface KpiCardProps {
  label: string;
  value: number | null;
  format?: KpiFormat;
  icon?: ReactNode;
  comparison?: PeriodComparison;
}

export function KpiCard({ label, value, format = "number", icon, comparison }: KpiCardProps) {
  const { t, locale } = useT();

  const formatted = displayMetric(value, (v) => {
    switch (format) {
      case "currency":
        return formatCurrency(v, locale);
      case "percent":
        return formatPercent(v, locale);
      case "multiplier":
        return `${v.toFixed(2)}×`;
      case "compact":
        return formatCompact(v, locale);
      default:
        return formatCompact(v, locale);
    }
  });

  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col justify-between gap-3 p-4">
        <div className="flex items-start justify-between">
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
          {icon ? <span className="text-accent">{icon}</span> : null}
        </div>
        <div className="space-y-1">
          <div className="text-xl font-bold tabular-nums">{formatted}</div>
          {comparison ? <ComparisonBadge comparison={comparison} vsLabel={t("dashboard.vsPrevPeriod")} flatLabel={t("dashboard.noChange")} /> : null}
        </div>
      </CardContent>
    </Card>
  );
}

function ComparisonBadge({
  comparison,
  vsLabel,
  flatLabel,
}: {
  comparison: PeriodComparison;
  vsLabel: string;
  flatLabel: string;
}) {
  const { locale } = useT();
  const { changePercent, direction, isPositive } = comparison;

  if (direction === "flat" || changePercent === null) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Minus className="h-3 w-3" /> {flatLabel}
      </span>
    );
  }

  const colorClass = isPositive === null ? "text-muted-foreground" : isPositive ? "text-success" : "text-destructive";

  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium", colorClass)}>
      {direction === "up" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
      {formatPercent(Math.abs(changePercent), locale)}
      <span className="font-normal text-muted-foreground">{vsLabel}</span>
    </span>
  );
}
