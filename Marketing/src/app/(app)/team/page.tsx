import { Building2, Check } from "lucide-react";
import { getT } from "@/lib/i18n/server";
import { requirePermission } from "@/lib/auth/workspace";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NewWorkspaceDialog, AddMemberForm, RemoveMemberButton } from "@/components/team/team-forms";
import { cn } from "@/lib/utils";

export default async function TeamPage() {
  const { t } = await getT();
  const ctx = await requirePermission("manage_team");

  const [workspaces, members] = await Promise.all([
    prisma.workspace.findMany({
      where: { members: { some: { userId: ctx.userId } } },
      include: { _count: { select: { members: true, socialAccounts: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.workspaceMember.findMany({
      where: { workspaceId: ctx.workspaceId },
      include: { user: { select: { id: true, name: true, email: true, isActive: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t("team.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("team.subtitle")}</p>
        </div>
        <NewWorkspaceDialog />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[320px_1fr]">
        <Card className="h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4 text-accent" />
              {t("team.workspaces")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {workspaces.map((workspace) => {
              const isCurrent = workspace.id === ctx.workspaceId;
              return (
                <div
                  key={workspace.id}
                  className={cn("rounded-lg border p-3", isCurrent && "border-primary bg-primary/5")}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{workspace.name}</span>
                    {isCurrent ? (
                      <Badge variant="success" className="gap-1 text-[10px]">
                        <Check className="h-3 w-3" />
                        {t("team.currentWorkspace")}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="mt-1 text-xs tabular-nums text-muted-foreground">
                    {t("team.members")}: {workspace._count.members} · {t("connections.title")}: {workspace._count.socialAccounts}
                  </div>
                </div>
              );
            })}
            <p className="pt-1 text-xs text-muted-foreground">{t("team.switchWorkspace")}: ↑</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{t("team.members")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <AddMemberForm />

            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="px-3 py-2 text-start font-medium">{t("common.name")}</th>
                    <th className="px-3 py-2 text-start font-medium">{t("crm.email")}</th>
                    <th className="px-3 py-2 text-start font-medium">{t("team.role")}</th>
                    <th className="px-3 py-2 text-start font-medium">{t("common.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.id} className="border-b last:border-b-0">
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="text-xs">{member.user.name.slice(0, 2)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{member.user.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground" dir="ltr">
                        {member.user.email}
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge variant={member.role === "OWNER" ? "default" : "secondary"}>{t(`roles.${member.role}`)}</Badge>
                      </td>
                      <td className="px-3 py-2.5">
                        {member.role !== "OWNER" && member.user.id !== ctx.userId ? (
                          <RemoveMemberButton userId={member.user.id} />
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
