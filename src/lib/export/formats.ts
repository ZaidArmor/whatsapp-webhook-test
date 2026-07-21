import type { ExportTargetFormat } from "@prisma/client";

export const EXPORT_FORMAT_LABELS: Record<ExportTargetFormat, string> = {
  CSV: "CSV",
  XLSX: "Excel (XLSX)",
  META_CUSTOM_AUDIENCE: "Meta Custom Audiences",
  GOOGLE_CUSTOMER_MATCH: "Google Customer Match",
  TIKTOK_AUDIENCE: "TikTok Audiences",
  SNAPCHAT_AUDIENCE: "Snapchat Audiences",
  WHATSAPP_CAMPAIGN: "حملات WhatsApp",
};

/** Ad-platform audience formats have a fixed column layout dictated by the platform's
 * bulk-upload spec, unlike the generic CSV/XLSX export where the user picks columns. */
export const FIXED_COLUMN_FORMATS = new Set<ExportTargetFormat>([
  "META_CUSTOM_AUDIENCE",
  "GOOGLE_CUSTOMER_MATCH",
  "TIKTOK_AUDIENCE",
  "SNAPCHAT_AUDIENCE",
  "WHATSAPP_CAMPAIGN",
]);

export const GENERIC_EXPORT_FIELDS = [
  "name",
  "originalPhone",
  "normalizedPhone",
  "email",
  "city",
  "branch",
  "service",
  "tags",
  "customerValue",
  "lastPurchaseDate",
] as const;

export type GenericExportField = (typeof GENERIC_EXPORT_FIELDS)[number];

export const GENERIC_EXPORT_FIELD_LABELS: Record<GenericExportField, string> = {
  name: "الاسم",
  originalPhone: "رقم الجوال الأصلي",
  normalizedPhone: "رقم الجوال الموحد",
  email: "البريد الإلكتروني",
  city: "المدينة",
  branch: "الفرع",
  service: "الخدمة",
  tags: "الوسوم",
  customerValue: "قيمة العميل",
  lastPurchaseDate: "تاريخ آخر شراء",
};

export interface ExportableCustomer {
  name: string;
  originalPhone: string;
  normalizedPhone: string | null;
  email: string | null;
  city: string | null;
  branchName: string | null;
  serviceName: string | null;
  tagNames: string[];
  potentialValue: number;
  totalPurchaseValue: number;
  lastPurchaseAt: Date | null;
}

function e164NoPlus(phone: string | null): string {
  return phone ? phone.replace(/^\+/, "") : "";
}

function splitName(name: string): { first: string; last: string } {
  const parts = name.trim().split(/\s+/);
  return { first: parts[0] ?? name, last: parts.slice(1).join(" ") || parts[0] || name };
}

export function buildExportRow(
  customer: ExportableCustomer,
  format: ExportTargetFormat,
  fields: GenericExportField[],
  maskSensitive: boolean
): Record<string, unknown> {
  if (format === "META_CUSTOM_AUDIENCE") {
    return { phone: e164NoPlus(customer.normalizedPhone), email: customer.email ?? "" };
  }
  if (format === "GOOGLE_CUSTOMER_MATCH") {
    const { first, last } = splitName(customer.name);
    return { Email: customer.email ?? "", Phone: customer.normalizedPhone ?? "", First_Name: first, Last_Name: last };
  }
  if (format === "TIKTOK_AUDIENCE") {
    return { phone_number: e164NoPlus(customer.normalizedPhone), email: customer.email ?? "" };
  }
  if (format === "SNAPCHAT_AUDIENCE") {
    return { Phone: e164NoPlus(customer.normalizedPhone), Email: customer.email ?? "" };
  }
  if (format === "WHATSAPP_CAMPAIGN") {
    return { phone: customer.normalizedPhone ?? "", name: customer.name };
  }

  // Generic CSV/XLSX with user-selected columns.
  const row: Record<string, unknown> = {};
  for (const field of fields) {
    const label = GENERIC_EXPORT_FIELD_LABELS[field];
    switch (field) {
      case "name":
        row[label] = customer.name;
        break;
      case "originalPhone":
        row[label] = maskSensitive ? maskForExport(customer.originalPhone) : customer.originalPhone;
        break;
      case "normalizedPhone":
        row[label] = maskSensitive ? maskForExport(customer.normalizedPhone ?? "") : (customer.normalizedPhone ?? "");
        break;
      case "email":
        row[label] = maskSensitive ? maskForExport(customer.email ?? "") : (customer.email ?? "");
        break;
      case "city":
        row[label] = customer.city ?? "";
        break;
      case "branch":
        row[label] = customer.branchName ?? "";
        break;
      case "service":
        row[label] = customer.serviceName ?? "";
        break;
      case "tags":
        row[label] = customer.tagNames.join("، ");
        break;
      case "customerValue":
        row[label] = customer.potentialValue;
        break;
      case "lastPurchaseDate":
        row[label] = customer.lastPurchaseAt ? customer.lastPurchaseAt.toISOString().slice(0, 10) : "";
        break;
    }
  }
  return row;
}

function maskForExport(value: string): string {
  if (!value) return value;
  if (value.length <= 4) return "•".repeat(value.length);
  return `${value.slice(0, 2)}${"•".repeat(value.length - 4)}${value.slice(-2)}`;
}
