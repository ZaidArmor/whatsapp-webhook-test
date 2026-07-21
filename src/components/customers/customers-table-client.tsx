"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { CheckCircle2, XCircle } from "lucide-react";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { CustomerStatusBadge } from "./customer-status-badge";
import { PlatformBadge } from "@/components/shared/platform-badge";
import { displayPhone } from "@/lib/phone/mask";
import { PHONE_VALIDITY_LABELS, LEAD_SOURCE_LABELS } from "@/lib/constants/customer";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import { exportRowsToXlsx } from "@/lib/export/xlsx";
import type { CustomerListRow } from "@/lib/data/customers";

const DEFAULT_HIDDEN_COLUMNS = ["email", "visitCount", "ownerName", "lastPurchaseAt", "campaignName", "tags"];

export function CustomersTableClient({ data, canViewFullPhone }: { data: CustomerListRow[]; canViewFullPhone: boolean }) {
  const columns: ColumnDef<CustomerListRow, unknown>[] = [
    {
      accessorKey: "name",
      header: "اسم العميل",
      meta: { label: "اسم العميل" },
      cell: ({ row }) => (
        <Link href={`/customers/${row.original.id}`} className="font-medium text-primary hover:underline">
          {row.original.name}
        </Link>
      ),
    },
    {
      accessorKey: "originalPhone",
      header: "رقم الجوال",
      meta: { label: "رقم الجوال" },
      cell: ({ row }) => (
        <span dir="ltr" className="tabular-nums">
          {displayPhone(row.original.normalizedPhone ?? row.original.originalPhone, canViewFullPhone)}
        </span>
      ),
    },
    {
      accessorKey: "phoneValidity",
      header: "صحة الرقم",
      meta: { label: "صحة الرقم" },
      cell: ({ row }) =>
        row.original.phoneValidity === "VALID" ? (
          <span className="inline-flex items-center gap-1 text-success"><CheckCircle2 className="h-3.5 w-3.5" /> صحيح</span>
        ) : (
          <span className="inline-flex items-center gap-1 text-destructive"><XCircle className="h-3.5 w-3.5" /> غير صحيح</span>
        ),
    },
    { accessorKey: "email", header: "البريد الإلكتروني", meta: { label: "البريد الإلكتروني" }, cell: ({ row }) => row.original.email ?? "—" },
    { accessorKey: "city", header: "المدينة", meta: { label: "المدينة" }, cell: ({ row }) => row.original.city ?? "—" },
    { accessorKey: "branchName", header: "الفرع", meta: { label: "الفرع" }, cell: ({ row }) => row.original.branchName ?? "—" },
    {
      accessorKey: "source",
      header: "مصدر العميل",
      meta: { label: "مصدر العميل" },
      cell: ({ row }) => (row.original.source ? LEAD_SOURCE_LABELS[row.original.source] : "—"),
    },
    {
      accessorKey: "platform",
      header: "المنصة",
      meta: { label: "المنصة" },
      cell: ({ row }) => (row.original.platform ? <PlatformBadge platform={row.original.platform} /> : "—"),
    },
    { accessorKey: "campaignName", header: "الحملة", meta: { label: "الحملة" }, cell: ({ row }) => row.original.campaignName ?? "—" },
    { accessorKey: "serviceName", header: "الخدمة", meta: { label: "الخدمة" }, cell: ({ row }) => row.original.serviceName ?? "—" },
    {
      accessorKey: "status",
      header: "حالة العميل",
      meta: { label: "حالة العميل" },
      cell: ({ row }) => <CustomerStatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "potentialValue",
      header: "القيمة المحتملة",
      meta: { label: "القيمة المحتملة" },
      cell: ({ row }) => formatCurrency(row.original.potentialValue),
    },
    {
      accessorKey: "totalPurchaseValue",
      header: "قيمة المشتريات",
      meta: { label: "قيمة المشتريات" },
      cell: ({ row }) => formatCurrency(row.original.totalPurchaseValue),
    },
    { accessorKey: "visitCount", header: "عدد الزيارات", meta: { label: "عدد الزيارات" }, cell: ({ row }) => formatNumber(row.original.visitCount) },
    {
      accessorKey: "firstContactAt",
      header: "أول تواصل",
      meta: { label: "أول تواصل" },
      cell: ({ row }) => (row.original.firstContactAt ? formatDate(row.original.firstContactAt) : "—"),
    },
    {
      accessorKey: "lastContactAt",
      header: "آخر تواصل",
      meta: { label: "آخر تواصل" },
      cell: ({ row }) => (row.original.lastContactAt ? formatDate(row.original.lastContactAt) : "—"),
    },
    {
      accessorKey: "lastPurchaseAt",
      header: "آخر عملية شراء",
      meta: { label: "آخر عملية شراء" },
      cell: ({ row }) => (row.original.lastPurchaseAt ? formatDate(row.original.lastPurchaseAt) : "—"),
    },
    { accessorKey: "ownerName", header: "الموظف المسؤول", meta: { label: "الموظف المسؤول" }, cell: ({ row }) => row.original.ownerName ?? "—" },
    {
      accessorKey: "tags",
      header: "الوسوم",
      meta: { label: "الوسوم" },
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.tags.length === 0 ? "—" : row.original.tags.map((t) => <Badge key={t} variant="muted">{t}</Badge>)}
        </div>
      ),
    },
    {
      accessorKey: "marketingConsent",
      header: "الموافقة التسويقية",
      meta: { label: "الموافقة التسويقية" },
      cell: ({ row }) =>
        row.original.marketingConsent ? (
          <CheckCircle2 className="h-4 w-4 text-success" />
        ) : (
          <XCircle className="h-4 w-4 text-muted-foreground" />
        ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      searchPlaceholder="ابحث بالاسم أو رقم الجوال أو البريد..."
      initialColumnVisibility={Object.fromEntries(DEFAULT_HIDDEN_COLUMNS.map((c) => [c, false]))}
      onExport={() =>
        exportRowsToXlsx(
          data.map((c) => ({
            "اسم العميل": c.name,
            "رقم الجوال": c.normalizedPhone ?? c.originalPhone,
            "صحة الرقم": PHONE_VALIDITY_LABELS[c.phoneValidity as keyof typeof PHONE_VALIDITY_LABELS] ?? c.phoneValidity,
            المدينة: c.city,
            الفرع: c.branchName,
            الخدمة: c.serviceName,
            الحالة: c.status,
            القيمة_المحتملة: c.potentialValue,
            قيمة_المشتريات: c.totalPurchaseValue,
          })),
          "customers-export"
        )
      }
    />
  );
}
