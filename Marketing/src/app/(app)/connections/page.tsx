import { getT } from "@/lib/i18n/server";
import { getWorkspaceContext } from "@/lib/auth/workspace";
import { prisma } from "@/lib/prisma";
import { ALL_PLATFORMS } from "@/lib/integrations/registry";
import { ConnectionCard, type ConnectionInfo } from "@/components/connections/connection-card";

export default async function ConnectionsPage() {
  const { t } = await getT();
  const ctx = await getWorkspaceContext();

  const accounts = await prisma.socialAccount.findMany({
    where: { workspaceId: ctx.workspaceId },
    orderBy: { platform: "asc" },
  });

  const cards: ConnectionInfo[] = ALL_PLATFORMS.map((platform) => {
    const account = accounts.find((a) => a.platform === platform);
    if (!account) {
      return {
        platform,
        status: "NONE",
        handle: null,
        displayName: null,
        followers: 0,
        lastSyncAt: null,
        tokenExpiresAt: null,
        externalId: null,
        errorMessage: null,
      };
    }
    return {
      platform,
      status: account.status,
      handle: account.handle,
      displayName: account.displayName,
      followers: account.followers,
      lastSyncAt: account.lastSyncAt?.toISOString() ?? null,
      tokenExpiresAt: account.tokenExpiresAt?.toISOString() ?? null,
      externalId: account.externalId,
      errorMessage: account.errorMessage,
    };
  });

  const canManage = ctx.can("manage_connections");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("connections.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("connections.subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((info) => (
          <ConnectionCard key={info.platform} info={info} canManage={canManage} />
        ))}
      </div>
    </div>
  );
}
