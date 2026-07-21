"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { PermissionKey, ServiceCategory } from "@prisma/client";
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

const serviceSchema = z.object({
  id: z.string().optional(),
  nameAr: z.string().min(1).max(150),
  nameEn: z.string().min(1).max(150),
  category: z.nativeEnum(ServiceCategory),
  isActive: z.boolean(),
  expectedSaleValue: z.number().min(0),
  targetCpl: z.number().min(0),
  targetRoas: z.number().min(0),
});

export async function saveServiceAction(input: z.infer<typeof serviceSchema>) {
  const user = await requirePermission(PermissionKey.MANAGE_USERS);
  const { id, ...data } = serviceSchema.parse(input);

  const service = id
    ? await prisma.service.update({ where: { id }, data })
    : await prisma.service.create({ data });

  await logAudit({ userId: user.id, action: id ? "UPDATE" : "CREATE", entityType: "Service", entityId: service.id });
  revalidatePath("/services");
}

const idSchema = z.object({ id: z.string().min(1) });

export async function deleteServiceAction(input: z.infer<typeof idSchema>) {
  const user = await requirePermission(PermissionKey.MANAGE_USERS);
  const { id } = idSchema.parse(input);
  await prisma.service.update({ where: { id }, data: { deletedAt: new Date() } });
  await logAudit({ userId: user.id, action: "DELETE", entityType: "Service", entityId: id });
  revalidatePath("/services");
}
