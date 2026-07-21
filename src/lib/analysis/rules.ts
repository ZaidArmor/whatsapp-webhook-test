import type { AnalysisThresholds } from "./thresholds";

export type RecommendationType = "OPPORTUNITY" | "WARNING" | "DANGER" | "EXCELLENT" | "NEEDS_FOLLOW_UP";
export type RecommendationPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface RecommendationDraft {
  ruleKey: string;
  type: RecommendationType;
  title: string;
  explanation: string;
  reason: string;
  supportingData: Record<string, unknown>;
  priority: RecommendationPriority;
  suggestedAction: string;
}

export interface CampaignMetricsSnapshot {
  spend: number;
  revenue: number;
  impressions: number;
  clicks: number;
  reach: number;
  leads: number;
  bookings: number;
  sales: number;
  conversations: number;
}

export interface CampaignAnalysisContext {
  campaignId: string;
  campaignName: string;
  current: CampaignMetricsSnapshot;
  previous: CampaignMetricsSnapshot;
  worstAd: { name: string; spend: number; leads: number } | null;
}

function safeDiv(a: number, b: number): number | null {
  return b > 0 ? a / b : null;
}

function hasEnoughData(current: CampaignMetricsSnapshot, minDataPoints: number): boolean {
  return current.clicks >= minDataPoints || current.leads >= Math.min(5, minDataPoints);
}

type RuleFn = (ctx: CampaignAnalysisContext, thresholds: AnalysisThresholds) => RecommendationDraft | null;

const spendingWithoutResults: RuleFn = (ctx, t) => {
  if (!hasEnoughData(ctx.current, t.minDataPoints)) return null;
  if (ctx.current.spend > t.targetCpl * 3 && ctx.current.leads === 0) {
    return {
      ruleKey: "SPENDING_WITHOUT_RESULTS",
      type: "DANGER",
      title: "الحملة تنفق دون تحقيق نتائج",
      explanation: `أنفقت الحملة "${ctx.campaignName}" مبلغ ${ctx.current.spend.toFixed(0)} ر.س دون أي عميل محتمل واحد.`,
      reason: "الإنفاق تجاوز 3 أضعاف تكلفة العميل المحتمل المستهدفة بدون أي نتائج.",
      supportingData: { spend: ctx.current.spend, leads: ctx.current.leads },
      priority: "CRITICAL",
      suggestedAction: "أوقف الحملة فوراً وراجع الاستهداف والتصميم الإعلاني.",
    };
  }
  return null;
};

const highCpl: RuleFn = (ctx, t) => {
  if (!hasEnoughData(ctx.current, t.minDataPoints)) return null;
  const cpl = safeDiv(ctx.current.spend, ctx.current.leads);
  if (cpl !== null && cpl > t.targetCpl * 1.5) {
    return {
      ruleKey: "HIGH_CPL",
      type: "WARNING",
      title: "تكلفة العميل المحتمل أعلى من الحد المقبول",
      explanation: `تكلفة العميل المحتمل الحالية ${cpl.toFixed(0)} ر.س مقابل هدف ${t.targetCpl} ر.س.`,
      reason: `CPL أعلى من الهدف بنسبة ${(((cpl - t.targetCpl) / t.targetCpl) * 100).toFixed(0)}%.`,
      supportingData: { cpl, target: t.targetCpl },
      priority: cpl > t.targetCpl * 2 ? "HIGH" : "MEDIUM",
      suggestedAction: "راجع استهداف الجمهور وجودة التصميم الإعلاني لتقليل التكلفة.",
    };
  }
  return null;
};

const lowCtr: RuleFn = (ctx, t) => {
  if (!hasEnoughData(ctx.current, t.minDataPoints)) return null;
  const ctr = safeDiv(ctx.current.clicks, ctx.current.impressions);
  if (ctr !== null && ctr * 100 < t.minCtr) {
    return {
      ruleKey: "LOW_CTR",
      type: "WARNING",
      title: "معدل النقر (CTR) منخفض",
      explanation: `CTR الحالي ${(ctr * 100).toFixed(2)}% وهو أقل من الحد الأدنى المقبول ${t.minCtr}%.`,
      reason: "انخفاض CTR يشير إلى ضعف جاذبية الإعلان أو استهداف غير دقيق.",
      supportingData: { ctr: ctr * 100, minCtr: t.minCtr },
      priority: "MEDIUM",
      suggestedAction: "جرّب تصاميم أو نصوصاً إعلانية جديدة، أو راجع دقة الاستهداف.",
    };
  }
  return null;
};

const highCpm: RuleFn = (ctx, t) => {
  if (!hasEnoughData(ctx.current, t.minDataPoints)) return null;
  const cpm = safeDiv(ctx.current.spend, ctx.current.impressions);
  if (cpm !== null && cpm * 1000 > t.maxCpm) {
    return {
      ruleKey: "HIGH_CPM",
      type: "WARNING",
      title: "تكلفة الألف ظهور (CPM) مرتفعة",
      explanation: `CPM الحالي ${(cpm * 1000).toFixed(1)} ر.س مقابل الحد الأعلى ${t.maxCpm} ر.س.`,
      reason: "ارتفاع CPM قد يشير إلى منافسة عالية على الجمهور المستهدف أو ضعف جودة الإعلان.",
      supportingData: { cpm: cpm * 1000, maxCpm: t.maxCpm },
      priority: "LOW",
      suggestedAction: "وسّع نطاق الجمهور المستهدف أو جرّب فترات زمنية مختلفة للعرض.",
    };
  }
  return null;
};

const lowConversionRate: RuleFn = (ctx, t) => {
  if (!hasEnoughData(ctx.current, t.minDataPoints) || ctx.current.leads < 5) return null;
  const rate = safeDiv(ctx.current.sales, ctx.current.leads);
  if (rate !== null && rate * 100 < t.targetConversionRate * 0.5) {
    return {
      ruleKey: "LOW_CONVERSION_RATE",
      type: "WARNING",
      title: "معدل التحويل منخفض",
      explanation: `معدل التحويل الحالي ${(rate * 100).toFixed(1)}% مقابل هدف ${t.targetConversionRate}%.`,
      reason: "عدد العملاء المحتملين جيد لكن نسبة تحولهم لمبيعات منخفضة.",
      supportingData: { conversionRate: rate * 100, target: t.targetConversionRate },
      priority: "HIGH",
      suggestedAction: "راجع سرعة ومتابعة فريق المبيعات لهذه الحملة.",
    };
  }
  return null;
};

const goodLeadsLowSales: RuleFn = (ctx) => {
  if (ctx.current.leads >= 20 && ctx.current.sales === 0) {
    return {
      ruleKey: "GOOD_LEADS_LOW_SALES",
      type: "WARNING",
      title: "عدد Leads جيد لكن المبيعات منخفضة",
      explanation: `الحملة حققت ${ctx.current.leads} عميلاً محتملاً دون أي مبيعات حتى الآن.`,
      reason: "فجوة واضحة بين توليد العملاء المحتملين وإغلاق المبيعات.",
      supportingData: { leads: ctx.current.leads, sales: ctx.current.sales },
      priority: "HIGH",
      suggestedAction: "دقق في جودة العملاء المحتملين ومتابعة فريق المبيعات لهم.",
    };
  }
  return null;
};

const highRoasOpportunity: RuleFn = (ctx, t) => {
  if (!hasEnoughData(ctx.current, t.minDataPoints)) return null;
  const roas = safeDiv(ctx.current.revenue, ctx.current.spend);
  if (roas !== null && roas > t.targetRoas * 1.5) {
    return {
      ruleKey: "HIGH_ROAS_OPPORTUNITY",
      type: "OPPORTUNITY",
      title: "أداء ممتاز — فرصة لزيادة الميزانية",
      explanation: `ROAS الحالي ${roas.toFixed(1)}x يتجاوز الهدف (${t.targetRoas}x) بشكل كبير.`,
      reason: "الحملة تحقق عائداً مرتفعاً جداً على الإنفاق ويمكن استغلال ذلك بزيادة الميزانية.",
      supportingData: { roas, target: t.targetRoas },
      priority: "MEDIUM",
      suggestedAction: "ادرس زيادة الميزانية اليومية تدريجياً مع مراقبة استقرار الأداء.",
    };
  }
  return null;
};

const performanceDeclined: RuleFn = (ctx) => {
  const currentRoas = safeDiv(ctx.current.revenue, ctx.current.spend);
  const previousRoas = safeDiv(ctx.previous.revenue, ctx.previous.spend);
  if (currentRoas !== null && previousRoas !== null && previousRoas > 0) {
    const change = (currentRoas - previousRoas) / previousRoas;
    if (change < -0.3) {
      return {
        ruleKey: "PERFORMANCE_DECLINED",
        type: "WARNING",
        title: "تراجع الأداء مقارنة بالفترة السابقة",
        explanation: `انخفض ROAS من ${previousRoas.toFixed(1)}x إلى ${currentRoas.toFixed(1)}x (${(change * 100).toFixed(0)}%).`,
        reason: "تراجع واضح في كفاءة الإنفاق مقارنة بالفترة السابقة لنفس الحملة.",
        supportingData: { currentRoas, previousRoas, changePercent: change * 100 },
        priority: "HIGH",
        suggestedAction: "قارن التغييرات الأخيرة في الاستهداف أو التصميم أو الميزانية وابحث عن سبب التراجع.",
      };
    }
  }
  return null;
};

const highFrequency: RuleFn = (ctx, t) => {
  if (!hasEnoughData(ctx.current, t.minDataPoints)) return null;
  const frequency = safeDiv(ctx.current.impressions, ctx.current.reach);
  if (frequency !== null && frequency > t.maxFrequency) {
    return {
      ruleKey: "HIGH_FREQUENCY",
      type: "WARNING",
      title: "ارتفاع معدل التكرار (Frequency)",
      explanation: `معدل التكرار الحالي ${frequency.toFixed(1)}× يتجاوز الحد الأعلى ${t.maxFrequency}×.`,
      reason: "قد يشير ارتفاع التكرار إلى إرهاق الجمهور المستهدف وتراجع فعالية الإعلان بمرور الوقت.",
      supportingData: { frequency, maxFrequency: t.maxFrequency },
      priority: "MEDIUM",
      suggestedAction: "وسّع الجمهور المستهدف أو جدّد التصاميم الإعلانية.",
    };
  }
  return null;
};

const adWastingBudget: RuleFn = (ctx) => {
  if (ctx.worstAd && ctx.worstAd.spend > 500 && ctx.worstAd.leads === 0) {
    return {
      ruleKey: "AD_WASTING_BUDGET",
      type: "WARNING",
      title: "إعلان معين يستهلك الميزانية دون نتائج",
      explanation: `الإعلان "${ctx.worstAd.name}" أنفق ${ctx.worstAd.spend.toFixed(0)} ر.س دون أي عميل محتمل.`,
      reason: "أحد الإعلانات ضمن الحملة يستهلك جزءاً كبيراً من الميزانية دون تحقيق نتائج.",
      supportingData: { adName: ctx.worstAd.name, spend: ctx.worstAd.spend },
      priority: "MEDIUM",
      suggestedAction: "أوقف هذا الإعلان تحديداً أو استبدل تصميمه.",
    };
  }
  return null;
};

const excellentPerformance: RuleFn = (ctx, t) => {
  if (!hasEnoughData(ctx.current, t.minDataPoints)) return null;
  const roas = safeDiv(ctx.current.revenue, ctx.current.spend);
  const cpl = safeDiv(ctx.current.spend, ctx.current.leads);
  if (roas !== null && roas >= t.targetRoas && cpl !== null && cpl <= t.targetCpl) {
    return {
      ruleKey: "EXCELLENT_PERFORMANCE",
      type: "EXCELLENT",
      title: "أداء ممتاز ومستقر",
      explanation: `الحملة تحقق ROAS ${roas.toFixed(1)}x وCPL ${cpl.toFixed(0)} ر.س، وكلاهما ضمن الأهداف المحددة.`,
      reason: "الحملة تعمل بكفاءة عالية على كل من التكلفة والعائد.",
      supportingData: { roas, cpl },
      priority: "LOW",
      suggestedAction: "حافظ على الإعدادات الحالية وراقب الأداء دورياً.",
    };
  }
  return null;
};

export const CAMPAIGN_RULES: RuleFn[] = [
  spendingWithoutResults,
  highCpl,
  lowCtr,
  highCpm,
  lowConversionRate,
  goodLeadsLowSales,
  highRoasOpportunity,
  performanceDeclined,
  highFrequency,
  adWastingBudget,
  excellentPerformance,
];

export function runCampaignRules(ctx: CampaignAnalysisContext, thresholds: AnalysisThresholds): RecommendationDraft[] {
  return CAMPAIGN_RULES.map((rule) => rule(ctx, thresholds)).filter((r): r is RecommendationDraft => r !== null);
}

// ---- Portfolio-wide rules (branch / platform / service comparisons) ----

export interface BranchAnalysisContext {
  branchId: string;
  branchName: string;
  leads: number;
  sales: number;
}

export function branchNotConverting(ctx: BranchAnalysisContext, t: AnalysisThresholds): RecommendationDraft | null {
  if (ctx.leads < t.minDataPoints) return null;
  const rate = safeDiv(ctx.sales, ctx.leads);
  if (rate !== null && rate * 100 < t.targetConversionRate * 0.4) {
    return {
      ruleKey: "BRANCH_NOT_CONVERTING",
      type: "WARNING",
      title: "فرع يستقبل عملاء محتملين ولا يحولهم إلى مبيعات",
      explanation: `فرع "${ctx.branchName}" استقبل ${ctx.leads} عميلاً محتملاً بمعدل تحويل ${(rate * 100).toFixed(1)}% فقط.`,
      reason: "معدل تحويل هذا الفرع أقل بكثير من المعدل المستهدف.",
      supportingData: { branchId: ctx.branchId, leads: ctx.leads, sales: ctx.sales, conversionRate: rate * 100 },
      priority: "HIGH",
      suggestedAction: "راجع أداء فريق المبيعات في هذا الفرع وسرعة المتابعة مع العملاء.",
    };
  }
  return null;
}

export interface PlatformAnalysisContext {
  platform: string;
  roas: number;
}

export function bestPlatformInsight(platforms: PlatformAnalysisContext[]): RecommendationDraft | null {
  const withData = platforms.filter((p) => p.roas > 0);
  if (withData.length < 2) return null;
  const best = withData.reduce((a, b) => (b.roas > a.roas ? b : a));
  const others = withData.filter((p) => p.platform !== best.platform);
  const avgOthers = others.reduce((sum, p) => sum + p.roas, 0) / others.length;
  if (avgOthers > 0 && best.roas > avgOthers * 1.5) {
    return {
      ruleKey: "BEST_PLATFORM",
      type: "OPPORTUNITY",
      title: "منصة معينة تحقق نتائج أفضل من غيرها",
      explanation: `منصة ${best.platform} تحقق ROAS ${best.roas.toFixed(1)}x مقابل متوسط ${avgOthers.toFixed(1)}x لبقية المنصات.`,
      reason: "فرصة لإعادة توزيع الميزانية نحو المنصة الأعلى عائداً.",
      supportingData: { bestPlatform: best.platform, bestRoas: best.roas, avgOthers },
      priority: "MEDIUM",
      suggestedAction: "ادرس نقل جزء من ميزانية المنصات الأقل أداءً إلى هذه المنصة.",
    };
  }
  return null;
}
