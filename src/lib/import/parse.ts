import * as XLSX from "xlsx";
import type { RawRow } from "./types";

export function readWorkbook(data: ArrayBuffer): XLSX.WorkBook {
  return XLSX.read(data, { type: "array", codepage: 65001 });
}

export function getSheetNames(workbook: XLSX.WorkBook): string[] {
  return workbook.SheetNames;
}

/** Extracts the header row + data rows (as plain string maps) from a given sheet. */
export function sheetToRows(workbook: XLSX.WorkBook, sheetName: string): { headers: string[]; rows: RawRow[] } {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return { headers: [], rows: [] };

  const matrix = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, blankrows: false, defval: "" });
  if (matrix.length === 0) return { headers: [], rows: [] };

  const headerRow = matrix[0] ?? [];
  const headers = headerRow.map((h, i) => (h?.toString().trim() ? h.toString().trim() : `عمود ${i + 1}`));

  const rows: RawRow[] = matrix.slice(1).map((line) => {
    const row: RawRow = {};
    headers.forEach((header, i) => {
      const value = line[i];
      row[header] = value === undefined || value === null ? "" : String(value).trim();
    });
    return row;
  });

  return { headers, rows };
}
