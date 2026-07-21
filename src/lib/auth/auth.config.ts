import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe base config (no Node-only providers/bcrypt) so it can run inside
 * middleware. The full config with the Credentials provider lives in auth.ts
 * and extends this one for the actual route handlers / server-side auth().
 */
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = Boolean(auth?.user);
      const isOnLogin = request.nextUrl.pathname.startsWith("/login");

      if (isOnLogin) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/dashboard", request.nextUrl));
        }
        return true;
      }

      return isLoggedIn;
    },
  },
  session: { strategy: "jwt" },
} satisfies NextAuthConfig;
