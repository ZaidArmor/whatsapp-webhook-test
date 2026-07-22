import { MockSocialAdapter } from "../mock-adapter";

/**
 * Meta adapter — Facebook Pages + Instagram Business (publishing, scheduling,
 * comments, messages, insights) and Meta Ads (campaign management).
 *
 * Real implementation: Meta Graph API + Marketing API.
 * Required env vars: META_APP_ID, META_APP_SECRET, META_ACCESS_TOKEN,
 * META_AD_ACCOUNT_ID. Docs: https://developers.facebook.com/docs/graph-api
 * // TODO: connect real API here — override the Mock methods with Graph API calls.
 */
export class MetaAdapter extends MockSocialAdapter {
  constructor(platform: "FACEBOOK" | "INSTAGRAM") {
    super(platform);
  }
}
