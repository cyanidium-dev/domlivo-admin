"""Contact sheet for eyeballing: N random photos per class, or the photo pairs
of one group/edge list. Usage:
  python -I contact_sheet.py classes out.jpg aerial facade view_sea render
  python -I contact_sheet.py pairs out.jpg <pairs.json> [limit]
"""
import json
import os
import random
import sys
from pathlib import Path

from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent
# data (thumbnails, features, groups) stays out of git, in the workspace next to the repo
DATA = Path(os.environ.get("GEO_ENGINE_DATA") or HERE.parents[2] / "domlivo-workspace" / "geo" / "photo-engine")
THUMBS = DATA / "thumbs"
CELL = 200


def tile(asset):
    try:
        im = Image.open(THUMBS / f"{asset}.jpg").convert("RGB")
    except Exception:
        im = Image.new("RGB", (CELL, CELL), (200, 200, 200))
    im.thumbnail((CELL, CELL))
    canvas = Image.new("RGB", (CELL, CELL), (255, 255, 255))
    canvas.paste(im, ((CELL - im.width) // 2, (CELL - im.height) // 2))
    return canvas


def main():
    mode, out = sys.argv[1], sys.argv[2]
    rows = []
    if mode == "classes":
        cls = json.loads((DATA / "photo-classes.json").read_text())
        rnd = random.Random(7)
        for label in sys.argv[3:]:
            pool = [a for a, v in cls.items() if v["cls"] == label]
            rows.append((label, [(a, f'{cls[a]["p"]:.2f}') for a in rnd.sample(pool, min(6, len(pool)))]))
    else:
        pairs = json.loads(Path(sys.argv[3]).read_text())
        limit = int(sys.argv[4]) if len(sys.argv) > 4 else 8
        for p in pairs[:limit]:
            rows.append((p.get("label", ""), [(p["a"], p.get("ta", "")), (p["b"], p.get("tb", ""))]))
    W = max(len(r[1]) for r in rows) * CELL
    sheet = Image.new("RGB", (W + 110, len(rows) * (CELL + 4)), (255, 255, 255))
    d = ImageDraw.Draw(sheet)
    for i, (label, items) in enumerate(rows):
        y = i * (CELL + 4)
        d.text((4, y + 4), label[:16], fill=(0, 0, 0))
        for j, (asset, note) in enumerate(items):
            sheet.paste(tile(asset), (110 + j * CELL, y))
            if note:
                d.text((112 + j * CELL, y + 2), str(note)[:28], fill=(255, 0, 0))
    sheet.save(out, quality=80)
    print(out, sheet.size)


if __name__ == "__main__":
    main()
