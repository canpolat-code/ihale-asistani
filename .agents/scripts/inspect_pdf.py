import fitz
import sys
import json

path = sys.argv[1]
page_num = int(sys.argv[2])

doc = fitz.open(path)
page = doc[page_num]
d = page.get_text("dict")
for block in d["blocks"]:
    if block["type"] != 0:
        continue
    for line in block["lines"]:
        text = "".join(s["text"] for s in line["spans"])
        if not text.strip():
            continue
        bbox = line["bbox"]
        print(f"y0={bbox[1]:.1f} y1={bbox[3]:.1f} x0={bbox[0]:.1f} x1={bbox[2]:.1f}  |  {text}")
