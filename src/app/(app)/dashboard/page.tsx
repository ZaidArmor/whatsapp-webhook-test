import {
  Banknote,
  TrendingUp,
  Users,
  MessageCircle,
  CalendarCheck,
  ShoppingCart,
  Target,
  UserPlus,
  Gauge,
  Percent,
  Receipt,
  UserPlus2,
  Repeat,
  Megaphone,
  Star,
  Building2,
  Wrench,
} from "lucide-react";
import { getDashboardData } from "@/lib/data/dashboard";
import { resolveDateRange } from "@/lib/data/date-ranges";
import type { DashboardFilters, DateRangePreset } from "@/types";
import { KpiCard } from "@/components/shared/kpi-card";
import { ChartCard } from "@/components/shared/chart-card";
import { DashboardFilters as DashboardFiltersBar } from "./dashboard-filters";
import { SpendVsRevenueChart } from "@/components/dashboard/charts/spend-vs-revenue-chart";
import { LeadsByDayChart } from "@/components/dashboard/charts/leads-by-day-chart";
import { SalesByPlatformChart } from "@/components/dashboard/charts/sales-by-platform-chart";
import { ConversionRateChart } from "@/components/dashboard/charts/conversion-rate-chart";
import { BranchPerformanceChart } from "@/components/dashboard/charts/branch-performance-chart";
import { BudgetDistributionChart } from "@/components/dashboard/charts/budget-distribution-chart";
import { NewVsReturningChart } from "@/components/dashboard/charts/new-vs-returning-chart";
import { ServicePerformanceChart } from "@/components/dashboard/charts/service-performance-chart";
import { CampaignRankingChart } from "@/components/dashboard/charts/campaign-ranking-chart";
import { MarketingFunnelChart } from "@/components/dashboard/charts/marketing-funnel-chart";

interface DashboardPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const preset = (params.preset as DateRangePreset) ?? "last30Days";
  const range = resolveDateRange(preset, { from: params.from, to: params.to });

  const filters: DashboardFilters = {
    range,
    preset,
    branchId: params.branchId,
    platform: params.platform,
    campaignId: params.campaignId,
    serviceId: params.serviceId,
    city: params.city,
    source: params.source,
  };

  const { kpis, comparison, charts, filterOptions } = await getDashboardData(filters);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">لوحة التحكم الرئيسية</h1>
          <p className="text-sm text-muted-foreground">نظرة عامة على أداء التسويق والمبيعات</p>
        </div>
      </div>

      <DashboardFiltersBar options={filterOptions} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
        <KpiCard label="إجمالي الإنفاق الإعلاني" value={kpis.spend} format="currency" icon={<Banknote className="h-4 w-4" />} comparison={comparison.spend} />
        <KpiCard label="إجمالي الإيرادات" value={kpis.revenue} format="currency" icon={<TrendingUp className="h-4 w-4" />} comparison={comparison.revenue} />
        <KpiCard label="عدد العملاء المحتملين" value={kpis.leads} icon={<Users className="h-4 w-4" />} comparison={comparison.leads} />
        <KpiCard label="عدد المحادثات" value={kpis.conversations} icon={<MessageCircle className="h-4 w-4" />} />
        <KpiCard label="عدد الحجوزات" value={kpis.bookings} icon={<CalendarCheck className="h-4 w-4" />} />
        <KpiCard label="عدد المبيعات" value={kpis.sales} icon={<ShoppingCart className="h-4 w-4" />} comparison={comparison.sales} />
        <KpiCard
          label="تكلفة العميل المحتمل CPL"
          value={kpis.cpl}
          format="currency"
          icon={<Target className="h-4 w-4" />}
          comparison={comparison.cpl}
          tooltip="CPL = الإنفاق ÷ عدد العملاء المحتملين"
        />
        <KpiCard
          label="تكلفة الاستحواذ CAC"
          value={kpis.cac}
          format="currency"
          icon={<UserPlus className="h-4 w-4" />}
          tooltip="CAC = الإنفاق ÷ عدد العملاء المكتسبين (المبيعات)"
        />
        <KpiCard
          label="العائد على الإنفاق ROAS"
          value={kpis.roas}
          format="number"
          icon={<Gauge className="h-4 w-4" />}
          comparison={comparison.roas}
          tooltip="ROAS = الإيرادات ÷ الإنفاق"
        />
        <KpiCard
          label="معدل التحويل"
          value={kpis.conversionRate}
          format="percent"
          icon={<Percent className="h-4 w-4" />}
          tooltip="معدل التحويل = المبيعات ÷ العملاء المحتملين × 100"
        />
        <KpiCard label="متوسط قيمة الفاتورة" value={kpis.aov} format="currency" icon={<Receipt className="h-4 w-4" />} />
        <KpiCard label="عدد العملاء الجدد" value={kpis.newCustomers} icon={<UserPlus2 className="h-4 w-4" />} />
        <KpiCard label="عدد العملاء العائدين" value={kpis.returningCustomers} icon={<Repeat className="h-4 w-4" />} />
        <KpiCard label="أفضل منصة إعلانية" value={kpis.bestPlatform?.label ?? null} format="text" icon={<Megaphone className="h-4 w-4" />} />
        <KpiCard label="أفضل حملة" value={kpis.bestCampaign?.label ?? null} format="text" icon={<Star className="h-4 w-4" />} />
        <KpiCard label="أفضل فرع" value={kpis.bestBranch?.label ?? null} format="text" icon={<Building2 className="h-4 w-4" />} />
        <KpiCard label="أفضل خدمة من حيث المبيعات" value={kpis.bestService?.label ?? null} format="text" icon={<Wrench className="h-4 w-4" />} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="الإنفاق مقابل الإيرادات" className="lg:col-span-2">
          <SpendVsRevenueChart data={charts.spendVsRevenue} />
        </ChartCard>

        <ChartCard title="العملاء المحتملون حسب اليوم">
          <LeadsByDayChart data={charts.leadsByDay} />
        </ChartCard>

        <ChartCard title="معدل التحويل عبر الزمن">
          <ConversionRateChart data={charts.conversionRateByDay} />
        </ChartCard>

        <ChartCard title="المبيعات حسب المنصة">
          <SalesByPlatformChart data={charts.salesByPlatform} />
        </ChartCard>

        <ChartCard title="توزيع الميزانية حسب المنصة" description="بالآلاف (ر.س)">
          <BudgetDistributionChart data={charts.budgetDistribution} />
        </ChartCard>

        <ChartCard title="أداء الفروع">
          <BranchPerformanceChart data={charts.branchPerformance} />
        </ChartCard>

        <ChartCard title="العملاء الجدد مقابل العملاء العائدين">
          <NewVsReturningChart data={charts.newVsReturning} />
        </ChartCard>

        <ChartCard title="أداء الخدمات">
          <ServicePerformanceChart data={charts.servicePerformance} />
        </ChartCard>

        <ChartCard title="أفضل وأسوأ الحملات (حسب ROAS)" className="lg:col-span-2">
          <CampaignRankingChart data={charts.campaignRanking} />
        </ChartCard>

        <ChartCard title="مسار التحويل التسويقي" description="من مرات الظهور إلى المبيعات" className="lg:col-span-2">
          <MarketingFunnelChart data={charts.funnel} />
        </ChartCard>
      </div>
    </div>
  );
}
