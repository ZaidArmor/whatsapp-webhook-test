import { prisma } from "@/lib/prisma";

export interface AnalysisThresholds {
  targetCpl: number;
  targetCac: number;
  targetRoas: number;
  minCtr: number;
  maxCpm: number;
  maxFrequency: number;
  targetConversionRate: number;
  minDataPoints: number;
}

export const DEFAULT_THRESHOLDS: AnalysisThresholds = {
  targetCpl: 80,
  targetCac: 400,
  targetRoas: 3,
  minCtr: 1,
  maxCpm: 40,
  maxFrequency: 3.5,
  targetConversionRate: 15,
  minDataPoints: 30,
};

const SETTING_KEY = "analysis_thresholds";

export async function getThresholds(): Promise<AnalysisThresholds> {
  const setting = await prisma.setting.findUnique({ where: { key: SETTING_KEY } });
  if (!setting) return DEFAULT_THRESHOLDS;
  return { ...DEFAULT_THRESHOLDS, ...(setting.value as Partial<AnalysisThresholds>) };
}

export async function saveThresholds(thresholds: AnalysisThresholds): Promise<void> {
  const value = JSON.parse(JSON.stringify(thresholds));
  await prisma.setting.upsert({
    where: { key: SETTING_KEY },
    update: { value },
    create: { key: SETTING_KEY, value },
  });
}
