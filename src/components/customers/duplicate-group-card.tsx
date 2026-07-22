"use client";

import * as React from "react";
import Link from "next/link";
import { Merge, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import { mergeDuplicatesAction, discardDuplicatesAction } from "@/app/(app)/customers/duplicates/actions";
import type { DuplicateGroup } from "@/lib/data/duplicates";

export function DuplicateGroupCard({ group }: { group: DuplicateGroup }) {
  const [dismissed, setDismissed] = React.useState(false);
  const [keepId, setKeepId] = React.useState(group.members[0]?.id ?? "");
  const [pending, startTransition] = React.useTransition();

  if (dismissed) return null;

  const discardIds = group.members.filter((m) => m.id !== keepId).map((m) => m.id);

  const applyStrategy = (strategy: "newest" | "oldest" | "complete") => {
    const sorted = [...group.members].sort((a, b) => {
      if (strategy === "newest") return b.createdAt.getTime() - a.createdAt.getTime();
      if (strategy === "oldest") return a.createdAt.getTime() - b.createdAt.getTime();
      return b.completeness - a.completeness;
    });
    const winner = sorted[0];
    if (!winner) return;
    setKeepId(winner.id);
    const discards = group.members.filter((m) => m.id !== winner.id).map((m) => m.id);
    startTransition(() => void discardDuplicatesAction({ keepId: winner.id, discardIds: discards }));
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-sm">
          {group.matchType === "phone" ? "تطابق برقم الجوال" : "تطابق بالبريد الإلكتروني"}:
          <span dir="ltr" className="font-mono text-foreground">
            {group.key}
          </span>
          <Badge variant="warning">{group.members.length} سجلات</Badge>
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={() => setDismissed(true)}>
          <X className="h-3.5 w-3.5" /> تجاهل
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="scroll-x-container">
          <table className="w-full text-sm">
            <thead className="border-b text-muted-foreground">
              <tr>
                <th className="p-2 text-start">الاحتفاظ</th>
                <th className="p-2 text-start">الاسم</th>
                <th className="p-2 text-start">الفرع</th>
                <th className="p-2 text-start">الحالة</th>
                <th className="p-2 text-start">تاريخ الإنشاء</th>
                <th className="p-2 text-start">درجة الاكتمال</th>
              </tr>
            </thead>
            <tbody>
              {group.members.map((member) => (
                <tr key={member.id} className="border-b last:border-0">
                  <td className="p-2">
                    <input
                      type="radio"
                      name={`keep-${group.key}`}
                      checked={keepId === member.id}
                      onChange={() => setKeepId(member.id)}
                    />
                  </td>
                  <td className="p-2">
                    <Link href={`/customers/${member.id}`} className="font-medium text-primary hover:underline">
                      {member.name}
                    </Link>
                  </td>
                  <td className="p-2">{member.branchName ?? "—"}</td>
                  <td className="p-2">{member.status}</td>
                  <td className="p-2 text-muted-foreground">{formatDateTime(member.createdAt)}</td>
                  <td className="p-2">{member.completeness}/6</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => applyStrategy("newest")} disabled={pending}>
            الاحتفاظ بالأحدث
          </Button>
          <Button variant="outline" size="sm" onClick={() => applyStrategy("oldest")} disabled={pending}>
            الاحتفاظ بالأقدم
          </Button>
          <Button variant="outline" size="sm" onClick={() => applyStrategy("complete")} disabled={pending}>
            الاحتفاظ بالأكثر اكتمالاً
          </Button>
          <Button
            size="sm"
            disabled={pending || discardIds.length === 0}
            onClick={() => startTransition(() => void mergeDuplicatesAction({ keepId, discardIds }))}
          >
            <Merge className="h-4 w-4" /> دمج السجلات مع المحدد
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
