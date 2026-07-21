import type { Platform } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  ConnectResult,
  ConnectionStatusResult,
  MarketingIntegrationProvider,
  SyncResult,
} from "./types";

function randomAccountId(): string {
  return Math.floor(1_000_000_000 + Math.random() * 8_999_999_999).toString();
}

function futureDate(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

/**
 * Simulates a real ad-platform connection: fake account data, a token
 * expiring ~60 days out, occasional sync errors, and small realistic
 * delays — but implements the exact same interface a real Meta/Google/
 * TikTok/Snapchat/GA4 client would, so only this class needs replacing
 * to go live (see docs/adding-a-real-integration in the README).
 */
export class MockIntegrationProvider implements MarketingIntegrationProvider {
  constructor(
    public readonly platform: Platform,
    private readonly accountNamePrefix: string
  ) {}

  private async delay(ms = 400) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  async connect(): Promise<ConnectResult> {
    await this.delay();
    const accountName = `${this.accountNamePrefix} — حساب ARMOR`;
    const accountExternalId = randomAccountId();
    const tokenExpiresAt = futureDate(60);

    await prisma.integration.upsert({
      where: { platform: this.platform },
      update: {
        status: "CONNECTED",
        accountName,
        accountExternalId,
        tokenExpiresAt,
        lastSyncAt: new Date(),
        errorMessage: null,
        isMock: true,
      },
      create: {
        platform: this.platform,
        status: "CONNECTED",
        accountName,
        accountExternalId,
        tokenExpiresAt,
        lastSyncAt: new Date(),
        isMock: true,
      },
    });

    return { success: true, accountName, accountExternalId, tokenExpiresAt };
  }

  async disconnect(): Promise<void> {
    await this.delay(200);
    await prisma.integration.upsert({
      where: { platform: this.platform },
      update: {
        status: "NOT_CONNECTED",
        accountName: null,
        accountExternalId: null,
        tokenExpiresAt: null,
        lastSyncAt: null,
        errorMessage: null,
      },
      create: { platform: this.platform, status: "NOT_CONNECTED" },
    });
  }

  async refreshToken(): Promise<ConnectResult> {
    await this.delay(300);
    const tokenExpiresAt = futureDate(60);
    const integration = await prisma.integration.update({
      where: { platform: this.platform },
      data: { tokenExpiresAt, status: "CONNECTED", errorMessage: null },
    });
    return {
      success: true,
      accountName: integration.accountName ?? undefined,
      accountExternalId: integration.accountExternalId ?? undefined,
      tokenExpiresAt,
    };
  }

  async testConnection(): Promise<ConnectionStatusResult> {
    return this.getConnectionStatus();
  }

  async getConnectionStatus(): Promise<ConnectionStatusResult> {
    const integration = await prisma.integration.findUnique({ where: { platform: this.platform } });
    if (!integration || integration.status === "NOT_CONNECTED") return { connected: false };
    return {
      connected: integration.status === "CONNECTED" || integration.status === "SYNCING",
      accountName: integration.accountName ?? undefined,
      lastSyncAt: integration.lastSyncAt ?? undefined,
      tokenExpiresAt: integration.tokenExpiresAt ?? undefined,
      errorMessage: integration.errorMessage ?? undefined,
    };
  }

  private async runSync(kind: string, simulatedCount: [number, number]): Promise<SyncResult> {
    const integration = await prisma.integration.findUnique({ where: { platform: this.platform } });
    if (!integration || integration.status === "NOT_CONNECTED") {
      return { success: false, itemsSynced: 0, errorMessage: "الحساب غير متصل" };
    }

    await prisma.integration.update({ where: { platform: this.platform }, data: { status: "SYNCING" } });
    await this.delay(600);

    // Small simulated failure rate so the error-log / retry UX has something to show.
    const failed = Math.random() < 0.08;
    const [min, max] = simulatedCount;
    const itemsSynced = failed ? 0 : Math.floor(min + Math.random() * (max - min));

    await prisma.integration.update({
      where: { platform: this.platform },
      data: {
        status: "CONNECTED",
        lastSyncAt: new Date(),
        errorMessage: failed ? `فشلت مزامنة ${kind}: انتهت مهلة الاتصال بواجهة برمجة التطبيقات (محاكاة).` : null,
      },
    });

    return failed
      ? { success: false, itemsSynced: 0, errorMessage: `فشلت مزامنة ${kind}` }
      : { success: true, itemsSynced };
  }

  syncAccounts(): Promise<SyncResult> {
    return this.runSync("الحسابات", [1, 3]);
  }

  syncCampaigns(): Promise<SyncResult> {
    return this.runSync("الحملات", [2, 8]);
  }

  syncAds(): Promise<SyncResult> {
    return this.runSync("الإعلانات", [5, 25]);
  }

  syncMetrics(): Promise<SyncResult> {
    return this.runSync("بيانات الأداء", [30, 90]);
  }
}
