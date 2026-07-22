"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Platform, PermissionKey } from "@prisma/client";
import { auth } from "@/lib/auth/auth";
import { logAudit } from "@/lib/audit/log";
import { getProvider } from "@/lib/integrations/registry";

async function requirePermission(permission: PermissionKey) {
  const session = await auth();
  if (!session?.user || !session.user.permissions.includes(permission)) {
    throw new Error("PERMISSION_DENIED");
  }
  return session.user;
}

const platformSchema = z.object({ platform: z.nativeEnum(Platform) });

export async function connectIntegrationAction(input: z.infer<typeof platformSchema>) {
  const user = await requirePermission(PermissionKey.MANAGE_INTEGRATIONS);
  const { platform } = platformSchema.parse(input);
  const provider = getProvider(platform);
  const result = await provider.connect();

  await logAudit({ userId: user.id, action: "CONNECT_INTEGRATION", entityType: "Integration", entityId: platform, metadata: { platform } });
  revalidatePath("/integrations");
  return result;
}

export async function disconnectIntegrationAction(input: z.infer<typeof platformSchema>) {
  const user = await requirePermission(PermissionKey.MANAGE_INTEGRATIONS);
  const { platform } = platformSchema.parse(input);
  const provider = getProvider(platform);
  await provider.disconnect();

  await logAudit({ userId: user.id, action: "DISCONNECT_INTEGRATION", entityType: "Integration", entityId: platform, metadata: { platform } });
  revalidatePath("/integrations");
}

export async function reconnectIntegrationAction(input: z.infer<typeof platformSchema>) {
  const user = await requirePermission(PermissionKey.MANAGE_INTEGRATIONS);
  const { platform } = platformSchema.parse(input);
  const provider = getProvider(platform);
  const result = await provider.refreshToken();

  await logAudit({ userId: user.id, action: "CONNECT_INTEGRATION", entityType: "Integration", entityId: platform, metadata: { platform, action: "reconnect" } });
  revalidatePath("/integrations");
  return result;
}

export async function syncNowAction(input: z.infer<typeof platformSchema>) {
  await requirePermission(PermissionKey.MANAGE_INTEGRATIONS);
  const { platform } = platformSchema.parse(input);
  const provider = getProvider(platform);

  const [accounts, campaigns, ads, metrics] = await Promise.all([
    provider.syncAccounts(),
    provider.syncCampaigns(),
    provider.syncAds(),
    provider.syncMetrics(),
  ]);

  revalidatePath("/integrations");
  return { accounts, campaigns, ads, metrics };
}
