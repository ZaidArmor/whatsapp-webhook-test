import { prisma } from "@/lib/prisma";
import { ImportWizard } from "@/components/import/import-wizard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDateTime } from "@/lib/utils";

const JOB_STATUS_LABELS: Record<string, string> = {
  PENDING: "قيد الانتظار",
  PROCESSING: "قيد المعالجة",
  COMPLETED: "مكتمل",
  COMPLETED_WITH_ERRORS: "مكتمل مع أخطاء",
  FAILED: "فشل",
};

async function getReferenceData() {
  const [branches, services, campaigns] = await Promise.all([
    prisma.branch.findMany({ where: { deletedAt: null } }),
    prisma.service.findMany({ where: { deletedAt: null } }),
    prisma.campaign.findMany({ where: { deletedAt: null }, select: { id: true, name: true } }),
  ]);

  return {
    branches: branches.map((b) => ({ id: b.id, names: [b.name, b.nameEn].filter((n): n is string => Boolean(n)) })),
    services: services.map((s) => ({ id: s.id, names: [s.nameAr, s.nameEn].filter(Boolean) })),
    campaigns: campaigns.map((c) => ({ id: c.id, names: [c.name] })),
  };
}

async function getImportHistory() {
  return prisma.importJob.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { user: true },
  });
}

export default async function CustomersImportPage() {
  const [reference, history] = await Promise.all([getReferenceData(), getImportHistory()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">استيراد العملاء</h1>
        <p className="text-sm text-muted-foreground">استيراد قائمة عملاء من ملف CSV أو Excel مع تنظيف الأرقام واكتشاف التكرار</p>
      </div>

      <ImportWizard reference={reference} />

      <Card>
        <CardHeader>
          <CardTitle>سجل عمليات الاستيراد</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <EmptyState title="لا توجد عمليات استيراد سابقة" className="py-8" />
          ) : (
            <div className="scroll-x-container" dir="rtl">
              <table className="w-full text-sm">
                <thead className="border-b text-muted-foreground">
                  <tr>
                    <th className="p-2 text-start">الملف</th>
                    <th className="p-2 text-start">المستخدم</th>
                    <th className="p-2 text-start">التاريخ</th>
                    <th className="p-2 text-start">الإجمالي</th>
                    <th className="p-2 text-start">مقبولة</th>
                    <th className="p-2 text-start">مرفوضة</th>
                    <th className="p-2 text-start">مكررة</th>
                    <th className="p-2 text-start">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((job) => (
                    <tr key={job.id} className="border-b last:border-0">
                      <td className="p-2 font-medium">{job.fileName}</td>
                      <td className="p-2">{job.user.name}</td>
                      <td className="p-2 text-muted-foreground">{formatDateTime(job.createdAt)}</td>
                      <td className="p-2">{job.totalRows}</td>
                      <td className="p-2 text-success">{job.acceptedRows}</td>
                      <td className="p-2 text-destructive">{job.rejectedRows}</td>
                      <td className="p-2 text-warning">{job.duplicateRows}</td>
                      <td className="p-2">
                        <Badge variant={job.status === "COMPLETED" ? "success" : job.status === "FAILED" ? "destructive" : "warning"}>
                          {JOB_STATUS_LABELS[job.status] ?? job.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
