import { MockSocialAdapter } from "../mock-adapter";

/**
 * TikTok adapter — content publishing + analytics and TikTok Ads.
 *
 * Real implementation: TikTok Content Posting API + TikTok Business API.
 * Required env vars: TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET,
 * TIKTOK_ADS_ACCESS_TOKEN, TIKTOK_ADS_ADVERTISER_ID.
 * Docs: https://developers.tiktok.com / https://business-api.tiktok.com
 * // TODO: connect real API here.
 */
export class TikTokAdapter extends MockSocialAdapter {
  constructor() {
    super("TIKTOK");
  }
}
