import Link from "next/link";
import { Plus } from "lucide-react";
import { getSegmentsList } from "@/lib/data/segments";
import { SegmentsTableClient } from "@/components/segments/segments-table-client";
import { Button } from "@/components/ui/button";

export default async function SegmentsPage() {
  const segments = await getSegmentsList();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">الشرائح</h1>
          <p className="text-sm text-muted-foreground">إنشاء شرائح عملاء لإعادة الاستهداف بناءً على شروط متعددة</p>
        </div>
        <Button asChild>
          <Link href="/segments/new">
            <Plus className="h-4 w-4" /> شريحة جديدة
          </Link>
        </Button>
      </div>

      <SegmentsTableClient data={segments} />
    </div>
  );
}
