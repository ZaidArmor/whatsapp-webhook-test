"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/workspace";
import { getAdapter } from "@/lib/integrations/registry";
import { logAudit } from "@/lib/audit";

export interface PostActionState {
  ok: boolean;
  errorKey?: string;
}

const composeSchema = z.object({
  title: z.string().max(200).optional(),
  body: z.string().min(1),
  accountIds: z.array(z.string().min(1)).min(1),
  mediaIds: z.array(z.string().min(1)).max(4),
  mode: z.enum(["draft", "approval", "schedule", "publish"]),
  scheduledAt: z.string().datetime().optional(),
});

export type ComposeInput = z.infer<typeof composeSchema>;

export async function composePostAction(input: ComposeInput): Promise<PostActionState> {
  let ctx;
  try {
    ctx = await requirePermission("create_posts");
  } catch {
    return { ok: false, errorKey: "common.permissionDenied" };
  }

  const parsed = composeSchema.safeParse(input);
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors;
    if (flat.body) return { ok: false, errorKey: "posts.bodyRequired" };
    if (flat.accountIds) return { ok: false, errorKey: "posts.accountsRequired" };
    return { ok: false, errorKey: "common.error" };
  }
  const data = parsed.data;

  if ((data.mode === "publish" || data.mode === "schedule") && !ctx.can("publish_posts")) {
    return { ok: false, errorKey: "common.permissionDenied" };
  }
  if (data.mode === "schedule" && !data.scheduledAt) return { ok: false, errorKey: "common.error" };

  // Targets must belong to this workspace and be connected.
  const accounts = await prisma.socialAccount.findMany({
    where: { id: { in: data.accountIds }, workspaceId: ctx.workspaceId, status: "CONNECTED" },
  });
  if (accounts.length === 0) return { ok: false, errorKey: "posts.accountsRequired" };

  const status =
    data.mode === "draft" ? "DRAFT" : data.mode === "approval" ? "PENDING_APPROVAL" : data.mode === "schedule" ? "SCHEDULED" : "PUBLISHED";
  const scheduledAt = data.mode === "schedule" ? new Date(data.scheduledAt!) : data.mode === "publish" ? new Date() : null;

  const post = await prisma.post.create({
    data: {
      workspaceId: ctx.workspaceId,
      authorId: ctx.userId,
      title: data.title || null,
      body: data.body,
      status,
      scheduledAt,
      publishedAt: null,
      approvedById: data.mode === "schedule" || data.mode === "publish" ? ctx.userId : null,
      media: { create: data.mediaIds.map((mediaAssetId, i) => ({ mediaAssetId, sortOrder: i })) },
      targets: {
        create: accounts.map((account) => ({ socialAccountId: account.id, status })),
      },
    },
    include: { targets: true, media: { include: { mediaAsset: true } } },
  });

  if (data.mode === "publish") {
    const mediaUrls = post.media.map((m) => m.mediaAsset.url);
    for (const target of post.targets) {
      const account = accounts.find((a) => a.id === target.socialAccountId)!;
      await getAdapter(account.platform).publishPost({
        postId: post.id,
        targetId: target.id,
        body: post.body,
        mediaUrls,
      });
    }
    await prisma.post.update({ where: { id: post.id }, data: { publishedAt: new Date() } });
  } else if (data.mode === "schedule") {
    const mediaUrls = post.media.map((m) => m.mediaAsset.url);
    for (const target of post.targets) {
      const account = accounts.find((a) => a.id === target.socialAccountId)!;
      await getAdapter(account.platform).schedulePost({
        postId: post.id,
        targetId: target.id,
        body: post.body,
        mediaUrls,
        scheduledAt: scheduledAt!,
      });
    }
  }

  await logAudit({
    workspaceId: ctx.workspaceId,
    userId: ctx.userId,
    action: data.mode === "publish" ? "PUBLISH" : data.mode === "schedule" ? "SCHEDULE" : "CREATE",
    entityType: "Post",
    entityId: post.id,
    metadata: { mode: data.mode, targets: accounts.map((a) => a.platform) },
  });

  revalidatePath("/posts");
  revalidatePath("/calendar");
  redirect("/posts");
}

const reviewSchema = z.object({
  postId: z.string().min(1),
  decision: z.enum(["approve", "reject"]),
  note: z.string().max(500).optional(),
});

export async function reviewPostAction(input: z.infer<typeof reviewSchema>): Promise<PostActionState> {
  let ctx;
  try {
    ctx = await requirePermission("approve_posts");
  } catch {
    return { ok: false, errorKey: "common.permissionDenied" };
  }

  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errorKey: "common.error" };
  const { postId, decision, note } = parsed.data;

  const post = await prisma.post.findFirst({
    where: { id: postId, workspaceId: ctx.workspaceId, deletedAt: null, status: "PENDING_APPROVAL" },
  });
  if (!post) return { ok: false, errorKey: "common.error" };

  // Approved posts with a schedule move straight to the queue; otherwise they
  // wait as APPROVED for the author to schedule/publish.
  const nextStatus = decision === "reject" ? "REJECTED" : post.scheduledAt ? "SCHEDULED" : "APPROVED";

  await prisma.$transaction([
    prisma.post.update({
      where: { id: post.id },
      data: { status: nextStatus, approvedById: ctx.userId, approvalNote: note || null },
    }),
    prisma.postTarget.updateMany({ where: { postId: post.id }, data: { status: nextStatus } }),
  ]);

  await logAudit({
    workspaceId: ctx.workspaceId,
    userId: ctx.userId,
    action: decision === "approve" ? "APPROVE" : "REJECT",
    entityType: "Post",
    entityId: post.id,
    metadata: { nextStatus },
  });

  revalidatePath("/posts");
  revalidatePath("/calendar");
  return { ok: true };
}

export async function publishPostNowAction(postId: string): Promise<PostActionState> {
  let ctx;
  try {
    ctx = await requirePermission("publish_posts");
  } catch {
    return { ok: false, errorKey: "common.permissionDenied" };
  }

  const post = await prisma.post.findFirst({
    where: {
      id: postId,
      workspaceId: ctx.workspaceId,
      deletedAt: null,
      status: { in: ["APPROVED", "SCHEDULED", "DRAFT"] },
    },
    include: { targets: { include: { socialAccount: true } }, media: { include: { mediaAsset: true } } },
  });
  if (!post) return { ok: false, errorKey: "common.error" };

  const mediaUrls = post.media.map((m) => m.mediaAsset.url);
  for (const target of post.targets) {
    await getAdapter(target.socialAccount.platform).publishPost({
      postId: post.id,
      targetId: target.id,
      body: target.bodyOverride ?? post.body,
      mediaUrls,
    });
  }
  await prisma.post.update({ where: { id: post.id }, data: { status: "PUBLISHED", publishedAt: new Date() } });

  await logAudit({
    workspaceId: ctx.workspaceId,
    userId: ctx.userId,
    action: "PUBLISH",
    entityType: "Post",
    entityId: post.id,
  });

  revalidatePath("/posts");
  revalidatePath("/calendar");
  return { ok: true };
}

export async function deletePostAction(postId: string): Promise<PostActionState> {
  let ctx;
  try {
    ctx = await requirePermission("create_posts");
  } catch {
    return { ok: false, errorKey: "common.permissionDenied" };
  }

  const post = await prisma.post.findFirst({ where: { id: postId, workspaceId: ctx.workspaceId, deletedAt: null } });
  if (!post) return { ok: false, errorKey: "common.error" };

  await prisma.post.update({ where: { id: post.id }, data: { deletedAt: new Date() } });
  await logAudit({ workspaceId: ctx.workspaceId, userId: ctx.userId, action: "DELETE", entityType: "Post", entityId: post.id });

  revalidatePath("/posts");
  revalidatePath("/calendar");
  return { ok: true };
}
