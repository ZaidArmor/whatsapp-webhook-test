"use client";

import * as React from "react";
import { nanoid } from "nanoid";
import { Plus, Users, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { SegmentConditionRow } from "./segment-condition-row";
import { EmptyState } from "@/components/shared/empty-state";
import { previewSegmentAction, saveSegmentAction } from "@/app/(app)/segments/actions";
import type { SegmentConditionInput, SegmentGroupInput, SegmentTreeInput } from "@/lib/segments/types";

export interface SegmentSelectOptions {
  branches: Array<{ value: string; label: string }>;
  services: Array<{ value: string; label: string }>;
  campaigns: Array<{ value: string; label: string }>;
  platforms: Array<{ value: string; label: string }>;
  sources: Array<{ value: string; label: string }>;
  statuses: Array<{ value: string; label: string }>;
  phoneValidities: Array<{ value: string; label: string }>;
}

function newCondition(): SegmentConditionInput {
  return { id: nanoid(8), field: "CITY", operator: "EQUALS", value: null };
}

function newGroup(): SegmentGroupInput {
  return { id: nanoid(8), logicalOperator: "AND", conditions: [newCondition()] };
}

interface SegmentBuilderProps {
  options: SegmentSelectOptions;
  initial?: { id: string; name: string; description: string | null; tree: SegmentTreeInput };
}

export function SegmentBuilder({ options, initial }: SegmentBuilderProps) {
  const [name, setName] = React.useState(initial?.name ?? "");
  const [description, setDescription] = React.useState(initial?.description ?? "");
  const [topOperator, setTopOperator] = React.useState<"AND" | "OR">(initial?.tree.topLogicalOperator ?? "OR");
  const [groups, setGroups] = React.useState<SegmentGroupInput[]>(
    initial?.tree.groups && initial.tree.groups.length > 0 ? initial.tree.groups : [newGroup()]
  );
  const [preview, setPreview] = React.useState<{ count: number; preview: Array<{ id: string; name: string; city: string | null; status: string }> } | null>(
    null
  );
  const [isPreviewing, setIsPreviewing] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  const tree: SegmentTreeInput = React.useMemo(() => ({ topLogicalOperator: topOperator, groups }), [topOperator, groups]);

  const runPreview = React.useCallback(async (currentTree: SegmentTreeInput) => {
    setIsPreviewing(true);
    try {
      const result = await previewSegmentAction(currentTree);
      setPreview(result);
    } finally {
      setIsPreviewing(false);
    }
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(() => void runPreview(tree), 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(tree)]);

  function updateGroup(groupId: string, updater: (group: SegmentGroupInput) => SegmentGroupInput) {
    setGroups((prev) => prev.map((g) => (g.id === groupId ? updater(g) : g)));
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      await saveSegmentAction({ id: initial?.id, name, description: description || null, tree });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>معلومات الشريحة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="segment-name">اسم الشريحة</Label>
              <Input id="segment-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: عملاء PPF السابقون" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="segment-description">الوصف (اختياري)</Label>
              <Input id="segment-description" value={description ?? ""} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">مطابقة</span>
          <Select value={topOperator} onValueChange={(v) => setTopOperator(v as "AND" | "OR")}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AND">كل المجموعات</SelectItem>
              <SelectItem value="OR">أي مجموعة</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">من المجموعات التالية:</span>
        </div>

        {groups.map((group, groupIndex) => (
          <Card key={group.id} className="border-dashed">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm">المجموعة {groupIndex + 1}</CardTitle>
                <span className="text-xs text-muted-foreground">مطابقة</span>
                <Select
                  value={group.logicalOperator}
                  onValueChange={(v) => updateGroup(group.id, (g) => ({ ...g, logicalOperator: v as "AND" | "OR" }))}
                >
                  <SelectTrigger className="h-7 w-28 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AND">كل الشروط</SelectItem>
                    <SelectItem value="OR">أي شرط</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {groups.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => setGroups((prev) => prev.filter((g) => g.id !== group.id))}
                >
                  حذف المجموعة
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-2">
              {group.conditions.map((condition) => (
                <SegmentConditionRow
                  key={condition.id}
                  condition={condition}
                  options={options}
                  onChange={(next) =>
                    updateGroup(group.id, (g) => ({
                      ...g,
                      conditions: g.conditions.map((c) => (c.id === next.id ? next : c)),
                    }))
                  }
                  onRemove={() =>
                    updateGroup(group.id, (g) => ({ ...g, conditions: g.conditions.filter((c) => c.id !== condition.id) }))
                  }
                />
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateGroup(group.id, (g) => ({ ...g, conditions: [...g.conditions, newCondition()] }))}
              >
                <Plus className="h-3.5 w-3.5" /> إضافة شرط
              </Button>
            </CardContent>
          </Card>
        ))}

        <Button variant="outline" onClick={() => setGroups((prev) => [...prev, newGroup()])}>
          <Plus className="h-4 w-4" /> إضافة مجموعة شروط
        </Button>
      </div>

      <div className="space-y-4">
        <Card className="sticky top-20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4" /> عدد العملاء المطابقين
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-3xl font-bold tabular-nums">
              {isPreviewing ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /> : (preview?.count ?? 0)}
            </div>
            {preview && preview.preview.length > 0 ? (
              <ul className="max-h-64 space-y-1.5 overflow-y-auto text-sm">
                {preview.preview.map((c) => (
                  <li key={c.id} className="flex items-center justify-between border-b pb-1 last:border-0">
                    <span>{c.name}</span>
                    <Badge variant="muted">{c.city ?? "—"}</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              !isPreviewing && <EmptyState title="لا يوجد عملاء مطابقون" className="py-6" />
            )}
            <Button className="w-full" onClick={() => void handleSave()} disabled={isSaving || !name.trim()}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              حفظ الشريحة
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
