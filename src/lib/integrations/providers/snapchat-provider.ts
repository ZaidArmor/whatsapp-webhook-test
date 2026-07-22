import { MockIntegrationProvider } from "../mock-provider";

/** Snapchat Ads adapter. Real implementation would use the Snapchat Marketing API via SNAPCHAT_CLIENT_ID / SNAPCHAT_CLIENT_SECRET. */
export class SnapchatProvider extends MockIntegrationProvider {
  constructor() {
    super("SNAPCHAT_ADS", "Snapchat");
  }
}
