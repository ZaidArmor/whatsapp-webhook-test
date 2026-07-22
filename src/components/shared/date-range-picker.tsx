"use client";

import { Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import type { DateRangePreset } from "@/types";

const PRESET_LABELS: Record<DateRangePreset, string> = {
  today: "اليوم",
  yesterday: "أمس",
  last7Days: "آخر 7 أيام",
  last30Days: "آخر 30 يوماً",
  thisMonth: "هذا الشهر",
  lastMonth: "الشهر الماضي",
  thisQuarter: "هذا الربع",
  thisYear: "هذه السنة",
  custom: "فترة مخصصة",
};

const PRESET_ORDER: DateRangePreset[] = [
  "today",
  "yesterday",
  "last7Days",
  "last30Days",
  "thisMonth",
  "lastMonth",
  "thisQuarter",
  "thisYear",
  "custom",
];

interface DateRangePickerProps {
  preset: DateRangePreset;
  customFrom?: string;
  customTo?: string;
  onPresetChange: (preset: DateRangePreset) => void;
  onCustomChange: (from: string, to: string) => void;
}

export function DateRangePicker({ preset, customFrom, customTo, onPresetChange, onCustomChange }: DateRangePickerProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={preset} onValueChange={(value) => onPresetChange(value as DateRangePreset)}>
        <SelectTrigger className="w-44">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PRESET_ORDER.map((p) => (
            <SelectItem key={p} value={p}>
              {PRESET_LABELS[p]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {preset === "custom" && (
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={customFrom ?? ""}
            onChange={(e) => onCustomChange(e.target.value, customTo ?? "")}
            className="w-36"
          />
          <span className="text-muted-foreground">إلى</span>
          <Input
            type="date"
            value={customTo ?? ""}
            onChange={(e) => onCustomChange(customFrom ?? "", e.target.value)}
            className="w-36"
          />
        </div>
      )}
    </div>
  );
}
