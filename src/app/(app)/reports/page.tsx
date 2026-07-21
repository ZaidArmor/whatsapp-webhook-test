import { getReportData, REPORT_TYPES, type ReportType } from "@/lib/data/reports";
import { ReportView } from "@/components/reports/report-view";

interface PageProps {
  searchParams: Promise<{ type?: string }>;
}

export default async function ReportsPage({ searchParams }: PageProps) {
  const { type } = await searchParams;
  const reportType: ReportType = REPORT_TYPES.includes(type as ReportType) ? (type as ReportType) : "campaigns";
  const { rows } = await getReportData(reportType);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">مركز التقارير</h1>
        <p className="text-sm text-muted-foreground">اختر نوع التقرير ثم صدّره أو اطبعه</p>
      </div>

      <ReportView type={reportType} rows={rows} />
    </div>
  );
}
