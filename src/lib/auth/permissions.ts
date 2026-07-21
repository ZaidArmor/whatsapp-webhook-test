import { PermissionKey, RoleName } from "@prisma/client";

/**
 * Source of truth for role → permission assignments. Seeded into the
 * Role/Permission/RolePermission tables so admins can eventually customize
 * it from the DB, but kept here as a typed reference used by the seed script.
 */
export const ROLE_PERMISSIONS: Record<RoleName, PermissionKey[]> = {
  SUPER_ADMIN: Object.values(PermissionKey),
  EXECUTIVE_MANAGER: [
    PermissionKey.VIEW_DASHBOARD,
    PermissionKey.VIEW_ALL_BRANCHES,
    PermissionKey.VIEW_REVENUE,
    PermissionKey.VIEW_CUSTOMER_DATA,
    PermissionKey.EXPORT_CUSTOMERS,
    PermissionKey.MANAGE_CAMPAIGNS,
    PermissionKey.EDIT_ANALYSIS_SETTINGS,
  ],
  MARKETING_MANAGER: [
    PermissionKey.VIEW_DASHBOARD,
    PermissionKey.VIEW_ALL_BRANCHES,
    PermissionKey.VIEW_REVENUE,
    PermissionKey.VIEW_CUSTOMER_DATA,
    PermissionKey.MANAGE_CAMPAIGNS,
    PermissionKey.MANAGE_INTEGRATIONS,
    PermissionKey.EXPORT_CUSTOMERS,
    PermissionKey.IMPORT_CUSTOMERS,
    PermissionKey.EDIT_ANALYSIS_SETTINGS,
  ],
  CAMPAIGN_SPECIALIST: [
    PermissionKey.VIEW_DASHBOARD,
    PermissionKey.VIEW_ALL_BRANCHES,
    PermissionKey.MANAGE_CAMPAIGNS,
    PermissionKey.MANAGE_INTEGRATIONS,
  ],
  SALES_MANAGER: [
    PermissionKey.VIEW_DASHBOARD,
    PermissionKey.VIEW_ALL_BRANCHES,
    PermissionKey.VIEW_REVENUE,
    PermissionKey.VIEW_CUSTOMER_DATA,
    PermissionKey.EDIT_CUSTOMERS,
    PermissionKey.EXPORT_CUSTOMERS,
    PermissionKey.IMPORT_CUSTOMERS,
  ],
  BRANCH_MANAGER: [
    PermissionKey.VIEW_DASHBOARD,
    PermissionKey.VIEW_SINGLE_BRANCH,
    PermissionKey.VIEW_CUSTOMER_DATA,
    PermissionKey.EDIT_CUSTOMERS,
  ],
  SALES_EMPLOYEE: [
    PermissionKey.VIEW_DASHBOARD,
    PermissionKey.VIEW_SINGLE_BRANCH,
    PermissionKey.VIEW_CUSTOMER_DATA,
    PermissionKey.EDIT_CUSTOMERS,
  ],
  DATA_ANALYST: [
    PermissionKey.VIEW_DASHBOARD,
    PermissionKey.VIEW_ALL_BRANCHES,
    PermissionKey.VIEW_CUSTOMER_DATA,
    PermissionKey.VIEW_REVENUE,
    PermissionKey.EXPORT_CUSTOMERS,
  ],
  VIEWER: [PermissionKey.VIEW_DASHBOARD, PermissionKey.VIEW_SINGLE_BRANCH],
};

export const ROLE_LABELS: Record<RoleName, string> = {
  SUPER_ADMIN: "مدير النظام",
  EXECUTIVE_MANAGER: "مدير تنفيذي",
  MARKETING_MANAGER: "مدير تسويق",
  CAMPAIGN_SPECIALIST: "أخصائي حملات",
  SALES_MANAGER: "مدير مبيعات",
  BRANCH_MANAGER: "مدير فرع",
  SALES_EMPLOYEE: "موظف مبيعات",
  DATA_ANALYST: "محلل بيانات",
  VIEWER: "مشاهد",
};

export function hasPermission(
  permissions: readonly string[],
  key: PermissionKey
): boolean {
  return permissions.includes(key);
}

export function hasAnyPermission(
  permissions: readonly string[],
  keys: PermissionKey[]
): boolean {
  return keys.some((key) => permissions.includes(key));
}
