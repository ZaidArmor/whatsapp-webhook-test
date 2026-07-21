import Link from "next/link";
import { notFound } from "next/navigation";
import { Download } from "lucide-react";
import { getSegmentDetail, getSegmentBuilderOptions } from "@/lib/data/segments";
import { SegmentBuilder } from "@/components/segments/segment-builder";
import { Button } from "@/components/ui/button";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SegmentDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [segment, options] = await Promise.all([getSegmentDetail(id), getSegmentBuilderOptions()]);
  if (!segment) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{segment.name}</h1>
          <p className="text-sm text-muted-foreground">{segment.description ?? "تعديل شروط الشريحة"}</p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/exports?segmentId=${segment.id}`}>
            <Download className="h-4 w-4" /> تصدير هذه الشريحة
          </Link>
        </Button>
      </div>
      <SegmentBuilder options={options} initial={segment} />
    </div>
  );
}
