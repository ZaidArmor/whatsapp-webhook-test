import type { DefaultSession } from "next-auth";

interface SessionMembership {
  workspaceId: string;
  workspaceName: string;
  workspaceSlug: string;
  role: string;
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      memberships: SessionMembership[];
    } & DefaultSession["user"];
  }

  interface User {
    memberships?: SessionMembership[];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    memberships: SessionMembership[];
  }
}
