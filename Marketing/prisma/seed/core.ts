import { PrismaClient, WorkspaceRole } from "@prisma/client";
import bcrypt from "bcryptjs";

export const DEMO_PASSWORD = "Marketing@123";

const USERS = [
  { email: "admin@marketing.sa", name: "مدير النظام", roleByWorkspace: WorkspaceRole.OWNER },
  { email: "manager@marketing.sa", name: "سارة المدير", roleByWorkspace: WorkspaceRole.MANAGER },
  { email: "editor@marketing.sa", name: "خالد المحرر", roleByWorkspace: WorkspaceRole.EDITOR },
  { email: "analyst@marketing.sa", name: "نورة المحللة", roleByWorkspace: WorkspaceRole.ANALYST },
  { email: "client@marketing.sa", name: "عميل مشاهد", roleByWorkspace: WorkspaceRole.VIEWER },
] as const;

const WORKSPACES = [
  { name: "أرمور لحماية السيارات", slug: "armor-cars", brandColor: "#131A3A" },
  { name: "مطاعم الذواقة", slug: "gourmet-restaurants", brandColor: "#7C3AED" },
] as const;

export async function seedCore(prisma: PrismaClient) {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const workspaces = [];
  for (const w of WORKSPACES) {
    const workspace = await prisma.workspace.upsert({
      where: { slug: w.slug },
      update: { name: w.name, brandColor: w.brandColor },
      create: w,
    });
    workspaces.push(workspace);
  }
  console.log(`✔ Workspaces (${workspaces.length})`);

  const users = [];
  for (const u of USERS) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name },
      create: { email: u.email, name: u.name, passwordHash },
    });
    users.push({ record: user, role: u.roleByWorkspace });

    for (const workspace of workspaces) {
      await prisma.workspaceMember.upsert({
        where: { workspaceId_userId: { workspaceId: workspace.id, userId: user.id } },
        update: { role: u.roleByWorkspace },
        create: { workspaceId: workspace.id, userId: user.id, role: u.roleByWorkspace },
      });
    }
  }
  console.log(`✔ Users + memberships (${users.length} users × ${workspaces.length} workspaces)`);
  console.log(`✔ Demo login: admin@marketing.sa / ${DEMO_PASSWORD}`);

  return { workspaces, users: users.map((u) => u.record) };
}
