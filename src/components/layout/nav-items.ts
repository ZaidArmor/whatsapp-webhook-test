import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Plug,
  Megaphone,
  LineChart,
  Lightbulb,
  Users,
  Layers,
  Download,
  FileBarChart,
  Building2,
  Wrench,
  BellRing,
  UserCog,
  Settings,
  ScrollText,
} from "lucide-react";
import { PermissionKey } from "@prisma/client";

export interface NavItem {
  key: string;
  href: string;
  icon: LucideIcon;
  permission?: PermissionKey;
}

export interface NavGroup {
  labelAr: string;
  labelEn: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    labelAr: "عام",
    labelEn: "General",
    items: [
      { key: "dashboard", href: "/dashboard", icon: LayoutDashboard, permission: PermissionKey.VIEW_DASHBOARD },
    ],
  },
  {
    labelAr: "التسويق",
    labelEn: "Marketing",
    items: [
      { key: "integrations", href: "/integrations", icon: Plug, permission: PermissionKey.MANAGE_INTEGRATIONS },
      { key: "campaigns", href: "/campaigns", icon: Megaphone, permission: PermissionKey.MANAGE_CAMPAIGNS },
      { key: "analytics", href: "/analytics", icon: LineChart, permission: PermissionKey.VIEW_DASHBOARD },
      { key: "recommendations", href: "/recommendations", icon: Lightbulb, permission: PermissionKey.VIEW_DASHBOARD },
    ],
  },
  {
    labelAr: "العملاء",
    labelEn: "Customers",
    items: [
      { key: "customers", href: "/customers", icon: Users, permission: PermissionKey.VIEW_CUSTOMER_DATA },
      { key: "segments", href: "/segments", icon: Layers, permission: PermissionKey.VIEW_CUSTOMER_DATA },
      { key: "exports", href: "/exports", icon: Download, permission: PermissionKey.EXPORT_CUSTOMERS },
    ],
  },
  {
    labelAr: "التقارير",
    labelEn: "Reports",
    items: [{ key: "reports", href: "/reports", icon: FileBarChart, permission: PermissionKey.VIEW_DASHBOARD }],
  },
  {
    labelAr: "الإدارة",
    labelEn: "Administration",
    items: [
      { key: "branches", href: "/branches", icon: Building2, permission: PermissionKey.MANAGE_USERS },
      { key: "services", href: "/services", icon: Wrench, permission: PermissionKey.MANAGE_USERS },
      { key: "alerts", href: "/alerts", icon: BellRing, permission: PermissionKey.VIEW_DASHBOARD },
      { key: "users", href: "/users", icon: UserCog, permission: PermissionKey.MANAGE_USERS },
      { key: "settings", href: "/settings", icon: Settings, permission: PermissionKey.EDIT_ANALYSIS_SETTINGS },
      { key: "auditLog", href: "/audit-log", icon: ScrollText, permission: PermissionKey.MANAGE_USERS },
    ],
  },
];
