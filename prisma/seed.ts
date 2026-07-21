import { PrismaClient, PermissionKey, RoleName } from "@prisma/client";
import bcrypt from "bcryptjs";
import { ROLE_PERMISSIONS, ROLE_LABELS } from "../src/lib/auth/permissions";
import { seedServices } from "./seed/services";
import { seedCampaigns } from "./seed/campaigns";
import { seedCustomers } from "./seed/customers";

const prisma = new PrismaClient();

const PERMISSION_LABELS: Record<PermissionKey, string> = {
  VIEW_DASHBOARD: "مشاهدة لوحة التحكم",
  VIEW_ALL_BRANCHES: "مشاهدة كل الفروع",
  VIEW_SINGLE_BRANCH: "مشاهدة فرع واحد فقط",
  IMPORT_CUSTOMERS: "استيراد العملاء",
  EXPORT_CUSTOMERS: "تصدير العملاء",
  EDIT_CUSTOMERS: "تعديل العملاء",
  DELETE_CUSTOMERS: "حذف العملاء",
  MANAGE_CAMPAIGNS: "إدارة الحملات",
  MANAGE_INTEGRATIONS: "إدارة التكاملات",
  VIEW_REVENUE: "مشاهدة الإيرادات",
  VIEW_CUSTOMER_DATA: "مشاهدة بيانات العملاء",
  MANAGE_USERS: "إدارة المستخدمين",
  EDIT_ANALYSIS_SETTINGS: "تعديل إعدادات التحليل",
};

async function seedPermissions() {
  for (const key of Object.values(PermissionKey)) {
    await prisma.permission.upsert({
      where: { key },
      update: { label: PERMISSION_LABELS[key] },
      create: { key, label: PERMISSION_LABELS[key] },
    });
  }
  console.log(`✔ Permissions seeded (${Object.values(PermissionKey).length})`);
}

async function seedRolesAndAssignments() {
  for (const name of Object.values(RoleName)) {
    const role = await prisma.role.upsert({
      where: { name },
      update: { label: ROLE_LABELS[name] },
      create: { name, label: ROLE_LABELS[name] },
    });

    const permissionKeys = ROLE_PERMISSIONS[name];
    for (const key of permissionKeys) {
      const permission = await prisma.permission.findUniqueOrThrow({ where: { key } });
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
    }
  }
  console.log(`✔ Roles + role-permission assignments seeded`);
}

export async function seedBranches() {
  const branches = [
    { name: "أبها", nameEn: "Abha", city: "أبها" },
    { name: "خميس مشيط", nameEn: "Khamis Mushait", city: "خميس مشيط" },
    { name: "جازان", nameEn: "Jazan", city: "جازان" },
  ];

  const created = [];
  for (const branch of branches) {
    const existing = await prisma.branch.findFirst({ where: { name: branch.name } });
    const record =
      existing ??
      (await prisma.branch.create({
        data: branch,
      }));
    created.push(record);
  }
  console.log(`✔ Branches seeded (${created.length})`);
  return created;
}

async function seedAdminUser(branchId: string) {
  const passwordHash = await bcrypt.hash("Armor@12345", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@armor.sa" },
    update: {},
    create: {
      name: "مدير النظام",
      email: "admin@armor.sa",
      passwordHash,
      branchId,
    },
  });

  const superAdminRole = await prisma.role.findUniqueOrThrow({
    where: { name: RoleName.SUPER_ADMIN },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: admin.id, roleId: superAdminRole.id } },
    update: {},
    create: { userId: admin.id, roleId: superAdminRole.id },
  });

  console.log(`✔ Admin demo user ready: admin@armor.sa / Armor@12345`);
  return admin;
}

async function main() {
  console.log("Seeding ARMOR Marketing Intelligence Hub...");
  await seedPermissions();
  await seedRolesAndAssignments();
  const branches = await seedBranches();
  const primaryBranch = branches[0];
  if (!primaryBranch) throw new Error("Expected at least one branch to be seeded");
  await seedAdminUser(primaryBranch.id);

  const existingCampaignCount = await prisma.campaign.count();
  if (existingCampaignCount === 0) {
    const services = await seedServices(prisma);
    const campaigns = await seedCampaigns(prisma, branches, services);
    await seedCustomers(prisma, branches, services, campaigns);
  } else {
    console.log("↷ Demo campaigns/customers already present, skipping (idempotent seed).");
  }

  console.log("Seed complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
