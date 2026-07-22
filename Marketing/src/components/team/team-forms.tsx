"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, UserPlus, Trash2 } from "lucide-react";
import { WorkspaceRole } from "@prisma/client";
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
import { useT } from "@/lib/i18n/client";
import { createWorkspaceAction, addMemberAction, removeMemberAction } from "@/app/(app)/team/actions";

export function NewWorkspaceDialog() {
  const { t } = useT();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        {t("team.newWorkspace")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("team.newWorkspace")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="ws-name">{t("team.workspaceName")}</Label>
            <Input id="ws-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
          </div>
          {error ? <div className="text-sm font-medium text-destructive">{error}</div> : null}
          {success ? <div className="text-sm font-medium text-success">{t("team.workspaceCreated")}</div> : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              disabled={isPending || name.trim().length < 2}
              onClick={() => {
                setError(null);
                startTransition(async () => {
                  const result = await createWorkspaceAction({ name });
                  if (!result.ok) {
                    setError(t(result.errorKey ?? "common.error"));
                    return;
                  }
                  setSuccess(true);
                  setTimeout(() => {
                    setOpen(false);
                    setSuccess(false);
                    setName("");
                  }, 800);
                  router.refresh();
                });
              }}
            >
              {t("common.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function AddMemberForm() {
  const { t } = useT();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<WorkspaceRole>("EDITOR");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-56 flex-1 space-y-1.5">
          <Label htmlFor="member-email">{t("team.memberEmail")}</Label>
          <Input id="member-email" dir="ltr" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>{t("team.role")}</Label>
          <Select value={role} onValueChange={(v) => setRole(v as WorkspaceRole)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(WorkspaceRole).map((r) => (
                <SelectItem key={r} value={r}>
                  {t(`roles.${r}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          disabled={isPending || !email.includes("@")}
          onClick={() => {
            setMessage(null);
            startTransition(async () => {
              const result = await addMemberAction({ email, role });
              if (result.ok) {
                setMessage({ text: t("team.memberAdded"), ok: true });
                setEmail("");
              } else {
                setMessage({ text: t(result.errorKey ?? "common.error"), ok: false });
              }
              router.refresh();
            });
          }}
        >
          <UserPlus className="h-4 w-4" />
          {t("team.addMember")}
        </Button>
      </div>
      {message ? (
        <div className={message.ok ? "text-xs font-medium text-success" : "text-xs font-medium text-destructive"}>{message.text}</div>
      ) : null}
    </div>
  );
}

export function RemoveMemberButton({ userId }: { userId: string }) {
  const { t } = useT();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant="ghost"
      className="text-muted-foreground hover:text-destructive"
      disabled={isPending}
      aria-label={t("team.removeMember")}
      onClick={() =>
        startTransition(async () => {
          await removeMemberAction({ userId });
          router.refresh();
        })
      }
    >
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  );
}
