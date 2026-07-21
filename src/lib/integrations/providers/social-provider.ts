import { MockIntegrationProvider } from "../mock-provider";

/** LinkedIn / X (Twitter) adapter — organic social presence, not ad accounts. */
export class SocialProvider extends MockIntegrationProvider {
  constructor(platform: "LINKEDIN" | "X_TWITTER") {
    super(platform, platform === "LINKEDIN" ? "LinkedIn" : "X");
  }
}
