"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART_COLORS } from "@/lib/chart-colors";
import { EmptyState } from "@/components/shared/empty-state";

export function ConversionRateChart({ data }: { data: Array<{ date: string; rate: number | null }> }) {
  const hasData = data.some((d) => d.rate !== null);
  if (!hasData) return <EmptyState title="لا توجد بيانات كافية لاحتساب معدل التحويل" className="py-16" />;

  return (
    <ResponsiveContainer width="100%" height={260} minWidth={420}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} minTickGap={24} />
        <YAxis tick={{ fontSize: 11 }} width={40} unit="%" />
        <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, "معدل التحويل"]} />
        <Line
          type="monotone"
          dataKey="rate"
          name="معدل التحويل"
          stroke={CHART_COLORS.warning}
          strokeWidth={2}
          dot={false}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
