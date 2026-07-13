// Matching utilities: normalize Turkish "Poz No" codes and compute a
// bigram Dice-coefficient similarity score for fuzzy description matching.

// Turkish "Poz No" codes are hierarchical, dot-separated segments, with an
// optional "/"-separated suffix. Only the following shapes are recognized —
// anything else is treated as "not a Poz No" and must not be detected:
//   - First segment: 2-3 digits (e.g. "04", "35", "98") or 1-3 letters
//     (e.g. "V", "KTB").
//   - 1-2 middle segments (each preceded by "."): 2-4 digits
//     (e.g. "800", "9116"), 1-3 letters (e.g. "KTB"), or letters+digits
//     (e.g. "V37").
//   - Optional suffix (preceded by "/"): 1-3 digits (e.g. "24", "001"),
//     1-2 letters (e.g. "B"), letters+digits (e.g. "F01"), or
//     digits+letters(+digits) (e.g. "01K", "01O1").
// Examples covered: 04.V37/24, V.0107, V.0107/B, 35.800.9116, 77.110.1013,
// KTB.98.0017, V.0401/F01, V.0401/01O1, V.0401/01K, V.0509/001, 04.KTB.0041
const LETTER_CLASS = "A-ZÇĞİÖŞÜ";
const POZ_NO_CORE =
  `(?:\\d{2,3}|[${LETTER_CLASS}]{1,3})` +
  `(?:\\.(?:\\d{2,4}|[${LETTER_CLASS}]{1,3}\\d{1,3}|[${LETTER_CLASS}]{1,3})){1,2}` +
  `(?:\\/(?:\\d{1,3}|[${LETTER_CLASS}]{1,2}\\d{1,2}|\\d{1,2}[${LETTER_CLASS}]{1,2}\\d{0,2}|[${LETTER_CLASS}]{1,2}))?`;

/** Matches a Poz No anywhere inside a larger string (e.g. a PDF text line). Capture group 1 is the code. */
export const POZ_NO_PATTERN = new RegExp(`\\b(${POZ_NO_CORE})\\b`, "i");

const POZ_NO_FULL_PATTERN = new RegExp(`^${POZ_NO_CORE}$`, "i");

/** True if the whole (trimmed) string is a recognized Poz No shape. */
export function isValidPozNo(pozNo: string): boolean {
  return POZ_NO_FULL_PATTERN.test(pozNo.trim());
}

/** Normalize a Poz No for exact-match comparison (strip whitespace, unify separators, lowercase). */
export function normalizePozNo(pozNo: string): string {
  return pozNo
    .trim()
    .toLowerCase()
    .replace(/[.\-\/\s]+/g, ".")
    .replace(/^\.+|\.+$/g, "");
}

/** Normalize free text for description similarity comparisons. */
function normalizeText(text: string): string {
  return text
    .toLocaleLowerCase("tr")
    .replace(/[^a-z0-9ığüşöç\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function bigrams(text: string): string[] {
  const normalized = normalizeText(text);
  if (normalized.length < 2) return normalized ? [normalized] : [];
  const grams: string[] = [];
  for (let i = 0; i < normalized.length - 1; i++) {
    grams.push(normalized.slice(i, i + 2));
  }
  return grams;
}

/**
 * Dice coefficient similarity between two strings based on character
 * bigrams. Returns a value in [0, 1] -- 1 means identical.
 */
export function diceCoefficient(a: string, b: string): number {
  const bigramsA = bigrams(a);
  const bigramsB = bigrams(b);

  if (bigramsA.length === 0 || bigramsB.length === 0) {
    return bigramsA.length === bigramsB.length ? 1 : 0;
  }

  const counts = new Map<string, number>();
  for (const gram of bigramsA) {
    counts.set(gram, (counts.get(gram) ?? 0) + 1);
  }

  let intersection = 0;
  for (const gram of bigramsB) {
    const remaining = counts.get(gram) ?? 0;
    if (remaining > 0) {
      intersection++;
      counts.set(gram, remaining - 1);
    }
  }

  return (2 * intersection) / (bigramsA.length + bigramsB.length);
}

export const FUZZY_MATCH_THRESHOLD = 0.5;

export type MatchCandidate = {
  id: number;
  priceListId: number;
  pozNo: string;
  description: string;
  unit: string | null;
  unitPrice: number;
  sourceName: string;
};

export type MatchResult = {
  status: "matched" | "fuzzy" | "unmatched";
  score: number | null;
  candidate: MatchCandidate | null;
};

/**
 * Match a tender line item against a pool of price catalog candidates.
 * Tries an exact normalized Poz No match first; falls back to the best
 * fuzzy description match above the threshold.
 */
export function matchItem(
  pozNo: string,
  description: string,
  candidates: MatchCandidate[],
): MatchResult {
  const normalizedTarget = normalizePozNo(pozNo);

  if (normalizedTarget) {
    const exact = candidates.find(
      (candidate) => normalizePozNo(candidate.pozNo) === normalizedTarget,
    );
    if (exact) {
      return { status: "matched", score: 1, candidate: exact };
    }
  }

  let best: MatchCandidate | null = null;
  let bestScore = 0;

  for (const candidate of candidates) {
    const score = diceCoefficient(description, candidate.description);
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }

  if (best && bestScore >= FUZZY_MATCH_THRESHOLD) {
    return { status: "fuzzy", score: bestScore, candidate: best };
  }

  return { status: "unmatched", score: null, candidate: null };
}
