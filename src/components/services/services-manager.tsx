"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ServiceCategory } from "@prisma/client";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { formatCurrency } from "@/lib/utils";
import { saveServiceAction, deleteServiceAction } from "@/app/(app)/services/actions";

const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  PPF: "أفلام حماية الطلاء",
  THERMAL_INSULATION_CAR: "العازل الحراري للسيارات",
  NANO_CERAMIC: "النانو سيراميك",
  POLISHING: "التلميع الاحترافي",
  THERMAL_INSULATION_BUILDING: "العازل الحراري للمباني",
  OTHER: "أخرى",
};

export interface ServiceRow {
  id: string;
  nameAr: string;
  nameEn: string;
  category: ServiceCategory;
  isActive: boolean;
  expectedSaleValue: number;
  targetCpl: number;
  targetRoas: number;
}

export function ServicesManager({ services }: { services: ServiceRow[] }) {
  const router = useRouter();
  const [editing, setEditing] = React.useState<ServiceRow | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<ServiceRow | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setEditing("new")}>
          <Plus className="h-4 w-4" /> خدمة جديدة
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <Card key={service.id}>
            <CardContent className="space-y-2 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{service.nameAr}</p>
                  <p className="text-xs text-muted-foreground">{service.nameEn}</p>
                </div>
                <Badge variant={service.isActive ? "success" : "muted"}>{service.isActive ? "نشط" : "غير نشط"}</Badge>
              </div>
              <Badge variant="secondary">{CATEGORY_LABELS[service.category]}</Badge>
              <div className="grid grid-cols-3 gap-2 pt-1 text-xs text-muted-foreground">
                <div>
                  <p>البيع المتوقع</p>
                  <p className="font-medium text-foreground">{formatCurrency(service.expectedSaleValue)}</p>
                </div>
                <div>
                  <p>CPL المستهدف</p>
                  <p className="font-medium text-foreground">{formatCurrency(service.targetCpl)}</p>
                </div>
                <div>
                  <p>ROAS المستهدف</p>
                  <p className="font-medium text-foreground">{service.targetRoas}×</p>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <Button size="sm" variant="outline" onClick={() => setEditing(service)}>
                  <Pencil className="h-3.5 w-3.5" /> تعديل
                </Button>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setDeleteTarget(service)}>
                  <Trash2 className="h-3.5 w-3.5" /> حذف
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {editing && (
        <ServiceFormDialog
          service={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => router.refresh()}
        />
      )}

      <ConfirmationDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="حذف الخدمة"
        description={`سيتم إخفاء خدمة "${deleteTarget?.nameAr}" (حذف مؤقت).`}
        confirmLabel="حذف"
        destructive
        onConfirm={async () => {
          if (deleteTarget) await deleteServiceAction({ id: deleteTarget.id });
          router.refresh();
        }}
      />
    </div>
  );
}

function ServiceFormDialog({
  service,
  onClose,
  onSaved,
}: {
  service: ServiceRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [nameAr, setNameAr] = React.useState(service?.nameAr ?? "");
  const [nameEn, setNameEn] = React.useState(service?.nameEn ?? "");
  const [category, setCategory] = React.useState<ServiceCategory>(service?.category ?? "OTHER");
  const [isActive, setIsActive] = React.useState(service?.isActive ?? true);
  const [expectedSaleValue, setExpectedSaleValue] = React.useState(service?.expectedSaleValue ?? 0);
  const [targetCpl, setTargetCpl] = React.useState(service?.targetCpl ?? 0);
  const [targetRoas, setTargetRoas] = React.useState(service?.targetRoas ?? 0);
  const [isSaving, setIsSaving] = React.useState(false);

  async function handleSave() {
    setIsSaving(true);
    try {
      await saveServiceAction({
        id: service?.id,
        nameAr,
        nameEn,
        category,
        isActive,
        expectedSaleValue,
        targetCpl,
        targetRoas,
      });
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
          <DialogTitle>{service ? "تعديل الخدمة" : "خدمة جديدة"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>الاسم بالعربية</Label>
              <Input value={nameAr} onChange={(e) => setNameAr(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>الاسم بالإنجليزية</Label>
              <Input value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>الفئة</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as ServiceCategory)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>قيمة البيع المتوقعة</Label>
              <Input type="number" value={expectedSaleValue} onChange={(e) => setExpectedSaleValue(Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label>CPL المستهدف</Label>
              <Input type="number" value={targetCpl} onChange={(e) => setTargetCpl(Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label>ROAS المستهدف</Label>
              <Input type="number" value={targetRoas} onChange={(e) => setTargetRoas(Number(e.target.value))} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={isActive} onCheckedChange={setIsActive} />
            <span className="text-sm">نشطة</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            إلغاء
          </Button>
          <Button onClick={() => void handleSave()} disabled={isSaving || !nameAr.trim() || !nameEn.trim()}>
            حفظ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
