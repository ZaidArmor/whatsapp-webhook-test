"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART_COLORS } from "@/lib/chart-colors";
import { EmptyState } from "@/components/shared/empty-state";

interface CampaignRankRow {
  name: string;
  roas: number | null;
  spend: number;
}

/** Shows the best 5 and worst 5 campaigns by ROAS (spend > 0 only, to exclude noise). */
export function CampaignRankingChart({ data }: { data: CampaignRankRow[] }) {
  const withRoas = data.filter((d) => d.roas !== null && d.spend > 0);
  if (withRoas.length === 0) return <EmptyState title="لا توجد حملات كافية للمقارنة" className="py-16" />;

  const best = withRoas.slice(0, 5);
  const worst = withRoas.slice(-5).reverse();
  const combined = [...best, ...worst.filter((w) => !best.some((b) => b.name === w.name))].map((c, i) => ({
    key: `${i}-${c.name}`,
    name: c.name.length > 22 ? `${c.name.slice(0, 22)}…` : c.name,
    roas: Number((c.roas ?? 0).toFixed(2)),
  }));

  return (
    <ResponsiveContainer width="100%" height={Math.max(280, combined.length * 46)} minWidth={460}>
      <BarChart data={combined} layout="vertical" margin={{ left: 16, right: 16 }} barCategoryGap="25%">
        <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border" />
        <XAxis type="number" tick={{ fontSize: 11 }} unit="x" />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={190} interval={0} />
        <Tooltip formatter={(value) => [`${value}x`, "ROAS"]} />
        <Bar dataKey="roas" radius={[0, 4, 4, 0]} barSize={20}>
          {combined.map((entry) => (
            <Cell key={entry.key} fill={entry.roas >= 1 ? CHART_COLORS.success : CHART_COLORS.destructive} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
