"use client";

import * as React from "react";
import { Info, AlertTriangle, ShieldAlert, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";
import { updateAlertStatusAction } from "@/app/(app)/alerts/actions";

export interface AlertRow {
  id: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  status: "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED";
  title: string;
  message: string;
  campaignName: string | null;
  createdAt: Date;
}

const SEVERITY_META = {
  INFO: { label: "معلومة", icon: Info, variant: "muted" as const },
  WARNING: { label: "تنبيه", icon: AlertTriangle, variant: "warning" as const },
  CRITICAL: { label: "خطر", icon: ShieldAlert, variant: "destructive" as const },
};

export function AlertCard({ alert }: { alert: AlertRow }) {
  const meta = SEVERITY_META[alert.severity];
  const [pending, startTransition] = React.useTransition();

  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4 p-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5">
            <meta.icon className="h-5 w-5" />
          </span>
          <div>
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <Badge variant={meta.variant}>{meta.label}</Badge>
              {alert.campaignName && <Badge variant="muted">{alert.campaignName}</Badge>}
              <Badge variant={alert.status === "ACTIVE" ? "warning" : alert.status === "RESOLVED" ? "success" : "secondary"}>
                {alert.status === "ACTIVE" ? "نشط" : alert.status === "RESOLVED" ? "تم الحل" : "تمت المراجعة"}
              </Badge>
            </div>
            <h3 className="font-medium">{alert.title}</h3>
            <p className="text-sm text-muted-foreground">{alert.message}</p>
            <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(alert.createdAt)}</p>
          </div>
        </div>
        {alert.status !== "RESOLVED" && (
          <div className="flex shrink-0 flex-col gap-1">
            {alert.status === "ACTIVE" && (
              <Button
                variant="outline"
                size="sm"
                disabled={pending}
                onClick={() => startTransition(() => void updateAlertStatusAction({ id: alert.id, status: "ACKNOWLEDGED" }))}
              >
                مراجعة
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() => startTransition(() => void updateAlertStatusAction({ id: alert.id, status: "RESOLVED" }))}
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> حل
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
