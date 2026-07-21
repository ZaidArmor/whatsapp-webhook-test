import {
  PrismaClient,
  CustomerStatus,
  LeadSource,
  Platform,
  type Branch,
  type Service,
  type Campaign,
} from "@prisma/client";
import { normalizePhone } from "../../src/lib/phone/normalize";
import { daysAgo, randomChoice, randomFloat, randomInt, weightedChoice } from "./random";

const FIRST_NAMES = [
  "محمد",
  "عبدالله",
  "خالد",
  "فهد",
  "سلطان",
  "تركي",
  "سعود",
  "ناصر",
  "فيصل",
  "عمر",
  "نورة",
  "سارة",
  "منيرة",
  "لطيفة",
  "هند",
  "أمل",
  "ريم",
  "العنود",
  "غادة",
  "مها",
];

const LAST_NAMES = [
  "القحطاني",
  "الشهري",
  "العسيري",
  "آل مالكي",
  "الغامدي",
  "الزهراني",
  "الحارثي",
  "آل شايع",
  "الشمراني",
  "الأحمري",
];

const CITIES = ["أبها", "خميس مشيط", "جازان", "الرياض", "جدة", "الدمام", "الطائف"];

const STATUS_WEIGHTS: Array<[CustomerStatus, number]> = [
  [CustomerStatus.NEW, 14],
  [CustomerStatus.CONTACTED, 14],
  [CustomerStatus.INTERESTED, 10],
  [CustomerStatus.QUOTE_REQUESTED, 8],
  [CustomerStatus.BOOKED, 8],
  [CustomerStatus.ATTENDED, 6],
  [CustomerStatus.SOLD, 15],
  [CustomerStatus.NO_ANSWER, 10],
  [CustomerStatus.NOT_INTERESTED, 8],
  [CustomerStatus.POSTPONED, 5],
  [CustomerStatus.PAST_CUSTOMER, 6],
  [CustomerStatus.RETARGETING_OPPORTUNITY, 6],
];

const SOURCE_BY_PLATFORM: Partial<Record<Platform, LeadSource>> = {
  META_ADS: LeadSource.FACEBOOK,
  FACEBOOK: LeadSource.FACEBOOK,
  INSTAGRAM: LeadSource.INSTAGRAM,
  TIKTOK_ADS: LeadSource.TIKTOK,
  TIKTOK: LeadSource.TIKTOK,
  SNAPCHAT_ADS: LeadSource.SNAPCHAT,
  GOOGLE_ADS: LeadSource.GOOGLE,
};

function randomName(): string {
  return `${randomChoice(FIRST_NAMES)} ${randomChoice(LAST_NAMES)}`;
}

/** Generates a raw Saudi phone string in one of several real-world messy formats. */
function generateRawSaudiPhone(valid: boolean): string {
  const subscriberNumber = valid
    ? `5${randomInt(0, 9)}${String(randomInt(0, 9999999)).padStart(7, "0")}`
    : null;

  if (!valid) {
    const invalidKind = randomChoice(["landline", "tooShort", "garbage"] as const);
    if (invalidKind === "landline") {
      return `01${randomInt(1, 7)}${String(randomInt(0, 9999999)).padStart(7, "0")}`;
    }
    if (invalidKind === "tooShort") {
      return `05${randomInt(100000, 999999)}`;
    }
    return `05${randomInt(10, 99)}-ABCD-${randomInt(10, 99)}`;
  }

  const style = randomInt(0, 5);
  switch (style) {
    case 0:
      return `0${subscriberNumber}`;
    case 1:
      return subscriberNumber!;
    case 2:
      return `966${subscriberNumber}`;
    case 3:
      return `+966${subscriberNumber}`;
    case 4:
      return `00966 ${subscriberNumber!.slice(0, 2)} ${subscriberNumber!.slice(2, 5)} ${subscriberNumber!.slice(5)}`;
    default:
      return `0${subscriberNumber!.slice(0, 2)}-${subscriberNumber!.slice(2, 5)}-${subscriberNumber!.slice(5)}`;
  }
}

interface SeedCustomersOptions {
  count?: number;
  duplicateCount?: number;
}

export async function seedCustomers(
  prisma: PrismaClient,
  branches: Branch[],
  services: Service[],
  campaigns: Campaign[],
  options: SeedCustomersOptions = {}
) {
  const count = options.count ?? 500;
  const duplicateCount = options.duplicateCount ?? 20;

  const createdIds: string[] = [];
  const createdRawPhones: string[] = [];

  for (let i = 0; i < count; i++) {
    const branch = randomChoice(branches);
    const service = randomChoice(services);
    const matchingCampaigns = campaigns.filter(
      (c) => c.branchId === branch.id && c.serviceId === service.id
    );
    const campaign = matchingCampaigns.length > 0 ? randomChoice(matchingCampaigns) : randomChoice(campaigns);
    const platform = campaign.platform;
    const source = SOURCE_BY_PLATFORM[platform] ?? randomChoice(Object.values(LeadSource));

    const status = weightedChoice(STATUS_WEIGHTS);
    const isPhoneValid = Math.random() < 0.85;
    const rawPhone = generateRawSaudiPhone(isPhoneValid);
    const normalized = normalizePhone(rawPhone);

    const firstContactAt = daysAgo(randomInt(1, 120));
    const lastContactAt = randomInt(0, 1) === 1 ? daysAgo(randomInt(0, 30)) : firstContactAt;
    const hasPurchased = status === CustomerStatus.SOLD || status === CustomerStatus.PAST_CUSTOMER;
    const potentialValue = service.expectedSaleValue.toNumber() * randomFloat(0.7, 1.3);
    const totalPurchaseValue = hasPurchased ? potentialValue * randomFloat(0.9, 1.1) : 0;

    const customer = await prisma.customer.create({
      data: {
        name: randomName(),
        originalPhone: rawPhone,
        normalizedPhone: normalized.normalized,
        countryCode: normalized.countryCode,
        phoneValidity: normalized.validity,
        email: Math.random() < 0.4 ? `customer${i}@example.com` : null,
        city: Math.random() < 0.8 ? branch.city : randomChoice(CITIES),
        branchId: branch.id,
        source,
        platform,
        campaignId: campaign.id,
        serviceId: service.id,
        status,
        potentialValue,
        totalPurchaseValue,
        visitCount: hasPurchased ? randomInt(1, 6) : randomInt(0, 3),
        firstContactAt,
        lastContactAt,
        lastPurchaseAt: hasPurchased ? daysAgo(randomInt(0, 90)) : null,
        marketingConsent: Math.random() < 0.75,
      },
    });

    await prisma.customerActivity.create({
      data: {
        customerId: customer.id,
        type: "status_change",
        description: `تم إنشاء العميل بحالة: ${status}`,
      },
    });

    await prisma.lead.create({
      data: {
        customerId: customer.id,
        campaignId: campaign.id,
        branchId: branch.id,
        serviceId: service.id,
        createdAt: firstContactAt,
      },
    });

    if (
      status === CustomerStatus.BOOKED ||
      status === CustomerStatus.ATTENDED ||
      status === CustomerStatus.SOLD
    ) {
      await prisma.booking.create({
        data: {
          customerId: customer.id,
          campaignId: campaign.id,
          branchId: branch.id,
          serviceId: service.id,
          scheduledAt: daysAgo(randomInt(0, 60)),
          attended: status !== CustomerStatus.BOOKED,
        },
      });
    }

    if (hasPurchased) {
      await prisma.sale.create({
        data: {
          customerId: customer.id,
          campaignId: campaign.id,
          branchId: branch.id,
          serviceId: service.id,
          amount: totalPurchaseValue,
          soldAt: daysAgo(randomInt(0, 90)),
        },
      });
    }

    createdIds.push(customer.id);
    createdRawPhones.push(rawPhone);
  }

  // Seed intentional duplicates: same phone number, slightly different spelling.
  for (let i = 0; i < duplicateCount && i < createdIds.length; i++) {
    const originalId = createdIds[i]!;
    const original = await prisma.customer.findUniqueOrThrow({ where: { id: originalId } });

    const duplicate = await prisma.customer.create({
      data: {
        name: `${original.name} `, // trailing space variant — realistic messy duplicate
        originalPhone: createdRawPhones[i]!,
        normalizedPhone: original.normalizedPhone,
        countryCode: original.countryCode,
        phoneValidity: original.phoneValidity,
        email: original.email,
        city: original.city,
        branchId: original.branchId,
        source: original.source,
        platform: original.platform,
        campaignId: original.campaignId,
        serviceId: original.serviceId,
        status: CustomerStatus.NEW,
        potentialValue: original.potentialValue,
        isDuplicate: true,
        duplicateOfId: original.id,
        firstContactAt: daysAgo(randomInt(0, 5)),
      },
    });
    createdIds.push(duplicate.id);
  }

  console.log(`✔ Customers seeded (${createdIds.length}, including ${duplicateCount} duplicates)`);
  return createdIds;
}
