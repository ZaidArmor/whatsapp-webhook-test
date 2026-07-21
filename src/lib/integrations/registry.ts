import { Platform } from "@prisma/client";
import type { MarketingIntegrationProvider } from "./types";
import { MetaProvider } from "./providers/meta-provider";
import { GoogleAdsProvider } from "./providers/google-ads-provider";
import { GA4Provider } from "./providers/ga4-provider";
import { TikTokProvider } from "./providers/tiktok-provider";
import { SnapchatProvider } from "./providers/snapchat-provider";
import { WhatsAppProvider } from "./providers/whatsapp-provider";
import { SocialProvider } from "./providers/social-provider";

/** All platforms shown on /integrations, each resolved to its provider adapter. */
export function getProvider(platform: Platform): MarketingIntegrationProvider {
  switch (platform) {
    case Platform.META_ADS:
    case Platform.FACEBOOK:
    case Platform.INSTAGRAM:
      return new MetaProvider(platform);
    case Platform.GOOGLE_ADS:
    case Platform.GOOGLE_SEARCH_CONSOLE:
    case Platform.GOOGLE_BUSINESS_PROFILE:
    case Platform.YOUTUBE:
      return new GoogleAdsProvider(platform);
    case Platform.GA4:
      return new GA4Provider();
    case Platform.TIKTOK_ADS:
    case Platform.TIKTOK:
      return new TikTokProvider(platform);
    case Platform.SNAPCHAT_ADS:
      return new SnapchatProvider();
    case Platform.WHATSAPP_BUSINESS:
      return new WhatsAppProvider();
    case Platform.LINKEDIN:
    case Platform.X_TWITTER:
      return new SocialProvider(platform);
    default:
      throw new Error(`No integration provider registered for platform: ${platform}`);
  }
}

export const ALL_INTEGRATION_PLATFORMS: Platform[] = [
  Platform.META_ADS,
  Platform.FACEBOOK,
  Platform.INSTAGRAM,
  Platform.TIKTOK_ADS,
  Platform.TIKTOK,
  Platform.SNAPCHAT_ADS,
  Platform.GOOGLE_ADS,
  Platform.GA4,
  Platform.GOOGLE_SEARCH_CONSOLE,
  Platform.YOUTUBE,
  Platform.WHATSAPP_BUSINESS,
  Platform.GOOGLE_BUSINESS_PROFILE,
  Platform.LINKEDIN,
  Platform.X_TWITTER,
];
