import { MockIntegrationProvider } from "../mock-provider";

/**
 * Meta Ads / Facebook / Instagram adapter. Real implementation would wrap the
 * Meta Marketing API (Graph API) using META_APP_ID / META_APP_SECRET /
 * META_ACCESS_TOKEN from environment variables — never hardcoded here.
 */
export class MetaProvider extends MockIntegrationProvider {
  constructor(platform: "META_ADS" | "FACEBOOK" | "INSTAGRAM") {
    super(platform, "Meta");
  }
}
