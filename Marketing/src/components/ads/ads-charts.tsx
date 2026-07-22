"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PlatformKind } from "@prisma/client";
import { CHART_COLORS } from "@/lib/chart-colors";
import { EmptyState } from "@/components/shared/empty-state";
import { useT } from "@/lib/i18n/client";
import { formatCompact, formatDate } from "@/lib/utils";

export function PlatformComparisonChart({
  data,
}: {
  data: Array<{ platform: PlatformKind; spend: number; revenue: number; roas: number | null }>;
}) {
  const { t } = useT();
  if (data.length === 0) return <EmptyState title={t("common.noData")} className="py-14" />;
  const rows = data.map((d) => ({ ...d, label: t(`platforms.${d.platform}`) }));
  return (
    <ResponsiveContainer width="100%" height={280} minWidth={420}>
      <BarChart data={rows}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} />
        <YAxis tick={{ fontSize: 11 }} width={56} tickFormatter={(v: number) => formatCompact(v)} />
        <Tooltip formatter={(value) => formatCompact(Number(value))} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="spend" name={t("ads.spend")} fill={CHART_COLORS.warning} radius={[4, 4, 0, 0]} />
        <Bar dataKey="revenue" name={t("ads.revenue")} fill={CHART_COLORS.primaryLight} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CampaignDailyChart({
  data,
}: {
  data: Array<{ date: string; spend: number; revenue: number }>;
}) {
  const { t, locale } = useT();
  if (data.length === 0) return <EmptyState title={t("common.noData")} className="py-14" />;
  return (
    <ResponsiveContainer width="100%" height={280} minWidth={420}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
        <XAxis dataKey="date" tickFormatter={(iso: string) => formatDate(iso, locale)} tick={{ fontSize: 11 }} minTickGap={28} />
        <YAxis tick={{ fontSize: 11 }} width={56} tickFormatter={(v: number) => formatCompact(v)} />
        <Tooltip labelFormatter={(label) => formatDate(String(label), locale)} formatter={(value) => formatCompact(Number(value))} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="spend" name={t("ads.spend")} stroke={CHART_COLORS.warning} strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="revenue" name={t("ads.revenue")} stroke={CHART_COLORS.primaryLight} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
