"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { saveBranchAction, deleteBranchAction } from "@/app/(app)/branches/actions";

export interface BranchRow {
  id: string;
  name: string;
  nameEn: string | null;
  city: string;
  isActive: boolean;
}

export function BranchesManager({ branches }: { branches: BranchRow[] }) {
  const router = useRouter();
  const [editing, setEditing] = React.useState<BranchRow | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<BranchRow | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setEditing("new")}>
          <Plus className="h-4 w-4" /> فرع جديد
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {branches.map((branch) => (
          <Card key={branch.id}>
            <CardContent className="space-y-2 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{branch.name}</p>
                  {branch.nameEn && <p className="text-xs text-muted-foreground">{branch.nameEn}</p>}
                </div>
                <Badge variant={branch.isActive ? "success" : "muted"}>{branch.isActive ? "نشط" : "غير نشط"}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{branch.city}</p>
              <div className="flex gap-2 pt-1">
                <Button size="sm" variant="outline" onClick={() => setEditing(branch)}>
                  <Pencil className="h-3.5 w-3.5" /> تعديل
                </Button>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setDeleteTarget(branch)}>
                  <Trash2 className="h-3.5 w-3.5" /> حذف
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {editing && (
        <BranchFormDialog
          branch={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => router.refresh()}
        />
      )}

      <ConfirmationDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="حذف الفرع"
        description={`سيتم إخفاء فرع "${deleteTarget?.name}" (حذف مؤقت).`}
        confirmLabel="حذف"
        destructive
        onConfirm={async () => {
          if (deleteTarget) await deleteBranchAction({ id: deleteTarget.id });
          router.refresh();
        }}
      />
    </div>
  );
}

function BranchFormDialog({
  branch,
  onClose,
  onSaved,
}: {
  branch: BranchRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = React.useState(branch?.name ?? "");
  const [nameEn, setNameEn] = React.useState(branch?.nameEn ?? "");
  const [city, setCity] = React.useState(branch?.city ?? "");
  const [isActive, setIsActive] = React.useState(branch?.isActive ?? true);
  const [isSaving, setIsSaving] = React.useState(false);

  async function handleSave() {
    setIsSaving(true);
    try {
      await saveBranchAction({ id: branch?.id, name, nameEn: nameEn || null, city, isActive });
      onSaved();
      onClose();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{branch ? "تعديل الفرع" : "فرع جديد"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>الاسم بالعربية</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>الاسم بالإنجليزية</Label>
            <Input value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>المدينة</Label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={isActive} onCheckedChange={setIsActive} />
            <span className="text-sm">نشط</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            إلغاء
          </Button>
          <Button onClick={() => void handleSave()} disabled={isSaving || !name.trim() || !city.trim()}>
            حفظ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
