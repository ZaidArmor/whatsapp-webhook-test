"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { Archive, ArchiveRestore, Copy, Trash2 } from "lucide-react";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, formatNumber } from "@/lib/utils";
import { archiveSegmentAction, unarchiveSegmentAction, copySegmentAction, deleteSegmentAction } from "@/app/(app)/segments/actions";
import type { SegmentListRow } from "@/lib/data/segments";

export function SegmentsTableClient({ data }: { data: SegmentListRow[] }) {
  const router = useRouter();

  const columns: ColumnDef<SegmentListRow, unknown>[] = [
    {
      accessorKey: "name",
      header: "اسم الشريحة",
      meta: { label: "اسم الشريحة" },
      cell: ({ row }) => (
        <Link href={`/segments/${row.original.id}`} className="font-medium text-primary hover:underline">
          {row.original.name}
        </Link>
      ),
    },
    { accessorKey: "description", header: "الوصف", meta: { label: "الوصف" }, cell: ({ row }) => row.original.description ?? "—" },
    {
      accessorKey: "customerCountCache",
      header: "عدد العملاء",
      meta: { label: "عدد العملاء" },
      cell: ({ row }) => formatNumber(row.original.customerCountCache),
    },
    { accessorKey: "ownerName", header: "أنشئت بواسطة", meta: { label: "أنشئت بواسطة" } },
    {
      accessorKey: "updatedAt",
      header: "آخر تحديث",
      meta: { label: "آخر تحديث" },
      cell: ({ row }) => formatDateTime(row.original.updatedAt),
    },
    {
      accessorKey: "isArchived",
      header: "الحالة",
      meta: { label: "الحالة" },
      cell: ({ row }) => <Badge variant={row.original.isArchived ? "muted" : "success"}>{row.original.isArchived ? "مؤرشفة" : "نشطة"}</Badge>,
    },
    {
      id: "actions",
      header: "إجراءات",
      meta: { label: "إجراءات" },
      enableHiding: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" title="نسخ" onClick={() => void copySegmentAction({ id: row.original.id })}>
            <Copy className="h-4 w-4" />
          </Button>
          {row.original.isArchived ? (
            <Button variant="ghost" size="icon" title="إلغاء الأرشفة" onClick={() => void unarchiveSegmentAction({ id: row.original.id })}>
              <ArchiveRestore className="h-4 w-4" />
            </Button>
          ) : (
            <Button variant="ghost" size="icon" title="أرشفة" onClick={() => void archiveSegmentAction({ id: row.original.id })}>
              <Archive className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            title="حذف"
            onClick={() => {
              if (confirm("هل أنت متأكد من حذف هذه الشريحة؟")) {
                void deleteSegmentAction({ id: row.original.id }).then(() => router.refresh());
              }
            }}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return <DataTable columns={columns} data={data} searchPlaceholder="ابحث عن شريحة..." />;
}
