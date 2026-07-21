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
        email: { label: "البريد الإلكتروني", type: "email" },
        password: { label: "كلمة المرور", type: "password" },
      },
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email, deletedAt: null },
          include: {
            userRoles: {
              include: { role: { include: { permissions: { include: { permission: true } } } } },
            },
          },
        });

        if (!user || !user.isActive || !user.passwordHash) return null;

        const passwordMatches = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatches) return null;

        const roles = user.userRoles.map((ur) => ur.role.name);
        const permissions = Array.from(
          new Set(
            user.userRoles.flatMap((ur) => ur.role.permissions.map((rp) => rp.permission.key))
          )
        );

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          roles,
          permissions,
          branchId: user.branchId,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.roles = user.roles ?? [];
        token.permissions = user.permissions ?? [];
        token.branchId = user.branchId ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.roles = token.roles;
      session.user.permissions = token.permissions;
      session.user.branchId = token.branchId;
      return session;
    },
  },
});
