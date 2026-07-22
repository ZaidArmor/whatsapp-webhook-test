import { PrismaClient, type Campaign } from "@prisma/client";
import { randomFloat } from "./random";

const AGGREGATE_ROW_FILTER = {
  device: null,
  region: null,
  ageRange: null,
  gender: null,
  hour: null,
  adId: null,
  adSetId: null,
} as const;

/**
 * Splits each campaign's daily aggregate metrics across its ads so the
 * campaign detail page's "best ad" / per-ad performance table has real data,
 * instead of every ad showing empty metrics.
 */
export async function seedAdMetrics(prisma: PrismaClient, campaigns: Campaign[]) {
  let rowCount = 0;

  for (const campaign of campaigns) {
    const adSets = await prisma.adSet.findMany({ where: { campaignId: campaign.id }, include: { ads: true } });
    const ads = adSets.flatMap((adSet) => adSet.ads.map((ad) => ({ ad, adSetId: adSet.id })));
    if (ads.length === 0) continue;

    const dailyRows = await prisma.campaignMetric.findMany({
      where: { campaignId: campaign.id, ...AGGREGATE_ROW_FILTER },
    });
    if (dailyRows.length === 0) continue;

    // Fixed-ish per-ad share (with light day-to-day jitter) so one ad clearly outperforms the rest.
    const rawWeights = ads.map(() => randomFloat(0.5, 1.5));
    const totalWeight = rawWeights.reduce((a, b) => a + b, 0);
    const shares = rawWeights.map((w) => w / totalWeight);

    const rows = [];
    for (const row of dailyRows) {
      for (let i = 0; i < ads.length; i++) {
        const { ad, adSetId } = ads[i]!;
        const factor = shares[i]! * randomFloat(0.85, 1.15);
        rows.push({
          date: row.date,
          campaignId: campaign.id,
          adSetId,
          adId: ad.id,
          impressions: Math.round(row.impressions * factor),
          reach: Math.round(row.reach * factor),
          clicks: Math.round(row.clicks * factor),
          spend: Number((Number(row.spend) * factor).toFixed(2)),
          leads: Math.round(row.leads * factor),
          conversations: Math.round(row.conversations * factor),
          bookings: Math.round(row.bookings * factor),
          sales: Math.round(row.sales * factor),
          revenue: Number((Number(row.revenue) * factor).toFixed(2)),
        });
      }
    }

    await prisma.campaignMetric.createMany({ data: rows });
    rowCount += rows.length;
  }

  console.log(`✔ Ad-level metrics seeded (${rowCount} rows)`);
}
