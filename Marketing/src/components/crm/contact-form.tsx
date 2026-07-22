"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { PipelineStage, PlatformKind } from "@prisma/client";
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
import { createContactAction } from "@/app/(app)/crm/actions";

const NONE = "__none__";

interface ContactFormProps {
  owners: Array<{ id: string; name: string }>;
  campaigns: Array<{ id: string; name: string; platform: PlatformKind }>;
}

export function NewContactDialog({ owners, campaigns }: ContactFormProps) {
  const { t } = useT();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [source, setSource] = useState<string>(NONE);
  const [stage, setStage] = useState<PipelineStage>("NEW");
  const [value, setValue] = useState("0");
  const [ownerId, setOwnerId] = useState<string>(NONE);
  const [campaignId, setCampaignId] = useState<string>(NONE);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const result = await createContactAction({
        name,
        phone: phone || undefined,
        email: email || undefined,
        source: source === NONE ? undefined : (source as PlatformKind),
        stage,
        value: Number(value) || 0,
        ownerId: ownerId === NONE ? undefined : ownerId,
        campaignId: campaignId === NONE ? undefined : campaignId,
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
        setPhone("");
        setEmail("");
        setValue("0");
      }, 800);
      router.refresh();
    });
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        {t("crm.newContact")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("crm.newContact")}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="ct-name">{t("crm.contactName")}</Label>
              <Input id="ct-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ct-phone">{t("crm.phone")}</Label>
                <Input id="ct-phone" dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ct-email">{t("crm.email")}</Label>
                <Input id="ct-email" dir="ltr" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={160} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("crm.source")}</Label>
                <Select value={source} onValueChange={setSource}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>{t("common.optional")}</SelectItem>
                    {Object.values(PlatformKind).map((p) => (
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
                <Label>{t("crm.stage")}</Label>
                <Select value={stage} onValueChange={(v) => setStage(v as PipelineStage)}>
                  <SelectTrigger>
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
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ct-value">{t("crm.value")}</Label>
                <Input id="ct-value" type="number" min={0} value={value} onChange={(e) => setValue(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>{t("crm.owner")}</Label>
                <Select value={ownerId} onValueChange={setOwnerId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>{t("common.optional")}</SelectItem>
                    {owners.map((owner) => (
                      <SelectItem key={owner.id} value={owner.id}>
                        {owner.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>{t("crm.linkedCampaign")}</Label>
              <Select value={campaignId} onValueChange={setCampaignId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>{t("common.optional")}</SelectItem>
                  {campaigns.map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      <span className="flex items-center gap-2">
                        <PlatformIcon platform={campaign.platform} className="h-3.5 w-3.5" />
                        <span className="line-clamp-1">{campaign.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {error ? <div className="text-sm font-medium text-destructive">{error}</div> : null}
            {success ? <div className="text-sm font-medium text-success">{t("crm.contactCreated")}</div> : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button disabled={isPending || name.trim().length < 2} onClick={submit}>
              {t("common.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
