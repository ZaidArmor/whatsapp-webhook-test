import { getT } from "@/lib/i18n/server";
import { requirePermission } from "@/lib/auth/workspace";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDateTime } from "@/lib/utils";

const ACTION_VARIANT: Record<string, "success" | "warning" | "destructive" | "muted" | "secondary" | "default"> = {
  CREATE: "success",
  UPDATE: "secondary",
  DELETE: "destructive",
  PUBLISH: "success",
  SCHEDULE: "default",
  APPROVE: "success",
  REJECT: "destructive",
  EXPORT: "warning",
  CONNECT: "success",
  DISCONNECT: "muted",
  LOGIN: "muted",
  LOGOUT: "muted",
};

export default async function AuditLogPage() {
  const { t, locale } = await getT();
  const ctx = await requirePermission("view_audit");

  const logs = await prisma.auditLog.findMany({
    where: { workspaceId: ctx.workspaceId },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("audit.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("audit.subtitle")}</p>
      </div>

      {logs.length === 0 ? (
        <EmptyState title={t("common.noData")} />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-xs text-muted-foreground">
                <th className="px-3 py-2.5 text-start font-medium">{t("common.date")}</th>
                <th className="px-3 py-2.5 text-start font-medium">{t("audit.user")}</th>
                <th className="px-3 py-2.5 text-start font-medium">{t("audit.action")}</th>
                <th className="px-3 py-2.5 text-start font-medium">{t("audit.entity")}</th>
                <th className="px-3 py-2.5 text-start font-medium">{t("common.details")}</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b last:border-b-0">
                  <td className="px-3 py-2.5 text-xs tabular-nums text-muted-foreground">
                    {formatDateTime(log.createdAt, locale)}
                  </td>
                  <td className="px-3 py-2.5">{log.user?.name ?? t("audit.systemUser")}</td>
                  <td className="px-3 py-2.5">
                    <Badge variant={ACTION_VARIANT[log.action] ?? "muted"}>{t(`audit.actions.${log.action}`)}</Badge>
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs" dir="ltr">
                    {log.entityType}
                  </td>
                  <td className="max-w-64 truncate px-3 py-2.5 font-mono text-[11px] text-muted-foreground" dir="ltr">
                    {log.metadata ? JSON.stringify(log.metadata) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
