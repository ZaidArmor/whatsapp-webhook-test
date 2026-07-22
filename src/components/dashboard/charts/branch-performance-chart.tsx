"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART_COLORS } from "@/lib/chart-colors";
import { EmptyState } from "@/components/shared/empty-state";

export function BranchPerformanceChart({
  data,
}: {
  data: Array<{ branch: string; revenue: number; spend: number }>;
}) {
  if (data.length === 0) return <EmptyState title="لا توجد بيانات كافية لهذه الفترة" className="py-16" />;

  return (
    <ResponsiveContainer width="100%" height={260} minWidth={360}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
        <XAxis dataKey="branch" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} width={48} />
        <Tooltip />
        <Legend />
        <Bar dataKey="revenue" name="الإيرادات" fill={CHART_COLORS.success} radius={[4, 4, 0, 0]} />
        <Bar dataKey="spend" name="الإنفاق" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
