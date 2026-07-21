import type { Platform } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const PLATFORM_META: Record<Platform, { label: string; className: string }> = {
  META_ADS: { label: "Meta Ads", className: "bg-[#1877F2]/10 text-[#1877F2]" },
  FACEBOOK: { label: "Facebook", className: "bg-[#1877F2]/10 text-[#1877F2]" },
  INSTAGRAM: { label: "Instagram", className: "bg-[#E1306C]/10 text-[#E1306C]" },
  TIKTOK_ADS: { label: "TikTok Ads", className: "bg-foreground/10 text-foreground" },
  TIKTOK: { label: "TikTok", className: "bg-foreground/10 text-foreground" },
  SNAPCHAT_ADS: { label: "Snapchat Ads", className: "bg-[#FFFC00]/20 text-yellow-700 dark:text-yellow-400" },
  GOOGLE_ADS: { label: "Google Ads", className: "bg-[#4285F4]/10 text-[#4285F4]" },
  GA4: { label: "GA4", className: "bg-[#F9AB00]/10 text-[#B27B00]" },
  GOOGLE_SEARCH_CONSOLE: { label: "Search Console", className: "bg-[#4285F4]/10 text-[#4285F4]" },
  YOUTUBE: { label: "YouTube", className: "bg-[#FF0000]/10 text-[#FF0000]" },
  WHATSAPP_BUSINESS: { label: "WhatsApp Business", className: "bg-[#25D366]/10 text-[#128C7E]" },
  GOOGLE_BUSINESS_PROFILE: { label: "Google Business", className: "bg-[#4285F4]/10 text-[#4285F4]" },
  LINKEDIN: { label: "LinkedIn", className: "bg-[#0A66C2]/10 text-[#0A66C2]" },
  X_TWITTER: { label: "X", className: "bg-foreground/10 text-foreground" },
};

export function PlatformBadge({ platform }: { platform: Platform }) {
  const meta = PLATFORM_META[platform];
  return <Badge className={cn("border-transparent font-medium", meta.className)}>{meta.label}</Badge>;
}
