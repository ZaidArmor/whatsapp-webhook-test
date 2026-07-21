import { prisma } from "@/lib/prisma";
import { BranchesManager } from "@/components/branches/branches-manager";

export default async function BranchesPage() {
  const branches = await prisma.branch.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">الفروع</h1>
        <p className="text-sm text-muted-foreground">إدارة فروع الشركة</p>
      </div>
      <BranchesManager branches={branches} />
    </div>
  );
}
