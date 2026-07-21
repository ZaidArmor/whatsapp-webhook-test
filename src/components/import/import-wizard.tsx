"use client";

import * as React from "react";
import * as XLSX from "xlsx";
import { UploadCloud, FileSpreadsheet, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { readWorkbook, getSheetNames, sheetToRows } from "@/lib/import/parse";
import { cleanRow, markInFileDuplicates, type ImportReferenceData } from "@/lib/import/clean";
import type { CleanedRow, ImportableField, RawRow } from "@/lib/import/types";
import { checkDbDuplicatesAction, commitImportAction } from "@/app/(app)/customers/import/actions";
import { ImportColumnMapping } from "./import-column-mapping";
import { ImportReview } from "./import-review";
import { ImportResult, type ImportResultData } from "./import-result";

const STEPS = ["رفع الملف", "اختيار الورقة", "المعاينة", "مطابقة الأعمدة", "المراجعة والتأكيد", "النتيجة"];

function guessMapping(header: string): ImportableField | null {
  const normalized = header.trim().toLowerCase();
  const guesses: Array<[RegExp, ImportableField]> = [
    [/mobile|phone|جوال|هاتف/, "phone"],
    [/name|اسم/, "name"],
    [/email|بريد/, "email"],
    [/city|مدينة/, "city"],
    [/branch|فرع/, "branch"],
    [/service|خدمة/, "service"],
    [/campaign|حملة/, "campaign"],
    [/source|مصدر/, "source"],
    [/note|ملاحظ/, "notes"],
  ];
  return guesses.find(([regex]) => regex.test(normalized))?.[1] ?? null;
}

export function ImportWizard({ reference }: { reference: ImportReferenceData }) {
  const [step, setStep] = React.useState(0);
  const [file, setFile] = React.useState<File | null>(null);
  const [workbook, setWorkbook] = React.useState<XLSX.WorkBook | null>(null);
  const [sheetName, setSheetName] = React.useState<string>("");
  const [headers, setHeaders] = React.useState<string[]>([]);
  const [allRows, setAllRows] = React.useState<RawRow[]>([]);
  const [mapping, setMapping] = React.useState<Record<string, ImportableField | null>>({});
  const [cleanedRows, setCleanedRows] = React.useState<CleanedRow[]>([]);
  const [skipDuplicates, setSkipDuplicates] = React.useState(true);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [result, setResult] = React.useState<ImportResultData | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  async function handleFile(selected: File) {
    setFile(selected);
    const buffer = await selected.arrayBuffer();
    const wb = readWorkbook(buffer);
    setWorkbook(wb);
    const sheets = getSheetNames(wb);
    const firstSheet = sheets[0] ?? "";
    setSheetName(firstSheet);
    setStep(sheets.length > 1 ? 1 : 2);
    loadSheet(wb, firstSheet);
  }

  function loadSheet(wb: XLSX.WorkBook, sheet: string) {
    const { headers: h, rows } = sheetToRows(wb, sheet);
    setHeaders(h);
    setAllRows(rows);
    const initialMapping = Object.fromEntries(h.map((header) => [header, guessMapping(header)]));
    setMapping(initialMapping);
  }

  async function proceedToReview() {
    setIsProcessing(true);
    try {
      let rows = allRows.map((raw, i) => cleanRow(raw, i + 2, mapping, reference));
      rows = markInFileDuplicates(rows);

      const phones = rows.map((r) => r.normalizedPhone).filter((p): p is string => Boolean(p));
      const emails = rows.map((r) => r.email).filter((e): e is string => Boolean(e));
      const dbMatches = await checkDbDuplicatesAction({ phones, emails });
      const dbPhoneSet = new Set(dbMatches.phones);
      const dbEmailSet = new Set(dbMatches.emails);

      rows = rows.map((row) => ({
        ...row,
        isDuplicateInDb:
          (row.normalizedPhone ? dbPhoneSet.has(row.normalizedPhone) : false) ||
          (row.email ? dbEmailSet.has(row.email) : false),
      }));

      setCleanedRows(rows);
      setStep(4);
    } finally {
      setIsProcessing(false);
    }
  }

  async function confirmImport() {
    if (!file) return;
    setIsProcessing(true);
    try {
      const fileType = file.name.endsWith(".csv") ? "CSV" : file.name.endsWith(".xls") ? "XLS" : "XLSX";
      const commitResult = await commitImportAction({
        fileName: file.name,
        fileType,
        columnMapping: mapping,
        rows: cleanedRows,
        skipDuplicates,
      });
      setResult(commitResult);
      setStep(5);
    } finally {
      setIsProcessing(false);
    }
  }

  function reset() {
    setStep(0);
    setFile(null);
    setWorkbook(null);
    setSheetName("");
    setHeaders([]);
    setAllRows([]);
    setMapping({});
    setCleanedRows([]);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <Card>
      <CardContent className="space-y-6 p-6">
        <ol className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {STEPS.map((label, i) => (
            <li key={label} className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-medium",
                  i === step
                    ? "border-primary bg-primary text-primary-foreground"
                    : i < step
                      ? "border-success bg-success/10 text-success"
                      : "border-border"
                )}
              >
                {i + 1}
              </span>
              <span className={i === step ? "font-medium text-foreground" : ""}>{label}</span>
              {i < STEPS.length - 1 && <ChevronLeft className="h-3 w-3 rtl-flip" />}
            </li>
          ))}
        </ol>

        {step === 0 && (
          <div
            className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-12 text-center hover:bg-accent/30"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const dropped = e.dataTransfer.files[0];
              if (dropped) void handleFile(dropped);
            }}
          >
            <UploadCloud className="h-10 w-10 text-muted-foreground" />
            <p className="font-medium">اسحب ملف CSV أو Excel هنا أو اضغط للاختيار</p>
            <p className="text-xs text-muted-foreground">الصيغ المدعومة: CSV، XLSX، XLS</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const selected = e.target.files?.[0];
                if (selected) void handleFile(selected);
              }}
            />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              اختيار ملف
            </Button>
          </div>
        )}

        {step === 1 && workbook && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">هذا الملف يحتوي على عدة أوراق عمل. اختر الورقة المطلوب استيرادها:</p>
            <Select
              value={sheetName}
              onValueChange={(value) => {
                setSheetName(value);
                loadSheet(workbook, value);
              }}
            >
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getSheetNames(workbook).map((name) => (
                  <SelectItem key={name} value={name}>
                    <FileSpreadsheet className="h-4 w-4" /> {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <StepNav onBack={() => setStep(0)} onNext={() => setStep(2)} />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">معاينة أول 20 صفاً من الملف ({allRows.length} صف إجمالي):</p>
            <div className="scroll-x-container max-h-80 rounded-lg border" dir="rtl">
              <table className="w-full text-sm">
                <thead className="sticky top-0 border-b bg-muted/40">
                  <tr>
                    {headers.map((h) => (
                      <th key={h} className="whitespace-nowrap p-2 text-start">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allRows.slice(0, 20).map((row, i) => (
                    <tr key={i} className="border-b last:border-0">
                      {headers.map((h) => (
                        <td key={h} className="whitespace-nowrap p-2">
                          {row[h] || "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <StepNav onBack={() => setStep(0)} onNext={() => setStep(3)} />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <ImportColumnMapping
              headers={headers}
              mapping={mapping}
              onChange={(header, field) => setMapping((prev) => ({ ...prev, [header]: field }))}
            />
            <StepNav
              onBack={() => setStep(2)}
              onNext={() => void proceedToReview()}
              nextDisabled={!Object.values(mapping).includes("name") || !Object.values(mapping).includes("phone")}
              isLoading={isProcessing}
            />
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <ImportReview rows={cleanedRows} skipDuplicates={skipDuplicates} onSkipDuplicatesChange={setSkipDuplicates} />
            <StepNav onBack={() => setStep(3)} onNext={() => void confirmImport()} nextLabel="تأكيد الاستيراد" isLoading={isProcessing} />
          </div>
        )}

        {step === 5 && result && <ImportResult result={result} onStartOver={reset} />}
      </CardContent>
    </Card>
  );
}

function StepNav({
  onBack,
  onNext,
  nextLabel = "التالي",
  nextDisabled,
  isLoading,
}: {
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  isLoading?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <Button variant="outline" onClick={onBack} disabled={isLoading}>
        <ChevronRight className="h-4 w-4" /> رجوع
      </Button>
      <Button onClick={onNext} disabled={nextDisabled || isLoading}>
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {nextLabel}
      </Button>
    </div>
  );
}
