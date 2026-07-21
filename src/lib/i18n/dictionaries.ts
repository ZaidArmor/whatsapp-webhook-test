export const locales = ["ar", "en"] as const;
export type Locale = (typeof locales)[number];

export interface Dictionary {
  appName: string;
  nav: {
    dashboard: string;
    integrations: string;
    campaigns: string;
    analytics: string;
    recommendations: string;
    customers: string;
    segments: string;
    exports: string;
    reports: string;
    branches: string;
    services: string;
    alerts: string;
    users: string;
    settings: string;
    auditLog: string;
  };
  common: {
    search: string;
    filters: string;
    export: string;
    import: string;
    save: string;
    cancel: string;
    confirm: string;
    edit: string;
    delete: string;
    view: string;
    loading: string;
    noData: string;
    noResults: string;
    permissionDenied: string;
    error: string;
    retry: string;
    success: string;
    today: string;
    yesterday: string;
    last7Days: string;
    last30Days: string;
    thisMonth: string;
    lastMonth: string;
    thisQuarter: string;
    thisYear: string;
    custom: string;
  };
}

export const dictionaries: Record<Locale, Dictionary> = {
  ar: {
    appName: "ARMOR - مركز الذكاء التسويقي",
    nav: {
      dashboard: "الرئيسية",
      integrations: "ربط الحسابات",
      campaigns: "الحملات الإعلانية",
      analytics: "التحليلات",
      recommendations: "التوصيات",
      customers: "العملاء",
      segments: "الشرائح",
      exports: "التصدير",
      reports: "التقارير",
      branches: "الفروع",
      services: "الخدمات",
      alerts: "التنبيهات",
      users: "المستخدمون",
      settings: "الإعدادات",
      auditLog: "سجل التدقيق",
    },
    common: {
      search: "بحث...",
      filters: "الفلاتر",
      export: "تصدير",
      import: "استيراد",
      save: "حفظ",
      cancel: "إلغاء",
      confirm: "تأكيد",
      edit: "تعديل",
      delete: "حذف",
      view: "عرض",
      loading: "جارٍ التحميل...",
      noData: "لا توجد بيانات",
      noResults: "لا توجد نتائج مطابقة",
      permissionDenied: "لا تملك صلاحية الوصول إلى هذا القسم",
      error: "حدث خطأ غير متوقع",
      retry: "إعادة المحاولة",
      success: "تمت العملية بنجاح",
      today: "اليوم",
      yesterday: "أمس",
      last7Days: "آخر 7 أيام",
      last30Days: "آخر 30 يوماً",
      thisMonth: "هذا الشهر",
      lastMonth: "الشهر الماضي",
      thisQuarter: "هذا الربع",
      thisYear: "هذه السنة",
      custom: "فترة مخصصة",
    },
  },
  en: {
    appName: "ARMOR Marketing Intelligence Hub",
    nav: {
      dashboard: "Dashboard",
      integrations: "Integrations",
      campaigns: "Campaigns",
      analytics: "Analytics",
      recommendations: "Recommendations",
      customers: "Customers",
      segments: "Segments",
      exports: "Exports",
      reports: "Reports",
      branches: "Branches",
      services: "Services",
      alerts: "Alerts",
      users: "Users",
      settings: "Settings",
      auditLog: "Audit Log",
    },
    common: {
      search: "Search...",
      filters: "Filters",
      export: "Export",
      import: "Import",
      save: "Save",
      cancel: "Cancel",
      confirm: "Confirm",
      edit: "Edit",
      delete: "Delete",
      view: "View",
      loading: "Loading...",
      noData: "No data available",
      noResults: "No matching results",
      permissionDenied: "You don't have permission to view this section",
      error: "Something went wrong",
      retry: "Retry",
      success: "Operation completed successfully",
      today: "Today",
      yesterday: "Yesterday",
      last7Days: "Last 7 days",
      last30Days: "Last 30 days",
      thisMonth: "This month",
      lastMonth: "Last month",
      thisQuarter: "This quarter",
      thisYear: "This year",
      custom: "Custom range",
    },
  },
} as const;

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export const dir = (locale: Locale): "rtl" | "ltr" => (locale === "ar" ? "rtl" : "ltr");
