import { prisma } from "@/lib/prisma";
import { getExportHistory } from "./actions";
import { ExportBuilder } from "@/components/exports/export-builder";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { EXPORT_FORMAT_LABELS } from "@/lib/export/formats";
import { formatDateTime } from "@/lib/utils";

interface PageProps {
  searchParams: Promise<{ segmentId?: string }>;
}

export default async function ExportsPage({ searchParams }: PageProps) {
  const { segmentId } = await searchParams;
  const [segments, history] = await Promise.all([
    prisma.segment.findMany({ where: { isArchived: false }, select: { id: true, name: true } }),
    getExportHistory(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">تصدير قوائم إعادة الاستهداف</h1>
        <p className="text-sm text-muted-foreground">تصدير شرائح العملاء بصيغ متعددة تناسب كل منصة إعلانية</p>
      </div>

      <ExportBuilder segments={segments.map((s) => ({ value: s.id, label: s.name }))} initialSegmentId={segmentId} />

      <Card>
        <CardHeader>
          <CardTitle>سجل عمليات التصدير</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <EmptyState title="لا توجد عمليات تصدير سابقة" className="py-8" />
          ) : (
            <div className="scroll-x-container" dir="rtl">
              <table className="w-full text-sm">
                <thead className="border-b text-muted-foreground">
                  <tr>
                    <th className="p-2 text-start">الصيغة</th>
                    <th className="p-2 text-start">الشريحة</th>
                    <th className="p-2 text-start">المستخدم</th>
                    <th className="p-2 text-start">عدد السجلات</th>
                    <th className="p-2 text-start">التاريخ</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((job) => (
                    <tr key={job.id} className="border-b last:border-0">
                      <td className="p-2">
                        <Badge variant="secondary">{EXPORT_FORMAT_LABELS[job.targetFormat]}</Badge>
                      </td>
                      <td className="p-2">{job.segment?.name ?? "كل العملاء"}</td>
                      <td className="p-2">{job.user.name}</td>
                      <td className="p-2">{job.rowCount}</td>
                      <td className="p-2 text-muted-foreground">{formatDateTime(job.createdAt)}</td>
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
