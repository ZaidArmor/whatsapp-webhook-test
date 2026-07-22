"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART_COLORS } from "@/lib/chart-colors";
import { EmptyState } from "@/components/shared/empty-state";

const DEVICE_LABELS: Record<string, string> = { mobile: "جوال", desktop: "حاسوب", tablet: "لوحي" };

export function DeviceBreakdownChart({ data }: { data: Array<{ device: string; spend: number; leads: number }> }) {
  if (data.length === 0) return <EmptyState title="لا توجد بيانات" className="py-10" />;
  const chartData = data.map((d) => ({ ...d, label: DEVICE_LABELS[d.device] ?? d.device }));
  return (
    <ResponsiveContainer width="100%" height={220} minWidth={280}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} width={36} />
        <Tooltip />
        <Bar dataKey="leads" name="العملاء المحتملون" fill={CHART_COLORS.primaryLight} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function RegionBreakdownChart({ data }: { data: Array<{ region: string; spend: number; leads: number }> }) {
  if (data.length === 0) return <EmptyState title="لا توجد بيانات" className="py-10" />;
  return (
    <ResponsiveContainer width="100%" height={220} minWidth={280}>
      <BarChart data={data} layout="vertical" margin={{ left: 16 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border" />
        <XAxis type="number" tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="region" tick={{ fontSize: 11 }} width={90} />
        <Tooltip />
        <Bar dataKey="spend" name="الإنفاق" fill={CHART_COLORS.primary} radius={[0, 4, 4, 0]} barSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function AgeGenderBreakdownChart({
  data,
}: {
  data: Array<{ ageRange: string; gender: string; leads: number }>;
}) {
  if (data.length === 0) return <EmptyState title="لا توجد بيانات" className="py-10" />;

  const ageRanges = Array.from(new Set(data.map((d) => d.ageRange))).sort();
  const chartData = ageRanges.map((ageRange) => {
    const male = data.find((d) => d.ageRange === ageRange && d.gender === "male")?.leads ?? 0;
    const female = data.find((d) => d.ageRange === ageRange && d.gender === "female")?.leads ?? 0;
    return { ageRange, ذكور: male, إناث: female };
  });

  return (
    <ResponsiveContainer width="100%" height={240} minWidth={320}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
        <XAxis dataKey="ageRange" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} width={36} />
        <Tooltip />
        <Bar dataKey="ذكور" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
        <Bar dataKey="إناث" fill={CHART_COLORS.warning} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function HourBreakdownChart({ data }: { data: Array<{ hour: number; leads: number }> }) {
  if (data.length === 0) return <EmptyState title="لا توجد بيانات" className="py-10" />;
  const chartData = data.map((d) => ({ ...d, label: `${d.hour}:00` }));
  return (
    <ResponsiveContainer width="100%" height={220} minWidth={480}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
        <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={1} />
        <YAxis tick={{ fontSize: 11 }} width={36} />
        <Tooltip />
        <Bar dataKey="leads" name="العملاء المحتملون" fill={CHART_COLORS.success} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
