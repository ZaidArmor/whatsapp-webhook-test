import {
  PrismaClient,
  PlatformKind,
  AdObjective,
  AdCampaignStatus,
  type SocialAccount,
  type Workspace,
} from "@prisma/client";
import { daysAgo, randomChoice, randomFloat, randomInt } from "./random";

const AD_PLATFORMS: PlatformKind[] = ["FACEBOOK", "INSTAGRAM", "TIKTOK", "SNAPCHAT", "GOOGLE_ADS"];
const OBJECTIVES = Object.values(AdObjective);

const CAMPAIGN_NAMES_AR = [
  "إطلاق العرض الموسمي",
  "زيادة الوعي بالعلامة",
  "حملة العملاء المحتملين",
  "إعادة الاستهداف",
  "تحويلات المتجر",
  "التفاعل مع المحتوى",
];

const AUDIENCES = ["الرجال 25-45 | المدن الرئيسية", "النساء 22-40 | اهتمامات التسوق", "زوار الموقع آخر 30 يوماً", "جمهور مشابه 1%"];

type Quality = "excellent" | "good" | "average" | "poor";
const QUALITIES: Quality[] = ["excellent", "good", "good", "average", "average", "poor"];

const PROFILES: Record<Quality, { ctr: [number, number]; cvr: [number, number]; rev: [number, number] }> = {
  excellent: { ctr: [2.2, 3.8], cvr: [0.06, 0.11], rev: [280, 420] },
  good: { ctr: [1.3, 2.2], cvr: [0.035, 0.06], rev: [220, 330] },
  average: { ctr: [0.7, 1.3], cvr: [0.015, 0.035], rev: [160, 260] },
  poor: { ctr: [0.2, 0.7], cvr: [0.002, 0.015], rev: [90, 180] },
};

export async function seedAdCampaigns(prisma: PrismaClient, workspaces: Workspace[], accounts: SocialAccount[]) {
  const existing = await prisma.adCampaign.count();
  if (existing > 0) {
    console.log("↷ Ad campaigns already present, skipping.");
    return;
  }

  let campaignCount = 0;
  let metricRows = 0;

  for (const workspace of workspaces) {
    const wsAccounts = accounts.filter((a) => a.workspaceId === workspace.id);
    for (const platform of AD_PLATFORMS) {
      const account = wsAccounts.find((a) => a.platform === platform) ?? null;
      const perPlatform = workspace.slug === "armor-cars" ? 2 : 1;

      for (let i = 0; i < perPlatform; i++) {
        const quality = randomChoice(QUALITIES);
        const profile = PROFILES[quality];
        const durationDays = randomInt(25, 85);
        const startDate = daysAgo(durationDays);
        const status =
          Math.random() < 0.7 ? AdCampaignStatus.ACTIVE : Math.random() < 0.5 ? AdCampaignStatus.PAUSED : AdCampaignStatus.COMPLETED;
        const budget = randomInt(6000, 45000);

        const campaign = await prisma.adCampaign.create({
          data: {
            workspaceId: workspace.id,
            socialAccountId: account?.id,
            platform,
            name: `${randomChoice(CAMPAIGN_NAMES_AR)} — ${platform}`,
            objective: randomChoice(OBJECTIVES),
            status,
            budget,
            startDate,
            endDate: status === AdCampaignStatus.COMPLETED ? daysAgo(randomInt(1, 8)) : null,
          },
        });
        campaignCount++;

        const adSet = await prisma.adSet.create({
          data: {
            campaignId: campaign.id,
            name: `${campaign.name} — المجموعة 1`,
            audience: randomChoice(AUDIENCES),
            budget,
          },
        });

        const ads = [];
        for (let a = 0; a < randomInt(2, 3); a++) {
          ads.push(
            await prisma.ad.create({
              data: {
                adSetId: adSet.id,
                name: `إعلان ${a + 1}`,
                headline: randomChoice(["عرض لفترة محدودة", "احجز الآن", "اكتشف الجديد", "جودة تستحقها"]),
                bodyText: `محتوى إعلاني تجريبي للحملة ${campaign.name}`,
              },
            })
          );
        }

        // Daily aggregate rows (adId/adSetId null) + per-ad split rows.
        const dailyBudget = budget / durationDays;
        const aggregate: Array<{ date: Date; campaignId: string; impressions: number; clicks: number; spend: number; leads: number; conversions: number; revenue: number }> = [];
        const perAd: Array<{ date: Date; campaignId: string; adSetId: string; adId: string; impressions: number; clicks: number; spend: number; leads: number; conversions: number; revenue: number }> = [];
        for (let d = 0; d < durationDays; d++) {
          const date = daysAgo(durationDays - 1 - d);
          if (date > new Date()) break;
          const spend = Number((dailyBudget * randomFloat(0.6, 1.25)).toFixed(2));
          const cpm = randomFloat(9, 32);
          const impressions = Math.round((spend / cpm) * 1000);
          const ctr = randomFloat(profile.ctr[0], profile.ctr[1]) / 100;
          const clicks = Math.round(impressions * ctr);
          const cvr = randomFloat(profile.cvr[0], profile.cvr[1]);
          const conversions = Math.round(clicks * cvr);
          const leads = Math.round(conversions * randomFloat(1.1, 1.8));
          const revenue = Number((conversions * randomFloat(profile.rev[0], profile.rev[1])).toFixed(2));

          aggregate.push({ date, campaignId: campaign.id, impressions, clicks, spend, leads, conversions, revenue });

          const weights = ads.map(() => randomFloat(0.5, 1.5));
          const total = weights.reduce((s, w) => s + w, 0);
          ads.forEach((ad, idx) => {
            const share = weights[idx]! / total;
            perAd.push({
              date,
              campaignId: campaign.id,
              adSetId: adSet.id,
              adId: ad.id,
              impressions: Math.round(impressions * share),
              clicks: Math.round(clicks * share),
              spend: Number((spend * share).toFixed(2)),
              leads: Math.round(leads * share),
              conversions: Math.round(conversions * share),
              revenue: Number((revenue * share).toFixed(2)),
            });
          });
        }
        await prisma.adMetric.createMany({ data: aggregate });
        await prisma.adMetric.createMany({ data: perAd });
        metricRows += aggregate.length + perAd.length;
      }
    }
  }

  console.log(`✔ Ad campaigns (${campaignCount}) with ${metricRows} metric rows`);
}
