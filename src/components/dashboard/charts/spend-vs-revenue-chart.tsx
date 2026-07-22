"use client";

import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART_COLORS } from "@/lib/chart-colors";
import { EmptyState } from "@/components/shared/empty-state";

export interface SpendVsRevenuePoint {
  date: string;
  spend: number;
  revenue: number;
}

export function SpendVsRevenueChart({ data }: { data: SpendVsRevenuePoint[] }) {
  if (data.length === 0) return <EmptyState title="لا توجد بيانات كافية لهذه الفترة" className="py-16" />;

  return (
    <ResponsiveContainer width="100%" height={280} minWidth={480}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS.success} stopOpacity={0.35} />
            <stop offset="95%" stopColor={CHART_COLORS.success} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.35} />
            <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} minTickGap={24} />
        <YAxis tick={{ fontSize: 11 }} width={48} />
        <Tooltip />
        <Legend />
        <Area
          type="monotone"
          dataKey="revenue"
          name="الإيرادات"
          stroke={CHART_COLORS.success}
          fill="url(#revenueGradient)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="spend"
          name="الإنفاق"
          stroke={CHART_COLORS.primary}
          fill="url(#spendGradient)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
