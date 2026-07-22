import { MockIntegrationProvider } from "../mock-provider";

/**
 * Google Ads / Search Console / Business Profile / YouTube adapter. Real
 * implementation would use the Google Ads API / GSC API / Business Profile
 * API via GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_ADS_DEVELOPER_TOKEN.
 */
export class GoogleAdsProvider extends MockIntegrationProvider {
  constructor(platform: "GOOGLE_ADS" | "GOOGLE_SEARCH_CONSOLE" | "GOOGLE_BUSINESS_PROFILE" | "YOUTUBE") {
    super(platform, "Google");
  }
}
