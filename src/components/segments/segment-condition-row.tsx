"use client";

import { Trash2 } from "lucide-react";
import type { SegmentConditionField, SegmentConditionOperator } from "@prisma/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  FIELD_LABELS,
  FIELD_VALUE_TYPE,
  OPERATOR_LABELS,
  OPERATORS_BY_VALUE_TYPE,
  type FieldValueType,
} from "@/lib/segments/types";
import type { SegmentConditionInput } from "@/lib/segments/types";
import type { SegmentSelectOptions } from "./segment-builder";

interface SegmentConditionRowProps {
  condition: SegmentConditionInput;
  options: SegmentSelectOptions;
  onChange: (condition: SegmentConditionInput) => void;
  onRemove: () => void;
}

const SELECT_FIELD_OPTIONS_KEY: Partial<Record<SegmentConditionField, keyof SegmentSelectOptions>> = {
  BRANCH: "branches",
  SERVICE: "services",
  CAMPAIGN: "campaigns",
  PLATFORM: "platforms",
  SOURCE: "sources",
  CUSTOMER_STATUS: "statuses",
  PHONE_VALIDITY: "phoneValidities",
};

export function SegmentConditionRow({ condition, options, onChange, onRemove }: SegmentConditionRowProps) {
  const valueType: FieldValueType = FIELD_VALUE_TYPE[condition.field];
  const availableOperators = OPERATORS_BY_VALUE_TYPE[valueType];
  const selectOptionsKey = SELECT_FIELD_OPTIONS_KEY[condition.field];
  const selectOptions = selectOptionsKey ? options[selectOptionsKey] : [];

  function updateField(field: SegmentConditionField) {
    const nextValueType = FIELD_VALUE_TYPE[field];
    const nextOperator = OPERATORS_BY_VALUE_TYPE[nextValueType][0]!;
    onChange({ ...condition, field, operator: nextOperator, value: null });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border bg-background p-2">
      <Select value={condition.field} onValueChange={(v) => updateField(v as SegmentConditionField)}>
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(FIELD_LABELS).map(([field, label]) => (
            <SelectItem key={field} value={field}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={condition.operator}
        onValueChange={(v) => onChange({ ...condition, operator: v as SegmentConditionOperator })}
      >
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {availableOperators.map((op) => (
            <SelectItem key={op} value={op}>
              {OPERATOR_LABELS[op]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="min-w-40 flex-1">
        <ConditionValueInput
          valueType={valueType}
          operator={condition.operator}
          value={condition.value}
          selectOptions={selectOptions}
          onChange={(value) => onChange({ ...condition, value })}
        />
      </div>

      <Button variant="ghost" size="icon" onClick={onRemove}>
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}

function ConditionValueInput({
  valueType,
  operator,
  value,
  selectOptions,
  onChange,
}: {
  valueType: FieldValueType;
  operator: SegmentConditionOperator;
  value: SegmentConditionInput["value"];
  selectOptions: Array<{ value: string; label: string }>;
  onChange: (value: SegmentConditionInput["value"]) => void;
}) {
  if (valueType === "boolean") return null;

  if (valueType === "days") {
    return (
      <Input
        type="number"
        min={0}
        value={typeof value === "number" ? value : ""}
        onChange={(e) => onChange(Number(e.target.value))}
        placeholder="عدد الأيام"
      />
    );
  }

  if (valueType === "number") {
    return (
      <Input
        type="number"
        value={typeof value === "number" ? value : ""}
        onChange={(e) => onChange(Number(e.target.value))}
        placeholder="القيمة"
      />
    );
  }

  if (valueType === "date") {
    return (
      <Input
        type="date"
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  if (valueType === "select" && (operator === "IN" || operator === "NOT_IN")) {
    const arrayValue = Array.isArray(value) ? value.join("، ") : "";
    return (
      <Input
        value={arrayValue}
        onChange={(e) => onChange(e.target.value.split("،").map((v) => v.trim()).filter(Boolean))}
        placeholder="قيم مفصولة بفاصلة عربية (،)"
      />
    );
  }

  if (valueType === "select" && selectOptions.length > 0) {
    return (
      <Select value={typeof value === "string" ? value : ""} onValueChange={(v) => onChange(v)}>
        <SelectTrigger>
          <SelectValue placeholder="اختر قيمة" />
        </SelectTrigger>
        <SelectContent>
          {selectOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <Input value={typeof value === "string" ? value : ""} onChange={(e) => onChange(e.target.value)} placeholder="القيمة" />
  );
}
