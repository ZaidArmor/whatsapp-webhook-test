"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART_COLORS } from "@/lib/chart-colors";
import { EmptyState } from "@/components/shared/empty-state";

export function ServicePerformanceChart({
  data,
}: {
  data: Array<{ service: string; revenue: number; sales: number }>;
}) {
  if (data.length === 0) return <EmptyState title="لا توجد بيانات كافية لهذه الفترة" className="py-16" />;

  return (
    <ResponsiveContainer width="100%" height={Math.max(240, data.length * 56)} minWidth={420}>
      <BarChart data={data} layout="vertical" margin={{ left: 16, right: 16 }} barCategoryGap="30%">
        <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border" />
        <XAxis type="number" tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="service" tick={{ fontSize: 11 }} width={170} interval={0} />
        <Tooltip />
        <Bar dataKey="revenue" name="الإيرادات" fill={CHART_COLORS.success} radius={[0, 4, 4, 0]} barSize={22} />
      </BarChart>
    </ResponsiveContainer>
  );
}
