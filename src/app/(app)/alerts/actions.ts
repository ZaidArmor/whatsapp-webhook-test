"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AlertStatus, PermissionKey } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth";

async function requirePermission(permission: PermissionKey) {
  const session = await auth();
  if (!session?.user || !session.user.permissions.includes(permission)) {
    throw new Error("PERMISSION_DENIED");
  }
  return session.user;
}

const schema = z.object({ id: z.string().min(1), status: z.nativeEnum(AlertStatus) });

export async function updateAlertStatusAction(input: z.infer<typeof schema>) {
  await requirePermission(PermissionKey.VIEW_DASHBOARD);
  const { id, status } = schema.parse(input);
  await prisma.alert.update({ where: { id }, data: { status } });
  revalidatePath("/alerts");
}
