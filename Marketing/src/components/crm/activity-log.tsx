"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StickyNote, Phone, CalendarCheck, GitBranch, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useT } from "@/lib/i18n/client";
import { formatDateTime } from "@/lib/utils";
import { addContactActivityAction } from "@/app/(app)/crm/actions";

const TYPE_ICONS: Record<string, typeof StickyNote> = {
  NOTE: StickyNote,
  CALL: Phone,
  MEETING: CalendarCheck,
  STAGE_CHANGE: GitBranch,
};

export interface ActivityItem {
  id: string;
  type: string;
  description: string;
  createdAt: string;
}

export function ActivityLog({ contactId, activities }: { contactId: string; activities: ActivityItem[] }) {
  const { t, locale } = useT();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [type, setType] = useState<"NOTE" | "CALL" | "MEETING">("NOTE");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    if (!description.trim()) return;
    setError(null);
    const body = description;
    setDescription("");
    startTransition(async () => {
      const result = await addContactActivityAction({ contactId, type, description: body });
      if (!result.ok) setError(t(result.errorKey ?? "common.error"));
      router.refresh();
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">{t("crm.activityLog")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-2">
          <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
            <SelectTrigger className="h-9 w-32 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(["NOTE", "CALL", "MEETING"] as const).map((option) => (
                <SelectItem key={option} value={option}>
                  {t(`crm.activityTypes.${option}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
            placeholder={t("crm.addNote")}
            className="h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <Button size="sm" disabled={isPending || !description.trim()} onClick={submit}>
            <Plus className="h-3.5 w-3.5" />
            {t("crm.addNote")}
          </Button>
        </div>
        {error ? <div className="text-xs font-medium text-destructive">{error}</div> : null}

        <ol className="space-y-3">
          {activities.map((activity) => {
            const Icon = TYPE_ICONS[activity.type] ?? StickyNote;
            return (
              <li key={activity.id} className="flex gap-3">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1 border-b pb-3 last:border-b-0">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {t(`crm.activityTypes.${activity.type}`)}
                    </span>
                    <span className="tabular-nums">{formatDateTime(activity.createdAt, locale)}</span>
                  </div>
                  <p className="mt-0.5 text-sm" dir="auto">{activity.description}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
