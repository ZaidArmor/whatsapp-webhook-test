import { PrismaClient, ServiceCategory } from "@prisma/client";

export const SERVICE_DEFINITIONS = [
  {
    nameAr: "أفلام حماية الطلاء PPF",
    nameEn: "Paint Protection Film (PPF)",
    category: ServiceCategory.PPF,
    expectedSaleValue: 3500,
    targetCpl: 80,
    targetRoas: 4,
  },
  {
    nameAr: "العازل الحراري للسيارات",
    nameEn: "Automotive Thermal Insulation",
    category: ServiceCategory.THERMAL_INSULATION_CAR,
    expectedSaleValue: 1200,
    targetCpl: 50,
    targetRoas: 3.5,
  },
  {
    nameAr: "النانو سيراميك",
    nameEn: "Nano Ceramic Coating",
    category: ServiceCategory.NANO_CERAMIC,
    expectedSaleValue: 1800,
    targetCpl: 60,
    targetRoas: 4,
  },
  {
    nameAr: "التلميع الاحترافي",
    nameEn: "Professional Polishing",
    category: ServiceCategory.POLISHING,
    expectedSaleValue: 600,
    targetCpl: 30,
    targetRoas: 3,
  },
  {
    nameAr: "العازل الحراري للمباني",
    nameEn: "Building Thermal Insulation",
    category: ServiceCategory.THERMAL_INSULATION_BUILDING,
    expectedSaleValue: 5000,
    targetCpl: 150,
    targetRoas: 3.5,
  },
] as const;

export async function seedServices(prisma: PrismaClient) {
  const services = [];
  for (const def of SERVICE_DEFINITIONS) {
    const existing = await prisma.service.findFirst({ where: { nameAr: def.nameAr } });
    const service =
      existing ??
      (await prisma.service.create({
        data: def,
      }));
    services.push(service);
  }
  console.log(`✔ Services seeded (${services.length})`);
  return services;
}
