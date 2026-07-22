import { Radar, CalendarDays, Inbox, TrendingUp } from "lucide-react";
import { getT } from "@/lib/i18n/server";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const { t } = await getT();

  const highlights = [
    { icon: CalendarDays, text: t("auth.highlight1") },
    { icon: Inbox, text: t("auth.highlight2") },
    { icon: TrendingUp, text: t("auth.highlight3") },
  ];

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-brand p-12 text-white lg:flex">
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              "radial-gradient(circle at 25% 25%, #0FB5A6 1.5px, transparent 1.5px), radial-gradient(circle at 75% 65%, white 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0FB5A6] text-white">
            <Radar className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl font-bold">{t("app.shortName")}</div>
            <div className="text-xs text-white/70">{t("app.tagline")}</div>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <h1 className="text-3xl font-bold leading-snug">{t("app.name")}</h1>
          <ul className="space-y-4">
            {highlights.map((item) => (
              <li key={item.text} className="flex items-center gap-3 text-white/90">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <item.icon className="h-4 w-4" />
                </span>
                <span className="text-sm">{item.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 text-xs text-white/50">© {new Date().getFullYear()}</div>
      </div>

      <div className="flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2 text-center lg:text-start">
            <div className="mb-4 text-2xl font-bold text-primary lg:hidden">{t("app.shortName")}</div>
            <h2 className="text-xl font-semibold">{t("auth.signInTitle")}</h2>
            <p className="text-sm text-muted-foreground">{t("auth.signInSubtitle")}</p>
          </div>

          <LoginForm />

          <p className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground" dir="auto">
            {t("auth.demoAccount", { email: "admin@marketing.sa", password: "Marketing@123" })}
          </p>
        </div>
      </div>
    </div>
  );
}
