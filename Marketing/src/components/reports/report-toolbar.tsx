"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileSpreadsheet, FileText, Printer, CalendarClock } from "lucide-react";
import type { ReportKind } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/client";
import { scheduleMonthlyReportAction } from "@/app/(app)/reports/actions";

export function ReportToolbar({ kind, canExport }: { kind: ReportKind; canExport: boolean }) {
  const { t } = useT();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [scheduled, setScheduled] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-2 print:hidden">
      {canExport ? (
        <>
          <Button size="sm" variant="outline" asChild>
            <a href={`/api/reports/export?kind=${kind}&format=csv`} download>
              <FileText className="h-3.5 w-3.5" />
              {t("reports.exportCsv")}
            </a>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <a href={`/api/reports/export?kind=${kind}&format=xlsx`} download>
              <FileSpreadsheet className="h-3.5 w-3.5" />
              {t("reports.exportExcel")}
            </a>
          </Button>
        </>
      ) : null}
      <Button size="sm" variant="outline" onClick={() => window.print()}>
        <Printer className="h-3.5 w-3.5" />
        {t("reports.printPdf")}
      </Button>
      <Button
        size="sm"
        variant="secondary"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const result = await scheduleMonthlyReportAction({ kind });
            if (result.ok) setScheduled(true);
            router.refresh();
          })
        }
      >
        <CalendarClock className="h-3.5 w-3.5" />
        {t("reports.scheduleMonthly")}
      </Button>
      {scheduled ? <span className="text-xs font-medium text-success">{t("reports.scheduledOk")}</span> : null}
    </div>
  );
}
