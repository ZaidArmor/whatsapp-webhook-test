"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/client";
import { setCampaignStatusAction } from "@/app/(app)/ads/actions";

interface CampaignStatusButtonProps {
  campaignId: string;
  status: string;
}

export function CampaignStatusButton({ campaignId, status }: CampaignStatusButtonProps) {
  const { t } = useT();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (status !== "ACTIVE" && status !== "PAUSED") return null;
  const next = status === "ACTIVE" ? "PAUSED" : "ACTIVE";

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={isPending}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        startTransition(async () => {
          await setCampaignStatusAction({ campaignId, status: next });
          router.refresh();
        });
      }}
    >
      {status === "ACTIVE" ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
      {status === "ACTIVE" ? t("ads.pause") : t("ads.activate")}
    </Button>
  );
}
