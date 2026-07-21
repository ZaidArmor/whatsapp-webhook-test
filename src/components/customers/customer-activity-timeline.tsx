import { History, MessageSquare, RefreshCw, Merge } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDateTime } from "@/lib/utils";
import type { CustomerActivityRow } from "@/lib/data/customers";

const TYPE_ICON: Record<string, typeof History> = {
  status_change: RefreshCw,
  note: MessageSquare,
  merge: Merge,
};

export function CustomerActivityTimeline({ activities }: { activities: CustomerActivityRow[] }) {
  if (activities.length === 0) {
    return <EmptyState title="لا توجد إجراءات مسجلة بعد" className="py-8" />;
  }

  return (
    <ol className="space-y-4">
      {activities.map((activity) => {
        const Icon = TYPE_ICON[activity.type] ?? History;
        return (
          <li key={activity.id} className="flex gap-3">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Icon className="h-3.5 w-3.5" />
            </span>
            <div>
              <p className="text-sm">{activity.description}</p>
              <p className="text-xs text-muted-foreground">{formatDateTime(activity.createdAt)}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
