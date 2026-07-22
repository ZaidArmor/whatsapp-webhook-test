import { cookies } from "next/headers";
import { KeyRound, Languages } from "lucide-react";
import type { PlatformKind } from "@prisma/client";
import { getT } from "@/lib/i18n/server";
import { getWorkspaceContext } from "@/lib/auth/workspace";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PlatformIcon } from "@/components/shared/platform-icon";
import { LocaleToggle } from "@/components/layout/header-controls";
import { ProfileForm, ThemeSetting, NotificationSwitch } from "@/components/settings/settings-forms";

/** Env var names each platform needs when the real APIs get connected (see .env.example). */
const PLATFORM_ENV_KEYS: Array<{ platform: PlatformKind; keys: string[] }> = [
  { platform: "FACEBOOK", keys: ["META_APP_ID", "META_APP_SECRET", "META_ACCESS_TOKEN", "META_AD_ACCOUNT_ID"] },
  { platform: "TIKTOK", keys: ["TIKTOK_CLIENT_KEY", "TIKTOK_CLIENT_SECRET", "TIKTOK_ADS_ACCESS_TOKEN"] },
  { platform: "SNAPCHAT", keys: ["SNAPCHAT_CLIENT_ID", "SNAPCHAT_CLIENT_SECRET", "SNAPCHAT_AD_ACCOUNT_ID"] },
  { platform: "X_TWITTER", keys: ["X_API_KEY", "X_API_SECRET", "X_ACCESS_TOKEN", "X_ACCESS_TOKEN_SECRET"] },
  { platform: "LINKEDIN", keys: ["LINKEDIN_CLIENT_ID", "LINKEDIN_CLIENT_SECRET", "LINKEDIN_ORGANIZATION_ID"] },
  { platform: "GOOGLE_ADS", keys: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_ADS_DEVELOPER_TOKEN", "GOOGLE_ADS_CUSTOMER_ID"] },
  { platform: "YOUTUBE", keys: ["YOUTUBE_API_KEY", "YOUTUBE_CHANNEL_ID"] },
];

export default async function SettingsPage() {
  const { t } = await getT();
  const ctx = await getWorkspaceContext();

  const [user, store] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: ctx.userId }, select: { name: true, email: true } }),
    cookies(),
  ]);
  const pref = (key: string) => store.get(`mktg_notify_${key}`)?.value !== "0";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("settings.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("settings.subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{t("settings.profile")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ProfileForm initialName={user.name} />
            <div className="text-xs text-muted-foreground" dir="ltr">
              {user.email}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{t("settings.preferences")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm">
                <Languages className="h-4 w-4" />
                {t("common.language")}
              </span>
              <LocaleToggle />
            </div>
            <ThemeSetting />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{t("settings.notifications")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <NotificationSwitch prefKey="approvals" labelKey="settings.notifyApprovals" initial={pref("approvals")} />
            <NotificationSwitch prefKey="inbox" labelKey="settings.notifyInbox" initial={pref("inbox")} />
            <NotificationSwitch prefKey="alerts" labelKey="settings.notifyAlerts" initial={pref("alerts")} />
          </CardContent>
        </Card>

        <Card className="xl:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <KeyRound className="h-4 w-4 text-accent" />
              {t("settings.apiKeys")}
            </CardTitle>
            <p className="text-xs text-muted-foreground">{t("settings.apiKeysHint")}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {PLATFORM_ENV_KEYS.map(({ platform, keys }) => (
              <div key={platform} className="space-y-2 rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <PlatformIcon platform={platform} className="h-4 w-4" />
                  <span className="text-sm font-medium">{t(`platforms.${platform}`)}</span>
                  <Badge variant="muted" className="ms-auto text-[10px]">
                    {t("settings.apiKeysDisabled")}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {keys.map((key) => (
                    <div key={key} className="space-y-1">
                      <span className="block font-mono text-[10px] text-muted-foreground" dir="ltr">
                        {key}
                      </span>
                      <Input disabled placeholder="••••••••" dir="ltr" className="h-8 font-mono text-xs" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
