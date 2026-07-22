import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { TooltipProvider } from "@/components/ui/tooltip";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <TooltipProvider>
      <div className="flex min-h-screen">
        <Sidebar permissions={session.user.permissions} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header
            user={{
              id: session.user.id,
              name: session.user.name ?? "",
              email: session.user.email ?? "",
              image: session.user.image,
              roles: session.user.roles,
              permissions: session.user.permissions,
            }}
          />
          <main className="min-w-0 flex-1 bg-muted/30 p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  );
}
