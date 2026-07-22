import { getThresholds } from "@/lib/analysis/thresholds";
import { ThresholdsForm } from "@/components/settings/thresholds-form";

export default async function SettingsPage() {
  const thresholds = await getThresholds();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">الإعدادات</h1>
        <p className="text-sm text-muted-foreground">إدارة إعدادات محرك التحليل والتوصيات</p>
      </div>

      <ThresholdsForm initial={thresholds} />
    </div>
  );
}
