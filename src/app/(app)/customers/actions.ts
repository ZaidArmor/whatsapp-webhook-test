"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { CustomerStatus, PermissionKey } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth";
import { logAudit } from "@/lib/audit/log";
import { CUSTOMER_STATUS_LABELS } from "@/lib/constants/customer";

async function requirePermission(permission: PermissionKey) {
  const session = await auth();
  if (!session?.user || !session.user.permissions.includes(permission)) {
    throw new Error("PERMISSION_DENIED");
  }
  return session.user;
}

const statusSchema = z.object({
  customerId: z.string().min(1),
  status: z.nativeEnum(CustomerStatus),
});

export async function updateCustomerStatusAction(input: z.infer<typeof statusSchema>) {
  const user = await requirePermission(PermissionKey.EDIT_CUSTOMERS);
  const { customerId, status } = statusSchema.parse(input);

  const previous = await prisma.customer.findUniqueOrThrow({ where: { id: customerId } });

  await prisma.$transaction([
    prisma.customer.update({ where: { id: customerId }, data: { status } }),
    prisma.customerActivity.create({
      data: {
        customerId,
        type: "status_change",
        description: `تغيير الحالة من "${CUSTOMER_STATUS_LABELS[previous.status]}" إلى "${CUSTOMER_STATUS_LABELS[status]}"`,
        createdById: user.id,
      },
    }),
  ]);

  await logAudit({
    userId: user.id,
    action: "UPDATE",
    entityType: "Customer",
    entityId: customerId,
    metadata: { field: "status", from: previous.status, to: status },
  });

  revalidatePath(`/customers/${customerId}`);
  revalidatePath("/customers");
}

const noteSchema = z.object({
  customerId: z.string().min(1),
  note: z.string().min(1).max(2000),
});

export async function addCustomerNoteAction(input: z.infer<typeof noteSchema>) {
  const user = await requirePermission(PermissionKey.EDIT_CUSTOMERS);
  const { customerId, note } = noteSchema.parse(input);

  await prisma.$transaction([
    prisma.customer.update({ where: { id: customerId }, data: { notes: note } }),
    prisma.customerActivity.create({
      data: { customerId, type: "note", description: note, createdById: user.id },
    }),
  ]);

  await logAudit({ userId: user.id, action: "UPDATE", entityType: "Customer", entityId: customerId, metadata: { field: "notes" } });

  revalidatePath(`/customers/${customerId}`);
}

const tagSchema = z.object({
  customerId: z.string().min(1),
  tagName: z.string().min(1).max(50),
});

export async function addCustomerTagAction(input: z.infer<typeof tagSchema>) {
  const user = await requirePermission(PermissionKey.EDIT_CUSTOMERS);
  const { customerId, tagName } = tagSchema.parse(input);

  const tag = await prisma.tag.upsert({
    where: { name: tagName },
    update: {},
    create: { name: tagName },
  });

  await prisma.customerTag.upsert({
    where: { customerId_tagId: { customerId, tagId: tag.id } },
    update: {},
    create: { customerId, tagId: tag.id },
  });

  await logAudit({ userId: user.id, action: "UPDATE", entityType: "Customer", entityId: customerId, metadata: { field: "tags", added: tagName } });

  revalidatePath(`/customers/${customerId}`);
}

const removeTagSchema = z.object({ customerId: z.string().min(1), tagId: z.string().min(1) });

export async function removeCustomerTagAction(input: z.infer<typeof removeTagSchema>) {
  const user = await requirePermission(PermissionKey.EDIT_CUSTOMERS);
  const { customerId, tagId } = removeTagSchema.parse(input);

  await prisma.customerTag.deleteMany({ where: { customerId, tagId } });

  await logAudit({ userId: user.id, action: "UPDATE", entityType: "Customer", entityId: customerId, metadata: { field: "tags", removedTagId: tagId } });

  revalidatePath(`/customers/${customerId}`);
}

const consentSchema = z.object({ customerId: z.string().min(1), consent: z.boolean() });

export async function updateMarketingConsentAction(input: z.infer<typeof consentSchema>) {
  const user = await requirePermission(PermissionKey.EDIT_CUSTOMERS);
  const { customerId, consent } = consentSchema.parse(input);

  await prisma.customer.update({ where: { id: customerId }, data: { marketingConsent: consent } });

  await logAudit({ userId: user.id, action: "UPDATE", entityType: "Customer", entityId: customerId, metadata: { field: "marketingConsent", to: consent } });

  revalidatePath(`/customers/${customerId}`);
}

const deleteSchema = z.object({ customerId: z.string().min(1) });

export async function softDeleteCustomerAction(input: z.infer<typeof deleteSchema>) {
  const user = await requirePermission(PermissionKey.DELETE_CUSTOMERS);
  const { customerId } = deleteSchema.parse(input);

  await prisma.customer.update({ where: { id: customerId }, data: { deletedAt: new Date() } });

  await logAudit({ userId: user.id, action: "DELETE", entityType: "Customer", entityId: customerId });

  revalidatePath("/customers");
}
