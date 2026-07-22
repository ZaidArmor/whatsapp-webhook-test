"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { runAnalysisAction } from "@/app/(app)/recommendations/actions";

export function RunAnalysisButton() {
  const router = useRouter();
  const [isRunning, setIsRunning] = React.useState(false);
  const [result, setResult] = React.useState<string | null>(null);

  async function handleRun() {
    setIsRunning(true);
    setResult(null);
    try {
      const summary = await runAnalysisAction();
      setResult(`تم تحليل ${summary.campaignsAnalyzed} حملة وإنشاء ${summary.recommendationsCreated} توصية و${summary.alertsCreated} تنبيه جديد`);
      router.refresh();
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Button onClick={() => void handleRun()} disabled={isRunning}>
        {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        تشغيل التحليل الآن
      </Button>
      {result && <p className="text-sm text-muted-foreground">{result}</p>}
    </div>
  );
}
