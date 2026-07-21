"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { saveThresholdsAction } from "@/app/(app)/settings/actions";
import type { AnalysisThresholds } from "@/lib/analysis/thresholds";

const FIELDS: Array<{ key: keyof AnalysisThresholds; label: string; suffix?: string; description: string }> = [
  { key: "targetCpl", label: "تكلفة العميل المحتمل المستهدفة (CPL)", suffix: "ر.س", description: "الحد الأقصى المقبول لتكلفة العميل المحتمل" },
  { key: "targetCac", label: "تكلفة الاستحواذ المستهدفة (CAC)", suffix: "ر.س", description: "الحد الأقصى المقبول لتكلفة اكتساب العميل" },
  { key: "targetRoas", label: "العائد على الإنفاق المستهدف (ROAS)", suffix: "×", description: "الحد الأدنى المستهدف للعائد على الإنفاق" },
  { key: "minCtr", label: "الحد الأدنى لـ CTR", suffix: "%", description: "أقل من هذا يُعتبر معدل نقر منخفض" },
  { key: "maxCpm", label: "الحد الأعلى لـ CPM", suffix: "ر.س", description: "أعلى من هذا يُعتبر CPM مرتفعاً" },
  { key: "maxFrequency", label: "الحد الأعلى للتكرار (Frequency)", suffix: "×", description: "أعلى من هذا قد يشير إلى إرهاق الجمهور" },
  { key: "targetConversionRate", label: "معدل التحويل المستهدف", suffix: "%", description: "النسبة المستهدفة لتحويل العملاء المحتملين إلى مبيعات" },
  { key: "minDataPoints", label: "الحد الأدنى لعدد البيانات قبل إصدار الحكم", suffix: "نقرة", description: "لا يتم إصدار توصيات إلا بعد الوصول لهذا الحد من البيانات" },
];

export function ThresholdsForm({ initial }: { initial: AnalysisThresholds }) {
  const router = useRouter();
  const [values, setValues] = React.useState<AnalysisThresholds>(initial);
  const [isSaving, setIsSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  async function handleSave() {
    setIsSaving(true);
    setSaved(false);
    try {
      await saveThresholdsAction(values);
      setSaved(true);
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>حدود محرك التحليل</CardTitle>
        <CardDescription>هذه القيم تتحكم بمتى يصدر النظام تحذيرات أو فرصاً أو تنبيهات خطر للحملات.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {FIELDS.map((field) => (
            <div key={field.key} className="space-y-1.5">
              <Label htmlFor={field.key}>{field.label}</Label>
              <div className="relative">
                <Input
                  id={field.key}
                  type="number"
                  value={values[field.key]}
                  onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: Number(e.target.value) }))}
                  className="pe-12"
                />
                {field.suffix && (
                  <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    {field.suffix}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{field.description}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={() => void handleSave()} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            حفظ الإعدادات
          </Button>
          {saved && <span className="text-sm text-success">تم الحفظ بنجاح</span>}
        </div>
      </CardContent>
    </Card>
  );
}
