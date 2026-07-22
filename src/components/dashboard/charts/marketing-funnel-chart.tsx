"use client";

import { Cell, Funnel, FunnelChart, LabelList, ResponsiveContainer, Tooltip } from "recharts";
import { CATEGORICAL_PALETTE } from "@/lib/chart-colors";
import { EmptyState } from "@/components/shared/empty-state";
import { formatNumber } from "@/lib/utils";
import type { LabeledValue } from "@/lib/data/dashboard";

export function MarketingFunnelChart({ data }: { data: LabeledValue[] }) {
  if (data.every((d) => d.value === 0)) {
    return <EmptyState title="لا توجد بيانات كافية لهذه الفترة" className="py-16" />;
  }

  return (
    <ResponsiveContainer width="100%" height={300} minWidth={320}>
      <FunnelChart>
        <Tooltip formatter={(value) => formatNumber(Number(value))} />
        <Funnel dataKey="value" data={data} nameKey="label" isAnimationActive>
          <LabelList position="right" dataKey="label" fill="currentColor" stroke="none" fontSize={12} />
          <LabelList
            position="center"
            dataKey="value"
            fill="#fff"
            stroke="none"
            fontSize={12}
            formatter={(value) => formatNumber(Number(value))}
          />
          {data.map((entry, index) => (
            <Cell key={entry.label} fill={CATEGORICAL_PALETTE[index % CATEGORICAL_PALETTE.length]} />
          ))}
        </Funnel>
      </FunnelChart>
    </ResponsiveContainer>
  );
}
