import { getT } from "@/lib/i18n/server";

export default async function DashboardPage() {
  const { t } = await getT();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("dashboard.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("dashboard.subtitle")}</p>
      </div>
    </div>
  );
}
