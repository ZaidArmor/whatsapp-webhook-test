import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { type: "email" },
        password: { type: "password" },
      },
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email, deletedAt: null },
          include: { memberships: { include: { workspace: true } } },
        });

        if (!user || !user.isActive || !user.passwordHash) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          memberships: user.memberships.map((m) => ({
            workspaceId: m.workspaceId,
            workspaceName: m.workspace.name,
            workspaceSlug: m.workspace.slug,
            role: m.role,
          })),
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.memberships = user.memberships ?? [];
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.memberships = token.memberships;
      return session;
    },
  },
});
