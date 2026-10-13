"""Map views with a labelled coordinate grid, for georeferencing a listing's map
screenshot by eye.

  python -I mapview.py ortho <lat> <lng> <half_m> <out.jpg> [--year 2018|2015] [--px 900]
  python -I mapview.py osm   <lat> <lng> <half_m> <out.png> [--px 900]

ortho: Albanian state orthophoto (ASIG geoportal WMS, 2018 or 2015 20 cm).
osm:   OpenStreetMap standard tiles (light use, cached on disk).
Both draw a 5x5 grid; every intersection is labelled "lat,lng" (5 decimals) and
the centre carries a red cross, so a point seen in the image can be read off
the grid: lat/lng vary linearly between grid lines (Web-Mercator distortion over
a few km is far below a pixel's worth of error here).
"""
import io
import math
import os
import sys
from pathlib import Path

import requests
from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent
DATA = Path(os.environ.get("GEO_ENGINE_DATA") or HERE.parents[2] / "domlivo-workspace" / "geo" / "photo-engine")
CACHE = DATA / "vision" / "tile-cache"
CACHE.mkdir(parents=True, exist_ok=True)
UA = {"User-Agent": "domlivo-geo/1.0 (+https://domlivo.com)"}
ASIG = {
    "2018": "ortofoto_2018:Ortofoto_2018",
    "2015": "orthophoto_2015:OrthoImagery_20cm",
}


def bbox(lat, lng, half_m):
    dlat = half_m / 111320.0
    dlng = half_m / (111320.0 * math.cos(math.radians(lat)))
    return lat - dlat, lng - dlng, lat + dlat, lng + dlng


def ortho(lat, lng, half_m, px, year):
    s, w, n, e = bbox(lat, lng, half_m)
    url = (
        "https://geoportal.asig.gov.al/service/wms?service=WMS&version=1.1.1&request=GetMap"
        f"&layers={ASIG[year]}&styles=&bbox={w},{s},{e},{n}&width={px}&height={px}&srs=EPSG:4326&format=image/jpeg"
    )
    r = requests.get(url, headers=UA, timeout=90)
    r.raise_for_status()
    return Image.open(io.BytesIO(r.content)).convert("RGB"), (s, w, n, e)


def osm(lat, lng, half_m, px):
    s, w, n, e = bbox(lat, lng, half_m)
    # zoom so that the box spans about px pixels
    span_deg = e - w
    z = max(10, min(18, int(math.log2(360 * px / (256 * span_deg)))))

    def tx(lon):
        return (lon + 180) / 360 * 2**z

    def ty(la):
        r = math.radians(la)
        return (1 - math.log(math.tan(r) + 1 / math.cos(r)) / math.pi) / 2 * 2**z

    x0, x1, y0, y1 = tx(w), tx(e), ty(n), ty(s)
    tiles = {}
    for X in range(int(x0), int(x1) + 1):
        for Y in range(int(y0), int(y1) + 1):
            f = CACHE / f"osm-{z}-{X}-{Y}.png"
            if not f.exists():
                r = requests.get(f"https://tile.openstreetmap.org/{z}/{X}/{Y}.png", headers=UA, timeout=60)
                r.raise_for_status()
                f.write_bytes(r.content)
            tiles[(X, Y)] = Image.open(f).convert("RGB")
    W = (int(x1) - int(x0) + 1) * 256
    H = (int(y1) - int(y0) + 1) * 256
    mosaic = Image.new("RGB", (W, H))
    for (X, Y), im in tiles.items():
        mosaic.paste(im, ((X - int(x0)) * 256, (Y - int(y0)) * 256))
    crop = mosaic.crop((int((x0 - int(x0)) * 256), int((y0 - int(y0)) * 256), int((x1 - int(x0)) * 256), int((y1 - int(y0)) * 256)))
    # resample to a square lat/lng-linear frame
    return crop.resize((px, px)), (s, w, n, e)


def grid(im, box):
    s, w, n, e = box
    d = ImageDraw.Draw(im)
    W, H = im.size
    for k in range(6):
        x = round(k * (W - 1) / 5)
        y = round(k * (H - 1) / 5)
        d.line([(x, 0), (x, H)], fill=(255, 255, 0), width=1)
        d.line([(0, y), (W, y)], fill=(255, 255, 0), width=1)
    for i in range(6):
        for j in range(6):
            x = round(i * (W - 1) / 5)
            y = round(j * (H - 1) / 5)
            la = n - (s - n) * -j / 5
            la = n - (n - s) * j / 5
            lo = w + (e - w) * i / 5
            label = f"{la:.5f},{lo:.5f}"
            tx = min(max(2, x + 2), W - 100)
            ty = min(max(2, y + 2), H - 12)
            d.rectangle([tx - 1, ty - 1, tx + 98, ty + 10], fill=(0, 0, 0))
            d.text((tx, ty), label, fill=(255, 255, 0))
    cx, cy = W // 2, H // 2
    d.line([(cx - 12, cy), (cx + 12, cy)], fill=(255, 0, 0), width=2)
    d.line([(cx, cy - 12), (cx, cy + 12)], fill=(255, 0, 0), width=2)
    return im


def main():
    kind, lat, lng, half_m, out = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), float(sys.argv[4]), sys.argv[5]
    px = int(sys.argv[sys.argv.index("--px") + 1]) if "--px" in sys.argv else 900
    year = sys.argv[sys.argv.index("--year") + 1] if "--year" in sys.argv else "auto"
    if kind == "ortho":
        # 2018 is newer but has holes (much of the coast south of Durrës); 2015 covers it
        im, box = ortho(lat, lng, half_m, px, "2018" if year == "auto" else year)
        if year == "auto":
            gray = im.convert("L")
            white = sum(1 for v in gray.getdata() if v > 245) / (px * px)
            if white > 0.3:
                im, box = ortho(lat, lng, half_m, px, "2015")
                year = "2015"
            else:
                year = "2018"
        kind = f"ortho {year}"
    else:
        im, box = osm(lat, lng, half_m, px)
    grid(im, box).save(out, quality=85)
    s, w, n, e = box
    print(f"{out}: {kind} {px}x{px}px, south {s:.6f} west {w:.6f} north {n:.6f} east {e:.6f}; "
          f"pixel (x,y) -> lat = {n:.6f} - y/{px}*{n - s:.6f}, lng = {w:.6f} + x/{px}*{e - w:.6f}")


if __name__ == "__main__":
    main()
