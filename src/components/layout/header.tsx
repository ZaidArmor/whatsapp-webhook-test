import { prisma } from "@/lib/prisma";
import { MobileSidebar } from "./mobile-sidebar";
import { CommandSearch } from "./command-search";
import { NotificationsMenu, type NotificationItem } from "./notifications-menu";
import { UserMenu } from "./user-menu";
import { ThemeToggle } from "./theme-toggle";
import { LocaleToggle } from "./locale-toggle";
import { Breadcrumbs } from "./breadcrumbs";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import type { RoleName } from "@prisma/client";

interface HeaderProps {
  user: { id: string; name: string; email: string; image?: string | null; roles: string[]; permissions: string[] };
}

async function getRecentAlerts(): Promise<NotificationItem[]> {
  try {
    const alerts = await prisma.alert.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: 6,
    });
    return alerts.map((a) => ({
      id: a.id,
      title: a.title,
      message: a.message,
      severity: a.severity,
      createdAt: a.createdAt.toISOString(),
    }));
  } catch {
    return [];
  }
}

export async function Header({ user }: HeaderProps) {
  const alerts = await getRecentAlerts();
  const primaryRole = user.roles[0] as RoleName | undefined;

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <MobileSidebar permissions={user.permissions} />
      <div className="hidden lg:block">
        <Breadcrumbs />
      </div>
      <div className="flex-1" />
      <div className="hidden md:block">
        <CommandSearch permissions={user.permissions} />
      </div>
      <NotificationsMenu items={alerts} />
      <ThemeToggle />
      <LocaleToggle />
      <UserMenu
        name={user.name}
        email={user.email}
        image={user.image}
        roleLabel={primaryRole ? ROLE_LABELS[primaryRole] : undefined}
      />
    </header>
  );
}
