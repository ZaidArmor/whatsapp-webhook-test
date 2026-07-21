import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      roles: string[];
      permissions: string[];
      branchId: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    roles?: string[];
    permissions?: string[];
    branchId?: string | null;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    roles: string[];
    permissions: string[];
    branchId: string | null;
  }
}
