"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { PermissionKey } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth";
import { logAudit } from "@/lib/audit/log";
import { outcomeForRow } from "@/lib/import/types";

async function requirePermission(permission: PermissionKey) {
  const session = await auth();
  if (!session?.user || !session.user.permissions.includes(permission)) {
    throw new Error("PERMISSION_DENIED");
  }
  return session.user;
}

const dbCheckSchema = z.object({
  phones: z.array(z.string()),
  emails: z.array(z.string()),
});

export async function checkDbDuplicatesAction(input: z.infer<typeof dbCheckSchema>) {
  await requirePermission(PermissionKey.IMPORT_CUSTOMERS);
  const { phones, emails } = dbCheckSchema.parse(input);

  const existing = await prisma.customer.findMany({
    where: {
      deletedAt: null,
      OR: [
        phones.length > 0 ? { normalizedPhone: { in: phones } } : undefined,
        emails.length > 0 ? { email: { in: emails } } : undefined,
      ].filter((clause): clause is NonNullable<typeof clause> => Boolean(clause)),
    },
    select: { normalizedPhone: true, email: true },
  });

  return {
    phones: existing.map((c) => c.normalizedPhone).filter((p): p is string => Boolean(p)),
    emails: existing.map((c) => c.email).filter((e): e is string => Boolean(e)),
  };
}

const cleanedRowSchema = z.object({
  rowNumber: z.number(),
  raw: z.record(z.string(), z.string()),
  name: z.string(),
  originalPhone: z.string(),
  normalizedPhone: z.string().nullable(),
  phoneValidity: z.enum(["VALID", "INVALID", "UNKNOWN"]),
  email: z.string().nullable(),
  city: z.string().nullable(),
  branchId: z.string().nullable(),
  serviceId: z.string().nullable(),
  campaignId: z.string().nullable(),
  source: z.string().nullable(),
  notes: z.string().nullable(),
  errors: z.array(z.string()),
  isDuplicateInFile: z.boolean(),
  isDuplicateInDb: z.boolean(),
});

const commitSchema = z.object({
  fileName: z.string(),
  fileType: z.enum(["CSV", "XLSX", "XLS"]),
  columnMapping: z.record(z.string(), z.string().nullable()),
  rows: z.array(cleanedRowSchema),
  skipDuplicates: z.boolean().default(true),
});

const LEAD_SOURCE_VALUES = new Set([
  "FACEBOOK",
  "INSTAGRAM",
  "TIKTOK",
  "SNAPCHAT",
  "GOOGLE",
  "WHATSAPP",
  "WEBSITE",
  "WALK_IN",
  "REFERRAL",
  "CALL_CENTER",
  "OTHER",
]);

export async function commitImportAction(input: z.infer<typeof commitSchema>) {
  const user = await requirePermission(PermissionKey.IMPORT_CUSTOMERS);
  const { fileName, fileType, columnMapping, rows, skipDuplicates } = commitSchema.parse(input);

  const importJob = await prisma.importJob.create({
    data: {
      fileName,
      fileType,
      userId: user.id,
      status: "PROCESSING",
      columnMapping,
      totalRows: rows.length,
    },
  });

  let accepted = 0;
  let rejected = 0;
  let duplicates = 0;
  const rejectedDetails: Array<{ rowNumber: number; name: string; phone: string; reason: string }> = [];

  for (const row of rows) {
    const outcome = outcomeForRow(row);
    const isDuplicateOutcome = outcome === "DUPLICATE";
    const finalOutcome = isDuplicateOutcome && !skipDuplicates ? "ACCEPTED" : outcome;

    const errorReason =
      finalOutcome === "REJECTED"
        ? row.errors.join("، ")
        : finalOutcome === "DUPLICATE"
          ? "رقم جوال أو بريد إلكتروني مكرر"
          : null;

    const importRow = await prisma.importRow.create({
      data: {
        importJobId: importJob.id,
        rowNumber: row.rowNumber,
        rawData: row.raw,
        status: finalOutcome,
        errorReason,
      },
    });

    if (finalOutcome === "ACCEPTED") {
      accepted += 1;
      const source = row.source && LEAD_SOURCE_VALUES.has(row.source.toUpperCase()) ? (row.source.toUpperCase() as never) : null;

      const customer = await prisma.customer.create({
        data: {
          name: row.name,
          originalPhone: row.originalPhone,
          normalizedPhone: row.normalizedPhone,
          phoneValidity: row.phoneValidity,
          email: row.email,
          city: row.city,
          branchId: row.branchId,
          serviceId: row.serviceId,
          campaignId: row.campaignId,
          source,
          notes: row.notes,
          status: "NEW",
          firstContactAt: new Date(),
          importRowId: importRow.id,
        },
      });

      await prisma.customerActivity.create({
        data: {
          customerId: customer.id,
          type: "import",
          description: `تم استيراد العميل من الملف: ${fileName}`,
          createdById: user.id,
        },
      });
    } else if (finalOutcome === "REJECTED") {
      rejected += 1;
      rejectedDetails.push({ rowNumber: row.rowNumber, name: row.name, phone: row.originalPhone, reason: errorReason ?? "" });
    } else {
      duplicates += 1;
      rejectedDetails.push({ rowNumber: row.rowNumber, name: row.name, phone: row.originalPhone, reason: errorReason ?? "" });
    }
  }

  await prisma.importJob.update({
    where: { id: importJob.id },
    data: {
      status: rejected > 0 || duplicates > 0 ? "COMPLETED_WITH_ERRORS" : "COMPLETED",
      acceptedRows: accepted,
      rejectedRows: rejected,
      duplicateRows: duplicates,
    },
  });

  await logAudit({
    userId: user.id,
    action: "IMPORT",
    entityType: "ImportJob",
    entityId: importJob.id,
    metadata: { fileName, totalRows: rows.length, accepted, rejected, duplicates },
  });

  revalidatePath("/customers");
  revalidatePath("/customers/import");

  return {
    importJobId: importJob.id,
    totalRows: rows.length,
    acceptedRows: accepted,
    rejectedRows: rejected,
    duplicateRows: duplicates,
    rejectedDetails,
  };
}
