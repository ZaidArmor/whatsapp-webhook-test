"use client";

import { CheckCircle2, AlertTriangle, Copy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { outcomeForRow, type CleanedRow } from "@/lib/import/types";

const OUTCOME_META = {
  ACCEPTED: { label: "مقبول", icon: CheckCircle2, variant: "success" as const },
  REJECTED: { label: "مرفوض", icon: AlertTriangle, variant: "destructive" as const },
  DUPLICATE: { label: "مكرر", icon: Copy, variant: "warning" as const },
};

interface ImportReviewProps {
  rows: CleanedRow[];
  skipDuplicates: boolean;
  onSkipDuplicatesChange: (value: boolean) => void;
}

export function ImportReview({ rows, skipDuplicates, onSkipDuplicatesChange }: ImportReviewProps) {
  const counts = rows.reduce(
    (acc, row) => {
      const outcome = outcomeForRow(row);
      acc[outcome] += 1;
      return acc;
    },
    { ACCEPTED: 0, REJECTED: 0, DUPLICATE: 0 }
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <SummaryTile label="إجمالي الصفوف" value={rows.length} />
        <SummaryTile label="مقبولة" value={counts.ACCEPTED} variant="success" />
        <SummaryTile label="مرفوضة / مكررة" value={counts.REJECTED + counts.DUPLICATE} variant="destructive" />
      </div>

      <div className="flex items-center gap-2 rounded-lg border p-3">
        <Switch checked={skipDuplicates} onCheckedChange={onSkipDuplicatesChange} />
        <span className="text-sm">تجاهل الصفوف المكررة عند الاستيراد ({counts.DUPLICATE} صف)</span>
      </div>

      <div className="scroll-x-container max-h-96 rounded-lg border" dir="rtl">
        <table className="w-full text-sm">
          <thead className="sticky top-0 border-b bg-muted/40">
            <tr>
              <th className="p-2 text-start">#</th>
              <th className="p-2 text-start">الاسم</th>
              <th className="p-2 text-start">الجوال</th>
              <th className="p-2 text-start">الجوال الموحد</th>
              <th className="p-2 text-start">الحالة</th>
              <th className="p-2 text-start">السبب</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const outcome = outcomeForRow(row);
              const meta = OUTCOME_META[outcome];
              return (
                <tr key={row.rowNumber} className="border-b last:border-0">
                  <td className="p-2 text-muted-foreground">{row.rowNumber}</td>
                  <td className="p-2">{row.name || "—"}</td>
                  <td className="p-2" dir="ltr">
                    {row.originalPhone || "—"}
                  </td>
                  <td className="p-2 text-muted-foreground" dir="ltr">
                    {row.normalizedPhone ?? "—"}
                  </td>
                  <td className="p-2">
                    <Badge variant={meta.variant} className="gap-1">
                      <meta.icon className="h-3 w-3" /> {meta.label}
                    </Badge>
                  </td>
                  <td className="p-2 text-xs text-muted-foreground">
                    {row.errors.join("، ") || (row.isDuplicateInFile || row.isDuplicateInDb ? "مكرر" : "—")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SummaryTile({ label, value, variant }: { label: string; value: number; variant?: "success" | "destructive" }) {
  return (
    <div className="rounded-lg border bg-card p-3 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={`text-xl font-bold ${variant === "success" ? "text-success" : variant === "destructive" ? "text-destructive" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}
