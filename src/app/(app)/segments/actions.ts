"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { PermissionKey } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth";
import { logAudit } from "@/lib/audit/log";
import { evaluateSegmentTree } from "@/lib/data/segments";
import type { SegmentTreeInput } from "@/lib/segments/types";

async function requirePermission(permission: PermissionKey) {
  const session = await auth();
  if (!session?.user || !session.user.permissions.includes(permission)) {
    throw new Error("PERMISSION_DENIED");
  }
  return session.user;
}

const conditionSchema = z.object({
  id: z.string(),
  field: z.string(),
  operator: z.string(),
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string()), z.null()]),
});

const groupSchema = z.object({
  id: z.string(),
  logicalOperator: z.enum(["AND", "OR"]),
  conditions: z.array(conditionSchema),
});

const treeSchema = z.object({
  topLogicalOperator: z.enum(["AND", "OR"]),
  groups: z.array(groupSchema),
});

export async function previewSegmentAction(tree: SegmentTreeInput) {
  await requirePermission(PermissionKey.VIEW_CUSTOMER_DATA);
  const parsed = treeSchema.parse(tree);
  const matches = await evaluateSegmentTree(parsed as SegmentTreeInput);
  return {
    count: matches.length,
    preview: matches.slice(0, 20).map((c) => ({ id: c.id, name: c.name, city: c.city, status: c.status })),
  };
}

const saveSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(120),
  description: z.string().max(500).nullable(),
  tree: treeSchema,
});

export async function saveSegmentAction(input: z.infer<typeof saveSchema>) {
  const user = await requirePermission(PermissionKey.VIEW_CUSTOMER_DATA);
  const { id, name, description, tree } = saveSchema.parse(input);

  const matches = await evaluateSegmentTree(tree as SegmentTreeInput);

  const segment = await prisma.$transaction(async (tx) => {
    const record = id
      ? await tx.segment.update({
          where: { id },
          data: { name, description, customerCountCache: matches.length },
        })
      : await tx.segment.create({
          data: { name, description, userId: user.id, customerCountCache: matches.length },
        });

    if (id) {
      await tx.segmentCondition.deleteMany({ where: { segmentId: id } });
    }

    const root = await tx.segmentCondition.create({
      data: { segmentId: record.id, logicalOperator: tree.topLogicalOperator },
    });

    for (const group of tree.groups) {
      const groupRow = await tx.segmentCondition.create({
        data: { segmentId: record.id, parentId: root.id, logicalOperator: group.logicalOperator },
      });
      for (const condition of group.conditions) {
        await tx.segmentCondition.create({
          data: {
            segmentId: record.id,
            parentId: groupRow.id,
            logicalOperator: "AND",
            field: condition.field as never,
            operator: condition.operator as never,
            value: condition.value ?? undefined,
          },
        });
      }
    }

    return record;
  });

  await logAudit({
    userId: user.id,
    action: id ? "UPDATE" : "CREATE",
    entityType: "Segment",
    entityId: segment.id,
    metadata: { name, customerCount: matches.length },
  });

  revalidatePath("/segments");
  redirect(`/segments/${segment.id}`);
}

const idSchema = z.object({ id: z.string().min(1) });

export async function archiveSegmentAction(input: z.infer<typeof idSchema>) {
  const user = await requirePermission(PermissionKey.VIEW_CUSTOMER_DATA);
  const { id } = idSchema.parse(input);

  const segment = await prisma.segment.update({ where: { id }, data: { isArchived: true } });
  await logAudit({ userId: user.id, action: "UPDATE", entityType: "Segment", entityId: id, metadata: { archived: true } });

  revalidatePath("/segments");
  return segment;
}

export async function unarchiveSegmentAction(input: z.infer<typeof idSchema>) {
  await requirePermission(PermissionKey.VIEW_CUSTOMER_DATA);
  const { id } = idSchema.parse(input);
  await prisma.segment.update({ where: { id }, data: { isArchived: false } });
  revalidatePath("/segments");
}

export async function copySegmentAction(input: z.infer<typeof idSchema>) {
  const user = await requirePermission(PermissionKey.VIEW_CUSTOMER_DATA);
  const { id } = idSchema.parse(input);

  const original = await prisma.segment.findUniqueOrThrow({
    where: { id },
    include: { conditions: { orderBy: { createdAt: "asc" } } },
  });

  const copy = await prisma.$transaction(async (tx) => {
    const record = await tx.segment.create({
      data: {
        name: `${original.name} (نسخة)`,
        description: original.description,
        userId: user.id,
        customerCountCache: original.customerCountCache,
      },
    });

    const idMap = new Map<string, string>();
    // Fetched in createdAt order, which — since saveSegmentAction always creates the
    // root, then groups, then leaves — guarantees each node's parent already has a
    // mapped id by the time we get to it.
    for (const node of original.conditions) {
      const newParentId = node.parentId ? idMap.get(node.parentId) : null;
      const newNode = await tx.segmentCondition.create({
        data: {
          segmentId: record.id,
          parentId: newParentId,
          logicalOperator: node.logicalOperator,
          field: node.field ?? undefined,
          operator: node.operator ?? undefined,
          value: node.value ?? undefined,
        },
      });
      idMap.set(node.id, newNode.id);
    }

    return record;
  });

  revalidatePath("/segments");
  redirect(`/segments/${copy.id}`);
}

export async function deleteSegmentAction(input: z.infer<typeof idSchema>) {
  const user = await requirePermission(PermissionKey.VIEW_CUSTOMER_DATA);
  const { id } = idSchema.parse(input);

  await prisma.segment.delete({ where: { id } });
  await logAudit({ userId: user.id, action: "DELETE", entityType: "Segment", entityId: id });

  revalidatePath("/segments");
}
