"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ExportTargetFormat, PermissionKey } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth";
import { logAudit } from "@/lib/audit/log";
import { evaluateSegmentTree, getSegmentDetail } from "@/lib/data/segments";
import { buildExportRow, GENERIC_EXPORT_FIELDS, type ExportableCustomer, type GenericExportField } from "@/lib/export/formats";

async function requirePermission(permission: PermissionKey) {
  const session = await auth();
  if (!session?.user || !session.user.permissions.includes(permission)) {
    throw new Error("PERMISSION_DENIED");
  }
  return session.user;
}

const exportSchema = z.object({
  segmentId: z.string().nullable(),
  format: z.nativeEnum(ExportTargetFormat),
  fields: z.array(z.enum(GENERIC_EXPORT_FIELDS)),
  dedupeOnly: z.boolean(),
  validPhoneOnly: z.boolean(),
  maskSensitive: z.boolean(),
});

export async function prepareExportAction(input: z.infer<typeof exportSchema>) {
  const user = await requirePermission(PermissionKey.EXPORT_CUSTOMERS);
  const { segmentId, format, fields, dedupeOnly, validPhoneOnly, maskSensitive } = exportSchema.parse(input);

  let customerIds: string[] | null = null;
  if (segmentId) {
    const segment = await getSegmentDetail(segmentId);
    if (segment) {
      const matches = await evaluateSegmentTree(segment.tree);
      customerIds = matches.map((m) => m.id);
    }
  }

  const customers = await prisma.customer.findMany({
    where: {
      deletedAt: null,
      ...(customerIds ? { id: { in: customerIds } } : {}),
      ...(validPhoneOnly ? { phoneValidity: "VALID" } : {}),
    },
    include: { branch: true, service: true, tags: { include: { tag: true } } },
  });

  let rows: ExportableCustomer[] = customers.map((c) => ({
    name: c.name,
    originalPhone: c.originalPhone,
    normalizedPhone: c.normalizedPhone,
    email: c.email,
    city: c.city,
    branchName: c.branch?.name ?? null,
    serviceName: c.service?.nameAr ?? null,
    tagNames: c.tags.map((t) => t.tag.name),
    potentialValue: Number(c.potentialValue),
    totalPurchaseValue: Number(c.totalPurchaseValue),
    lastPurchaseAt: c.lastPurchaseAt,
  }));

  if (dedupeOnly) {
    const seen = new Set<string>();
    rows = rows.filter((r) => {
      const key = r.normalizedPhone ?? r.email ?? r.name;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  const exportRows = rows.map((r) => buildExportRow(r, format, fields as GenericExportField[], maskSensitive));

  const exportJob = await prisma.exportJob.create({
    data: {
      userId: user.id,
      targetFormat: format,
      segmentId: segmentId ?? undefined,
      status: "COMPLETED",
      rowCount: exportRows.length,
      options: { fields, dedupeOnly, validPhoneOnly, maskSensitive },
    },
  });

  await logAudit({
    userId: user.id,
    action: "EXPORT",
    entityType: "ExportJob",
    entityId: exportJob.id,
    metadata: { format, rowCount: exportRows.length, segmentId },
  });

  revalidatePath("/exports");

  return {
    rows: exportRows,
    rowCount: exportRows.length,
    exportJobId: exportJob.id,
  };
}

export async function getExportHistory() {
  await requirePermission(PermissionKey.EXPORT_CUSTOMERS);
  return prisma.exportJob.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { user: true, segment: true },
  });
}
