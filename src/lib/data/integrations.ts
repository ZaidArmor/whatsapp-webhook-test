import { prisma } from "@/lib/prisma";
import type { IntegrationStatus, Platform } from "@prisma/client";
import { ALL_INTEGRATION_PLATFORMS } from "@/lib/integrations/registry";

export interface IntegrationRow {
  platform: Platform;
  status: IntegrationStatus;
  accountName: string | null;
  accountExternalId: string | null;
  lastSyncAt: Date | null;
  tokenExpiresAt: Date | null;
  errorMessage: string | null;
  isMock: boolean;
}

export async function getIntegrationsList(): Promise<IntegrationRow[]> {
  const existing = await prisma.integration.findMany();
  const byPlatform = new Map(existing.map((i) => [i.platform, i]));

  return ALL_INTEGRATION_PLATFORMS.map((platform) => {
    const record = byPlatform.get(platform);
    return {
      platform,
      status: record?.status ?? "NOT_CONNECTED",
      accountName: record?.accountName ?? null,
      accountExternalId: record?.accountExternalId ?? null,
      lastSyncAt: record?.lastSyncAt ?? null,
      tokenExpiresAt: record?.tokenExpiresAt ?? null,
      errorMessage: record?.errorMessage ?? null,
      isMock: record?.isMock ?? true,
    };
  });
}
