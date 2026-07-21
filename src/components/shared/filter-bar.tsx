"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { SelectOption } from "@/types";

export interface FilterConfig {
  key: string;
  label: string;
  options: SelectOption[];
}

interface FilterBarProps {
  filters: FilterConfig[];
  values: Record<string, string | undefined>;
  onChange: (key: string, value: string | undefined) => void;
  onClear?: () => void;
  leading?: ReactNode;
}

export function FilterBar({ filters, values, onChange, onClear, leading }: FilterBarProps) {
  const hasActiveFilters = Object.values(values).some(Boolean);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {leading}
      {filters.map((filter) => (
        <Select
          key={filter.key}
          value={values[filter.key] ?? "__all__"}
          onValueChange={(value) => onChange(filter.key, value === "__all__" ? undefined : value)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder={filter.label} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">{filter.label}: الكل</SelectItem>
            {filter.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}
      {hasActiveFilters && onClear ? (
        <Button variant="ghost" size="sm" onClick={onClear} className="text-muted-foreground">
          <X className="h-3.5 w-3.5" /> مسح الفلاتر
        </Button>
      ) : null}
    </div>
  );
}
