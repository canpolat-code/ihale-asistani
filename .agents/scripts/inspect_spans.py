import fitz, sys
path = sys.argv[1]
page_num = int(sys.argv[2])
doc = fitz.open(path)
page = doc[page_num]
d = page.get_text("dict")
for block in d["blocks"]:
    if block["type"] != 0:
        continue
    for line in block["lines"]:
        for s in line["spans"]:
            t = s["text"]
            if not t.strip():
                continue
            b = s["bbox"]
            print(f"y0={b[1]:.1f} y1={b[3]:.1f} x0={b[0]:.1f} x1={b[2]:.1f} | {t!r}")
