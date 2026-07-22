"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { AdObjective, PlatformKind } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlatformIcon } from "@/components/shared/platform-icon";
import { useT } from "@/lib/i18n/client";
import { createCampaignAction } from "@/app/(app)/ads/actions";

const AD_PLATFORMS: PlatformKind[] = ["FACEBOOK", "INSTAGRAM", "TIKTOK", "SNAPCHAT", "GOOGLE_ADS"];

export function NewCampaignDialog() {
  const { t } = useT();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState<PlatformKind>("FACEBOOK");
  const [objective, setObjective] = useState<AdObjective>("CONVERSIONS");
  const [budget, setBudget] = useState("10000");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [audience, setAudience] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const result = await createCampaignAction({
        name,
        platform,
        objective,
        budget: Number(budget),
        startDate: new Date(startDate).toISOString(),
        audience: audience || undefined,
      });
      if (!result.ok) {
        setError(t(result.errorKey ?? "common.error"));
        return;
      }
      setSuccess(true);
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
        setName("");
        setAudience("");
      }, 800);
      router.refresh();
    });
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        {t("ads.newCampaign")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("ads.newCampaign")}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="c-name">{t("ads.campaignName")}</Label>
              <Input id="c-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={150} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("common.platform")}</Label>
                <Select value={platform} onValueChange={(v) => setPlatform(v as PlatformKind)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AD_PLATFORMS.map((p) => (
                      <SelectItem key={p} value={p}>
                        <span className="flex items-center gap-2">
                          <PlatformIcon platform={p} className="h-3.5 w-3.5" />
                          {t(`platforms.${p}`)}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>{t("ads.objective")}</Label>
                <Select value={objective} onValueChange={(v) => setObjective(v as AdObjective)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(AdObjective).map((o) => (
                      <SelectItem key={o} value={o}>
                        {t(`ads.objectives.${o}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="c-budget">{t("ads.budget")}</Label>
                <Input id="c-budget" type="number" min={100} value={budget} onChange={(e) => setBudget(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-start">{t("ads.startDate")}</Label>
                <Input id="c-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="c-audience">{t("ads.audience")}</Label>
              <Input id="c-audience" value={audience} onChange={(e) => setAudience(e.target.value)} maxLength={300} />
            </div>

            {error ? <div className="text-sm font-medium text-destructive">{error}</div> : null}
            {success ? <div className="text-sm font-medium text-success">{t("ads.campaignCreated")}</div> : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button disabled={isPending || !name.trim() || Number(budget) <= 0} onClick={submit}>
              {t("common.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
