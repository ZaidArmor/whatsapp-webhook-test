import { MockSocialAdapter } from "../mock-adapter";

/**
 * Google Ads adapter — campaigns, ad groups, performance pull.
 *
 * Real implementation: Google Ads API (OAuth2 + developer token).
 * Required env vars: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
 * GOOGLE_ADS_DEVELOPER_TOKEN, GOOGLE_ADS_CUSTOMER_ID.
 * Docs: https://developers.google.com/google-ads/api
 * // TODO: connect real API here.
 */
export class GoogleAdsAdapter extends MockSocialAdapter {
  constructor() {
    super("GOOGLE_ADS");
  }
}
