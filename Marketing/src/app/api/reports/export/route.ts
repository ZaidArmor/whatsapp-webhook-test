import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { ReportKind } from "@prisma/client";
import { requirePermission } from "@/lib/auth/workspace";
import { getT } from "@/lib/i18n/server";
import { generateReport } from "@/lib/reports/generate";
import { logAudit } from "@/lib/audit";

export async function GET(request: NextRequest) {
  let ctx;
  try {
    ctx = await requirePermission("export_data");
  } catch {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const kindRaw = searchParams.get("kind") ?? "";
  const format = searchParams.get("format") === "xlsx" ? "xlsx" : "csv";
  if (!Object.values(ReportKind).includes(kindRaw as ReportKind)) {
    return NextResponse.json({ error: "INVALID_KIND" }, { status: 400 });
  }
  const kind = kindRaw as ReportKind;

  const { t } = await getT();
  const report = await generateReport(ctx.workspaceId, kind);

  // Cells holding i18n keys (e.g. platforms.FACEBOOK) are translated here;
  // translate() falls back to the raw string for plain text.
  const header = report.columns.map((c) => t(c.labelKey));
  const rows = report.rows.map((row) =>
    report.columns.map((c) => {
      const value = row[c.key];
      return typeof value === "string" ? t(value) : (value ?? "");
    })
  );

  await logAudit({
    workspaceId: ctx.workspaceId,
    userId: ctx.userId,
    action: "EXPORT",
    entityType: "Report",
    metadata: { kind, format },
  });

  const fileBase = `report-${kind.toLowerCase()}-${new Date().toISOString().slice(0, 10)}`;

  if (format === "xlsx") {
    const sheet = XLSX.utils.aoa_to_sheet([header, ...rows]);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "Report");
    const buffer = XLSX.write(book, { type: "buffer", bookType: "xlsx" }) as Buffer;
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileBase}.xlsx"`,
      },
    });
  }

  const escape = (cell: string | number) => {
    const str = String(cell);
    return /[",\n]/.test(str) ? `"${str.replaceAll('"', '""')}"` : str;
  };
  // BOM so Excel opens Arabic CSV correctly.
  const csv = "﻿" + [header, ...rows].map((row) => row.map(escape).join(",")).join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileBase}.csv"`,
    },
  });
}
