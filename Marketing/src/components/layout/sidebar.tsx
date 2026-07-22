"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft, Radar } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";
import { navGroups } from "./nav-items";
import type { PermissionKey } from "@/lib/auth/permissions";

const COLLAPSE_KEY = "mktg_sidebar_collapsed";

export function Sidebar({ permissions }: { permissions: PermissionKey[] }) {
  const pathname = usePathname();
  const { t } = useT();
  const [collapsed, setCollapsed] = React.useState(false);

  React.useEffect(() => {
    // One-time restore of a browser-only preference; the sync setState is intentional.
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

  const permissionSet = new Set(permissions);

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col border-e bg-card transition-all duration-200 lg:flex",
        collapsed ? "w-[68px]" : "w-64"
      )}
    >
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Radar className="h-4 w-4" />
        </div>
        {!collapsed && <span className="truncate text-sm font-bold text-primary">{t("app.shortName")}</span>}
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-2 py-4">
        {navGroups.map((group) => {
          const visible = group.items.filter((item) => permissionSet.has(item.permission));
          if (visible.length === 0) return null;

          return (
            <div key={group.key}>
              {!collapsed && (
                <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {t(`nav.groups.${group.key}`)}
                </div>
              )}
              <div className="space-y-0.5">
                {visible.map((item) => {
                  const isActive =
                    item.href === "/posts/new"
                      ? pathname === item.href
                      : pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      title={collapsed ? t(`nav.${item.key}`) : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground/80 hover:bg-secondary hover:text-foreground",
                        collapsed && "justify-center px-0"
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="truncate">{t(`nav.${item.key}`)}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <button
        onClick={toggle}
        className="flex h-12 items-center justify-center gap-2 border-t text-sm text-muted-foreground hover:bg-secondary"
      >
        <ChevronsLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
        {!collapsed && t("common.collapse")}
      </button>
    </aside>
  );
}
