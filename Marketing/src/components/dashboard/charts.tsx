"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PlatformKind } from "@prisma/client";
import { CHART_COLORS, CATEGORICAL_PALETTE } from "@/lib/chart-colors";
import { EmptyState } from "@/components/shared/empty-state";
import { useT } from "@/lib/i18n/client";
import { formatCompact, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

function useDateTick() {
  const { locale } = useT();
  return (iso: string) => formatDate(iso, locale);
}

export function FollowersGrowthChart({ data }: { data: Array<{ date: string; value: number }> }) {
  const { t } = useT();
  const tick = useDateTick();
  if (data.length === 0) return <EmptyState title={t("common.noData")} className="py-14" />;
  return (
    <ResponsiveContainer width="100%" height={260} minWidth={420}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
        <XAxis dataKey="date" tickFormatter={tick} tick={{ fontSize: 11 }} minTickGap={28} />
        <YAxis tick={{ fontSize: 11 }} width={52} tickFormatter={(v: number) => formatCompact(v)} />
        <Tooltip labelFormatter={(label) => tick(String(label))} />
        <Line type="monotone" dataKey="value" name={t("dashboard.kpis.followers")} stroke={CHART_COLORS.primaryLight} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function ReachTrendChart({ data }: { data: Array<{ date: string; value: number }> }) {
  const { t } = useT();
  const tick = useDateTick();
  if (data.length === 0) return <EmptyState title={t("common.noData")} className="py-14" />;
  return (
    <ResponsiveContainer width="100%" height={260} minWidth={420}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="reachGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS.primaryLight} stopOpacity={0.3} />
            <stop offset="95%" stopColor={CHART_COLORS.primaryLight} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
        <XAxis dataKey="date" tickFormatter={tick} tick={{ fontSize: 11 }} minTickGap={28} />
        <YAxis tick={{ fontSize: 11 }} width={52} tickFormatter={(v: number) => formatCompact(v)} />
        <Tooltip labelFormatter={(label) => tick(String(label))} />
        <Area type="monotone" dataKey="value" name={t("dashboard.kpis.reach")} stroke={CHART_COLORS.primaryLight} fill="url(#reachGrad)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function EngagementByPlatformChart({ data }: { data: Array<{ platform: PlatformKind; value: number }> }) {
  const { t } = useT();
  if (data.length === 0) return <EmptyState title={t("common.noData")} className="py-14" />;
  const rows = data.map((d) => ({ ...d, label: t(`platforms.${d.platform}`) }));
  return (
    <ResponsiveContainer width="100%" height={260} minWidth={420}>
      <BarChart data={rows}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} />
        <YAxis tick={{ fontSize: 11 }} width={52} tickFormatter={(v: number) => formatCompact(v)} />
        <Tooltip />
        <Bar dataKey="value" name={t("dashboard.kpis.engagements")} radius={[4, 4, 0, 0]}>
          {rows.map((row, i) => (
            <Cell key={row.platform} fill={CATEGORICAL_PALETTE[i % CATEGORICAL_PALETTE.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function SpendVsRevenueChart({ data }: { data: Array<{ date: string; spend: number; revenue: number }> }) {
  const { t } = useT();
  const tick = useDateTick();
  if (data.length === 0) return <EmptyState title={t("common.noData")} className="py-14" />;
  return (
    <ResponsiveContainer width="100%" height={280} minWidth={480}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS.success} stopOpacity={0.3} />
            <stop offset="95%" stopColor={CHART_COLORS.success} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
            <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
        <XAxis dataKey="date" tickFormatter={tick} tick={{ fontSize: 11 }} minTickGap={28} />
        <YAxis tick={{ fontSize: 11 }} width={56} tickFormatter={(v: number) => formatCompact(v)} />
        <Tooltip labelFormatter={(label) => tick(String(label))} />
        <Legend />
        <Area type="monotone" dataKey="revenue" name={t("dashboard.kpis.revenue")} stroke={CHART_COLORS.success} fill="url(#revGrad)" strokeWidth={2} />
        <Area type="monotone" dataKey="spend" name={t("dashboard.kpis.adSpend")} stroke={CHART_COLORS.primary} fill="url(#spendGrad)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function RoasByPlatformChart({ data }: { data: Array<{ platform: PlatformKind; value: number }> }) {
  const { t } = useT();
  const rows = data.filter((d) => d.value > 0).map((d) => ({ ...d, label: t(`platforms.${d.platform}`) }));
  if (rows.length === 0) return <EmptyState title={t("common.noData")} className="py-14" />;
  return (
    <ResponsiveContainer width="100%" height={260} minWidth={420}>
      <BarChart data={rows} layout="vertical" margin={{ left: 12, right: 12 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border" />
        <XAxis type="number" tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={110} interval={0} />
        <Tooltip />
        <Bar dataKey="value" name={t("dashboard.kpis.roas")} radius={[0, 4, 4, 0]} barSize={20}>
          {rows.map((row) => (
            <Cell key={row.platform} fill={row.value >= 1 ? CHART_COLORS.success : CHART_COLORS.destructive} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TopPostsList({
  data,
}: {
  data: Array<{ id: string; body: string; platform: PlatformKind; engagement: number; impressions: number }>;
}) {
  const { t, locale } = useT();
  if (data.length === 0) return <EmptyState title={t("common.noData")} className="py-10" />;
  return (
    <ul className="space-y-3" dir="auto">
      {data.map((post) => (
        <li key={post.id} className="flex items-start justify-between gap-3 border-b pb-2 last:border-0">
          <div className="min-w-0">
            <p className="truncate text-sm">{post.body}</p>
            <Badge variant="muted" className="mt-1">
              {t(`platforms.${post.platform}`)}
            </Badge>
          </div>
          <div className="shrink-0 text-end text-xs text-muted-foreground">
            <div className="font-semibold text-foreground">{formatCompact(post.engagement, locale)}</div>
            {t("dashboard.kpis.engagements")}
          </div>
        </li>
      ))}
    </ul>
  );
}
