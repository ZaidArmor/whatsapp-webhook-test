"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { CATEGORICAL_PALETTE } from "@/lib/chart-colors";
import { EmptyState } from "@/components/shared/empty-state";
import type { LabeledValue } from "@/lib/data/dashboard";

export function SalesByPlatformChart({ data }: { data: LabeledValue[] }) {
  const filtered = data.filter((d) => d.value > 0);
  if (filtered.length === 0) return <EmptyState title="لا توجد مبيعات في هذه الفترة" className="py-16" />;

  return (
    <ResponsiveContainer width="100%" height={260} minWidth={320}>
      <PieChart>
        <Pie data={filtered} dataKey="value" nameKey="label" innerRadius={55} outerRadius={90} paddingAngle={2}>
          {filtered.map((entry, index) => (
            <Cell key={entry.label} fill={CATEGORICAL_PALETTE[index % CATEGORICAL_PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
