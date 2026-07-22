import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { readWorkbook, getSheetNames, sheetToRows } from "@/lib/import/parse";
import { cleanRow, markInFileDuplicates, type ImportReferenceData } from "@/lib/import/clean";
import { outcomeForRow, type ImportableField } from "@/lib/import/types";

function buildCsvBuffer(csv: string): ArrayBuffer {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(csv);
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

function buildXlsxBuffer(rows: string[][]): ArrayBuffer {
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Customers");
  const out = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
  return out as ArrayBuffer;
}

const emptyReference: ImportReferenceData = { branches: [], services: [], campaigns: [] };

const referenceWithBranch: ImportReferenceData = {
  branches: [{ id: "branch-abha", names: ["أبها", "Abha"] }],
  services: [{ id: "service-ppf", names: ["أفلام حماية الطلاء PPF", "PPF"] }],
  campaigns: [],
};

describe("Import pipeline — CSV end to end", () => {
  it("parses a CSV file, maps columns, cleans rows, and classifies outcomes", () => {
    const csv = [
      "Mobile,Name,Branch,Service",
      "0512345678,أحمد محمد,أبها,PPF",
      "0598765432,سارة علي,أبها,PPF",
      ",بدون رقم,أبها,PPF", // missing phone -> rejected
      "0512345678,تكرار لنفس الرقم,أبها,PPF", // duplicate of row 1 within the file
    ].join("\n");

    const workbook = readWorkbook(buildCsvBuffer(csv));
    const sheetNames = getSheetNames(workbook);
    expect(sheetNames).toHaveLength(1);

    const { headers, rows } = sheetToRows(workbook, sheetNames[0]!);
    expect(headers).toEqual(["Mobile", "Name", "Branch", "Service"]);
    expect(rows).toHaveLength(4);

    const mapping: Record<string, ImportableField | null> = {
      Mobile: "phone",
      Name: "name",
      Branch: "branch",
      Service: "service",
    };

    let cleaned = rows.map((raw, i) => cleanRow(raw, i + 2, mapping, referenceWithBranch));
    cleaned = markInFileDuplicates(cleaned);

    expect(cleaned[0]!.normalizedPhone).toBe("+966512345678");
    expect(cleaned[0]!.branchId).toBe("branch-abha");
    expect(cleaned[0]!.serviceId).toBe("service-ppf");

    const outcomes = cleaned.map(outcomeForRow);
    expect(outcomes).toEqual(["ACCEPTED", "ACCEPTED", "REJECTED", "DUPLICATE"]);

    const accepted = outcomes.filter((o) => o === "ACCEPTED").length;
    const rejected = outcomes.filter((o) => o === "REJECTED").length;
    const duplicate = outcomes.filter((o) => o === "DUPLICATE").length;
    expect({ accepted, rejected, duplicate }).toEqual({ accepted: 2, rejected: 1, duplicate: 1 });
  });

  it("rejects rows with an invalid email even when phone is valid", () => {
    const csv = ["Mobile,Name,Email", "0512345678,عميل,not-an-email"].join("\n");
    const workbook = readWorkbook(buildCsvBuffer(csv));
    const { rows } = sheetToRows(workbook, getSheetNames(workbook)[0]!);
    const mapping: Record<string, ImportableField | null> = { Mobile: "phone", Name: "name", Email: "email" };

    const cleaned = rows.map((raw, i) => cleanRow(raw, i + 2, mapping, emptyReference));
    expect(outcomeForRow(cleaned[0]!)).toBe("REJECTED");
    expect(cleaned[0]!.errors).toContain("صيغة البريد الإلكتروني غير صحيحة");
  });
});

describe("Import pipeline — XLSX with multiple sheets", () => {
  it("reads sheet names and parses the selected sheet's rows", () => {
    const sheet1 = [
      ["Mobile", "Name"],
      ["0512345678", "عميل الورقة الأولى"],
    ];
    const workbook = readWorkbook(buildXlsxBuffer(sheet1));
    const sheetNames = getSheetNames(workbook);
    expect(sheetNames).toContain("Customers");

    const { headers, rows } = sheetToRows(workbook, "Customers");
    expect(headers).toEqual(["Mobile", "Name"]);
    expect(rows[0]!.Name).toBe("عميل الورقة الأولى");

    const mapping: Record<string, ImportableField | null> = { Mobile: "phone", Name: "name" };
    const cleaned = rows.map((raw, i) => cleanRow(raw, i + 2, mapping, emptyReference));
    expect(cleaned[0]!.normalizedPhone).toBe("+966512345678");
    expect(outcomeForRow(cleaned[0]!)).toBe("ACCEPTED");
  });
});

describe("Import pipeline — Arabic-Indic digits and messy formats", () => {
  it("normalizes a row whose phone uses Arabic-Indic digits and dashes", () => {
    const csv = ["Mobile,Name", "٠٥-١٢٣٤-٥٦٧٨,عميل بأرقام عربية"].join("\n");
    const workbook = readWorkbook(buildCsvBuffer(csv));
    const { rows } = sheetToRows(workbook, getSheetNames(workbook)[0]!);
    const mapping: Record<string, ImportableField | null> = { Mobile: "phone", Name: "name" };

    const cleaned = rows.map((raw, i) => cleanRow(raw, i + 2, mapping, emptyReference));
    expect(cleaned[0]!.normalizedPhone).toBe("+966512345678");
    expect(cleaned[0]!.phoneValidity).toBe("VALID");
  });
});
