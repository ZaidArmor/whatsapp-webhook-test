import { getDuplicateGroups } from "@/lib/data/duplicates";
import { DuplicateGroupCard } from "@/components/customers/duplicate-group-card";
import { EmptyState } from "@/components/shared/empty-state";
import { CheckCircle2 } from "lucide-react";

export default async function CustomerDuplicatesPage() {
  const groups = await getDuplicateGroups();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">العملاء المكررون</h1>
        <p className="text-sm text-muted-foreground">
          {groups.length > 0
            ? `تم العثور على ${groups.length} مجموعة سجلات مكررة بناءً على رقم الجوال أو البريد الإلكتروني`
            : "لا توجد سجلات مكررة حالياً"}
        </p>
      </div>

      {groups.length === 0 ? (
        <EmptyState icon={<CheckCircle2 className="h-5 w-5" />} title="لا توجد تكرارات" description="جميع سجلات العملاء فريدة." />
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <DuplicateGroupCard key={group.key} group={group} />
          ))}
        </div>
      )}
    </div>
  );
}
