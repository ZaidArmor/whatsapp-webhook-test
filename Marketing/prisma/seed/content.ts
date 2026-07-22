import { PlatformKind, PostStatus, PrismaClient, type SocialAccount, type User, type Workspace } from "@prisma/client";
import { daysAgo, randomChoice, randomInt } from "./random";

const POST_BODIES = [
  "عرض نهاية الأسبوع انطلق 🎉 خصم 20% على جميع الخدمات — احجز الآن قبل انتهاء العرض!",
  "خلف الكواليس: جولة داخل فريق العمل وكيف نجهّز طلباتكم بعناية.",
  "سؤال اليوم: ما الخدمة التي تودون رؤية محتوى أكثر عنها؟ شاركونا في التعليقات 👇",
  "قبل وبعد — النتيجة تتحدث عن نفسها ✨",
  "نصيحة سريعة من خبرائنا لهذا الموسم ☀️",
  "شكراً لثقتكم — وصلنا إلى إنجاز جديد هذا الشهر بفضلكم ❤️",
  "إطلاق جديد قريباً… ترقبوا التفاصيل خلال الأيام القادمة 👀",
  "آراء عملائنا هي وقودنا — تقييم 5 نجوم من عميل هذا الأسبوع ⭐⭐⭐⭐⭐",
];

const CONTENT_PLATFORMS: PlatformKind[] = ["FACEBOOK", "INSTAGRAM", "TIKTOK", "SNAPCHAT", "X_TWITTER"];

export async function seedContent(prisma: PrismaClient, workspaces: Workspace[], accounts: SocialAccount[], users: User[]) {
  const existing = await prisma.post.count();
  if (existing > 0) {
    console.log("↷ Posts already present, skipping.");
    return;
  }

  const editor = users.find((u) => u.email.startsWith("editor")) ?? users[0]!;
  const manager = users.find((u) => u.email.startsWith("manager")) ?? users[0]!;

  let postCount = 0;
  for (const workspace of workspaces) {
    // Media library per workspace
    const media = [];
    for (let i = 1; i <= 6; i++) {
      media.push(
        await prisma.mediaAsset.create({
          data: {
            workspaceId: workspace.id,
            kind: i % 3 === 0 ? "VIDEO" : "IMAGE",
            fileName: `placeholder-${i}.svg`,
            url: `/media/placeholder-${i}.svg`,
            sizeBytes: randomInt(120_000, 3_400_000),
            uploadedById: editor.id,
          },
        })
      );
    }

    const wsAccounts = accounts.filter((a) => a.workspaceId === workspace.id && CONTENT_PLATFORMS.includes(a.platform));

    const plan: Array<{ status: PostStatus; when: Date | null; count: number }> = [
      { status: "PUBLISHED", when: null, count: 12 },
      { status: "SCHEDULED", when: null, count: 5 },
      { status: "PENDING_APPROVAL", when: null, count: 3 },
      { status: "DRAFT", when: null, count: 3 },
      { status: "REJECTED", when: null, count: 1 },
    ];

    for (const bucket of plan) {
      for (let i = 0; i < bucket.count; i++) {
        const body = randomChoice(POST_BODIES);
        const scheduledAt =
          bucket.status === "PUBLISHED"
            ? daysAgo(randomInt(1, 28))
            : bucket.status === "SCHEDULED"
              ? daysAgo(-randomInt(1, 14))
              : null;

        const post = await prisma.post.create({
          data: {
            workspaceId: workspace.id,
            authorId: editor.id,
            body,
            status: bucket.status,
            scheduledAt,
            publishedAt: bucket.status === "PUBLISHED" ? scheduledAt : null,
            approvedById: bucket.status === "PUBLISHED" || bucket.status === "SCHEDULED" ? manager.id : null,
            approvalNote: bucket.status === "REJECTED" ? "الرجاء تعديل الصياغة وإضافة وسائط أوضح" : null,
          },
        });
        postCount++;

        await prisma.postMedia.create({
          data: { postId: post.id, mediaAssetId: randomChoice(media).id, sortOrder: 0 },
        });

        const targetAccounts = wsAccounts.slice(0, randomInt(2, Math.min(4, wsAccounts.length)));
        for (const account of targetAccounts) {
          const published = bucket.status === "PUBLISHED";
          await prisma.postTarget.create({
            data: {
              postId: post.id,
              socialAccountId: account.id,
              status: bucket.status,
              publishedAt: published ? post.publishedAt : null,
              externalPostId: published ? String(randomInt(10 ** 12, 9 * 10 ** 12)) : null,
              impressions: published ? randomInt(3000, 90000) : 0,
              reach: published ? randomInt(2500, 70000) : 0,
              likes: published ? randomInt(80, 4200) : 0,
              comments: published ? randomInt(4, 260) : 0,
              shares: published ? randomInt(2, 140) : 0,
              clicks: published ? randomInt(20, 900) : 0,
            },
          });
        }
      }
    }
  }
  console.log(`✔ Posts (${postCount}) with media + per-platform targets`);
}
