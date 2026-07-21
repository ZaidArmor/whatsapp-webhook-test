import { prisma } from "@/lib/prisma";
import { AlertCard } from "@/components/alerts/alert-card";
import { EmptyState } from "@/components/shared/empty-state";
import { BellRing } from "lucide-react";

export default async function AlertsPage() {
  const alerts = await prisma.alert.findMany({
    include: { campaign: true },
    orderBy: [{ status: "asc" }, { severity: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">التنبيهات</h1>
        <p className="text-sm text-muted-foreground">مركز التنبيهات التشغيلية والتحليلية</p>
      </div>

      {alerts.length === 0 ? (
        <EmptyState icon={<BellRing className="h-5 w-5" />} title="لا توجد تنبيهات حالياً" />
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={{
                id: alert.id,
                severity: alert.severity,
                status: alert.status,
                title: alert.title,
                message: alert.message,
                campaignName: alert.campaign?.name ?? null,
                createdAt: alert.createdAt,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
