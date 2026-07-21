import { describe, expect, it } from "vitest";
import {
  runCampaignRules,
  branchNotConverting,
  bestPlatformInsight,
  type CampaignAnalysisContext,
  type CampaignMetricsSnapshot,
} from "@/lib/analysis/rules";
import { DEFAULT_THRESHOLDS } from "@/lib/analysis/thresholds";

function metrics(overrides: Partial<CampaignMetricsSnapshot> = {}): CampaignMetricsSnapshot {
  return {
    spend: 0,
    revenue: 0,
    impressions: 0,
    clicks: 0,
    reach: 0,
    leads: 0,
    bookings: 0,
    sales: 0,
    conversations: 0,
    ...overrides,
  };
}

function ctx(overrides: Partial<CampaignAnalysisContext> = {}): CampaignAnalysisContext {
  return {
    campaignId: "c1",
    campaignName: "حملة تجريبية",
    current: metrics(),
    previous: metrics(),
    worstAd: null,
    ...overrides,
  };
}

describe("runCampaignRules", () => {
  it("flags a campaign spending heavily with zero leads as DANGER", () => {
    const context = ctx({ current: metrics({ spend: 500, clicks: 40, leads: 0 }) });
    const results = runCampaignRules(context, DEFAULT_THRESHOLDS);
    expect(results.some((r) => r.ruleKey === "SPENDING_WITHOUT_RESULTS" && r.type === "DANGER")).toBe(true);
  });

  it("flags high CPL relative to target", () => {
    const context = ctx({ current: metrics({ spend: 3000, clicks: 40, leads: 10 }) }); // CPL = 300, target = 80
    const results = runCampaignRules(context, DEFAULT_THRESHOLDS);
    const hit = results.find((r) => r.ruleKey === "HIGH_CPL");
    expect(hit).toBeDefined();
    expect(hit?.priority).toBe("HIGH");
  });

  it("does not flag CPL when there isn't enough data yet", () => {
    const context = ctx({ current: metrics({ spend: 3000, clicks: 5, leads: 1 }) }); // below minDataPoints
    const results = runCampaignRules(context, DEFAULT_THRESHOLDS);
    expect(results.some((r) => r.ruleKey === "HIGH_CPL")).toBe(false);
  });

  it("flags low CTR", () => {
    const context = ctx({ current: metrics({ impressions: 100000, clicks: 200, leads: 10, spend: 500 }) }); // CTR 0.2%
    const results = runCampaignRules(context, DEFAULT_THRESHOLDS);
    expect(results.some((r) => r.ruleKey === "LOW_CTR")).toBe(true);
  });

  it("flags good leads with zero sales", () => {
    const context = ctx({ current: metrics({ leads: 25, sales: 0, clicks: 500, spend: 1000 }) });
    const results = runCampaignRules(context, DEFAULT_THRESHOLDS);
    expect(results.some((r) => r.ruleKey === "GOOD_LEADS_LOW_SALES")).toBe(true);
  });

  it("flags an excellent ROAS as an opportunity to scale budget", () => {
    const context = ctx({ current: metrics({ spend: 1000, revenue: 6000, clicks: 100, leads: 20 }) }); // ROAS 6x, target 3x
    const results = runCampaignRules(context, DEFAULT_THRESHOLDS);
    expect(results.some((r) => r.ruleKey === "HIGH_ROAS_OPPORTUNITY" && r.type === "OPPORTUNITY")).toBe(true);
  });

  it("flags a performance decline vs. the previous period", () => {
    const context = ctx({
      current: metrics({ spend: 1000, revenue: 1000, clicks: 100, leads: 20 }), // ROAS 1x
      previous: metrics({ spend: 1000, revenue: 4000, clicks: 100, leads: 20 }), // ROAS 4x
    });
    const results = runCampaignRules(context, DEFAULT_THRESHOLDS);
    expect(results.some((r) => r.ruleKey === "PERFORMANCE_DECLINED")).toBe(true);
  });

  it("flags high frequency (audience fatigue)", () => {
    const context = ctx({ current: metrics({ impressions: 500000, reach: 100000, clicks: 100, leads: 20, spend: 1000 }) }); // freq 5x
    const results = runCampaignRules(context, DEFAULT_THRESHOLDS);
    expect(results.some((r) => r.ruleKey === "HIGH_FREQUENCY")).toBe(true);
  });

  it("flags a specific ad wasting budget within an otherwise fine campaign", () => {
    const context = ctx({
      current: metrics({ spend: 1000, revenue: 3500, clicks: 100, leads: 20, sales: 5 }),
      worstAd: { name: "إعلان ضعيف", spend: 600, leads: 0 },
    });
    const results = runCampaignRules(context, DEFAULT_THRESHOLDS);
    expect(results.some((r) => r.ruleKey === "AD_WASTING_BUDGET")).toBe(true);
  });

  it("marks a well-balanced campaign as excellent performance", () => {
    const context = ctx({ current: metrics({ spend: 1000, revenue: 4000, clicks: 200, impressions: 20000, leads: 20, sales: 5 }) });
    const results = runCampaignRules(context, DEFAULT_THRESHOLDS);
    expect(results.some((r) => r.ruleKey === "EXCELLENT_PERFORMANCE")).toBe(true);
  });
});

describe("branchNotConverting", () => {
  it("flags a branch with many leads but very few sales", () => {
    const result = branchNotConverting({ branchId: "b1", branchName: "جازان", leads: 100, sales: 2 }, DEFAULT_THRESHOLDS);
    expect(result).not.toBeNull();
    expect(result?.ruleKey).toBe("BRANCH_NOT_CONVERTING");
  });

  it("does not flag a branch with healthy conversion", () => {
    const result = branchNotConverting({ branchId: "b1", branchName: "جازان", leads: 100, sales: 20 }, DEFAULT_THRESHOLDS);
    expect(result).toBeNull();
  });
});

describe("bestPlatformInsight", () => {
  it("identifies a platform significantly outperforming the rest", () => {
    const result = bestPlatformInsight([
      { platform: "Snapchat Ads", roas: 12 },
      { platform: "Meta Ads", roas: 3 },
      { platform: "Google Ads", roas: 2.5 },
    ]);
    expect(result).not.toBeNull();
    expect(result?.supportingData.bestPlatform).toBe("Snapchat Ads");
  });

  it("returns null when performance is roughly even across platforms", () => {
    const result = bestPlatformInsight([
      { platform: "Meta Ads", roas: 3 },
      { platform: "Google Ads", roas: 3.2 },
    ]);
    expect(result).toBeNull();
  });
});
