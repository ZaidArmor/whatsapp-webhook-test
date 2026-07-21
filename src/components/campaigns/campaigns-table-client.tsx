"use client";

import * as React from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { GitCompare } from "lucide-react";
import { DataTable } from "@/components/shared/data-table";
import { PlatformBadge } from "@/components/shared/platform-badge";
import { CampaignStatusBadge } from "@/components/shared/campaign-status-badge";
import { CampaignRatingBadge } from "./campaign-rating-badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { displayMetric, formatCurrency, formatDate, formatNumber, formatPercent } from "@/lib/utils";
import { exportRowsToXlsx } from "@/lib/export/xlsx";
import type { CampaignListRow } from "@/lib/data/campaigns";

function num(v: number | null, fmt: (n: number) => string = (n) => formatNumber(Math.round(n))) {
  return displayMetric(v, fmt);
}

const columns: ColumnDef<CampaignListRow, unknown>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox checked={row.getIsSelected()} onCheckedChange={(v) => row.toggleSelected(!!v)} />
    ),
    enableHiding: false,
    enableSorting: false,
  },
  {
    accessorKey: "name",
    header: "اسم الحملة",
    meta: { label: "اسم الحملة" },
    cell: ({ row }) => (
      <Link href={`/campaigns/${row.original.id}`} className="font-medium text-primary hover:underline">
        {row.original.name}
      </Link>
    ),
  },
  {
    accessorKey: "platform",
    header: "المنصة",
    meta: { label: "المنصة" },
    cell: ({ row }) => <PlatformBadge platform={row.original.platform} />,
  },
  {
    accessorKey: "adAccountName",
    header: "الحساب الإعلاني",
    meta: { label: "الحساب الإعلاني" },
    cell: ({ row }) => row.original.adAccountName ?? "—",
  },
  { accessorKey: "objective", header: "الهدف", meta: { label: "الهدف" } },
  {
    accessorKey: "status",
    header: "الحالة",
    meta: { label: "الحالة" },
    cell: ({ row }) => <CampaignStatusBadge status={row.original.status} />,
  },
  {
    accessorKey: "startDate",
    header: "تاريخ البداية",
    meta: { label: "تاريخ البداية" },
    cell: ({ row }) => formatDate(row.original.startDate),
  },
  {
    accessorKey: "endDate",
    header: "تاريخ النهاية",
    meta: { label: "تاريخ النهاية" },
    cell: ({ row }) => (row.original.endDate ? formatDate(row.original.endDate) : "—"),
  },
  {
    accessorKey: "budget",
    header: "الميزانية",
    meta: { label: "الميزانية" },
    cell: ({ row }) => formatCurrency(row.original.budget),
  },
  {
    accessorKey: "spend",
    header: "المبلغ المصروف",
    meta: { label: "المبلغ المصروف" },
    cell: ({ row }) => formatCurrency(row.original.spend),
  },
  {
    accessorKey: "impressions",
    header: "مرات الظهور",
    meta: { label: "مرات الظهور" },
    cell: ({ row }) => formatNumber(row.original.impressions),
  },
  {
    accessorKey: "reach",
    header: "الوصول",
    meta: { label: "الوصول" },
    cell: ({ row }) => formatNumber(row.original.reach),
  },
  {
    accessorKey: "frequency",
    header: "التكرار",
    meta: { label: "التكرار" },
    cell: ({ row }) => num(row.original.frequency, (n) => `${n.toFixed(2)}x`),
  },
  {
    accessorKey: "clicks",
    header: "النقرات",
    meta: { label: "النقرات" },
    cell: ({ row }) => formatNumber(row.original.clicks),
  },
  {
    accessorKey: "ctr",
    header: "CTR",
    meta: { label: "CTR" },
    cell: ({ row }) => num(row.original.ctr, (n) => formatPercent(n)),
  },
  {
    accessorKey: "cpc",
    header: "CPC",
    meta: { label: "CPC" },
    cell: ({ row }) => num(row.original.cpc, (n) => formatCurrency(n)),
  },
  {
    accessorKey: "cpm",
    header: "CPM",
    meta: { label: "CPM" },
    cell: ({ row }) => num(row.original.cpm, (n) => formatCurrency(n)),
  },
  {
    accessorKey: "leads",
    header: "Leads",
    meta: { label: "Leads" },
    cell: ({ row }) => formatNumber(row.original.leads),
  },
  {
    accessorKey: "cpl",
    header: "CPL",
    meta: { label: "CPL" },
    cell: ({ row }) => num(row.original.cpl, (n) => formatCurrency(n)),
  },
  {
    accessorKey: "conversations",
    header: "المحادثات",
    meta: { label: "المحادثات" },
    cell: ({ row }) => formatNumber(row.original.conversations),
  },
  {
    accessorKey: "bookings",
    header: "الحجوزات",
    meta: { label: "الحجوزات" },
    cell: ({ row }) => formatNumber(row.original.bookings),
  },
  {
    accessorKey: "sales",
    header: "المبيعات",
    meta: { label: "المبيعات" },
    cell: ({ row }) => formatNumber(row.original.sales),
  },
  {
    accessorKey: "revenue",
    header: "الإيرادات",
    meta: { label: "الإيرادات" },
    cell: ({ row }) => formatCurrency(row.original.revenue),
  },
  {
    accessorKey: "roas",
    header: "ROAS",
    meta: { label: "ROAS" },
    cell: ({ row }) => num(row.original.roas, (n) => `${n.toFixed(2)}x`),
  },
  {
    accessorKey: "conversionRate",
    header: "معدل التحويل",
    meta: { label: "معدل التحويل" },
    cell: ({ row }) => num(row.original.conversionRate, (n) => formatPercent(n)),
  },
  { accessorKey: "branchName", header: "الفرع", meta: { label: "الفرع" }, cell: ({ row }) => row.original.branchName ?? "—" },
  { accessorKey: "serviceName", header: "الخدمة", meta: { label: "الخدمة" }, cell: ({ row }) => row.original.serviceName ?? "—" },
  {
    accessorKey: "rating",
    header: "تقييم الحملة",
    meta: { label: "تقييم الحملة" },
    cell: ({ row }) => <CampaignRatingBadge rating={row.original.rating} />,
  },
];

const DEFAULT_HIDDEN_COLUMNS = ["adAccountName", "reach", "frequency", "cpm", "conversations", "endDate"];

export function CampaignsTableClient({ data }: { data: CampaignListRow[] }) {
  const [selected, setSelected] = React.useState<CampaignListRow[]>([]);
  const [compareOpen, setCompareOpen] = React.useState(false);

  return (
    <div className="space-y-3">
      <DataTable
        columns={columns}
        data={data}
        searchPlaceholder="ابحث عن حملة..."
        enableRowSelection
        onSelectionChange={setSelected}
        initialColumnVisibility={Object.fromEntries(DEFAULT_HIDDEN_COLUMNS.map((c) => [c, false]))}
        onExport={() =>
          exportRowsToXlsx(
            data.map((c) => ({
              "اسم الحملة": c.name,
              المنصة: c.platform,
              الحالة: c.status,
              الميزانية: c.budget,
              "المبلغ المصروف": c.spend,
              مرات_الظهور: c.impressions,
              النقرات: c.clicks,
              CTR: c.ctr,
              CPL: c.cpl,
              Leads: c.leads,
              المبيعات: c.sales,
              الإيرادات: c.revenue,
              ROAS: c.roas,
              الفرع: c.branchName,
              الخدمة: c.serviceName,
            })),
            "campaigns-export"
          )
        }
        toolbarExtra={
          selected.length >= 2 ? (
            <Button variant="secondary" size="sm" onClick={() => setCompareOpen(true)}>
              <GitCompare className="h-4 w-4" /> مقارنة ({selected.length})
            </Button>
          ) : null
        }
      />

      <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>مقارنة الحملات</DialogTitle>
          </DialogHeader>
          <div className="scroll-x-container">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-2 text-start text-muted-foreground">المؤشر</th>
                  {selected.map((c) => (
                    <th key={c.id} className="p-2 text-start font-medium">
                      {c.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "المنصة", render: (c: CampaignListRow) => <PlatformBadge platform={c.platform} /> },
                  { label: "الإنفاق", render: (c: CampaignListRow) => formatCurrency(c.spend) },
                  { label: "الإيرادات", render: (c: CampaignListRow) => formatCurrency(c.revenue) },
                  { label: "ROAS", render: (c: CampaignListRow) => num(c.roas, (n) => `${n.toFixed(2)}x`) },
                  { label: "CPL", render: (c: CampaignListRow) => num(c.cpl, (n) => formatCurrency(n)) },
                  { label: "Leads", render: (c: CampaignListRow) => formatNumber(c.leads) },
                  { label: "المبيعات", render: (c: CampaignListRow) => formatNumber(c.sales) },
                  { label: "معدل التحويل", render: (c: CampaignListRow) => num(c.conversionRate, (n) => formatPercent(n)) },
                  { label: "التقييم", render: (c: CampaignListRow) => <CampaignRatingBadge rating={c.rating} /> },
                ].map((metric) => (
                  <tr key={metric.label} className="border-b last:border-0">
                    <td className="p-2 text-muted-foreground">{metric.label}</td>
                    {selected.map((c) => (
                      <td key={c.id} className="p-2">
                        {metric.render(c)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
