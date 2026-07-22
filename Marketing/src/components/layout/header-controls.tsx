"use client";

import * as React from "react";
import { Moon, Sun, Languages, LogOut, User, Building2, Check } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useT } from "@/lib/i18n/client";
import { signOutAction } from "@/lib/auth/actions";
import { switchWorkspaceAction } from "@/lib/auth/workspace-actions";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const { t } = useT();
  const [mounted, setMounted] = React.useState(false);

  // Standard next-themes SSR guard; the one extra render is intentional.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={isDark ? t("settings.lightMode") : t("settings.darkMode")}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

export function LocaleToggle() {
  const { t, locale, setLocale } = useT();

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={t("common.language")}
      onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
    >
      <Languages className="h-4 w-4" />
    </Button>
  );
}

export function WorkspaceSwitcher({
  current,
  memberships,
}: {
  current: { workspaceId: string; workspaceName: string };
  memberships: Array<{ workspaceId: string; workspaceName: string; role: string }>;
}) {
  const { t } = useT();
  const [pending, startTransition] = React.useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="max-w-52 gap-2" disabled={pending}>
          <Building2 className="h-4 w-4 shrink-0" />
          <span className="truncate">{current.workspaceName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>{t("team.switchWorkspace")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {memberships.map((m) => (
          <DropdownMenuItem
            key={m.workspaceId}
            onClick={() => startTransition(() => void switchWorkspaceAction({ workspaceId: m.workspaceId }))}
            className="flex items-center justify-between gap-2"
          >
            <span className="truncate">{m.workspaceName}</span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              {t(`roles.${m.role}`)}
              {m.workspaceId === current.workspaceId && <Check className="h-3.5 w-3.5 text-accent" />}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function UserMenu({ name, email, roleLabelKey }: { name: string; email: string; roleLabelKey: string }) {
  const { t } = useT();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Avatar>
          <AvatarFallback>{initials(name)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="truncate text-sm font-medium">{name}</span>
            <span className="truncate text-xs font-normal text-muted-foreground">{email}</span>
            <span className="mt-1 w-fit rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium">
              {t(roleLabelKey)}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings" className="flex items-center gap-2">
            <User className="h-4 w-4" /> {t("auth.profile")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <form action={signOutAction} className="w-full">
            <button type="submit" className="flex w-full items-center gap-2 text-destructive">
              <LogOut className="h-4 w-4" /> {t("auth.signOut")}
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
