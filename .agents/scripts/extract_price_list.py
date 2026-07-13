"""
Generic bbox-based extractor for Turkish government "Birim Fiyat" (unit price) PDF
tables. Handles varying column layouts across pages/sections by detecting the
repeated header row (Poz No / Tanımı / Ölçü Birimi / Birim Fiyat, etc.) on each
page, then classifying every text span into poz-no / description / unit / price
buckets using the detected column x-boundaries. Row grouping uses an
order-preserving strategy: since each item has exactly one poz-no and one price,
and rows never reorder top-to-bottom, we zip poz/price/unit lists positionally
after sorting by y, then bucket multi-line description spans into per-item bands
using the midpoints between consecutive poz-no vertical centers (PDF table
renderers vertically center single-line cells within the (possibly multi-line)
row height, so a poz-no's y-center reliably falls inside its own row's band).

Usage: python extract_price_list.py <pdf_path> <output_json_path> [first_page] [last_page]
"""
import fitz
import json
import re
import sys
import unicodedata

BOLD_FLAG = 1 << 4

# Turkish-aware uppercase check
def is_all_upper_tr(s: str) -> bool:
    s2 = s.replace("İ", "I").replace("I", "I")
    letters = [c for c in s if c.isalpha()]
    if not letters:
        return False
    return all((c.upper() == c) for c in letters)

# Poz No pattern - mirrors matching.ts POZ_NO_FULL_PATTERN rules:
# first segment: 2-3 digits OR 1-3 letters
# 1-2 dot-separated middle segments: 2-4 digits, 1-3 letters, or letters+digits (e.g. V37)
# optional "/"-suffix: 1-3 digits, 1-2 letters, letters+digits (F01), or digits+letter(s) (01K/01O1)
SEG = r"(?:[0-9]{2,4}|[A-Za-zÇĞİÖŞÜçğıöşü]{1,3}|[A-Za-zÇĞİÖŞÜçğıöşü]{1,3}[0-9]{1,3})"
FIRST = r"(?:[0-9]{2,3}|[A-Za-zÇĞİÖŞÜçğıöşü]{1,3})"
SUFFIX = r"(?:[0-9]{1,3}|[A-Za-zÇĞİÖŞÜçğıöşü]{1,2}|[A-Za-zÇĞİÖŞÜçğıöşü]{1,3}[0-9]{1,3}|[0-9]{1,3}[A-Za-zÇĞİÖŞÜçğıöşü]{1,2}[0-9]{0,3})"
POZ_FULL = re.compile(rf"^{FIRST}(?:\.{SEG}){{1,2}}(?:/{SUFFIX})?$")

# Only allow an optional leading currency symbol/whitespace around the number itself -
# NOT arbitrary surrounding text, since a loose \D* on both ends would also match plain
# prose containing an embedded measurement like "0,70 mm" as if it were a price.
PRICE_RE = re.compile(r"^[₺\s]*(\d{1,3}(?:\.\d{3})*,\d{2})\s*(?:TL)?\s*$")

UNITS = {
    "M2","M²","M3","M³","M'2","M'3","MT","M","KG","TON","AD","ADET","SA","LT","LİT",
    "TAKIM","TK","PAKET","GÜN","KOMPLE","DAKİKA","M2/AY","DM3","DM³","KM","CM",
    "PAFTA","SET","RULO","DEMET","ÇİFT","KUTU","TABAKA","POZ","SAAT","AY","YIL",
}

def norm(s):
    return s.strip()

def tr_lower(s):
    # Turkish-aware casefold: map both dotted/dotless I to plain 'i' before lowering,
    # since Python's str.lower() on 'İ' yields a combining-dot artifact that breaks
    # substring matching against plain ascii keywords.
    return s.replace("İ", "i").replace("I", "i").lower()

def is_unit_token(s):
    t = s.strip().rstrip(".").upper().replace("İ", "I")
    t2 = s.strip().rstrip(".").upper()
    return t2 in UNITS or t in {u.replace("İ","I") for u in UNITS}

def get_spans(page):
    d = page.get_text("dict")
    spans = []
    for block in d["blocks"]:
        if block["type"] != 0:
            continue
        for line in block["lines"]:
            for s in line["spans"]:
                t = s["text"]
                if not t.strip():
                    continue
                x0, y0, x1, y1 = s["bbox"]
                spans.append({
                    "text": t, "x0": x0, "y0": y0, "x1": x1, "y1": y1,
                    "bold": bool(s["flags"] & BOLD_FLAG),
                    "yc": (y0 + y1) / 2,
                })
    return spans

def detect_columns(spans):
    """Find header anchors on this page. Returns dict or None if not a price-table page."""
    poz_x = desc_x = price_x = None
    price_label_x = None
    montaj_x = None
    for s in spans:
        t = tr_lower(s["text"].strip())
        if not s["bold"]:
            continue
        if t in ("poz no",):
            poz_x = s["x0"]
        if t in ("tanımı", "imalat çeşidi", "imalatin cinsi", "yapılacak işin cinsi") or \
           ("imalat" in t and ("çeşidi" in t or "cinsi" in t)) or ("işin cinsi" in t) or (t == "tanımı"):
            if desc_x is None or s["x0"] < desc_x:
                desc_x = s["x0"]
        if "fiyat" in t and len(t) <= 20:
            if "montaj" in t and "bedel" not in t:
                # "Montajlı Birim Fiyat" - primary price, prefer over bare Birim Fiyat if present elsewhere
                if price_label_x is None or s["x0"] < price_label_x:
                    price_label_x = s["x0"]
            elif "bedel" not in t:
                if price_label_x is None or s["x0"] < price_label_x:
                    price_label_x = s["x0"]
        if "bedel" in t and "montaj" in t:
            montaj_x = s["x0"]
    if poz_x is None or desc_x is None:
        return None
    price_x = price_label_x if price_label_x is not None else montaj_x
    if price_x is None:
        return None
    return {"poz_x": poz_x, "desc_x": desc_x, "price_x": price_x, "montaj_x": montaj_x}

def extract_page(page, page_index, carried_cols=None):
    spans = get_spans(page)
    cols = detect_columns(spans)
    used_carried = False
    if cols is None:
        if carried_cols is None:
            return [], "no-header", None
        cols = carried_cols
        used_carried = True

    poz_x, desc_x, price_x = cols["poz_x"], cols["desc_x"], cols["price_x"]
    montaj_x = cols["montaj_x"]

    # POZ candidates: found purely by content (regex is distinctive enough that prose
    # description text essentially never matches it), not by position - header label
    # x-positions are centered over their column width and do not reliably predict where
    # the actual left-aligned data starts, so we derive real column edges from the data
    # itself further below instead of trusting header x0 directly.
    poz_items = [s for s in spans if POZ_FULL.match(norm(s["text"])) and s["x0"] < (poz_x + desc_x)]

    # PRICE candidates: numeric spans matching the price format, right of the poz column.
    all_price_candidates = [s for s in spans if PRICE_RE.match(norm(s["text"])) and s["x0"] > poz_x + 30]
    if montaj_x is not None and price_x != montaj_x and all_price_candidates:
        # two price-like columns exist (e.g. "Montajlı Birim Fiyat" + "Montaj Bedeli");
        # keep only the ones closer to the primary (non-"bedel") column anchor.
        price_items = [s for s in all_price_candidates
                        if abs(s["x0"] - price_x) <= abs(s["x0"] - montaj_x)]
    else:
        price_items = all_price_candidates

    # Real data column edges, derived empirically from the matched poz/price spans
    # rather than from header label positions (see note above).
    poz_x1 = max((s["x1"] for s in poz_items), default=poz_x + 40)
    price_x0 = min((s["x0"] for s in price_items), default=price_x)

    # UNIT candidates: found by content (whitelist token match) between the poz and
    # price columns - this must come before the description bound is finalized, since
    # the unit column sits between description and price.
    unit_items = []
    for s in spans:
        if not (poz_x1 <= s["x0"] < price_x0):
            continue
        for tok in re.split(r"\s{2,}", s["text"].strip()):
            tok = tok.strip()
            if is_unit_token(tok):
                unit_items.append({**s, "unit_text": tok})
                break

    unit_x0 = min((s["x0"] for s in unit_items), default=price_x0)
    desc_bound_lo = poz_x1 + 3
    desc_bound_hi = min(unit_x0, price_x0) - 3

    # DESC candidates: non-bold spans in desc column range, excluding poz/price/unit region.
    # Section sub-headers are filtered two ways: (1) bold flag (catches e.g. KTB's
    # "İŞÇİLİKLER" style headers, which share the description column's x0 but are bold),
    # and (2) x0 deviating from the column's modal (most common) x0 (catches PTT/ÇŞB
    # style headers, which are centered/off-grid but not necessarily bold).
    raw_desc = []
    for s in spans:
        if desc_bound_lo <= s["x0"] < desc_bound_hi:
            txt = norm(s["text"])
            if not txt or s["bold"]:
                continue
            raw_desc.append(s)

    if raw_desc:
        from collections import Counter
        x0_counts = Counter(round(s["x0"]) for s in raw_desc)
        mode_x0 = x0_counts.most_common(1)[0][0]
    else:
        mode_x0 = desc_x

    desc_items = [s for s in raw_desc if abs(round(s["x0"]) - mode_x0) <= 5]

    poz_items.sort(key=lambda s: s["yc"])
    price_items.sort(key=lambda s: s["yc"])
    unit_items.sort(key=lambda s: s["yc"])
    desc_items.sort(key=lambda s: (s["yc"], s["x0"]))

    n = len(poz_items)
    status = "ok"
    if len(price_items) != n:
        status = f"mismatch poz={n} price={len(price_items)}"
    m = min(n, len(price_items))

    # Build row bands from price centers, not poz centers: empirically, the price cell's
    # y-range always overlaps one specific line of its own row's (possibly multi-line)
    # description, so its center reliably falls inside the correct row's vertical span.
    # The poz-no cell, by contrast, is often bottom-anchored below the whole row rather
    # than centered on it, which would misattribute trailing description lines to the
    # wrong (previous) item if used as the split anchor.
    centers = [s["yc"] for s in price_items[:m]]
    bands = []
    for i in range(m):
        lo = -1e9 if i == 0 else (centers[i-1] + centers[i]) / 2
        hi = 1e9 if i == m - 1 else (centers[i] + centers[i+1]) / 2
        bands.append((lo, hi))

    # assign desc spans to bands
    band_texts = [[] for _ in range(m)]
    for s in desc_items:
        for i, (lo, hi) in enumerate(bands):
            if lo <= s["yc"] < hi:
                band_texts[i].append(s)
                break

    # assign unit spans to bands by nearest center
    band_units = [None] * m
    for s in unit_items:
        best_i, best_d = None, None
        for i, c in enumerate(centers):
            d = abs(s["yc"] - c)
            if best_d is None or d < best_d:
                best_d, best_i = d, i
        if best_i is not None and best_d < 60:
            if band_units[best_i] is None:
                band_units[best_i] = s["unit_text"]

    results = []
    for i in range(m):
        poz_no = norm(poz_items[i]["text"])
        price_txt = norm(price_items[i]["text"])
        pm = PRICE_RE.match(price_txt)
        price = pm.group(1) if pm else None
        desc_spans = sorted(band_texts[i], key=lambda s: (round(s["y0"], 0), s["x0"]))
        desc = " ".join(s["text"].strip() for s in desc_spans)
        desc = re.sub(r"\s+", " ", desc).strip()
        unit = band_units[i]
        results.append({
            "poz_no": poz_no, "description": desc, "unit": unit, "price": price,
            "page": page_index + 1,
        })
    return results, status, cols

def main():
    pdf_path = sys.argv[1]
    out_path = sys.argv[2]
    first = int(sys.argv[3]) if len(sys.argv) > 3 else 0
    last = int(sys.argv[4]) if len(sys.argv) > 4 else None

    doc = fitz.open(pdf_path)
    last = last if last is not None else doc.page_count - 1

    all_items = []
    page_stats = []
    carried = None
    for p in range(first, last + 1):
        items, status, used_cols = extract_page(doc[p], p, carried_cols=carried)
        if used_cols is not None:
            carried = used_cols
        all_items.extend(items)
        page_stats.append({"page": p + 1, "status": status, "count": len(items)})

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(all_items, f, ensure_ascii=False, indent=1)

    mismatches = [s for s in page_stats if s["status"] not in ("ok", "no-header")]
    no_header = [s for s in page_stats if s["status"] == "no-header"]
    print(f"Total items: {len(all_items)}")
    print(f"Pages with no header (skipped): {len(no_header)}")
    print(f"Pages with mismatches: {len(mismatches)}")
    for s in mismatches[:30]:
        print(" ", s)

if __name__ == "__main__":
    main()
