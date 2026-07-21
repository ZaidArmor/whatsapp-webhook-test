"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { IMPORTABLE_FIELDS, IMPORTABLE_FIELD_LABELS, REQUIRED_IMPORTABLE_FIELDS, type ImportableField } from "@/lib/import/types";

interface ImportColumnMappingProps {
  headers: string[];
  mapping: Record<string, ImportableField | null>;
  onChange: (header: string, field: ImportableField | null) => void;
}

export function ImportColumnMapping({ headers, mapping, onChange }: ImportColumnMappingProps) {
  const mappedFields = new Set(Object.values(mapping).filter(Boolean));
  const missingRequired = REQUIRED_IMPORTABLE_FIELDS.filter((f) => !mappedFields.has(f));

  return (
    <div className="space-y-3">
      {missingRequired.length > 0 && (
        <p className="rounded-md bg-warning/10 px-3 py-2 text-sm text-warning">
          الرجاء تعيين الحقول الإلزامية: {missingRequired.map((f) => IMPORTABLE_FIELD_LABELS[f]).join("، ")}
        </p>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {headers.map((header) => (
          <div key={header} className="flex items-center justify-between gap-3 rounded-lg border p-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{header}</p>
              <p className="text-xs text-muted-foreground">عمود الملف</p>
            </div>
            <Select
              value={mapping[header] ?? "__ignore__"}
              onValueChange={(value) => onChange(header, value === "__ignore__" ? null : (value as ImportableField))}
            >
              <SelectTrigger className="w-44 shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__ignore__">تجاهل هذا العمود</SelectItem>
                {IMPORTABLE_FIELDS.map((field) => (
                  <SelectItem key={field} value={field}>
                    {IMPORTABLE_FIELD_LABELS[field]}
                    {REQUIRED_IMPORTABLE_FIELDS.includes(field) ? " *" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(mapping)
          .filter(([, field]) => field)
          .map(([header, field]) => (
            <Badge key={header} variant="secondary">
              {header} ← {IMPORTABLE_FIELD_LABELS[field as ImportableField]}
            </Badge>
          ))}
      </div>
    </div>
  );
}
