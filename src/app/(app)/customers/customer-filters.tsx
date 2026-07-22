"use client";

import { useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { FilterBar, type FilterConfig } from "@/components/shared/filter-bar";
import type { SelectOption } from "@/types";
import { CUSTOMER_STATUS_LABELS, LEAD_SOURCE_LABELS, PHONE_VALIDITY_LABELS } from "@/lib/constants/customer";

export interface CustomerFilterOptions {
  branches: SelectOption[];
  services: SelectOption[];
  platforms: SelectOption[];
  cities: SelectOption[];
}

export function CustomerFilters({ options }: { options: CustomerFilterOptions }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string | undefined) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const filters: FilterConfig[] = [
    {
      key: "status",
      label: "الحالة",
      options: Object.entries(CUSTOMER_STATUS_LABELS).map(([value, label]) => ({ value, label })),
    },
    { key: "branchId", label: "الفرع", options: options.branches },
    { key: "serviceId", label: "الخدمة", options: options.services },
    { key: "platform", label: "المنصة", options: options.platforms },
    {
      key: "source",
      label: "مصدر العميل",
      options: Object.entries(LEAD_SOURCE_LABELS).map(([value, label]) => ({ value, label })),
    },
    { key: "city", label: "المدينة", options: options.cities },
    {
      key: "phoneValidity",
      label: "صحة الرقم",
      options: Object.entries(PHONE_VALIDITY_LABELS).map(([value, label]) => ({ value, label })),
    },
  ];

  const values = Object.fromEntries(filters.map((f) => [f.key, searchParams.get(f.key) ?? undefined]));

  return <FilterBar filters={filters} values={values} onChange={updateParam} onClear={() => router.push(pathname)} />;
}
