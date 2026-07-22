import { getIntegrationsList } from "@/lib/data/integrations";
import { IntegrationCard } from "@/components/integrations/integration-card";

export default async function IntegrationsPage() {
  const integrations = await getIntegrationsList();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">ربط الحسابات</h1>
        <p className="text-sm text-muted-foreground">
          إدارة ربط حسابات المنصات الإعلانية والتواصل الاجتماعي. الحسابات الحالية تجريبية (Mock) — يمكن استبدالها
          بواجهات API حقيقية لاحقاً.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {integrations.map((integration) => (
          <IntegrationCard key={integration.platform} integration={integration} />
        ))}
      </div>
    </div>
  );
}
