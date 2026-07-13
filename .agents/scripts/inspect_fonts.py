import fitz, sys
path = sys.argv[1]
page_num = int(sys.argv[2])
doc = fitz.open(path)
page = doc[page_num]
d = page.get_text("dict")
for block in d["blocks"]:
    if block["type"] != 0: continue
    for line in block["lines"]:
        for s in line["spans"]:
            t = s["text"]
            if not t.strip(): continue
            print(f"size={s['size']:.1f} font={s['font']} flags={s['flags']} | {t!r}")
