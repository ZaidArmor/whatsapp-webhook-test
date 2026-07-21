import { getSegmentBuilderOptions } from "@/lib/data/segments";
import { SegmentBuilder } from "@/components/segments/segment-builder";

export default async function NewSegmentPage() {
  const options = await getSegmentBuilderOptions();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">إنشاء شريحة جديدة</h1>
        <p className="text-sm text-muted-foreground">أضف شروطاً لتحديد العملاء المستهدفين، مع معاينة العدد مباشرة</p>
      </div>
      <SegmentBuilder options={options} />
    </div>
  );
}
