import { MockSocialAdapter } from "../mock-adapter";

/**
 * Snapchat adapter — stories/content + analytics and Snapchat Ads.
 *
 * Real implementation: Snap Kit / Marketing API.
 * Required env vars: SNAPCHAT_CLIENT_ID, SNAPCHAT_CLIENT_SECRET,
 * SNAPCHAT_AD_ACCOUNT_ID. Docs: https://marketingapi.snapchat.com/docs
 * // TODO: connect real API here.
 */
export class SnapchatAdapter extends MockSocialAdapter {
  constructor() {
    super("SNAPCHAT");
  }
}
