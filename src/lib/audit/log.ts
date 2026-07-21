import { prisma } from "@/lib/prisma";
import type { AuditAction } from "@prisma/client";

interface LogAuditParams {
  userId: string | null;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

/** Writes an audit trail entry. Never logs sensitive raw values (e.g. full phone numbers) in metadata. */
export async function logAudit({ userId, action, entityType, entityId, metadata }: LogAuditParams) {
  await prisma.auditLog.create({
    data: {
      userId,
      action,
      entityType,
      entityId,
      metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
    },
  });
}
