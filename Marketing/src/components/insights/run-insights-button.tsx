"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import { runInsightsAction } from "@/app/(app)/insights/actions";

export function RunInsightsButton() {
  const { t } = useT();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  return (
    <div className="flex items-center gap-3">
      {message ? (
        <span className={cn("text-xs font-medium", message.ok ? "text-success" : "text-destructive")}>{message.text}</span>
      ) : null}
      <Button
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const result = await runInsightsAction();
            if (result.ok) {
              setMessage({
                text: t("insights.runDone", { count: String(result.created ?? 0), campaigns: String(result.scanned ?? 0) }),
                ok: true,
              });
            } else {
              setMessage({ text: t(result.errorKey ?? "common.error"), ok: false });
            }
            router.refresh();
          })
        }
      >
        <Sparkles className={cn("h-4 w-4", isPending && "animate-pulse")} />
        {t("insights.run")}
      </Button>
    </div>
  );
}
