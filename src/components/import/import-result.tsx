"use client";

import Link from "next/link";
import { CheckCircle2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportRowsToCsv } from "@/lib/export/xlsx";

export interface ImportResultData {
  importJobId: string;
  totalRows: number;
  acceptedRows: number;
  rejectedRows: number;
  duplicateRows: number;
  rejectedDetails: Array<{ rowNumber: number; name: string; phone: string; reason: string }>;
}

export function ImportResult({ result, onStartOver }: { result: ImportResultData; onStartOver: () => void }) {
  return (
    <div className="space-y-4 text-center">
      <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
      <h3 className="text-lg font-semibold">اكتمل الاستيراد</h3>
      <div className="mx-auto grid max-w-md grid-cols-3 gap-3">
        <SummaryTile label="الإجمالي" value={result.totalRows} />
        <SummaryTile label="مقبولة" value={result.acceptedRows} className="text-success" />
        <SummaryTile label="مرفوضة/مكررة" value={result.rejectedRows + result.duplicateRows} className="text-destructive" />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {result.rejectedDetails.length > 0 && (
          <Button
            variant="outline"
            onClick={() =>
              exportRowsToCsv(
                result.rejectedDetails.map((d) => ({
                  الصف: d.rowNumber,
                  الاسم: d.name,
                  الجوال: d.phone,
                  السبب: d.reason,
                })),
                `import-errors-${result.importJobId}`
              )
            }
          >
            <Download className="h-4 w-4" /> تنزيل ملف الأخطاء
          </Button>
        )}
        <Button asChild>
          <Link href="/customers">الذهاب إلى العملاء</Link>
        </Button>
        <Button variant="ghost" onClick={onStartOver}>
          استيراد ملف آخر
        </Button>
      </div>
    </div>
  );
}

function SummaryTile({ label, value, className }: { label: string; value: number; className?: string }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-xl font-bold ${className ?? ""}`}>{value}</p>
    </div>
  );
}
