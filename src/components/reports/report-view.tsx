"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Download, Printer } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { exportRowsToCsv, exportRowsToXlsx } from "@/lib/export/xlsx";
import { REPORT_LABELS, REPORT_TYPES, type ReportType } from "@/lib/data/reports";

export function ReportView({ type, rows }: { type: ReportType; rows: Array<Record<string, unknown>> }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const columns = rows.length > 0 ? Object.keys(rows[0]!) : [];

  function updateType(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("type", next);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Select value={type} onValueChange={updateType}>
          <SelectTrigger className="w-72">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {REPORT_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {REPORT_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2 print:hidden">
          <Button variant="outline" onClick={() => exportRowsToCsv(rows, REPORT_LABELS[type])} disabled={rows.length === 0}>
            <Download className="h-4 w-4" /> CSV
          </Button>
          <Button variant="outline" onClick={() => exportRowsToXlsx(rows, REPORT_LABELS[type])} disabled={rows.length === 0}>
            <Download className="h-4 w-4" /> Excel
          </Button>
          <Button variant="outline" onClick={() => window.print()} disabled={rows.length === 0}>
            <Printer className="h-4 w-4" /> طباعة
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          {rows.length === 0 ? (
            <EmptyState title="لا توجد بيانات لهذا التقرير حالياً" />
          ) : (
            <div className="scroll-x-container" dir="rtl">
              <table className="w-full text-sm">
                <thead className="border-b text-muted-foreground">
                  <tr>
                    {columns.map((col) => (
                      <th key={col} className="whitespace-nowrap p-2 text-start">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i} className="border-b last:border-0">
                      {columns.map((col) => (
                        <td key={col} className="whitespace-nowrap p-2">
                          {formatCell(row[col])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "number") return new Intl.NumberFormat("ar-SA-u-nu-latn").format(value);
  return String(value);
}
