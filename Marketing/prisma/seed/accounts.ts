import { PrismaClient, PlatformKind, AccountStatus, type Workspace } from "@prisma/client";
import { daysAgo, randomFloat, randomInt } from "./random";

interface AccountSpec {
  platform: PlatformKind;
  handle: string;
  displayName: string;
  followers: number;
  status: AccountStatus;
  avatarColor: string;
}

function accountsFor(workspace: Workspace): AccountSpec[] {
  const base = workspace.slug === "armor-cars" ? "armor.sa" : "gourmet.sa";
  const f = workspace.slug === "armor-cars" ? 1 : 0.6;
  return [
    { platform: "FACEBOOK", handle: `@${base}`, displayName: workspace.name, followers: Math.round(84000 * f), status: "CONNECTED", avatarColor: "#1877F2" },
    { platform: "INSTAGRAM", handle: `@${base}`, displayName: workspace.name, followers: Math.round(126000 * f), status: "CONNECTED", avatarColor: "#E1306C" },
    { platform: "TIKTOK", handle: `@${base}`, displayName: workspace.name, followers: Math.round(210000 * f), status: "CONNECTED", avatarColor: "#010101" },
    { platform: "SNAPCHAT", handle: `@${base}`, displayName: workspace.name, followers: Math.round(58000 * f), status: "CONNECTED", avatarColor: "#FFFC00" },
    { platform: "X_TWITTER", handle: `@${base}`, displayName: workspace.name, followers: Math.round(31000 * f), status: "CONNECTED", avatarColor: "#0F1419" },
    { platform: "LINKEDIN", handle: workspace.name, displayName: workspace.name, followers: Math.round(9000 * f), status: "DISCONNECTED", avatarColor: "#0A66C2" },
    { platform: "GOOGLE_ADS", handle: `ads-${workspace.slug}`, displayName: workspace.name, followers: 0, status: "CONNECTED", avatarColor: "#4285F4" },
    { platform: "YOUTUBE", handle: workspace.name, displayName: workspace.name, followers: Math.round(45000 * f), status: "DISCONNECTED", avatarColor: "#FF0000" },
  ];
}

export async function seedAccounts(prisma: PrismaClient, workspaces: Workspace[]) {
  const all = [];
  for (const workspace of workspaces) {
    for (const spec of accountsFor(workspace)) {
      const account = await prisma.socialAccount.upsert({
        where: {
          workspaceId_platform_handle: {
            workspaceId: workspace.id,
            platform: spec.platform,
            handle: spec.handle,
          },
        },
        update: {},
        create: {
          workspaceId: workspace.id,
          platform: spec.platform,
          handle: spec.handle,
          displayName: spec.displayName,
          followers: spec.followers,
          status: spec.status,
          avatarColor: spec.avatarColor,
          externalId: String(randomInt(10 ** 9, 9 * 10 ** 9)),
          isMock: true,
          lastSyncAt: spec.status === "CONNECTED" ? new Date() : null,
          tokenExpiresAt: spec.status === "CONNECTED" ? daysAgo(-55) : null,
        },
      });
      all.push(account);
    }
  }
  console.log(`✔ Social accounts (${all.length})`);
  return all;
}

/** 90 days of daily account stats with gentle growth + weekly seasonality. */
export async function seedAccountStats(prisma: PrismaClient, accountIds: Array<{ id: string; followers: number; platform: PlatformKind }>) {
  let rows = 0;
  for (const account of accountIds) {
    if (account.platform === "GOOGLE_ADS") continue;
    const existing = await prisma.accountDailyStat.count({ where: { socialAccountId: account.id } });
    if (existing > 0) continue;

    const data = [];
    let followers = Math.round(account.followers * 0.93);
    for (let i = 89; i >= 0; i--) {
      const date = daysAgo(i);
      const weekday = date.getDay();
      const weekend = weekday === 5 || weekday === 6 ? 1.25 : 1;
      followers += randomInt(20, Math.max(30, Math.round(account.followers * 0.0012)));
      const reach = Math.round(followers * randomFloat(0.12, 0.35) * weekend);
      const impressions = Math.round(reach * randomFloat(1.2, 1.8));
      const engagements = Math.round(reach * randomFloat(0.03, 0.09));
      const clicks = Math.round(engagements * randomFloat(0.15, 0.4));
      const videoViews = Math.round(reach * randomFloat(0.3, 0.9));
      data.push({
        socialAccountId: account.id,
        date,
        followers,
        reach,
        impressions,
        engagements,
        clicks,
        videoViews,
      });
    }
    await prisma.accountDailyStat.createMany({ data });
    rows += data.length;
  }
  console.log(`✔ Account daily stats (${rows} rows)`);
}
