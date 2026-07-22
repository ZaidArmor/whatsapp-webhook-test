"use client";

import { useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { FilterBar, type FilterConfig } from "@/components/shared/filter-bar";
import { DateRangePicker } from "@/components/shared/date-range-picker";
import type { DashboardFilterOptions } from "@/lib/data/dashboard";
import type { DateRangePreset } from "@/types";

const SOURCE_OPTIONS = [
  { value: "FACEBOOK", label: "فيسبوك" },
  { value: "INSTAGRAM", label: "إنستغرام" },
  { value: "TIKTOK", label: "تيك توك" },
  { value: "SNAPCHAT", label: "سناب شات" },
  { value: "GOOGLE", label: "جوجل" },
  { value: "WHATSAPP", label: "واتساب" },
  { value: "WEBSITE", label: "الموقع الإلكتروني" },
  { value: "WALK_IN", label: "زيارة مباشرة" },
  { value: "REFERRAL", label: "إحالة" },
  { value: "CALL_CENTER", label: "مركز الاتصال" },
  { value: "OTHER", label: "أخرى" },
];

export function DashboardFilters({ options }: { options: DashboardFilterOptions }) {
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
    { key: "branchId", label: "الفرع", options: options.branches },
    { key: "platform", label: "المنصة", options: options.platforms },
    { key: "campaignId", label: "الحملة", options: options.campaigns },
    { key: "serviceId", label: "الخدمة", options: options.services },
    { key: "city", label: "المدينة", options: options.cities },
    { key: "source", label: "مصدر العميل", options: SOURCE_OPTIONS },
  ];

  const values = Object.fromEntries(filters.map((f) => [f.key, searchParams.get(f.key) ?? undefined]));

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <DateRangePicker
        preset={(searchParams.get("preset") as DateRangePreset) ?? "last30Days"}
        customFrom={searchParams.get("from") ?? undefined}
        customTo={searchParams.get("to") ?? undefined}
        onPresetChange={(preset) => updateParam("preset", preset)}
        onCustomChange={(from, to) => {
          const params = new URLSearchParams(searchParams.toString());
          params.set("preset", "custom");
          if (from) params.set("from", from);
          if (to) params.set("to", to);
          router.push(`${pathname}?${params.toString()}`);
        }}
      />
      <FilterBar
        filters={filters}
        values={values}
        onChange={updateParam}
        onClear={() => router.push(pathname)}
      />
    </div>
  );
}
