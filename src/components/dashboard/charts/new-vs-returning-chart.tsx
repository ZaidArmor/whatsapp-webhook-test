"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART_COLORS } from "@/lib/chart-colors";
import { EmptyState } from "@/components/shared/empty-state";

export function NewVsReturningChart({
  data,
}: {
  data: Array<{ date: string; newCustomers: number; returningCustomers: number }>;
}) {
  const hasData = data.some((d) => d.newCustomers > 0 || d.returningCustomers > 0);
  if (!hasData) return <EmptyState title="لا توجد بيانات كافية لهذه الفترة" className="py-16" />;

  return (
    <ResponsiveContainer width="100%" height={260} minWidth={420}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} minTickGap={24} />
        <YAxis tick={{ fontSize: 11 }} width={40} />
        <Tooltip />
        <Legend />
        <Bar dataKey="newCustomers" name="عملاء جدد" stackId="c" fill={CHART_COLORS.primaryLight} radius={[4, 4, 0, 0]} />
        <Bar dataKey="returningCustomers" name="عملاء عائدون" stackId="c" fill={CHART_COLORS.warning} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
