import { prisma } from "@/lib/prisma";
import { AuditLogTableClient } from "@/components/audit/audit-log-table-client";

export default async function AuditLogPage() {
  const logs = await prisma.auditLog.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  const rows = logs.map((log) => ({
    id: log.id,
    userName: log.user?.name ?? "النظام",
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    metadata: log.metadata,
    createdAt: log.createdAt,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">سجل التدقيق</h1>
        <p className="text-sm text-muted-foreground">سجل كامل لجميع العمليات الحساسة (إنشاء، تعديل، حذف، تصدير، استيراد)</p>
      </div>

      <AuditLogTableClient data={rows} />
    </div>
  );
}
