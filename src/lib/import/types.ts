export const IMPORTABLE_FIELDS = [
  "name",
  "phone",
  "email",
  "city",
  "branch",
  "service",
  "campaign",
  "source",
  "notes",
] as const;

export type ImportableField = (typeof IMPORTABLE_FIELDS)[number];

export const IMPORTABLE_FIELD_LABELS: Record<ImportableField, string> = {
  name: "اسم العميل",
  phone: "رقم الجوال",
  email: "البريد الإلكتروني",
  city: "المدينة",
  branch: "الفرع",
  service: "الخدمة",
  campaign: "الحملة",
  source: "مصدر العميل",
  notes: "ملاحظات",
};

export const REQUIRED_IMPORTABLE_FIELDS: ImportableField[] = ["name", "phone"];

export type RawRow = Record<string, string>;

export interface CleanedRow {
  rowNumber: number;
  raw: RawRow;
  name: string;
  originalPhone: string;
  normalizedPhone: string | null;
  phoneValidity: "VALID" | "INVALID" | "UNKNOWN";
  countryCode: string | null;
  email: string | null;
  city: string | null;
  branchName: string | null;
  branchId: string | null;
  serviceName: string | null;
  serviceId: string | null;
  campaignName: string | null;
  campaignId: string | null;
  source: string | null;
  notes: string | null;
  errors: string[];
  isDuplicateInFile: boolean;
  isDuplicateInDb: boolean;
}

export type RowOutcome = "ACCEPTED" | "REJECTED" | "DUPLICATE";

export function outcomeForRow(row: Pick<CleanedRow, "errors" | "isDuplicateInFile" | "isDuplicateInDb">): RowOutcome {
  if (row.errors.length > 0) return "REJECTED";
  if (row.isDuplicateInFile || row.isDuplicateInDb) return "DUPLICATE";
  return "ACCEPTED";
}
