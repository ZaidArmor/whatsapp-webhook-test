import { MockIntegrationProvider } from "../mock-provider";

/** TikTok Ads / TikTok adapter. Real implementation would use the TikTok Marketing API via TIKTOK_APP_ID / TIKTOK_APP_SECRET. */
export class TikTokProvider extends MockIntegrationProvider {
  constructor(platform: "TIKTOK_ADS" | "TIKTOK") {
    super(platform, "TikTok");
  }
}
