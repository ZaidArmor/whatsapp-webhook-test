"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { PermissionKey } from "@prisma/client";
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

const branchSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(100),
  nameEn: z.string().max(100).nullable(),
  city: z.string().min(1).max(100),
  isActive: z.boolean(),
});

export async function saveBranchAction(input: z.infer<typeof branchSchema>) {
  const user = await requirePermission(PermissionKey.MANAGE_USERS);
  const { id, ...data } = branchSchema.parse(input);

  const branch = id
    ? await prisma.branch.update({ where: { id }, data })
    : await prisma.branch.create({ data });

  await logAudit({ userId: user.id, action: id ? "UPDATE" : "CREATE", entityType: "Branch", entityId: branch.id });
  revalidatePath("/branches");
}

const idSchema = z.object({ id: z.string().min(1) });

export async function deleteBranchAction(input: z.infer<typeof idSchema>) {
  const user = await requirePermission(PermissionKey.MANAGE_USERS);
  const { id } = idSchema.parse(input);
  await prisma.branch.update({ where: { id }, data: { deletedAt: new Date() } });
  await logAudit({ userId: user.id, action: "DELETE", entityType: "Branch", entityId: id });
  revalidatePath("/branches");
}
