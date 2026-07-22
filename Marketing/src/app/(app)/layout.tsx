import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { getWorkspaceContext } from "@/lib/auth/workspace";
import { ROLE_PERMISSIONS } from "@/lib/auth/permissions";
import { Sidebar } from "@/components/layout/sidebar";
import { ThemeToggle, LocaleToggle, WorkspaceSwitcher, UserMenu } from "@/components/layout/header-controls";
import { TooltipProvider } from "@/components/ui/tooltip";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const ctx = await getWorkspaceContext();
  const permissions = ROLE_PERMISSIONS[ctx.role];

  return (
    <TooltipProvider>
      <div className="flex min-h-screen">
        <Sidebar permissions={permissions} />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70 print-hidden">
            <WorkspaceSwitcher
              current={{ workspaceId: ctx.workspaceId, workspaceName: ctx.workspaceName }}
              memberships={ctx.memberships}
            />
            <div className="flex-1" />
            <ThemeToggle />
            <LocaleToggle />
            <UserMenu
              name={ctx.userName}
              email={session.user.email ?? ""}
              roleLabelKey={`roles.${ctx.role}`}
            />
          </header>
          <main className="min-w-0 flex-1 bg-muted/30 p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  );
}
