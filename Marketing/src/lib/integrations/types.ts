import type { PlatformKind } from "@prisma/client";

export interface AdapterResult {
  success: boolean;
  message?: string;
}

export interface ConnectResult extends AdapterResult {
  accountName?: string;
  externalId?: string;
  tokenExpiresAt?: Date;
}

export interface ConnectionStatus {
  connected: boolean;
  accountName?: string;
  lastSyncAt?: Date;
  tokenExpiresAt?: Date;
  errorMessage?: string;
}

export interface PublishInput {
  postId: string;
  targetId: string;
  body: string;
  mediaUrls: string[];
}

export interface PublishResult extends AdapterResult {
  externalPostId?: string;
  publishedAt?: Date;
}

export interface ScheduleInput extends PublishInput {
  scheduledAt: Date;
}

export interface InsightsSnapshot {
  followers: number;
  reach: number;
  impressions: number;
  engagements: number;
}

export interface FetchedComment {
  externalId: string;
  authorName: string;
  authorHandle: string;
  body: string;
  postExternalId?: string;
}

export interface SendMessageInput {
  conversationId: string;
  body: string;
  senderUserId: string;
}

export interface AdCampaignSummary {
  id: string;
  name: string;
  status: string;
  budget: number;
}

export interface CreateAdCampaignInput {
  workspaceId: string;
  name: string;
  objective: string;
  budget: number;
  startDate: Date;
  audience?: string;
}

/**
 * Unified contract every platform adapter implements.
 * Today all adapters are mock implementations operating on the local DB;
 * swapping in a real client only means replacing one class per platform —
 * nothing in the UI, server actions, or data layer changes.
 */
export interface SocialPlatformAdapter {
  readonly platform: PlatformKind;

  connect(workspaceId: string): Promise<ConnectResult>;
  disconnect(workspaceId: string): Promise<AdapterResult>;
  getConnectionStatus(workspaceId: string): Promise<ConnectionStatus>;

  publishPost(input: PublishInput): Promise<PublishResult>;
  schedulePost(input: ScheduleInput): Promise<PublishResult>;

  fetchInsights(workspaceId: string): Promise<InsightsSnapshot>;
  fetchComments(workspaceId: string): Promise<FetchedComment[]>;
  sendMessage(input: SendMessageInput): Promise<AdapterResult>;

  getAdCampaigns(workspaceId: string): Promise<AdCampaignSummary[]>;
  createAdCampaign(input: CreateAdCampaignInput): Promise<AdCampaignSummary>;
}
