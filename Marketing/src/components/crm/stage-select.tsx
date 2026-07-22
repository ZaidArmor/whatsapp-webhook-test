"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { PipelineStage } from "@prisma/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import { setContactStageAction } from "@/app/(app)/crm/actions";

export const STAGE_COLORS: Record<PipelineStage, string> = {
  NEW: "text-sky-600 dark:text-sky-400",
  CONTACTED: "text-indigo-600 dark:text-indigo-400",
  QUALIFIED: "text-violet-600 dark:text-violet-400",
  PROPOSAL: "text-amber-600 dark:text-amber-400",
  WON: "text-success",
  LOST: "text-destructive",
};

export function StageSelect({ contactId, stage }: { contactId: string; stage: PipelineStage }) {
  const { t } = useT();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Select
      value={stage}
      disabled={isPending}
      onValueChange={(value) =>
        startTransition(async () => {
          await setContactStageAction({ contactId, stage: value as PipelineStage });
          router.refresh();
        })
      }
    >
      <SelectTrigger className={cn("h-8 w-36 text-xs font-medium", STAGE_COLORS[stage])}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.values(PipelineStage).map((s) => (
          <SelectItem key={s} value={s}>
            {t(`crm.stages.${s}`)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
