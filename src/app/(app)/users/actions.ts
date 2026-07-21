"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { PermissionKey, RoleName } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth";
import { logAudit } from "@/lib/audit/log";

async function requirePermission(permission: PermissionKey) {
  const session = await auth();
  if (!session?.user || !session.user.permissions.includes(permission)) {
    throw new Error("PERMISSION_DENIED");
  }
  return session.user;
}

const saveUserSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(150),
  email: z.string().email(),
  password: z.string().min(6).optional().or(z.literal("")),
  branchId: z.string().nullable(),
  isActive: z.boolean(),
  roles: z.array(z.nativeEnum(RoleName)).min(1),
});

export async function saveUserAction(input: z.infer<typeof saveUserSchema>) {
  const currentUser = await requirePermission(PermissionKey.MANAGE_USERS);
  const { id, name, email, password, branchId, isActive, roles } = saveUserSchema.parse(input);

  const passwordHash = password ? await bcrypt.hash(password, 10) : undefined;

  const user = await prisma.$transaction(async (tx) => {
    const record = id
      ? await tx.user.update({
          where: { id },
          data: { name, email, branchId, isActive, ...(passwordHash ? { passwordHash } : {}) },
        })
      : await tx.user.create({
          data: { name, email, branchId, isActive, passwordHash: passwordHash ?? (await bcrypt.hash("Armor@12345", 10)) },
        });

    await tx.userRole.deleteMany({ where: { userId: record.id } });
    const roleRecords = await tx.role.findMany({ where: { name: { in: roles } } });
    await tx.userRole.createMany({
      data: roleRecords.map((r) => ({ userId: record.id, roleId: r.id })),
    });

    return record;
  });

  await logAudit({ userId: currentUser.id, action: id ? "UPDATE" : "CREATE", entityType: "User", entityId: user.id });
  revalidatePath("/users");
}

const idSchema = z.object({ id: z.string().min(1) });

export async function deactivateUserAction(input: z.infer<typeof idSchema>) {
  const currentUser = await requirePermission(PermissionKey.MANAGE_USERS);
  const { id } = idSchema.parse(input);
  await prisma.user.update({ where: { id }, data: { isActive: false } });
  await logAudit({ userId: currentUser.id, action: "UPDATE", entityType: "User", entityId: id, metadata: { deactivated: true } });
  revalidatePath("/users");
}

export async function activateUserAction(input: z.infer<typeof idSchema>) {
  const currentUser = await requirePermission(PermissionKey.MANAGE_USERS);
  const { id } = idSchema.parse(input);
  await prisma.user.update({ where: { id }, data: { isActive: true } });
  await logAudit({ userId: currentUser.id, action: "UPDATE", entityType: "User", entityId: id, metadata: { activated: true } });
  revalidatePath("/users");
}
