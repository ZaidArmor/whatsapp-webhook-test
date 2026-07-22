"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/lib/auth/auth";
import { z } from "zod";
import { getT } from "@/lib/i18n/server";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export interface LoginActionState {
  error?: string;
}

export async function loginAction(_prev: LoginActionState, formData: FormData): Promise<LoginActionState> {
  const { t } = await getT();
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: t("auth.invalidInput") };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: t("auth.invalidCredentials") };
    }
    throw error;
  }
}

export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}
