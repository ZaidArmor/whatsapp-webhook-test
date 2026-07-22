"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { AuditAction } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/shared/data-table";
import { formatDateTime } from "@/lib/utils";

export interface AuditLogRow {
  id: string;
  userName: string;
  action: AuditAction;
  entityType: string;
  entityId: string | null;
  metadata: unknown;
  createdAt: Date;
}

const ACTION_LABELS: Record<AuditAction, string> = {
  CREATE: "إنشاء",
  UPDATE: "تعديل",
  DELETE: "حذف",
  EXPORT: "تصدير",
  IMPORT: "استيراد",
  LOGIN: "تسجيل دخول",
  LOGOUT: "تسجيل خروج",
  CONNECT_INTEGRATION: "ربط تكامل",
  DISCONNECT_INTEGRATION: "إلغاء ربط تكامل",
  MERGE_CUSTOMERS: "دمج عملاء",
};

const ACTION_VARIANT: Record<AuditAction, "success" | "warning" | "destructive" | "secondary" | "muted"> = {
  CREATE: "success",
  UPDATE: "secondary",
  DELETE: "destructive",
  EXPORT: "warning",
  IMPORT: "warning",
  LOGIN: "muted",
  LOGOUT: "muted",
  CONNECT_INTEGRATION: "success",
  DISCONNECT_INTEGRATION: "destructive",
  MERGE_CUSTOMERS: "secondary",
};

const columns: ColumnDef<AuditLogRow, unknown>[] = [
  {
    accessorKey: "createdAt",
    header: "التاريخ والوقت",
    meta: { label: "التاريخ والوقت" },
    cell: ({ row }) => formatDateTime(row.original.createdAt),
  },
  { accessorKey: "userName", header: "المستخدم", meta: { label: "المستخدم" } },
  {
    accessorKey: "action",
    header: "الإجراء",
    meta: { label: "الإجراء" },
    cell: ({ row }) => <Badge variant={ACTION_VARIANT[row.original.action]}>{ACTION_LABELS[row.original.action]}</Badge>,
  },
  { accessorKey: "entityType", header: "نوع الكائن", meta: { label: "نوع الكائن" } },
  {
    accessorKey: "entityId",
    header: "معرّف الكائن",
    meta: { label: "معرّف الكائن" },
    cell: ({ row }) => <span className="font-mono text-xs">{row.original.entityId ?? "—"}</span>,
  },
  {
    accessorKey: "metadata",
    header: "تفاصيل",
    meta: { label: "تفاصيل" },
    cell: ({ row }) => (
      <span className="max-w-xs truncate text-xs text-muted-foreground">
        {row.original.metadata ? JSON.stringify(row.original.metadata) : "—"}
      </span>
    ),
  },
];

export function AuditLogTableClient({ data }: { data: AuditLogRow[] }) {
  return <DataTable columns={columns} data={data} searchPlaceholder="ابحث في سجل التدقيق..." />;
}
