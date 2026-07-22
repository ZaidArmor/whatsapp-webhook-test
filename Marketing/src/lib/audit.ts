import { prisma } from "@/lib/prisma";
import type { AuditAction } from "@prisma/client";

interface LogAuditParams {
  workspaceId: string | null;
  userId: string | null;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

/** Audit trail writer. Never put raw sensitive values (tokens, full phone numbers) in metadata. */
export async function logAudit({ workspaceId, userId, action, entityType, entityId, metadata }: LogAuditParams) {
  await prisma.auditLog.create({
    data: {
      workspaceId,
      userId,
      action,
      entityType,
      entityId,
      metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
    },
  });
}
