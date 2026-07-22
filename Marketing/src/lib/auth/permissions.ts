import { WorkspaceRole } from "@prisma/client";

/**
 * Granular permission keys used across every screen and server action.
 * The role→permission matrix is the single source of truth for RBAC.
 */
export const PERMISSION_KEYS = [
  "view_dashboard",
  "manage_connections",
  "create_posts",
  "approve_posts",
  "publish_posts",
  "manage_inbox",
  "manage_ads",
  "manage_crm",
  "view_reports",
  "export_data",
  "run_insights",
  "manage_team",
  "manage_settings",
  "view_audit",
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];

const ALL: PermissionKey[] = [...PERMISSION_KEYS];

export const ROLE_PERMISSIONS: Record<WorkspaceRole, PermissionKey[]> = {
  OWNER: ALL,
  ADMIN: ALL,
  MANAGER: [
    "view_dashboard",
    "manage_connections",
    "create_posts",
    "approve_posts",
    "publish_posts",
    "manage_inbox",
    "manage_ads",
    "manage_crm",
    "view_reports",
    "export_data",
    "run_insights",
    "view_audit",
  ],
  EDITOR: ["view_dashboard", "create_posts", "manage_inbox", "view_reports"],
  ANALYST: ["view_dashboard", "view_reports", "export_data", "run_insights"],
  VIEWER: ["view_dashboard", "view_reports"],
};

export function roleHasPermission(role: WorkspaceRole, permission: PermissionKey): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}
