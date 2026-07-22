"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import type { PlatformKind } from "@prisma/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/client";
import type { DashboardFilterOptions } from "@/lib/data/dashboard";

const ALL = "__all__";

export function DashboardFilters({ options }: { options: DashboardFilterOptions }) {
  const { t } = useT();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const update = useCallback(
    (key: string, value: string | undefined) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== ALL) params.set(key, value);
      else params.delete(key);
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const days = searchParams.get("days") ?? "30";
  const platform = searchParams.get("platform") ?? ALL;
  const accountId = searchParams.get("accountId") ?? ALL;
  const campaignId = searchParams.get("campaignId") ?? ALL;
  const hasFilters = platform !== ALL || accountId !== ALL || campaignId !== ALL || days !== "30";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={days} onValueChange={(v) => update("days", v === "30" ? undefined : v)}>
        <SelectTrigger className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="7">{t("common.last7Days")}</SelectItem>
          <SelectItem value="30">{t("common.last30Days")}</SelectItem>
          <SelectItem value="90">{t("common.last90Days")}</SelectItem>
        </SelectContent>
      </Select>

      <Select value={platform} onValueChange={(v) => update("platform", v)}>
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{`${t("common.platform")}: ${t("common.all")}`}</SelectItem>
          {options.platforms.map((p) => (
            <SelectItem key={p} value={p}>
              {t(`platforms.${p}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={accountId} onValueChange={(v) => update("accountId", v)}>
        <SelectTrigger className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{`${t("common.account")}: ${t("common.all")}`}</SelectItem>
          {options.accounts.map((a) => (
            <SelectItem key={a.id} value={a.id}>
              {t(`platforms.${a.platform as PlatformKind}`)} — {a.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={campaignId} onValueChange={(v) => update("campaignId", v)}>
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{`${t("common.campaign")}: ${t("common.all")}`}</SelectItem>
          {options.campaigns.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => router.push(pathname)}>
          <X className="h-3.5 w-3.5" /> {t("common.clearFilters")}
        </Button>
      )}
    </div>
  );
}
