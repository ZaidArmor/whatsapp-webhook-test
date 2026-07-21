import { getCampaignsList } from "@/lib/data/campaigns";
import { CampaignsTableClient } from "@/components/campaigns/campaigns-table-client";

export default async function CampaignsPage() {
  const campaigns = await getCampaignsList();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">الحملات الإعلانية</h1>
        <p className="text-sm text-muted-foreground">إدارة ومتابعة أداء جميع الحملات الإعلانية عبر المنصات</p>
      </div>

      <CampaignsTableClient data={campaigns} />
    </div>
  );
}
