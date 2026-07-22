import Link from "next/link";
import { ReportKind } from "@prisma/client";
import { getT } from "@/lib/i18n/server";
import { requirePermission } from "@/lib/auth/workspace";
import { prisma } from "@/lib/prisma";
import { generateReport } from "@/lib/reports/generate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { ReportToolbar } from "@/components/reports/report-toolbar";
import { cn, formatDateTime, formatNumber } from "@/lib/utils";

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function ReportsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { t, locale } = await getT();
  const ctx = await requirePermission("view_reports");

  const kinds = Object.values(ReportKind);
  const kind = kinds.includes(params.kind as ReportKind) ? (params.kind as ReportKind) : ReportKind.MONTHLY_CLIENT;

  const [report, scheduled] = await Promise.all([
    generateReport(ctx.workspaceId, kind),
    prisma.report.findMany({
      where: { workspaceId: ctx.workspaceId, scheduleCron: { not: null } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <h1 className="text-2xl font-bold">{t("reports.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("reports.subtitle")}</p>
      </div>

      <div className="flex flex-wrap gap-2 print:hidden">
        {kinds.map((k) => (
          <Link
            key={k}
            href={`/reports?kind=${k}`}
            className={cn(
              "inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              kind === k ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted"
            )}
          >
            {t(`reports.kinds.${k}`)}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_280px] print:block">
        <Card>
          <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 space-y-0 pb-3">
            <CardTitle className="text-base">{t(`reports.kinds.${kind}`)}</CardTitle>
            <ReportToolbar kind={kind} canExport={ctx.can("export_data")} />
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {report.rows.length === 0 ? (
              <EmptyState title={t("common.noData")} />
            ) : (
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-xs text-muted-foreground">
                    {report.columns.map((column) => (
                      <th key={column.key} className="px-3 py-2.5 text-start font-medium">
                        {t(column.labelKey)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {report.rows.map((row, i) => (
                    <tr key={i} className="border-b last:border-b-0">
                      {report.columns.map((column) => {
                        const value = row[column.key];
                        return (
                          <td key={column.key} className="px-3 py-2.5 tabular-nums">
                            {value === null || value === undefined
                              ? "—"
                              : typeof value === "number"
                                ? formatNumber(value, locale)
                                : t(value)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        <Card className="h-fit print:hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{t("reports.scheduled")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {scheduled.length === 0 ? (
              <p className="text-xs text-muted-foreground">{t("reports.noScheduled")}</p>
            ) : (
              scheduled.map((row) => (
                <div key={row.id} className="space-y-0.5 border-b pb-2 text-xs last:border-b-0 last:pb-0">
                  <div className="font-medium">{t(`reports.kinds.${row.kind}`)}</div>
                  <div className="text-muted-foreground" dir="ltr">
                    {row.scheduleCron}
                  </div>
                  {row.lastGeneratedAt ? (
                    <div className="tabular-nums text-muted-foreground">
                      {t("reports.lastGenerated")}: {formatDateTime(row.lastGeneratedAt, locale)}
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
