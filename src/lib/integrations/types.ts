import type { Platform } from "@prisma/client";

export interface ConnectResult {
  success: boolean;
  accountName?: string;
  accountExternalId?: string;
  tokenExpiresAt?: Date;
  errorMessage?: string;
}

export interface SyncResult {
  success: boolean;
  itemsSynced: number;
  errorMessage?: string;
}

export interface ConnectionStatusResult {
  connected: boolean;
  accountName?: string;
  lastSyncAt?: Date;
  tokenExpiresAt?: Date;
  errorMessage?: string;
}

/**
 * Adapter contract every ad-platform / social integration must implement.
 * Mock providers implement this today; swapping in a real API client later
 * only requires a new class implementing this same interface — nothing in
 * the UI, server actions, or DB layer needs to change.
 */
export interface MarketingIntegrationProvider {
  readonly platform: Platform;

  connect(): Promise<ConnectResult>;
  disconnect(): Promise<void>;
  refreshToken(): Promise<ConnectResult>;
  testConnection(): Promise<ConnectionStatusResult>;
  getConnectionStatus(): Promise<ConnectionStatusResult>;

  syncAccounts(): Promise<SyncResult>;
  syncCampaigns(): Promise<SyncResult>;
  syncAds(): Promise<SyncResult>;
  syncMetrics(): Promise<SyncResult>;
}
