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

const resolveSchema = z.object({
  keepId: z.string().min(1),
  discardIds: z.array(z.string().min(1)).min(1),
});

/** Merges `discardIds` into `keepId`: reassigns activity/tags/leads/bookings/sales, fills
 * blank fields on the kept record from the most complete discarded one, then soft-deletes
 * the discarded records. Runs as a single transaction so a partial merge can never happen. */
export async function mergeDuplicatesAction(input: z.infer<typeof resolveSchema>) {
  const user = await requirePermission(PermissionKey.EDIT_CUSTOMERS);
  const { keepId, discardIds } = resolveSchema.parse(input);

  await prisma.$transaction(async (tx) => {
    const kept = await tx.customer.findUniqueOrThrow({ where: { id: keepId } });
    const discarded = await tx.customer.findMany({ where: { id: { in: discardIds } } });

    for (const d of discarded) {
      await tx.customerActivity.updateMany({ where: { customerId: d.id }, data: { customerId: keepId } });
      await tx.lead.updateMany({ where: { customerId: d.id }, data: { customerId: keepId } });
      await tx.booking.updateMany({ where: { customerId: d.id }, data: { customerId: keepId } });
      await tx.sale.updateMany({ where: { customerId: d.id }, data: { customerId: keepId } });

      const tags = await tx.customerTag.findMany({ where: { customerId: d.id } });
      for (const t of tags) {
        await tx.customerTag.upsert({
          where: { customerId_tagId: { customerId: keepId, tagId: t.tagId } },
          update: {},
          create: { customerId: keepId, tagId: t.tagId },
        });
      }
      await tx.customerTag.deleteMany({ where: { customerId: d.id } });
    }

    const mostComplete = [...discarded].sort((a, b) => Number(b.potentialValue) - Number(a.potentialValue))[0];
    await tx.customer.update({
      where: { id: keepId },
      data: {
        email: kept.email ?? mostComplete?.email ?? undefined,
        city: kept.city ?? mostComplete?.city ?? undefined,
        branchId: kept.branchId ?? mostComplete?.branchId ?? undefined,
        serviceId: kept.serviceId ?? mostComplete?.serviceId ?? undefined,
        notes: kept.notes ?? mostComplete?.notes ?? undefined,
        totalPurchaseValue: discarded.reduce((sum, d) => sum + Number(d.totalPurchaseValue), Number(kept.totalPurchaseValue)),
        visitCount: discarded.reduce((sum, d) => sum + d.visitCount, kept.visitCount),
      },
    });

    await tx.customer.updateMany({
      where: { id: { in: discardIds } },
      data: { deletedAt: new Date(), isDuplicate: true, duplicateOfId: keepId },
    });

    await tx.customerActivity.create({
      data: {
        customerId: keepId,
        type: "merge",
        description: `تم دمج ${discardIds.length} سجل مكرر مع هذا العميل`,
        createdById: user.id,
      },
    });
  });

  await logAudit({
    userId: user.id,
    action: "MERGE_CUSTOMERS",
    entityType: "Customer",
    entityId: keepId,
    metadata: { discardIds },
  });

  revalidatePath("/customers/duplicates");
  revalidatePath("/customers");
}

const dismissSchema = z.object({ keepId: z.string().min(1), discardIds: z.array(z.string().min(1)).min(1) });

/** "Keep newest/oldest/most complete" — same soft-delete mechanics as merge, without
 * reassigning history (the discarded records simply get archived as duplicates). */
export async function discardDuplicatesAction(input: z.infer<typeof dismissSchema>) {
  const user = await requirePermission(PermissionKey.EDIT_CUSTOMERS);
  const { keepId, discardIds } = dismissSchema.parse(input);

  await prisma.customer.updateMany({
    where: { id: { in: discardIds } },
    data: { deletedAt: new Date(), isDuplicate: true, duplicateOfId: keepId },
  });

  await logAudit({
    userId: user.id,
    action: "MERGE_CUSTOMERS",
    entityType: "Customer",
    entityId: keepId,
    metadata: { discardIds, strategy: "keep_without_merge" },
  });

  revalidatePath("/customers/duplicates");
  revalidatePath("/customers");
}
