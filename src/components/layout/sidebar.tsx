"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/locale-context";
import { navGroups } from "./nav-items";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const COLLAPSE_KEY = "armor_sidebar_collapsed";

export function Sidebar({ permissions }: { permissions: string[] }) {
  const pathname = usePathname();
  const { locale } = useLocale();
  const [collapsed, setCollapsed] = React.useState(false);

  React.useEffect(() => {
    // One-time read of a browser-only API (localStorage) to restore the
    // user's last collapse preference — must run after mount since it's
    // unavailable during SSR, so the synchronous setState here is intentional.
    const stored = window.localStorage.getItem(COLLAPSE_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored) setCollapsed(stored === "1");
  }, []);

  const toggle = () => {
    setCollapsed((prev) => {
      window.localStorage.setItem(COLLAPSE_KEY, prev ? "0" : "1");
      return !prev;
    });
  };

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col border-e bg-card transition-all duration-200 lg:flex",
        collapsed ? "w-[68px]" : "w-64"
      )}
    >
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <ShieldCheck className="h-4.5 w-4.5" />
        </div>
        {!collapsed && (
          <span className="truncate text-sm font-bold text-primary">
            {locale === "ar" ? "ARMOR" : "ARMOR"}
          </span>
        )}
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-2 py-4">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter(
            (item) => !item.permission || permissions.includes(item.permission)
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.labelEn}>
              {!collapsed && (
                <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {locale === "ar" ? group.labelAr : group.labelEn}
                </div>
              )}
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const label =
                    locale === "ar"
                      ? navLabelAr(item.key)
                      : navLabelEn(item.key);
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  const linkEl = (
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground/80 hover:bg-accent hover:text-accent-foreground",
                        collapsed && "justify-center px-0"
                      )}
                    >
                      <item.icon className="h-4.5 w-4.5 shrink-0" />
                      {!collapsed && <span className="truncate">{label}</span>}
                    </Link>
                  );

                  if (!collapsed) return <div key={item.key}>{linkEl}</div>;

                  return (
                    <Tooltip key={item.key} delayDuration={200}>
                      <TooltipTrigger asChild>{linkEl}</TooltipTrigger>
                      <TooltipContent side="top">{label}</TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <button
        onClick={toggle}
        className="flex h-12 items-center justify-center gap-2 border-t text-sm text-muted-foreground hover:bg-accent"
      >
        <ChevronsLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
        {!collapsed && (locale === "ar" ? "طي القائمة" : "Collapse")}
      </button>
    </aside>
  );
}

function navLabelAr(key: string): string {
  const map: Record<string, string> = {
    dashboard: "الرئيسية",
    integrations: "ربط الحسابات",
    campaigns: "الحملات الإعلانية",
    analytics: "التحليلات",
    recommendations: "التوصيات",
    customers: "العملاء",
    segments: "الشرائح",
    exports: "التصدير",
    reports: "التقارير",
    branches: "الفروع",
    services: "الخدمات",
    alerts: "التنبيهات",
    users: "المستخدمون",
    settings: "الإعدادات",
    auditLog: "سجل التدقيق",
    "audit-log": "سجل التدقيق",
    import: "استيراد العملاء",
    duplicates: "العملاء المكررون",
    new: "شريحة جديدة",
  };
  return map[key] ?? key;
}

function navLabelEn(key: string): string {
  const map: Record<string, string> = {
    dashboard: "Dashboard",
    integrations: "Integrations",
    campaigns: "Campaigns",
    analytics: "Analytics",
    recommendations: "Recommendations",
    customers: "Customers",
    segments: "Segments",
    exports: "Exports",
    reports: "Reports",
    branches: "Branches",
    services: "Services",
    alerts: "Alerts",
    users: "Users",
    settings: "Settings",
    auditLog: "Audit Log",
  };
  return map[key] ?? key;
}

export { navLabelAr, navLabelEn };
