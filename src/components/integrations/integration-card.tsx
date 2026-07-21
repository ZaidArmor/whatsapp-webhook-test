"use client";

import * as React from "react";
import { Link2, RefreshCw, Unplug, AlertTriangle, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlatformBadge } from "@/components/shared/platform-badge";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { formatDateTime } from "@/lib/utils";
import {
  connectIntegrationAction,
  disconnectIntegrationAction,
  reconnectIntegrationAction,
  syncNowAction,
} from "@/app/(app)/integrations/actions";
import type { IntegrationRow } from "@/lib/data/integrations";

const STATUS_META = {
  NOT_CONNECTED: { label: "غير متصل", variant: "muted" as const },
  CONNECTED: { label: "متصل", variant: "success" as const },
  ERROR: { label: "خطأ", variant: "destructive" as const },
  EXPIRED: { label: "انتهت الصلاحية", variant: "warning" as const },
  SYNCING: { label: "جارٍ المزامنة", variant: "secondary" as const },
};

export function IntegrationCard({ integration }: { integration: IntegrationRow }) {
  const [pending, startTransition] = React.useTransition();
  const [confirmDisconnect, setConfirmDisconnect] = React.useState(false);
  const [lastSyncSummary, setLastSyncSummary] = React.useState<string | null>(null);
  const meta = STATUS_META[integration.status];

  const tokenNearExpiry =
    integration.tokenExpiresAt && integration.tokenExpiresAt.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <PlatformBadge platform={integration.platform} />
          <Badge variant={meta.variant}>{meta.label}</Badge>
        </div>

        {integration.status !== "NOT_CONNECTED" ? (
          <div className="space-y-1 text-sm">
            <p className="font-medium">{integration.accountName}</p>
            <p className="text-xs text-muted-foreground">رقم الحساب: {integration.accountExternalId}</p>
            <p className="text-xs text-muted-foreground">
              آخر مزامنة: {integration.lastSyncAt ? formatDateTime(integration.lastSyncAt) : "—"}
            </p>
            <p className={tokenNearExpiry ? "text-xs font-medium text-warning" : "text-xs text-muted-foreground"}>
              انتهاء الصلاحية: {integration.tokenExpiresAt ? formatDateTime(integration.tokenExpiresAt) : "—"}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">لم يتم ربط هذا الحساب بعد</p>
        )}

        {integration.errorMessage && (
          <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-2 text-xs text-destructive">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {integration.errorMessage}
          </div>
        )}

        {lastSyncSummary && <p className="text-xs text-success">{lastSyncSummary}</p>}

        <div className="flex flex-wrap gap-2 pt-1">
          {integration.status === "NOT_CONNECTED" ? (
            <Button
              size="sm"
              disabled={pending}
              onClick={() => startTransition(() => void connectIntegrationAction({ platform: integration.platform }))}
            >
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Link2 className="h-3.5 w-3.5" />}
              ربط الحساب
            </Button>
          ) : (
            <>
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    const result = await syncNowAction({ platform: integration.platform });
                    const failedAny = [result.accounts, result.campaigns, result.ads, result.metrics].some((r) => !r.success);
                    setLastSyncSummary(
                      failedAny ? "حدث خطأ في إحدى عمليات المزامنة" : `تمت مزامنة ${result.metrics.itemsSynced} سجل أداء بنجاح`
                    );
                  })
                }
              >
                {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                مزامنة الآن
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => startTransition(() => void reconnectIntegrationAction({ platform: integration.platform }))}
              >
                <Link2 className="h-3.5 w-3.5" /> إعادة ربط
              </Button>
              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setConfirmDisconnect(true)}>
                <Unplug className="h-3.5 w-3.5" /> إلغاء الربط
              </Button>
            </>
          )}
        </div>
      </CardContent>

      <ConfirmationDialog
        open={confirmDisconnect}
        onOpenChange={setConfirmDisconnect}
        title="إلغاء ربط الحساب"
        description="سيتم إيقاف مزامنة البيانات من هذه المنصة. يمكنك إعادة الربط لاحقاً في أي وقت."
        confirmLabel="إلغاء الربط"
        destructive
        onConfirm={async () => {
          await disconnectIntegrationAction({ platform: integration.platform });
        }}
      />
    </Card>
  );
}
