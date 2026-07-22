import { cookies } from "next/headers";
import type { WorkspaceRole } from "@prisma/client";
import { auth } from "./auth";
import { roleHasPermission, type PermissionKey } from "./permissions";

export const WORKSPACE_COOKIE = "mktg_workspace";

export interface WorkspaceContext {
  userId: string;
  userName: string;
  workspaceId: string;
  workspaceName: string;
  role: WorkspaceRole;
  memberships: Array<{ workspaceId: string; workspaceName: string; role: string }>;
  can: (permission: PermissionKey) => boolean;
}

/**
 * Resolves the signed-in user's active workspace (cookie-selected, validated
 * against real memberships, falling back to the first membership).
 * Throws if unauthenticated or the user belongs to no workspace.
 */
export async function getWorkspaceContext(): Promise<WorkspaceContext> {
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHENTICATED");

  const memberships = session.user.memberships;
  if (memberships.length === 0) throw new Error("NO_WORKSPACE");

  const store = await cookies();
  const requested = store.get(WORKSPACE_COOKIE)?.value;
  const active = memberships.find((m) => m.workspaceId === requested) ?? memberships[0]!;

  const role = active.role as WorkspaceRole;

  return {
    userId: session.user.id,
    userName: session.user.name ?? "",
    workspaceId: active.workspaceId,
    workspaceName: active.workspaceName,
    role,
    memberships: memberships.map((m) => ({
      workspaceId: m.workspaceId,
      workspaceName: m.workspaceName,
      role: m.role,
    })),
    can: (permission) => roleHasPermission(role, permission),
  };
}

/** Guard for server actions/pages: returns context or throws PERMISSION_DENIED. */
export async function requirePermission(permission: PermissionKey): Promise<WorkspaceContext> {
  const ctx = await getWorkspaceContext();
  if (!ctx.can(permission)) throw new Error("PERMISSION_DENIED");
  return ctx;
}
