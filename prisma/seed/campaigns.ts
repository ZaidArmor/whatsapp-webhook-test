import {
  PrismaClient,
  Platform,
  CampaignObjective,
  CampaignStatus,
  type Branch,
  type Service,
} from "@prisma/client";
import { daysAgo, randomChoice, randomFloat, randomInt } from "./random";

const CAMPAIGN_PLATFORMS = [
  Platform.META_ADS,
  Platform.GOOGLE_ADS,
  Platform.TIKTOK_ADS,
  Platform.SNAPCHAT_ADS,
  Platform.FACEBOOK,
  Platform.INSTAGRAM,
] as const;

const OBJECTIVES = [
  CampaignObjective.LEADS,
  CampaignObjective.CONVERSIONS,
  CampaignObjective.TRAFFIC,
  CampaignObjective.AWARENESS,
  CampaignObjective.ENGAGEMENT,
] as const;

type Quality = "excellent" | "good" | "average" | "poor";

// leadRate is the share of *clicks* that turn into leads. Combined with a
// realistic CPC (~1-3 SAR), this keeps CPL/CAC/ROAS in believable ranges
// instead of the inflated numbers you'd get from a naive high conversion %.
const QUALITY_PROFILES: Record<
  Quality,
  { ctr: [number, number]; leadRate: [number, number]; bookingRate: [number, number]; saleRate: [number, number] }
> = {
  excellent: { ctr: [2.5, 4.2], leadRate: [0.03, 0.05], bookingRate: [0.3, 0.45], saleRate: [0.4, 0.55] },
  good: { ctr: [1.4, 2.4], leadRate: [0.018, 0.03], bookingRate: [0.2, 0.32], saleRate: [0.3, 0.42] },
  average: { ctr: [0.8, 1.5], leadRate: [0.01, 0.018], bookingRate: [0.12, 0.2], saleRate: [0.18, 0.3] },
  poor: { ctr: [0.25, 0.75], leadRate: [0.003, 0.01], bookingRate: [0.04, 0.1], saleRate: [0.08, 0.18] },
};

const AD_CREATIVE_TYPES = ["image", "video", "carousel"] as const;
const AD_HEADLINES = [
  "احمِ سيارتك من الخدوش والأشعة",
  "عرض حصري لفترة محدودة",
  "نتائج تدوم لسنوات",
  "احجز موعدك اليوم",
  "جودة مضمونة وضمان حقيقي",
  "اطلب عرض سعر مجاني الآن",
];

export async function seedCampaigns(prisma: PrismaClient, branches: Branch[], services: Service[]) {
  const campaigns = [];
  const qualities: Quality[] = ["excellent", "good", "good", "average", "average", "poor"];

  let platformIndex = 0;
  let objectiveIndex = 0;

  for (const branch of branches) {
    for (const service of services) {
      const platform = CAMPAIGN_PLATFORMS[platformIndex % CAMPAIGN_PLATFORMS.length]!;
      const objective = OBJECTIVES[objectiveIndex % OBJECTIVES.length]!;
      platformIndex++;
      objectiveIndex++;

      const quality = randomChoice(qualities);
      const durationDays = randomInt(30, 90);
      const startDate = daysAgo(durationDays);
      const statusRoll = Math.random();
      const status =
        statusRoll < 0.75 ? CampaignStatus.ACTIVE : statusRoll < 0.9 ? CampaignStatus.PAUSED : CampaignStatus.COMPLETED;
      const endDate = status === CampaignStatus.COMPLETED ? daysAgo(randomInt(1, 10)) : null;
      const budget = randomInt(8000, 40000);

      const campaign = await prisma.campaign.create({
        data: {
          name: `${service.nameAr} — ${branch.name} — ${platformLabel(platform)}`,
          platform,
          objective,
          status,
          startDate,
          endDate,
          budget,
          branchId: branch.id,
          serviceId: service.id,
        },
      });

      const adSet = await prisma.adSet.create({
        data: {
          campaignId: campaign.id,
          name: `${campaign.name} — المجموعة الإعلانية 1`,
          audience: randomChoice(["الرجال 25-45", "النساء 25-45", "أصحاب السيارات الفاخرة", "الجميع 18-55"]),
          budget,
        },
      });

      const adCount = randomInt(2, 4);
      const ads = [];
      for (let i = 0; i < adCount; i++) {
        const ad = await prisma.ad.create({
          data: {
            adSetId: adSet.id,
            name: `${service.nameEn} — إعلان ${i + 1}`,
            creativeType: randomChoice(AD_CREATIVE_TYPES),
            headline: randomChoice(AD_HEADLINES),
            bodyText: `اكتشف خدمة ${service.nameAr} في فرع ${branch.name} الآن.`,
          },
        });
        ads.push(ad);
      }

      await seedDailyMetrics(prisma, campaign.id, startDate, budget, quality, service.expectedSaleValue.toNumber());

      campaigns.push(campaign);
    }
  }

  console.log(`✔ Campaigns seeded (${campaigns.length}) with adsets, ads and daily metrics`);
  return campaigns;
}

function platformLabel(platform: Platform): string {
  const labels: Record<Platform, string> = {
    META_ADS: "Meta Ads",
    FACEBOOK: "Facebook",
    INSTAGRAM: "Instagram",
    TIKTOK_ADS: "TikTok Ads",
    TIKTOK: "TikTok",
    SNAPCHAT_ADS: "Snapchat Ads",
    GOOGLE_ADS: "Google Ads",
    GA4: "GA4",
    GOOGLE_SEARCH_CONSOLE: "Search Console",
    YOUTUBE: "YouTube",
    WHATSAPP_BUSINESS: "WhatsApp Business",
    GOOGLE_BUSINESS_PROFILE: "Google Business Profile",
    LINKEDIN: "LinkedIn",
    X_TWITTER: "X",
  };
  return labels[platform];
}

async function seedDailyMetrics(
  prisma: PrismaClient,
  campaignId: string,
  startDate: Date,
  budget: number,
  quality: Quality,
  serviceValue: number
) {
  const profile = QUALITY_PROFILES[quality];
  const today = new Date();
  const durationDays = Math.max(
    1,
    Math.round((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  );
  const dailyBudget = budget / durationDays;

  const rows = [];
  for (let i = 0; i < durationDays; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    if (date > today) break;

    const spend = Math.max(0, dailyBudget * randomFloat(0.6, 1.3));
    const cpm = randomFloat(8, 35);
    const impressions = Math.round((spend / cpm) * 1000);
    const ctr = randomFloat(profile.ctr[0], profile.ctr[1]) / 100;
    const clicks = Math.round(impressions * ctr);
    const reach = Math.round(impressions / randomFloat(1.05, 1.6));
    const leadRate = randomFloat(profile.leadRate[0], profile.leadRate[1]);
    const leads = Math.round(clicks * leadRate);
    const conversations = Math.round(leads * randomFloat(0.55, 0.95));
    const bookingRate = randomFloat(profile.bookingRate[0], profile.bookingRate[1]);
    const bookings = Math.round(leads * bookingRate);
    const saleRate = randomFloat(profile.saleRate[0], profile.saleRate[1]);
    const sales = Math.round(bookings * saleRate);
    const revenue = sales * serviceValue * randomFloat(0.85, 1.15);

    rows.push({
      date,
      campaignId,
      impressions,
      reach: Math.max(reach, clicks),
      clicks,
      spend,
      leads,
      conversations,
      bookings,
      sales,
      revenue,
    });
  }

  if (rows.length > 0) {
    await prisma.campaignMetric.createMany({ data: rows });
  }
}
