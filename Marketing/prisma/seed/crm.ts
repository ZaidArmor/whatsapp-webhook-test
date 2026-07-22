import {
  PipelineStage,
  PlatformKind,
  PrismaClient,
  type AdCampaign,
  type User,
  type Workspace,
} from "@prisma/client";
import { randomChoice, randomDateBetween, randomInt, weightedChoice } from "./random";

const FIRST_NAMES = ["أحمد", "محمد", "خالد", "سلطان", "فهد", "سارة", "نورة", "ريم", "لمى", "هند", "عبدالله", "بندر", "منيرة", "جواهر", "تركي"];
const LAST_NAMES = ["العتيبي", "القحطاني", "الشهري", "الدوسري", "الحربي", "الغامدي", "المطيري", "السبيعي", "الزهراني", "العنزي"];

const SOURCES: PlatformKind[] = ["INSTAGRAM", "FACEBOOK", "TIKTOK", "SNAPCHAT", "GOOGLE_ADS", "X_TWITTER"];

const STAGE_WEIGHTS: ReadonlyArray<readonly [PipelineStage, number]> = [
  ["NEW", 5],
  ["CONTACTED", 4],
  ["QUALIFIED", 3],
  ["PROPOSAL", 2],
  ["WON", 3],
  ["LOST", 2],
];

const ACTIVITY_TEMPLATES: Record<string, string[]> = {
  NOTE: ["مهتم بالباقة الشهرية، يفضل التواصل مساءً", "طلب عرض سعر مفصل عبر الإيميل", "عميل سابق — تجربة إيجابية"],
  CALL: ["تمت مكالمة تعريفية لمدة 10 دقائق", "لم يرد — إعادة المحاولة غداً", "مكالمة متابعة بعد إرسال العرض"],
  MEETING: ["اجتماع تعريفي في الفرع الرئيسي", "عرض تقديمي عن بعد للفريق"],
  STAGE_CHANGE: ["تم نقل العميل إلى مرحلة جديدة بعد التأهيل", "تحديث المرحلة بعد الرد على العرض"],
};

function phone(): string {
  return `+9665${randomInt(0, 9)}${String(randomInt(0, 9_999_999)).padStart(7, "0")}`;
}

export async function seedCrm(prisma: PrismaClient, workspaces: Workspace[], users: User[], campaigns: AdCampaign[]) {
  const existing = await prisma.contact.count();
  if (existing > 0) {
    console.log("↷ Contacts already present, skipping.");
    return;
  }

  const owners = users.filter((u) => /manager|admin|analyst/.test(u.email));
  let contactCount = 0;
  let activityCount = 0;

  for (const workspace of workspaces) {
    const wsCampaigns = campaigns.filter((c) => c.workspaceId === workspace.id);
    const perWorkspace = workspace.slug === "armor-cars" ? 42 : 24;

    for (let i = 0; i < perWorkspace; i++) {
      const first = randomChoice(FIRST_NAMES);
      const last = randomChoice(LAST_NAMES);
      const stage = weightedChoice(STAGE_WEIGHTS);
      const source = randomChoice(SOURCES);
      const campaign = Math.random() < 0.6 && wsCampaigns.length > 0 ? randomChoice(wsCampaigns) : null;
      const createdAt = randomDateBetween(new Date(Date.now() - 60 * 86_400_000), new Date());
      const value =
        stage === "WON"
          ? randomInt(800, 12_000)
          : stage === "PROPOSAL" || stage === "QUALIFIED"
            ? randomInt(500, 8_000)
            : randomInt(0, 3_000);

      const contact = await prisma.contact.create({
        data: {
          workspaceId: workspace.id,
          name: `${first} ${last}`,
          phone: phone(),
          email: Math.random() < 0.7 ? `${first}.${randomInt(100, 999)}@example.com`.replace(/\s/g, "") : null,
          source,
          stage,
          value,
          ownerId: randomChoice(owners).id,
          campaignId: campaign?.id ?? null,
          createdAt,
        },
      });
      contactCount++;

      const activityTypes = Object.keys(ACTIVITY_TEMPLATES);
      const numActivities = stage === "NEW" ? randomInt(0, 1) : randomInt(1, 4);
      let at = createdAt;
      for (let a = 0; a < numActivities; a++) {
        const type = randomChoice(activityTypes);
        at = new Date(at.getTime() + randomInt(2, 72) * 3_600_000);
        if (at > new Date()) break;
        await prisma.contactActivity.create({
          data: {
            contactId: contact.id,
            type,
            description: randomChoice(ACTIVITY_TEMPLATES[type]!),
            createdById: randomChoice(owners).id,
            createdAt: at,
          },
        });
        activityCount++;
      }
    }
  }

  console.log(`✔ Contacts (${contactCount}) with ${activityCount} activities`);
}
