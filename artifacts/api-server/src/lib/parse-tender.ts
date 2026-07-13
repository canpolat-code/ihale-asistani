// Parses an uploaded tender bill-of-quantities ("Birim Fiyat Teklif Cetveli")
// Excel file into { pozNo, description, unit, quantity } rows.
import * as XLSX from "xlsx";

export type ParsedTenderRow = {
  rowOrder: number;
  pozNo: string;
  description: string;
  unit: string | null;
  quantity: number;
};

export type TenderParseResult = {
  rows: ParsedTenderRow[];
  warnings: string[];
};

function parseTurkishNumber(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let normalized = trimmed;
  const hasComma = trimmed.includes(",");
  const hasDot = trimmed.includes(".");

  if (hasComma && hasDot) {
    normalized = trimmed.replace(/\./g, "").replace(",", ".");
  } else if (hasComma) {
    normalized = trimmed.replace(",", ".");
  }

  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

const HEADER_KEYWORDS = {
  pozNo: ["poz no", "poz numarası", "poz", "iş kalemi no"],
  description: ["tanım", "iş kaleminin adı", "açıklama", "iş tanımı"],
  unit: ["birim", "ölçü birimi"],
  quantity: ["miktar", "keşif miktarı"],
};

function findHeaderRow(
  rows: unknown[][],
): { headerRowIndex: number; columns: Record<string, number> } | null {
  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    const row = rows[i];
    if (!row) continue;

    const columns: Record<string, number> = {};
    row.forEach((cell, colIndex) => {
      if (typeof cell !== "string") return;
      const normalized = cell.trim().toLocaleLowerCase("tr");

      for (const [field, keywords] of Object.entries(HEADER_KEYWORDS)) {
        if (columns[field] !== undefined) continue;
        if (keywords.some((keyword) => normalized.includes(keyword))) {
          columns[field] = colIndex;
        }
      }
    });

    if (columns.pozNo !== undefined && columns.quantity !== undefined) {
      return { headerRowIndex: i, columns };
    }
  }

  return null;
}

export function parseTenderExcel(buffer: Buffer): TenderParseResult {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const warnings: string[] = [];
  const rows: ParsedTenderRow[] = [];

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { rows, warnings: ["Excel dosyasında sayfa bulunamadı."] };
  }

  const sheet = workbook.Sheets[sheetName];
  const raw = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
    blankrows: false,
  });

  const header = findHeaderRow(raw);
  let dataStart = 0;
  let columns = { pozNo: 0, description: 1, unit: 2, quantity: 3 };

  if (header) {
    dataStart = header.headerRowIndex + 1;
    columns = {
      pozNo: header.columns.pozNo,
      description: header.columns.description ?? 1,
      unit: header.columns.unit ?? -1,
      quantity: header.columns.quantity,
    };
  } else {
    warnings.push(
      "Başlık satırı tanınamadı; varsayılan sütun sırası (Poz No, Tanım, Birim, Miktar) kullanıldı.",
    );
  }

  let rowOrder = 0;
  for (let i = dataStart; i < raw.length; i++) {
    const row = raw[i];
    if (!row || row.length === 0) continue;

    const pozNoRaw = String(row[columns.pozNo] ?? "").trim();
    const description = String(row[columns.description] ?? "").trim();
    const unitRaw =
      columns.unit >= 0 ? String(row[columns.unit] ?? "").trim() : "";
    const quantityRaw = row[columns.quantity];

    if (!pozNoRaw || !description) continue;

    const quantity =
      typeof quantityRaw === "number"
        ? quantityRaw
        : parseTurkishNumber(String(quantityRaw ?? ""));

    if (quantity == null) {
      warnings.push(`"${pozNoRaw}" için geçerli bir miktar bulunamadı, satır atlandı.`);
      continue;
    }

    rows.push({
      rowOrder: rowOrder++,
      pozNo: pozNoRaw,
      description,
      unit: unitRaw || null,
      quantity,
    });
  }

  if (rows.length === 0) {
    warnings.push("Dosyadan hiçbir kalem ayrıştırılamadı.");
  }

  return { rows, warnings };
}
