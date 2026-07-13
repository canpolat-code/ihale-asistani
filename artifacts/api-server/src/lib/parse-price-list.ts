// Parses uploaded "Serbest Birim Fiyat" catalog files (Excel or PDF) into
// { pozNo, description, unit, unitPrice } rows. Best-effort: publisher
// layouts vary widely, especially for PDFs, so callers should surface
// `warnings` to the user rather than treating this as authoritative.
import * as XLSX from "xlsx";
import { isValidPozNo, POZ_NO_PATTERN } from "./matching.js";

export type ParsedPriceRow = {
  pozNo: string;
  description: string;
  unit: string | null;
  unitPrice: number;
};

export type ParseResult = {
  rows: ParsedPriceRow[];
  warnings: string[];
};

/** Parse a Turkish-formatted number like "1.234,56" or "1234,56" or "1234.56" into a float. */
function parseTurkishNumber(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let normalized = trimmed;
  const hasComma = trimmed.includes(",");
  const hasDot = trimmed.includes(".");

  if (hasComma && hasDot) {
    // Assume dot is thousands separator, comma is decimal separator.
    normalized = trimmed.replace(/\./g, "").replace(",", ".");
  } else if (hasComma) {
    normalized = trimmed.replace(",", ".");
  }

  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

const HEADER_KEYWORDS = {
  pozNo: ["poz no", "poz numarası", "poz", "iş kalemi no", "birim fiyat no"],
  description: ["tanım", "iş kaleminin adı", "açıklama", "iş tanımı"],
  unit: ["birim", "ölçü birimi"],
  unitPrice: ["birim fiyat", "fiyat", "tutar"],
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

    if (columns.pozNo !== undefined && columns.unitPrice !== undefined) {
      return { headerRowIndex: i, columns };
    }
  }

  return null;
}

export function parsePriceListExcel(buffer: Buffer): ParseResult {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const warnings: string[] = [];
  const rows: ParsedPriceRow[] = [];

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
  let columns = { pozNo: 0, description: 1, unit: 2, unitPrice: 3 };

  if (header) {
    dataStart = header.headerRowIndex + 1;
    columns = {
      pozNo: header.columns.pozNo,
      description: header.columns.description ?? 1,
      unit: header.columns.unit ?? -1,
      unitPrice: header.columns.unitPrice,
    };
  } else {
    warnings.push(
      "Başlık satırı tanınamadı; varsayılan sütun sırası (Poz No, Tanım, Birim, Birim Fiyat) kullanıldı.",
    );
  }

  for (let i = dataStart; i < raw.length; i++) {
    const row = raw[i];
    if (!row || row.length === 0) continue;

    const pozNoRaw = String(row[columns.pozNo] ?? "").trim();
    const description = String(row[columns.description] ?? "").trim();
    const unitRaw =
      columns.unit >= 0 ? String(row[columns.unit] ?? "").trim() : "";
    const priceRaw = row[columns.unitPrice];

    if (!pozNoRaw || !description) continue;
    if (!isValidPozNo(pozNoRaw)) {
      warnings.push(`"${pozNoRaw}" tanınan Poz No formatına uymuyor, satır atlandı.`);
      continue;
    }

    const unitPrice =
      typeof priceRaw === "number"
        ? priceRaw
        : parseTurkishNumber(String(priceRaw ?? ""));

    if (unitPrice == null) {
      warnings.push(`"${pozNoRaw}" için geçerli bir birim fiyat bulunamadı, satır atlandı.`);
      continue;
    }

    rows.push({
      pozNo: pozNoRaw,
      description,
      unit: unitRaw || null,
      unitPrice,
    });
  }

  if (rows.length === 0) {
    warnings.push("Dosyadan hiçbir poz kalemi ayrıştırılamadı.");
  }

  return { rows, warnings };
}

const KNOWN_UNITS = [
  "m2",
  "m3",
  "m",
  "kg",
  "ton",
  "adet",
  "ad",
  "lt",
  "saat",
  "gün",
  "m²",
  "m³",
  "kom",
];

/**
 * Best-effort text-regex parser for PDF-published price lists. Publisher
 * layouts vary significantly year to year and organization to organization,
 * so this looks for lines matching `<poz no> <description> <unit> <price>`
 * and reports anything it cannot confidently parse via `warnings`.
 */
export function parsePriceListPdfText(text: string): ParseResult {
  const warnings: string[] = [];
  const rows: ParsedPriceRow[] = [];

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const unitPattern = new RegExp(`\\b(${KNOWN_UNITS.join("|")})\\b`, "i");
  const pricePattern = /(\d{1,3}(?:\.\d{3})*,\d{2}|\d+,\d{2}|\d+\.\d{2})\s*$/;

  for (const line of lines) {
    const pozMatch = line.match(POZ_NO_PATTERN);
    if (!pozMatch) continue;

    const priceMatch = line.match(pricePattern);
    if (!priceMatch) continue;

    const unitPrice = parseTurkishNumber(priceMatch[1]);
    if (unitPrice == null) continue;

    const unitMatch = line.match(unitPattern);

    const pozNo = pozMatch[1];
    const afterPoz = line.slice(pozMatch.index! + pozMatch[0].length);
    const description = afterPoz
      .replace(pricePattern, "")
      .replace(unitPattern, "")
      .trim()
      .replace(/^[-:.\s]+/, "");

    if (!description) continue;

    rows.push({
      pozNo,
      description,
      unit: unitMatch ? unitMatch[1] : null,
      unitPrice,
    });
  }

  if (rows.length === 0) {
    warnings.push(
      "PDF'den hiçbir poz kalemi ayrıştırılamadı. PDF düzeni tanınamadı; lütfen Excel formatını deneyin veya kalemleri manuel ekleyin.",
    );
  } else {
    warnings.push(
      `PDF ayrıştırma en iyi çaba (best-effort) ile yapılır; ${rows.length} satır bulundu, lütfen sonuçları gözden geçirin.`,
    );
  }

  return { rows, warnings };
}
