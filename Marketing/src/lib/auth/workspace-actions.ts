"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getWorkspaceContext, WORKSPACE_COOKIE } from "./workspace";

const schema = z.object({ workspaceId: z.string().min(1) });

export async function switchWorkspaceAction(input: z.infer<typeof schema>) {
  const ctx = await getWorkspaceContext();
  const { workspaceId } = schema.parse(input);
  // Only allow switching to a workspace the user actually belongs to.
  if (!ctx.memberships.some((m) => m.workspaceId === workspaceId)) {
    throw new Error("PERMISSION_DENIED");
  }
  const store = await cookies();
  store.set(WORKSPACE_COOKIE, workspaceId, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  revalidatePath("/", "layout");
}
