"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import { updateProfileAction, setNotificationPrefAction } from "@/app/(app)/settings/actions";

export function ProfileForm({ initialName }: { initialName: string }) {
  const { t } = useT();
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="min-w-56 space-y-1.5">
        <Label htmlFor="profile-name">{t("settings.displayName")}</Label>
        <Input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
      </div>
      <Button
        disabled={isPending || name.trim().length < 2 || name === initialName}
        onClick={() =>
          startTransition(async () => {
            const result = await updateProfileAction({ name });
            if (result.ok) setSaved(true);
            router.refresh();
          })
        }
      >
        <Save className="h-4 w-4" />
        {t("common.save")}
      </Button>
      {saved ? <span className="pb-2 text-xs font-medium text-success">{t("common.savedSuccessfully")}</span> : null}
    </div>
  );
}

export function ThemeSetting() {
  const { t } = useT();
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-sm">
        {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        {isDark ? t("settings.darkMode") : t("settings.lightMode")}
      </span>
      <Switch checked={isDark} onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")} />
    </div>
  );
}

export function NotificationSwitch({
  prefKey,
  labelKey,
  initial,
}: {
  prefKey: "approvals" | "inbox" | "alerts";
  labelKey: string;
  initial: boolean;
}) {
  const { t } = useT();
  const [checked, setChecked] = useState(initial);
  const [isPending, startTransition] = useTransition();

  return (
    <div className={cn("flex items-center justify-between", isPending && "opacity-70")}>
      <span className="text-sm">{t(labelKey)}</span>
      <Switch
        checked={checked}
        disabled={isPending}
        onCheckedChange={(next) => {
          setChecked(next);
          startTransition(async () => {
            await setNotificationPrefAction({ key: prefKey, enabled: next });
          });
        }}
      />
    </div>
  );
}
