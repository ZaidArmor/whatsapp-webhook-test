import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Plug,
  FileText,
  PenSquare,
  CalendarDays,
  Inbox,
  Megaphone,
  Users,
  FileBarChart,
  Lightbulb,
  Building2,
  Settings,
  ScrollText,
} from "lucide-react";
import type { PermissionKey } from "@/lib/auth/permissions";

export interface NavItem {
  /** i18n key under nav.* */
  key: string;
  href: string;
  icon: LucideIcon;
  permission: PermissionKey;
}

export interface NavGroup {
  /** i18n key under nav.groups.* */
  key: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    key: "general",
    items: [
      { key: "dashboard", href: "/dashboard", icon: LayoutDashboard, permission: "view_dashboard" },
      { key: "connections", href: "/connections", icon: Plug, permission: "manage_connections" },
    ],
  },
  {
    key: "content",
    items: [
      { key: "posts", href: "/posts", icon: FileText, permission: "create_posts" },
      { key: "composer", href: "/posts/new", icon: PenSquare, permission: "create_posts" },
      { key: "calendar", href: "/calendar", icon: CalendarDays, permission: "create_posts" },
    ],
  },
  {
    key: "engagement",
    items: [{ key: "inbox", href: "/inbox", icon: Inbox, permission: "manage_inbox" }],
  },
  {
    key: "growth",
    items: [
      { key: "ads", href: "/ads", icon: Megaphone, permission: "manage_ads" },
      { key: "crm", href: "/crm", icon: Users, permission: "manage_crm" },
      { key: "reports", href: "/reports", icon: FileBarChart, permission: "view_reports" },
      { key: "insights", href: "/insights", icon: Lightbulb, permission: "view_reports" },
    ],
  },
  {
    key: "admin",
    items: [
      { key: "team", href: "/team", icon: Building2, permission: "manage_team" },
      { key: "settings", href: "/settings", icon: Settings, permission: "manage_settings" },
      { key: "auditLog", href: "/audit-log", icon: ScrollText, permission: "view_audit" },
    ],
  },
];
