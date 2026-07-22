"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART_COLORS } from "@/lib/chart-colors";
import { EmptyState } from "@/components/shared/empty-state";

export function LeadsByDayChart({ data }: { data: Array<{ date: string; leads: number }> }) {
  if (data.length === 0) return <EmptyState title="لا توجد بيانات كافية لهذه الفترة" className="py-16" />;

  return (
    <ResponsiveContainer width="100%" height={260} minWidth={420}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} minTickGap={24} />
        <YAxis tick={{ fontSize: 11 }} width={40} />
        <Tooltip />
        <Bar dataKey="leads" name="العملاء المحتملون" fill={CHART_COLORS.primaryLight} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
