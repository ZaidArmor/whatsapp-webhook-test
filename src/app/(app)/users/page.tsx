import { prisma } from "@/lib/prisma";
import { UsersManager } from "@/components/users/users-manager";

export default async function UsersPage() {
  const [users, branches] = await Promise.all([
    prisma.user.findMany({
      where: { deletedAt: null },
      include: { branch: true, userRoles: { include: { role: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.branch.findMany({ where: { deletedAt: null } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">المستخدمون</h1>
        <p className="text-sm text-muted-foreground">إدارة المستخدمين وأدوارهم وصلاحياتهم</p>
      </div>
      <UsersManager
        users={users.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          isActive: u.isActive,
          branchId: u.branchId,
          branchName: u.branch?.name ?? null,
          roles: u.userRoles.map((ur) => ur.role.name),
        }))}
        branches={branches.map((b) => ({ value: b.id, label: b.name }))}
      />
    </div>
  );
}
