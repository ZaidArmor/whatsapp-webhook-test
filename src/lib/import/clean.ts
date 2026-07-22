import { normalizePhone } from "@/lib/phone/normalize";
import type { CleanedRow, ImportableField, RawRow } from "./types";

export interface ReferenceOption {
  id: string;
  names: string[];
}

export interface ImportReferenceData {
  branches: ReferenceOption[];
  services: ReferenceOption[];
  campaigns: ReferenceOption[];
}

function normalizeForMatch(value: string): string {
  return value.trim().toLowerCase();
}

function matchReference(value: string | undefined, options: ReferenceOption[]): { id: string | null; name: string | null } {
  if (!value?.trim()) return { id: null, name: null };
  const target = normalizeForMatch(value);
  const match = options.find((option) => option.names.some((name) => normalizeForMatch(name) === target));
  return match ? { id: match.id, name: value.trim() } : { id: null, name: value.trim() };
}

export function cleanRow(
  raw: RawRow,
  rowNumber: number,
  columnMapping: Record<string, ImportableField | null>,
  reference: ImportReferenceData
): CleanedRow {
  const getMapped = (field: ImportableField): string => {
    const header = Object.entries(columnMapping).find(([, mapped]) => mapped === field)?.[0];
    return header ? (raw[header] ?? "").trim() : "";
  };

  const errors: string[] = [];

  const name = getMapped("name");
  if (!name) errors.push("اسم العميل مفقود");

  const rawPhone = getMapped("phone");
  if (!rawPhone) errors.push("رقم الجوال مفقود");
  const normalized = rawPhone ? normalizePhone(rawPhone) : { normalized: null, validity: "UNKNOWN" as const, countryCode: null };

  const email = getMapped("email") || null;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push("صيغة البريد الإلكتروني غير صحيحة");
  }

  const branchMatch = matchReference(getMapped("branch"), reference.branches);
  const serviceMatch = matchReference(getMapped("service"), reference.services);
  const campaignMatch = matchReference(getMapped("campaign"), reference.campaigns);

  return {
    rowNumber,
    raw,
    name,
    originalPhone: rawPhone,
    normalizedPhone: normalized.normalized,
    phoneValidity: normalized.validity,
    countryCode: normalized.countryCode,
    email,
    city: getMapped("city") || null,
    branchName: branchMatch.name,
    branchId: branchMatch.id,
    serviceName: serviceMatch.name,
    serviceId: serviceMatch.id,
    campaignName: campaignMatch.name,
    campaignId: campaignMatch.id,
    source: getMapped("source") || null,
    notes: getMapped("notes") || null,
    errors,
    isDuplicateInFile: false,
    isDuplicateInDb: false,
  };
}

/** Marks rows sharing the same normalized phone (or email, when phone is missing) within the same file. */
export function markInFileDuplicates(rows: CleanedRow[]): CleanedRow[] {
  const seenPhones = new Set<string>();
  const seenEmails = new Set<string>();

  return rows.map((row) => {
    const key = row.normalizedPhone ?? row.email ?? null;
    if (!key) return row;

    const isPhone = Boolean(row.normalizedPhone);
    const seen = isPhone ? seenPhones : seenEmails;
    const isDuplicateInFile = seen.has(key);
    seen.add(key);

    return { ...row, isDuplicateInFile };
  });
}
