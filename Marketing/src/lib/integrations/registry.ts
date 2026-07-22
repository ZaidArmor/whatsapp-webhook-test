import { PlatformKind } from "@prisma/client";
import type { SocialPlatformAdapter } from "./types";
import { MetaAdapter } from "./providers/meta";
import { TikTokAdapter } from "./providers/tiktok";
import { SnapchatAdapter } from "./providers/snapchat";
import { XAdapter } from "./providers/x";
import { LinkedInAdapter } from "./providers/linkedin";
import { GoogleAdsAdapter } from "./providers/google-ads";
import { YouTubeAdapter } from "./providers/youtube";

/** Resolves the adapter for a platform. Mock in this build (INTEGRATIONS_USE_MOCK=true). */
export function getAdapter(platform: PlatformKind): SocialPlatformAdapter {
  switch (platform) {
    case PlatformKind.FACEBOOK:
    case PlatformKind.INSTAGRAM:
      return new MetaAdapter(platform);
    case PlatformKind.TIKTOK:
      return new TikTokAdapter();
    case PlatformKind.SNAPCHAT:
      return new SnapchatAdapter();
    case PlatformKind.X_TWITTER:
      return new XAdapter();
    case PlatformKind.LINKEDIN:
      return new LinkedInAdapter();
    case PlatformKind.GOOGLE_ADS:
      return new GoogleAdsAdapter();
    case PlatformKind.YOUTUBE:
      return new YouTubeAdapter();
    default:
      throw new Error(`No adapter for platform: ${platform}`);
  }
}

export const ALL_PLATFORMS: PlatformKind[] = Object.values(PlatformKind);
