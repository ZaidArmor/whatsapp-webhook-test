import { PrismaClient, type Branch, type Campaign } from "@prisma/client";
import { randomFloat } from "./random";

const DEVICE_SHARES: Array<[string, number]> = [
  ["mobile", 0.62],
  ["desktop", 0.28],
  ["tablet", 0.1],
];

const EXTRA_REGIONS = ["الرياض", "جدة", "الدمام"];

const AGE_GENDER_SHARES: Array<[string, string, number]> = [
  ["18-24", "male", 0.14],
  ["18-24", "female", 0.09],
  ["25-34", "male", 0.22],
  ["25-34", "female", 0.13],
  ["35-44", "male", 0.16],
  ["35-44", "female", 0.08],
  ["45-54", "male", 0.11],
  ["45-54", "female", 0.07],
];

const BREAKDOWN_DAYS = 14;

interface DailyTotal {
  date: Date;
  impressions: number;
  reach: number;
  clicks: number;
  spend: number;
  leads: number;
  conversations: number;
  bookings: number;
  sales: number;
  revenue: number;
}

function splitRow(total: DailyTotal, campaignId: string, share: number, extra: Record<string, string | number | null>) {
  const jitter = randomFloat(0.85, 1.15);
  const factor = share * jitter;
  return {
    date: total.date,
    campaignId,
    impressions: Math.round(total.impressions * factor),
    reach: Math.round(total.reach * factor),
    clicks: Math.round(total.clicks * factor),
    spend: Number((total.spend * factor).toFixed(2)),
    leads: Math.round(total.leads * factor),
    conversations: Math.round(total.conversations * factor),
    bookings: Math.round(total.bookings * factor),
    sales: Math.round(total.sales * factor),
    revenue: Number((total.revenue * factor).toFixed(2)),
    ...extra,
  };
}

export async function seedBreakdownMetrics(prisma: PrismaClient, campaigns: Campaign[], branches: Branch[]) {
  let rowCount = 0;
  const cityByBranchId = new Map(branches.map((b) => [b.id, b.city]));

  for (const campaign of campaigns) {
    const recentDailyRows = await prisma.campaignMetric.findMany({
      where: {
        campaignId: campaign.id,
        device: null,
        region: null,
        ageRange: null,
        gender: null,
        hour: null,
        adId: null,
        adSetId: null,
      },
      orderBy: { date: "desc" },
      take: BREAKDOWN_DAYS,
    });

    if (recentDailyRows.length === 0) continue;

    const homeCity = (campaign.branchId && cityByBranchId.get(campaign.branchId)) || EXTRA_REGIONS[0]!;
    const regionShares: Array<[string, number]> = [
      [homeCity, 0.55],
      [EXTRA_REGIONS[0]!, 0.25],
      [EXTRA_REGIONS[1]!, 0.12],
      [EXTRA_REGIONS[2]!, 0.08],
    ];

    const deviceRows = [];
    const regionRows = [];
    const ageGenderRows = [];

    for (const row of recentDailyRows) {
      const total: DailyTotal = {
        date: row.date,
        impressions: row.impressions,
        reach: row.reach,
        clicks: row.clicks,
        spend: Number(row.spend),
        leads: row.leads,
        conversations: row.conversations,
        bookings: row.bookings,
        sales: row.sales,
        revenue: Number(row.revenue),
      };

      for (const [device, share] of DEVICE_SHARES) {
        deviceRows.push(splitRow(total, campaign.id, share, { device }));
      }
      for (const [region, share] of regionShares) {
        regionRows.push(splitRow(total, campaign.id, share, { region }));
      }
      for (const [ageRange, gender, share] of AGE_GENDER_SHARES) {
        ageGenderRows.push(splitRow(total, campaign.id, share, { ageRange, gender }));
      }
    }

    // Hourly breakdown for the most recent day only (24 rows), so "best hour" analysis has data.
    const latestDay = recentDailyRows[0]!;
    const latestTotal: DailyTotal = {
      date: latestDay.date,
      impressions: latestDay.impressions,
      reach: latestDay.reach,
      clicks: latestDay.clicks,
      spend: Number(latestDay.spend),
      leads: latestDay.leads,
      conversations: latestDay.conversations,
      bookings: latestDay.bookings,
      sales: latestDay.sales,
      revenue: Number(latestDay.revenue),
    };
    const hourWeights = Array.from({ length: 24 }, (_, hour) => {
      // Business hours (10am-10pm) get more traffic than overnight hours.
      const isBusinessHour = hour >= 10 && hour <= 22;
      return isBusinessHour ? randomFloat(0.04, 0.08) : randomFloat(0.005, 0.02);
    });
    const totalWeight = hourWeights.reduce((a, b) => a + b, 0);
    const hourRows = hourWeights.map((weight, hour) =>
      splitRow(latestTotal, campaign.id, weight / totalWeight, { hour })
    );

    await prisma.campaignMetric.createMany({ data: deviceRows });
    await prisma.campaignMetric.createMany({ data: regionRows });
    await prisma.campaignMetric.createMany({ data: ageGenderRows });
    await prisma.campaignMetric.createMany({ data: hourRows });

    rowCount += deviceRows.length + regionRows.length + ageGenderRows.length + hourRows.length;
  }

  console.log(`✔ Breakdown metrics seeded (${rowCount} rows: device/region/age-gender/hour)`);
}
