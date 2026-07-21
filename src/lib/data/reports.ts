import { prisma } from "@/lib/prisma";
import { getCampaignsList } from "./campaigns";
import { getCustomersList } from "./customers";
import { getSegmentsList } from "./segments";
import { formatDate } from "@/lib/utils";

export const REPORT_TYPES = [
  "campaigns",
  "platforms",
  "branches",
  "services",
  "leads",
  "sales",
  "roas",
  "customers",
  "retargeting",
  "dataQuality",
  "imports",
] as const;

export type ReportType = (typeof REPORT_TYPES)[number];

export const REPORT_LABELS: Record<ReportType, string> = {
  campaigns: "تقرير أداء الحملات",
  platforms: "تقرير أداء المنصات",
  branches: "تقرير أداء الفروع",
  services: "تقرير أداء الخدمات",
  leads: "تقرير العملاء المحتملين (Leads)",
  sales: "تقرير المبيعات",
  roas: "تقرير العائد على الإنفاق (ROAS)",
  customers: "تقرير العملاء",
  retargeting: "تقرير إعادة الاستهداف",
  dataQuality: "تقرير جودة البيانات",
  imports: "تقرير عمليات الاستيراد",
};

export interface ReportResult {
  rows: Array<Record<string, unknown>>;
}

export async function getReportData(type: ReportType): Promise<ReportResult> {
  switch (type) {
    case "campaigns": {
      const campaigns = await getCampaignsList();
      return {
        rows: campaigns.map((c) => ({
          "اسم الحملة": c.name,
          المنصة: c.platform,
          الفرع: c.branchName,
          الخدمة: c.serviceName,
          الإنفاق: c.spend,
          الإيرادات: c.revenue,
          ROAS: c.roas,
          CPL: c.cpl,
          Leads: c.leads,
          المبيعات: c.sales,
          التقييم: c.rating,
        })),
      };
    }
    case "platforms": {
      const campaigns = await getCampaignsList();
      const map = new Map<string, { spend: number; revenue: number; leads: number; sales: number }>();
      for (const c of campaigns) {
        const entry = map.get(c.platform) ?? { spend: 0, revenue: 0, leads: 0, sales: 0 };
        entry.spend += c.spend;
        entry.revenue += c.revenue;
        entry.leads += c.leads;
        entry.sales += c.sales;
        map.set(c.platform, entry);
      }
      return {
        rows: Array.from(map.entries()).map(([platform, v]) => ({
          المنصة: platform,
          الإنفاق: Math.round(v.spend),
          الإيرادات: Math.round(v.revenue),
          ROAS: v.spend > 0 ? Number((v.revenue / v.spend).toFixed(2)) : null,
          Leads: v.leads,
          المبيعات: v.sales,
        })),
      };
    }
    case "branches": {
      const campaigns = await getCampaignsList();
      const map = new Map<string, { spend: number; revenue: number; leads: number; sales: number }>();
      for (const c of campaigns) {
        const key = c.branchName ?? "—";
        const entry = map.get(key) ?? { spend: 0, revenue: 0, leads: 0, sales: 0 };
        entry.spend += c.spend;
        entry.revenue += c.revenue;
        entry.leads += c.leads;
        entry.sales += c.sales;
        map.set(key, entry);
      }
      return {
        rows: Array.from(map.entries()).map(([branch, v]) => ({
          الفرع: branch,
          الإنفاق: Math.round(v.spend),
          الإيرادات: Math.round(v.revenue),
          ROAS: v.spend > 0 ? Number((v.revenue / v.spend).toFixed(2)) : null,
          Leads: v.leads,
          المبيعات: v.sales,
        })),
      };
    }
    case "services": {
      const campaigns = await getCampaignsList();
      const map = new Map<string, { spend: number; revenue: number; leads: number; sales: number }>();
      for (const c of campaigns) {
        const key = c.serviceName ?? "—";
        const entry = map.get(key) ?? { spend: 0, revenue: 0, leads: 0, sales: 0 };
        entry.spend += c.spend;
        entry.revenue += c.revenue;
        entry.leads += c.leads;
        entry.sales += c.sales;
        map.set(key, entry);
      }
      return {
        rows: Array.from(map.entries()).map(([service, v]) => ({
          الخدمة: service,
          الإنفاق: Math.round(v.spend),
          الإيرادات: Math.round(v.revenue),
          ROAS: v.spend > 0 ? Number((v.revenue / v.spend).toFixed(2)) : null,
          Leads: v.leads,
          المبيعات: v.sales,
        })),
      };
    }
    case "leads": {
      const leads = await prisma.lead.findMany({
        include: { customer: true, campaign: true, branch: true, service: true },
        orderBy: { createdAt: "desc" },
        take: 1000,
      });
      return {
        rows: leads.map((l) => ({
          العميل: l.customer.name,
          الحملة: l.campaign?.name ?? "—",
          الفرع: l.branch?.name ?? "—",
          الخدمة: l.service?.nameAr ?? "—",
          التاريخ: formatDate(l.createdAt),
        })),
      };
    }
    case "sales": {
      const sales = await prisma.sale.findMany({
        include: { customer: true, campaign: true, branch: true, service: true },
        orderBy: { soldAt: "desc" },
        take: 1000,
      });
      return {
        rows: sales.map((s) => ({
          العميل: s.customer.name,
          الحملة: s.campaign?.name ?? "—",
          الفرع: s.branch?.name ?? "—",
          الخدمة: s.service?.nameAr ?? "—",
          المبلغ: Number(s.amount),
          التاريخ: formatDate(s.soldAt),
        })),
      };
    }
    case "roas": {
      const campaigns = await getCampaignsList();
      return {
        rows: campaigns
          .map((c) => ({ "اسم الحملة": c.name, المنصة: c.platform, الإنفاق: Math.round(c.spend), الإيرادات: Math.round(c.revenue), ROAS: c.roas }))
          .sort((a, b) => (b.ROAS ?? 0) - (a.ROAS ?? 0)),
      };
    }
    case "customers": {
      const customers = await getCustomersList();
      return {
        rows: customers.map((c) => ({
          الاسم: c.name,
          المدينة: c.city,
          الفرع: c.branchName,
          الخدمة: c.serviceName,
          الحالة: c.status,
          "القيمة المحتملة": c.potentialValue,
          "قيمة المشتريات": c.totalPurchaseValue,
        })),
      };
    }
    case "retargeting": {
      const segments = await getSegmentsList();
      return {
        rows: segments.map((s) => ({
          "اسم الشريحة": s.name,
          "عدد العملاء": s.customerCountCache,
          "أنشئت بواسطة": s.ownerName,
          الحالة: s.isArchived ? "مؤرشفة" : "نشطة",
        })),
      };
    }
    case "dataQuality": {
      const [total, valid, invalid, unknown, duplicates, noEmail, noConsent] = await Promise.all([
        prisma.customer.count({ where: { deletedAt: null } }),
        prisma.customer.count({ where: { deletedAt: null, phoneValidity: "VALID" } }),
        prisma.customer.count({ where: { deletedAt: null, phoneValidity: "INVALID" } }),
        prisma.customer.count({ where: { deletedAt: null, phoneValidity: "UNKNOWN" } }),
        prisma.customer.count({ where: { deletedAt: null, isDuplicate: true } }),
        prisma.customer.count({ where: { deletedAt: null, email: null } }),
        prisma.customer.count({ where: { deletedAt: null, marketingConsent: false } }),
      ]);
      return {
        rows: [
          { المؤشر: "إجمالي العملاء", القيمة: total },
          { المؤشر: "أرقام صحيحة", القيمة: valid },
          { المؤشر: "أرقام غير صحيحة", القيمة: invalid },
          { المؤشر: "أرقام غير معروفة", القيمة: unknown },
          { المؤشر: "سجلات مكررة", القيمة: duplicates },
          { المؤشر: "بدون بريد إلكتروني", القيمة: noEmail },
          { المؤشر: "بدون موافقة تسويقية", القيمة: noConsent },
        ],
      };
    }
    case "imports": {
      const jobs = await prisma.importJob.findMany({ include: { user: true }, orderBy: { createdAt: "desc" }, take: 200 });
      return {
        rows: jobs.map((j) => ({
          الملف: j.fileName,
          المستخدم: j.user.name,
          الإجمالي: j.totalRows,
          مقبولة: j.acceptedRows,
          مرفوضة: j.rejectedRows,
          مكررة: j.duplicateRows,
          الحالة: j.status,
          التاريخ: formatDate(j.createdAt),
        })),
      };
    }
    default:
      return { rows: [] };
  }
}
