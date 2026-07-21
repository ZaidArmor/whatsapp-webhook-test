import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;
}

export function KpiCardSkeleton() {
  return (
    <div className="space-y-3 rounded-xl border bg-card p-4">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-6 w-20" />
      <Skeleton className="h-3 w-28" />
    </div>
  );
}

export function ChartCardSkeleton({ heightClass = "h-64" }: { heightClass?: string }) {
  return (
    <div className="space-y-3 rounded-xl border bg-card p-4">
      <Skeleton className="h-4 w-40" />
      <Skeleton className={cn("w-full", heightClass)} />
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}
