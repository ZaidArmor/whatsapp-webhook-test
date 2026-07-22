import {
  ConversationKind,
  InboxStatus,
  PrismaClient,
  type SocialAccount,
  type User,
  type Workspace,
} from "@prisma/client";
import { randomChoice, randomDateBetween, randomInt, weightedChoice } from "./random";

const AUTHORS = [
  { name: "سارة العتيبي", handle: "@sarah_alotaibi" },
  { name: "محمد القحطاني", handle: "@m_alqahtani" },
  { name: "نورة الشهري", handle: "@noura.sh" },
  { name: "خالد الدوسري", handle: "@khalid_d" },
  { name: "ريم الحربي", handle: "@reem_alharbi" },
  { name: "عبدالله الغامدي", handle: "@abdullah.gh" },
  { name: "هند المطيري", handle: "@hind_m" },
  { name: "فيصل السبيعي", handle: "@faisal_subaie" },
];

const INBOUND_COMMENTS = [
  "كم السعر؟ وهل يشمل التوصيل؟",
  "تجربتي معكم كانت ممتازة، شكراً لكم 🙏",
  "متى يبدأ العرض الجديد؟",
  "هل يوجد فرع في جدة؟",
  "المنتج وصلني متأخر، أرجو المتابعة",
  "أبغى أحجز موعد، كيف الطريقة؟",
  "هل الخصم ساري على جميع الخدمات؟",
  "ما شاء الله شغل نظيف 👌",
];

const INBOUND_MESSAGES = [
  "السلام عليكم، أرغب بالاستفسار عن الأسعار",
  "هل يمكن الحجز ليوم الخميس القادم؟",
  "لدي مشكلة في آخر طلب، رقم الطلب 4521",
  "هل تقدمون خدمات للشركات؟",
  "أرسلت لكم إيميل ولم يصلني رد",
  "كيف أستفيد من عرض هذا الأسبوع؟",
];

const REPLIES = [
  "أهلاً بك! تم إرسال التفاصيل كاملة، ولا تتردد بأي استفسار إضافي 🌟",
  "شكراً لتواصلك معنا، تم تحويل طلبك للفريق المختص وسنوافيك خلال ساعات العمل.",
  "حياك الله! العرض ساري حتى نهاية الأسبوع ويمكنك الحجز عبر الرابط في البايو.",
  "نعتذر عن التأخير، تم رفع الموضوع للإدارة وسيتم تعويضك — تواصل معنا خاصاً.",
];

export async function seedInbox(prisma: PrismaClient, workspaces: Workspace[], accounts: SocialAccount[], users: User[]) {
  const existing = await prisma.conversation.count();
  if (existing > 0) {
    console.log("↷ Conversations already present, skipping.");
    return;
  }

  const agents = users.filter((u) => /manager|editor|admin/.test(u.email));
  let conversationCount = 0;

  for (const workspace of workspaces) {
    const wsAccounts = accounts.filter((a) => a.workspaceId === workspace.id);
    const perWorkspace = workspace.slug === "armor-cars" ? 26 : 14;

    for (let i = 0; i < perWorkspace; i++) {
      const account = randomChoice(wsAccounts);
      const author = randomChoice(AUTHORS);
      const kind = weightedChoice<ConversationKind>([
        ["COMMENT", 6],
        ["MESSAGE", 4],
      ]);
      const status = weightedChoice<InboxStatus>([
        ["OPEN", 4],
        ["IN_PROGRESS", 3],
        ["CLOSED", 5],
      ]);
      const startedAt = randomDateBetween(new Date(Date.now() - 21 * 86_400_000), new Date(Date.now() - 3_600_000));
      const assigned = status === "OPEN" ? null : randomChoice(agents);

      const conversation = await prisma.conversation.create({
        data: {
          workspaceId: workspace.id,
          socialAccountId: account.id,
          kind,
          status,
          authorName: author.name,
          authorHandle: author.handle,
          assignedToId: assigned?.id ?? null,
          createdAt: startedAt,
          lastMessageAt: startedAt,
        },
      });
      conversationCount++;

      const firstBody = kind === "COMMENT" ? randomChoice(INBOUND_COMMENTS) : randomChoice(INBOUND_MESSAGES);
      let lastAt = startedAt;
      await prisma.conversationMessage.create({
        data: { conversationId: conversation.id, direction: "INBOUND", body: firstBody, sentAt: lastAt },
      });

      // Closed / in-progress threads carry a short back-and-forth.
      const exchanges = status === "OPEN" ? 0 : randomInt(1, 3);
      for (let e = 0; e < exchanges; e++) {
        lastAt = new Date(lastAt.getTime() + randomInt(10, 240) * 60_000);
        await prisma.conversationMessage.create({
          data: {
            conversationId: conversation.id,
            direction: "OUTBOUND",
            body: randomChoice(REPLIES),
            sentById: assigned?.id ?? null,
            sentAt: lastAt,
          },
        });
        if (e < exchanges - 1) {
          lastAt = new Date(lastAt.getTime() + randomInt(10, 240) * 60_000);
          await prisma.conversationMessage.create({
            data: {
              conversationId: conversation.id,
              direction: "INBOUND",
              body: randomChoice(kind === "COMMENT" ? INBOUND_COMMENTS : INBOUND_MESSAGES),
              sentAt: lastAt,
            },
          });
        }
      }

      await prisma.conversation.update({ where: { id: conversation.id }, data: { lastMessageAt: lastAt } });
    }
  }

  console.log(`✔ Conversations (${conversationCount}) with messages`);
}
