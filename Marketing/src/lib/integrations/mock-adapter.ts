import type { PlatformKind } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  AdapterResult,
  AdCampaignSummary,
  ConnectionStatus,
  ConnectResult,
  CreateAdCampaignInput,
  FetchedComment,
  InsightsSnapshot,
  PublishInput,
  PublishResult,
  ScheduleInput,
  SendMessageInput,
  SocialPlatformAdapter,
} from "./types";

function futureDays(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

function randomExternalId(): string {
  return Math.floor(10 ** 12 + Math.random() * 9 * 10 ** 12).toString();
}

/**
 * Mock implementation shared by every platform adapter. It operates on the
 * local database so the whole app is fully functional offline. Real adapters
 * subclass this and override the methods marked with
 * `// TODO: connect real API here`.
 */
export class MockSocialAdapter implements SocialPlatformAdapter {
  constructor(public readonly platform: PlatformKind) {}

  protected async account(workspaceId: string) {
    return prisma.socialAccount.findFirst({ where: { workspaceId, platform: this.platform } });
  }

  async connect(workspaceId: string): Promise<ConnectResult> {
    // TODO: connect real API here — start the platform's OAuth flow and store
    // the resulting tokens (see the concrete adapter for the env vars needed).
    const account = await this.account(workspaceId);
    const tokenExpiresAt = futureDays(60);
    if (account) {
      await prisma.socialAccount.update({
        where: { id: account.id },
        data: { status: "CONNECTED", tokenExpiresAt, lastSyncAt: new Date(), errorMessage: null },
      });
      return { success: true, accountName: account.displayName, externalId: account.externalId ?? undefined, tokenExpiresAt };
    }
    const workspace = await prisma.workspace.findUniqueOrThrow({ where: { id: workspaceId } });
    const created = await prisma.socialAccount.create({
      data: {
        workspaceId,
        platform: this.platform,
        handle: `@${workspace.slug}`,
        displayName: workspace.name,
        externalId: randomExternalId(),
        status: "CONNECTED",
        tokenExpiresAt,
        lastSyncAt: new Date(),
        isMock: true,
      },
    });
    return { success: true, accountName: created.displayName, externalId: created.externalId ?? undefined, tokenExpiresAt };
  }

  async disconnect(workspaceId: string): Promise<AdapterResult> {
    // TODO: connect real API here — revoke tokens at the platform.
    const account = await this.account(workspaceId);
    if (!account) return { success: false };
    await prisma.socialAccount.update({
      where: { id: account.id },
      data: { status: "DISCONNECTED", tokenExpiresAt: null, lastSyncAt: null, errorMessage: null },
    });
    return { success: true };
  }

  async getConnectionStatus(workspaceId: string): Promise<ConnectionStatus> {
    const account = await this.account(workspaceId);
    if (!account || account.status === "DISCONNECTED") return { connected: false };
    return {
      connected: account.status === "CONNECTED",
      accountName: account.displayName,
      lastSyncAt: account.lastSyncAt ?? undefined,
      tokenExpiresAt: account.tokenExpiresAt ?? undefined,
      errorMessage: account.errorMessage ?? undefined,
    };
  }

  async publishPost(input: PublishInput): Promise<PublishResult> {
    // TODO: connect real API here — call the platform's publish endpoint with
    // the body + media, then persist the returned external post id.
    const publishedAt = new Date();
    const externalPostId = randomExternalId();
    await prisma.postTarget.update({
      where: { id: input.targetId },
      data: {
        status: "PUBLISHED",
        publishedAt,
        externalPostId,
        // Simulated early performance so the UI has non-zero metrics immediately.
        impressions: Math.floor(500 + Math.random() * 4000),
        reach: Math.floor(400 + Math.random() * 3000),
        likes: Math.floor(20 + Math.random() * 350),
        comments: Math.floor(2 + Math.random() * 40),
        shares: Math.floor(1 + Math.random() * 25),
        clicks: Math.floor(5 + Math.random() * 120),
      },
    });
    return { success: true, externalPostId, publishedAt };
  }

  async schedulePost(input: ScheduleInput): Promise<PublishResult> {
    // TODO: connect real API here — some platforms support native scheduling;
    // otherwise keep the local scheduler + call publish at fire time.
    await prisma.postTarget.update({
      where: { id: input.targetId },
      data: { status: "SCHEDULED" },
    });
    return { success: true };
  }

  async fetchInsights(workspaceId: string): Promise<InsightsSnapshot> {
    // TODO: connect real API here — pull account-level insights.
    const account = await this.account(workspaceId);
    if (!account) return { followers: 0, reach: 0, impressions: 0, engagements: 0 };
    const latest = await prisma.accountDailyStat.findFirst({
      where: { socialAccountId: account.id },
      orderBy: { date: "desc" },
    });
    await prisma.socialAccount.update({ where: { id: account.id }, data: { lastSyncAt: new Date() } });
    return {
      followers: latest?.followers ?? account.followers,
      reach: latest?.reach ?? 0,
      impressions: latest?.impressions ?? 0,
      engagements: latest?.engagements ?? 0,
    };
  }

  async fetchComments(workspaceId: string): Promise<FetchedComment[]> {
    // TODO: connect real API here — fetch new comments/mentions since last sync.
    const account = await this.account(workspaceId);
    if (!account) return [];
    const conversations = await prisma.conversation.findMany({
      where: { socialAccountId: account.id, kind: "COMMENT" },
      include: { messages: { orderBy: { sentAt: "desc" }, take: 1 } },
      take: 10,
    });
    return conversations.map((c) => ({
      externalId: c.id,
      authorName: c.authorName,
      authorHandle: c.authorHandle,
      body: c.messages[0]?.body ?? "",
    }));
  }

  async sendMessage(input: SendMessageInput): Promise<AdapterResult> {
    // TODO: connect real API here — send the reply through the platform API.
    await prisma.$transaction([
      prisma.conversationMessage.create({
        data: {
          conversationId: input.conversationId,
          direction: "OUTBOUND",
          body: input.body,
          sentById: input.senderUserId,
        },
      }),
      prisma.conversation.update({
        where: { id: input.conversationId },
        data: { lastMessageAt: new Date() },
      }),
    ]);
    return { success: true };
  }

  async getAdCampaigns(workspaceId: string): Promise<AdCampaignSummary[]> {
    // TODO: connect real API here — list campaigns from the ads API.
    const campaigns = await prisma.adCampaign.findMany({
      where: { workspaceId, platform: this.platform, deletedAt: null },
    });
    return campaigns.map((c) => ({ id: c.id, name: c.name, status: c.status, budget: Number(c.budget) }));
  }

  async createAdCampaign(input: CreateAdCampaignInput): Promise<AdCampaignSummary> {
    // TODO: connect real API here — create the campaign through the ads API,
    // then store the returned external campaign id.
    const account = await this.account(input.workspaceId);
    const campaign = await prisma.adCampaign.create({
      data: {
        workspaceId: input.workspaceId,
        socialAccountId: account?.id,
        platform: this.platform,
        name: input.name,
        objective: input.objective as never,
        status: "DRAFT",
        budget: input.budget,
        startDate: input.startDate,
      },
    });
    await prisma.adSet.create({
      data: {
        campaignId: campaign.id,
        name: `${input.name} — 1`,
        audience: input.audience,
        budget: input.budget,
      },
    });
    return { id: campaign.id, name: campaign.name, status: campaign.status, budget: Number(campaign.budget) };
  }
}
