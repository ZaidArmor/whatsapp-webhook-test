"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { RoleName } from "@prisma/client";
import { Plus, Pencil, UserX, UserCheck } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import { saveUserAction, deactivateUserAction, activateUserAction } from "@/app/(app)/users/actions";
import type { SelectOption } from "@/types";

export interface UserRow {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  branchId: string | null;
  branchName: string | null;
  roles: RoleName[];
}

export function UsersManager({ users, branches }: { users: UserRow[]; branches: SelectOption[] }) {
  const router = useRouter();
  const [editing, setEditing] = React.useState<UserRow | "new" | null>(null);

  const columns: ColumnDef<UserRow, unknown>[] = [
    { accessorKey: "name", header: "الاسم", meta: { label: "الاسم" } },
    { accessorKey: "email", header: "البريد الإلكتروني", meta: { label: "البريد الإلكتروني" } },
    {
      accessorKey: "roles",
      header: "الأدوار",
      meta: { label: "الأدوار" },
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.roles.map((r) => (
            <Badge key={r} variant="secondary">
              {ROLE_LABELS[r]}
            </Badge>
          ))}
        </div>
      ),
    },
    { accessorKey: "branchName", header: "الفرع", meta: { label: "الفرع" }, cell: ({ row }) => row.original.branchName ?? "كل الفروع" },
    {
      accessorKey: "isActive",
      header: "الحالة",
      meta: { label: "الحالة" },
      cell: ({ row }) => <Badge variant={row.original.isActive ? "success" : "muted"}>{row.original.isActive ? "نشط" : "معطل"}</Badge>,
    },
    {
      id: "actions",
      header: "إجراءات",
      meta: { label: "إجراءات" },
      enableHiding: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setEditing(row.original)}>
            <Pencil className="h-4 w-4" />
          </Button>
          {row.original.isActive ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => void deactivateUserAction({ id: row.original.id }).then(() => router.refresh())}
            >
              <UserX className="h-4 w-4 text-destructive" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => void activateUserAction({ id: row.original.id }).then(() => router.refresh())}
            >
              <UserCheck className="h-4 w-4 text-success" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setEditing("new")}>
          <Plus className="h-4 w-4" /> مستخدم جديد
        </Button>
      </div>

      <DataTable columns={columns} data={users} searchPlaceholder="ابحث عن مستخدم..." />

      {editing && (
        <UserFormDialog
          user={editing === "new" ? null : editing}
          branches={branches}
          onClose={() => setEditing(null)}
          onSaved={() => router.refresh()}
        />
      )}
    </div>
  );
}

function UserFormDialog({
  user,
  branches,
  onClose,
  onSaved,
}: {
  user: UserRow | null;
  branches: SelectOption[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = React.useState(user?.name ?? "");
  const [email, setEmail] = React.useState(user?.email ?? "");
  const [password, setPassword] = React.useState("");
  const [branchId, setBranchId] = React.useState<string | undefined>(user?.branchId ?? undefined);
  const [isActive, setIsActive] = React.useState(user?.isActive ?? true);
  const [roles, setRoles] = React.useState<RoleName[]>(user?.roles ?? []);
  const [isSaving, setIsSaving] = React.useState(false);

  async function handleSave() {
    setIsSaving(true);
    try {
      await saveUserAction({
        id: user?.id,
        name,
        email,
        password: password || undefined,
        branchId: branchId ?? null,
        isActive,
        roles,
      });
      onSaved();
      onClose();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{user ? "تعديل المستخدم" : "مستخدم جديد"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>الاسم</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>البريد الإلكتروني</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>{user ? "كلمة مرور جديدة (اختياري)" : "كلمة المرور (اختياري، الافتراضي: Armor@12345)"}</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} dir="ltr" />
          </div>
          <div className="space-y-1.5">
            <Label>الفرع</Label>
            <Select value={branchId ?? "__all__"} onValueChange={(v) => setBranchId(v === "__all__" ? undefined : v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">كل الفروع</SelectItem>
                {branches.map((b) => (
                  <SelectItem key={b.value} value={b.value}>
                    {b.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>الأدوار</Label>
            <div className="grid grid-cols-2 gap-2">
              {Object.values(RoleName).map((role) => (
                <label key={role} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={roles.includes(role)}
                    onCheckedChange={(checked) =>
                      setRoles((prev) => (checked ? [...prev, role] : prev.filter((r) => r !== role)))
                    }
                  />
                  {ROLE_LABELS[role]}
                </label>
              ))}
            </div>
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
          <Button onClick={() => void handleSave()} disabled={isSaving || !name.trim() || !email.trim() || roles.length === 0}>
            حفظ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
