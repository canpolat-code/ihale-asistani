// Builds a downloadable Excel "Birim Fiyat Teklif Cetveli" from the
// project's priced tender items.
import * as XLSX from "xlsx";
import type { TenderItemRow } from "@workspace/db";

export function buildTenderExportWorkbook(
  projectName: string,
  items: TenderItemRow[],
): Buffer {
  const header = [
    "Poz No",
    "Tanım",
    "Birim",
    "Miktar",
    "Birim Fiyat",
    "Tutar",
    "Eşleştirme Durumu",
  ];

  const statusLabels: Record<string, string> = {
    matched: "Eşleşti",
    fuzzy: "Yaklaşık Eşleşme",
    unmatched: "Eşleşmedi",
    manual: "Manuel",
  };

  const rows = items
    .slice()
    .sort((a, b) => a.rowOrder - b.rowOrder)
    .map((item) => [
      item.pozNo,
      item.description,
      item.unit ?? "",
      item.quantity,
      item.unitPrice ?? "",
      item.totalPrice ?? "",
      statusLabels[item.matchStatus] ?? item.matchStatus,
    ]);

  const sheet = XLSX.utils.aoa_to_sheet([header, ...rows]);
  sheet["!cols"] = [
    { wch: 16 },
    { wch: 50 },
    { wch: 8 },
    { wch: 12 },
    { wch: 14 },
    { wch: 14 },
    { wch: 18 },
  ];

  const workbook = XLSX.utils.book_new();
  const sheetName = projectName.slice(0, 31) || "Teklif Cetveli";
  XLSX.utils.book_append_sheet(workbook, sheet, sheetName);

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}
