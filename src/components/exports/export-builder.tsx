"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ExportTargetFormat } from "@prisma/client";
import { Download, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  EXPORT_FORMAT_LABELS,
  FIXED_COLUMN_FORMATS,
  GENERIC_EXPORT_FIELDS,
  GENERIC_EXPORT_FIELD_LABELS,
  type GenericExportField,
} from "@/lib/export/formats";
import { exportRowsToCsv, exportRowsToXlsx } from "@/lib/export/xlsx";
import { prepareExportAction } from "@/app/(app)/exports/actions";
import type { SelectOption } from "@/types";

const DEFAULT_FIELDS: GenericExportField[] = ["name", "normalizedPhone", "email", "city", "service"];

export function ExportBuilder({ segments, initialSegmentId }: { segments: SelectOption[]; initialSegmentId?: string }) {
  const router = useRouter();
  const [segmentId, setSegmentId] = React.useState<string | undefined>(initialSegmentId);
  const [format, setFormat] = React.useState<ExportTargetFormat>("XLSX");
  const [fields, setFields] = React.useState<GenericExportField[]>(DEFAULT_FIELDS);
  const [dedupeOnly, setDedupeOnly] = React.useState(true);
  const [validPhoneOnly, setValidPhoneOnly] = React.useState(false);
  const [maskSensitive, setMaskSensitive] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);
  const [lastResult, setLastResult] = React.useState<{ rowCount: number } | null>(null);

  const isFixedFormat = FIXED_COLUMN_FORMATS.has(format);

  async function handleExport() {
    setIsExporting(true);
    try {
      const result = await prepareExportAction({
        segmentId: segmentId ?? null,
        format,
        fields,
        dedupeOnly,
        validPhoneOnly,
        maskSensitive,
      });

      const segmentLabel = segments.find((s) => s.value === segmentId)?.label ?? "all-customers";
      const filename = `export-${segmentLabel}-${format.toLowerCase()}`;

      if (format === "XLSX") exportRowsToXlsx(result.rows, filename);
      else exportRowsToCsv(result.rows, filename);

      setLastResult({ rowCount: result.rowCount });
      router.refresh();
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>مصدر البيانات</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>الشريحة</Label>
              <Select value={segmentId ?? "__all__"} onValueChange={(v) => setSegmentId(v === "__all__" ? undefined : v)}>
                <SelectTrigger className="w-full sm:w-80">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">كل العملاء (بدون شريحة محددة)</SelectItem>
                  {segments.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>صيغة التصدير</Label>
              <Select value={format} onValueChange={(v) => setFormat(v as ExportTargetFormat)}>
                <SelectTrigger className="w-full sm:w-80">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EXPORT_FORMAT_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isFixedFormat && (
                <p className="text-xs text-muted-foreground">
                  تنسيق مخصص لهذه المنصة بأعمدة ثابتة (رقم الجوال والبريد الإلكتروني). في بيئة الإنتاج يجب تجزئة القيم
                  (SHA-256) وفق مواصفات المنصة قبل الرفع.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {!isFixedFormat && (
          <Card>
            <CardHeader>
              <CardTitle>الأعمدة المطلوبة</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {GENERIC_EXPORT_FIELDS.map((field) => (
                <label key={field} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={fields.includes(field)}
                    onCheckedChange={(checked) =>
                      setFields((prev) => (checked ? [...prev, field] : prev.filter((f) => f !== field)))
                    }
                  />
                  {GENERIC_EXPORT_FIELD_LABELS[field]}
                </label>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>خيارات التصدير</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ToggleRow label="تصدير بعد إزالة التكرار فقط" checked={dedupeOnly} onCheckedChange={setDedupeOnly} />
            <ToggleRow label="تصدير الأرقام الصحيحة فقط" checked={validPhoneOnly} onCheckedChange={setValidPhoneOnly} />
            {!isFixedFormat && (
              <ToggleRow
                label="إخفاء/تشفير البيانات الحساسة (لأغراض المعاينة الداخلية)"
                checked={maskSensitive}
                onCheckedChange={setMaskSensitive}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        <Card className="sticky top-20">
          <CardHeader>
            <CardTitle>تنزيل الملف</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full" onClick={() => void handleExport()} disabled={isExporting || (!isFixedFormat && fields.length === 0)}>
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              تصدير الآن
            </Button>
            {lastResult && (
              <p className="text-sm text-success">تم تصدير {lastResult.rowCount} سجل بنجاح.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm">{label}</span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
