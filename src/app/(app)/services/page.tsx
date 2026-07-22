import { prisma } from "@/lib/prisma";
import { ServicesManager } from "@/components/services/services-manager";

export default async function ServicesPage() {
  const services = await prisma.service.findMany({ where: { deletedAt: null }, orderBy: { nameAr: "asc" } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">الخدمات</h1>
        <p className="text-sm text-muted-foreground">إدارة الخدمات المقدمة وأهدافها التسويقية</p>
      </div>
      <ServicesManager
        services={services.map((s) => ({
          id: s.id,
          nameAr: s.nameAr,
          nameEn: s.nameEn,
          category: s.category,
          isActive: s.isActive,
          expectedSaleValue: Number(s.expectedSaleValue),
          targetCpl: Number(s.targetCpl),
          targetRoas: Number(s.targetRoas),
        }))}
      />
    </div>
  );
}
