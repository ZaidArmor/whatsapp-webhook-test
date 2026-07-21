import { getRecommendations } from "@/lib/data/recommendations";
import { RecommendationCard } from "@/components/recommendations/recommendation-card";
import { RunAnalysisButton } from "@/components/recommendations/run-analysis-button";
import { EmptyState } from "@/components/shared/empty-state";
import { Sparkles } from "lucide-react";

export default async function RecommendationsPage() {
  const recommendations = await getRecommendations();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">التوصيات</h1>
          <p className="text-sm text-muted-foreground">توصيات تحليلية مبنية على قواعد قابلة للتعديل من الإعدادات</p>
        </div>
        <RunAnalysisButton />
      </div>

      {recommendations.length === 0 ? (
        <EmptyState
          icon={<Sparkles className="h-5 w-5" />}
          title="لا توجد توصيات بعد"
          description="اضغط على «تشغيل التحليل الآن» لتحليل الحملات النشطة وإنشاء توصيات."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {recommendations.map((r) => (
            <RecommendationCard key={r.id} recommendation={r} />
          ))}
        </div>
      )}
    </div>
  );
}
