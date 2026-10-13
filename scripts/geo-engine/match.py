"""Stage 2 of the photo engine: which listings show the same building?

Bird/LUN, CIAN and Yandex all solve location for duplicates by linking listings,
not by reading coordinates off a photo. This does the same with our photos:

  1. near-identical photos across listings (pHash + dHash), any class but generic ones;
  2. "same place, other angle": DINOv2 nearest neighbours among place-type photos
     (balcony views, facades, drone shots, renders, construction, lobby, pool),
     confirmed geometrically with DISK + LightGlue + MAGSAC (fundamental matrix inliers);
  3. listing graph -> groups, merged strongest edge first, never merging two groups
     whose trusted pins (precision 'exact') are more than CONFLICT_M apart;
  4. a photo that links listings whose trusted pins disagree is generic (beach,
     promenade, agency stock) and loses all its edges;
  5. leave-one-out test on the trusted pins, then propagation of trusted pins to
     the other members of each group.

Inputs: manifest.json, features.npz, photo-classes.json, thumbs/
        ../geocode-plan-2026-10-11.json (text geocoder of the other session, optional)
Outputs: pairs.json (verified photo pairs), groups.json, match-report.md

Run: .venv/Scripts/python.exe -I match.py [--no-verify]
"""
import hashlib
import json
import os
import math
import sys
from collections import defaultdict
from pathlib import Path

import numpy as np
import torch

HERE = Path(__file__).resolve().parent
# data (thumbnails, features, groups) stays out of git, in the workspace next to the repo
DATA = Path(os.environ.get("GEO_ENGINE_DATA") or HERE.parents[2] / "domlivo-workspace" / "geo" / "photo-engine")
GEO = DATA.parent
THUMBS = DATA / "thumbs"

PLACE = {"view_sea", "view_city", "balcony", "facade", "aerial", "render", "construction", "common", "amenity"}
NEVER = {"beach", "graphic"}
CONFLICT_M = 150  # trusted pins farther apart than this are different buildings
SAME_PLACE_MIN_INLIERS = 200  # see the calibration note at the edge builder
KNN = 12
COS_MIN = 0.50
PHASH_MAX = 6
DHASH_MAX = 10
NO_VERIFY = "--no-verify" in sys.argv

device = "cuda" if torch.cuda.is_available() else "cpu"


def hav(a, b):
    (la1, lo1), (la2, lo2) = a, b
    R = 6371000.0
    p1, p2 = math.radians(la1), math.radians(la2)
    dp, dl = p2 - p1, math.radians(lo2 - lo1)
    h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * R * math.asin(math.sqrt(h))


def popcount64(x):
    x = x - ((x >> np.uint64(1)) & np.uint64(0x5555555555555555))
    x = (x & np.uint64(0x3333333333333333)) + ((x >> np.uint64(2)) & np.uint64(0x3333333333333333))
    x = (x + (x >> np.uint64(4))) & np.uint64(0x0F0F0F0F0F0F0F0F)
    return ((x * np.uint64(0x0101010101010101)) >> np.uint64(56)).astype(np.int32)


def main():
    manifest = json.loads((DATA / "manifest.json").read_text(encoding="utf8"))
    F = np.load(DATA / "features.npz")
    assets = list(F["assets"])
    aidx = {a: i for i, a in enumerate(assets)}
    classes = json.loads((DATA / "photo-classes.json").read_text())
    dino = torch.from_numpy(F["dino"].astype(np.float32))
    ph, dh = F["phash"], F["dhash"]

    L = {m["id"]: m for m in manifest}
    trusted = {m["id"]: (m["lat"], m["lng"]) for m in manifest if m.get("precision") == "exact" and m.get("lat")}
    photo_listings = defaultdict(set)
    for m in manifest:
        for p in m["photos"]:
            if p["asset"] in aidx:
                photo_listings[p["asset"]].add(m["id"])
    print(f"listings {len(manifest)}, trusted pins {len(trusted)}, photos with features {len(photo_listings)}")

    # ---------- 1. near-identical photos ----------
    idx = [aidx[a] for a in photo_listings if classes.get(a, {}).get("cls") not in NEVER]
    near = []
    I = np.array(idx)
    for s in range(0, len(I), 512):
        blk = I[s : s + 512]
        d1 = popcount64(ph[blk][:, None] ^ ph[I][None, :])
        d2 = popcount64(dh[blk][:, None] ^ dh[I][None, :])
        hit = np.argwhere((d1 <= PHASH_MAX) & (d2 <= DHASH_MAX))
        for r, c in hit:
            a, b = int(blk[r]), int(I[c])
            if a < b:
                near.append((a, b, int(d1[r, c])))
    # identical asset ids reused by several listings are near-duplicates too
    print(f"near-identical photo pairs: {len(near)}")

    # ---------- 2. DINOv2 neighbours among place photos ----------
    pidx = [aidx[a] for a in photo_listings if classes.get(a, {}).get("cls") in PLACE]
    P = torch.tensor(pidx)
    X = dino[P].to(device)
    S = X @ X.T
    cand = set()
    for r in range(len(pidx)):
        a = pidx[r]
        la = photo_listings[assets[a]]
        sims, order = torch.topk(S[r], min(KNN * 4, len(pidx)))
        taken = 0
        for sv, c in zip(sims.tolist(), order.tolist()):
            if sv < COS_MIN or taken >= KNN:
                break
            b = pidx[c]
            if b == a or photo_listings[assets[b]] & la or photo_listings[assets[b]] == la:
                continue
            cand.add((min(a, b), max(a, b), round(sv, 3)))
            taken += 1
    del S
    print(f"place-photo candidate pairs (cos >= {COS_MIN}): {len(cand)}")

    # ---------- geometric verification ----------
    verified = {}
    pairs_file = DATA / "pairs.json"
    if pairs_file.exists() and "--reverify" not in sys.argv:
        # verification takes ~30 min on the GPU; reuse the last run's inlier counts
        for p in json.loads(pairs_file.read_text()):
            if p["a"] in aidx and p["b"] in aidx:
                verified[(aidx[p["a"]], aidx[p["b"]], p["cos"])] = p["inliers"]
        print(f"reused {len(verified)} verified pairs from pairs.json")
    elif not NO_VERIFY:
        verified = verify(sorted(cand, key=lambda x: -x[2]), assets)

    # ---------- 3. listing graph ----------
    edges = []  # (strength, la, lb, info)

    def add_edges(a, b, strength, info):
        for x in photo_listings[assets[a]]:
            for y in photo_listings[assets[b]]:
                if x != y:
                    edges.append((strength, min(x, y), max(x, y), {**info, "pa": assets[a], "pb": assets[b]}))

    for a, b, d in near:
        cls_a = classes.get(assets[a], {}).get("cls")
        add_edges(a, b, 1.0 if cls_a != "interior" else 0.95, {"kind": "near-identical", "cls": cls_a, "ham": d})
    # the same Sanity asset inside several listings (re-imports, hidden duplicates)
    for asset, ls in photo_listings.items():
        if len(ls) > 1 and classes.get(asset, {}).get("cls") not in NEVER:
            ls = sorted(ls)
            for i in range(len(ls)):
                for j in range(i + 1, len(ls)):
                    edges.append((1.0, ls[i], ls[j], {"kind": "same-asset", "cls": classes.get(asset, {}).get("cls"), "pa": asset, "pb": asset}))
    # Calibrated 2026-10-13 on pairs of listings with trusted pins: >=200 inliers
    # 12/12 same building, >=150 13/14, >=45 23/43, >=25 30/99. Balcony views of
    # the same sea and one developer's look-alike renders fool lower counts.
    for (a, b, cos), inl in verified.items():
        if inl >= SAME_PLACE_MIN_INLIERS:
            s = 0.9
        else:
            continue
        add_edges(a, b, s, {"kind": "same-place", "cls": classes.get(assets[a], {}).get("cls") + "/" + classes.get(assets[b], {}).get("cls"), "inliers": inl, "cos": cos})
    for m in manifest:
        if m.get("duplicateOf") and m["duplicateOf"] in L:
            x, y = sorted([m["id"], m["duplicateOf"]])
            edges.append((1.0, x, y, {"kind": "duplicateOf"}))

    # ---------- calibration: direct edges between two trusted pins ----------
    calib = defaultdict(lambda: [0, 0])
    for s, x, y, info in edges:
        if x in trusted and y in trusted:
            k = f"{info['kind']}|{s}"
            calib[k][0 if hav(trusted[x], trusted[y]) <= CONFLICT_M else 1] += 1
    print("edge calibration on trusted pairs (same building / different building):", dict(calib))

    # ---------- 4. generic photos: link trusted pins that disagree ----------
    by_photo = defaultdict(set)
    for s, x, y, info in edges:
        for k in ("pa", "pb"):
            if k in info:
                by_photo[info[k]].update((x, y))
    generic = set()
    for asset, ls in by_photo.items():
        pins = [trusted[l] for l in ls if l in trusted]
        if len(pins) >= 2 and max(hav(p, q) for p in pins for q in pins) > CONFLICT_M:
            generic.add(asset)
    edges = [e for e in edges if e[3].get("pa") not in generic and e[3].get("pb") not in generic]
    print(f"generic photos dropped: {len(generic)}; listing edges kept: {len(edges)}")

    # ---------- union-find with cannot-link on trusted pins ----------
    parent = {m["id"]: m["id"] for m in manifest}
    seeds = {m["id"]: ([trusted[m["id"]]] if m["id"] in trusted else []) for m in manifest}

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    conflicts = []
    best = {}
    for s, x, y, info in sorted(edges, key=lambda e: -e[0]):
        key = (x, y)
        if key not in best or best[key][0] < s:
            best[key] = (s, info)
    for (x, y), (s, info) in sorted(best.items(), key=lambda kv: -kv[1][0]):
        rx, ry = find(x), find(y)
        if rx == ry:
            continue
        sx, sy = seeds[rx], seeds[ry]
        if sx and sy and max(hav(p, q) for p in sx for q in sy) > CONFLICT_M:
            conflicts.append({"a": x, "b": y, "strength": s, "info": info})
            continue
        parent[ry] = rx
        seeds[rx] = sx + sy

    groups = defaultdict(list)
    for m in manifest:
        groups[find(m["id"])].append(m["id"])
    multi = {r: ms for r, ms in groups.items() if len(ms) > 1}

    # ---------- 5. leave-one-out on trusted pins ----------
    loo = []
    for r, ms in multi.items():
        ts = [m for m in ms if m in trusted]
        if len(ts) < 2:
            continue
        for t in ts:
            others = [trusted[o] for o in ts if o != t]
            lat = float(np.median([p[0] for p in others]))
            lng = float(np.median([p[1] for p in others]))
            loo.append(hav((lat, lng), trusted[t]))
    # how far is today's approximate pin from the truth? (baseline the engine must beat)
    def bucket(v):
        return {"n": len(v), "<=50m": sum(x <= 50 for x in v), "<=100m": sum(x <= 100 for x in v), "<=250m": sum(x <= 250 for x in v), "median_m": round(float(np.median(v)), 1) if v else None}

    # ---------- 6. propagation ----------
    plan = {}
    plan_file = GEO / "geocode-plan-2026-10-11.json"
    if plan_file.exists():
        for p in json.loads(plan_file.read_text(encoding="utf8"))["plan"]:
            plan[p["id"]] = p
    out = []
    propagated = 0
    unseeded_members = 0
    link = defaultdict(float)  # strongest kept edge touching each listing
    for (x, y), (s, info) in best.items():
        if find(x) == find(y):
            link[x] = max(link[x], s)
            link[y] = max(link[y], s)
    for r, ms in sorted(multi.items(), key=lambda kv: -len(kv[1])):
        ts = [m for m in ms if m in trusted]
        g = {
            "group": "g" + hashlib.sha1(",".join(sorted(ms)).encode()).hexdigest()[:10],
            "size": len(ms),
            "seeds": ts,
            "members": [
                {
                    "id": m,
                    "link": link[m],
                    "slug": L[m].get("slug"),
                    "agent": L[m].get("agent"),
                    "district": L[m].get("district"),
                    "precision": L[m].get("precision"),
                    "title": L[m].get("title"),
                    "text": (plan.get(m) or {}).get("proposed"),
                    "textMatch": ((plan.get(m) or {}).get("match") or {}).get("name") if isinstance((plan.get(m) or {}).get("match"), dict) else (plan.get(m) or {}).get("match"),
                }
                for m in ms
            ],
            "evidence": [],
        }
        for (x, y), (s, info) in best.items():
            if find(x) == r and x in ms and y in ms:
                g["evidence"].append({"a": x, "b": y, "s": s, **info})
        g["evidence"] = sorted(g["evidence"], key=lambda e: -e["s"])[:12]
        if ts:
            lat = float(np.median([trusted[t][0] for t in ts]))
            lng = float(np.median([trusted[t][1] for t in ts]))
            spread = max((hav(trusted[a], trusted[b]) for a in ts for b in ts), default=0)
            g["predicted"] = {"lat": lat, "lng": lng, "level": "exact", "source": "photoMatch", "seedSpreadM": round(spread)}
            propagated += sum(1 for m in ms if m not in trusted)
        else:
            unseeded_members += len(ms)
            # text proposals of members that agree give the group an area-level guess
            props = [(plan[m]["proposed"], plan[m].get("confidence")) for m in ms if m in plan and plan[m].get("proposed") and plan[m]["proposed"].get("precision") in ("exact", "street", "area")]
            if props:
                pts = [(p["lat"], p["lng"]) for p, _ in props]
                spread = max((hav(a, b) for a in pts for b in pts), default=0)
                rank = {"exact": 0, "street": 1, "area": 2}
                p0 = sorted(props, key=lambda x: rank[x[0]["precision"]])[0][0]
                g["predicted"] = {"lat": p0["lat"], "lng": p0["lng"], "level": p0["precision"], "source": "text+photoMatch", "textSpreadM": round(spread)}
        out.append(g)

    (DATA / "groups.json").write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf8")
    (DATA / "conflicts.json").write_text(json.dumps(conflicts, ensure_ascii=False, indent=1), encoding="utf8")

    sizes = [len(ms) for ms in multi.values()]
    seeded = [r for r, ms in multi.items() if any(m in trusted for m in ms)]
    approx_ids = {m["id"] for m in manifest if m.get("precision") != "exact"}
    in_groups = {m for ms in multi.values() for m in ms}
    lines = [
        "# Photo engine — same-building groups",
        "",
        f"- listings: {len(manifest)}, trusted pins (exact): {len(trusted)}",
        f"- near-identical photo pairs: {len(near)}; place candidate pairs: {len(cand)}; geometrically verified: {sum(1 for v in verified.values() if v >= 25)} (>=25 inliers), {sum(1 for v in verified.values() if v >= 45)} (>=45)",
        f"- generic photos dropped: {len(generic)}; merges refused because trusted pins disagree: {len(conflicts)}",
        f"- groups with 2+ listings: {len(multi)} covering {sum(sizes)} listings (largest {max(sizes) if sizes else 0})",
        f"- approximate listings that sit in a group: {len(in_groups & approx_ids)} of {len(approx_ids)}",
        f"- groups with a trusted pin: {len(seeded)}; approximate listings that inherit a trusted pin: {propagated}",
        f"- listings in groups without any trusted pin: {unseeded_members} (one manual pin each group fixes them all)",
        "",
        "## Leave-one-out on trusted pins (predict a trusted pin from the other trusted pins of its group)",
        json.dumps(bucket(loo)),
        "",
        "## Edge calibration (before generic-photo removal): trusted pairs within / beyond 150 m",
        *[f"- {k}: same {v[0]} / different {v[1]}" for k, v in sorted(calib.items())],
    ]
    (DATA / "match-report.md").write_text("\n".join(lines), encoding="utf8")
    print("\n".join(lines))


def verify(pairs, assets):
    """DISK keypoints + LightGlue matches + MAGSAC fundamental-matrix inliers."""
    import cv2
    import kornia.feature as KF
    from PIL import Image

    disk = KF.DISK.from_pretrained("depth").to(device).eval()
    lg = KF.LightGlueMatcher("disk").to(device).eval()
    cache = {}

    def feats(i):
        if i in cache:
            return cache[i]
        arr = np.asarray(Image.open(THUMBS / f"{assets[i]}.jpg").convert("RGB"), dtype=np.float32) / 255.0
        img = torch.from_numpy(arr).permute(2, 0, 1)[None].to(device)
        with torch.inference_mode():
            f = disk(img, n=1024, pad_if_not_divisible=True)[0]
        hw = torch.tensor(img.shape[2:], device=device)
        cache[i] = (f.keypoints, f.descriptors, hw)
        if len(cache) > 6000:
            cache.pop(next(iter(cache)))
        return cache[i]

    out = {}
    for n, (a, b, cos) in enumerate(pairs):
        try:
            ka, da, hwa = feats(a)
            kb, db, hwb = feats(b)
            with torch.inference_mode():
                lafa = KF.laf_from_center_scale_ori(ka[None], torch.ones(1, len(ka), 1, 1, device=device))
                lafb = KF.laf_from_center_scale_ori(kb[None], torch.ones(1, len(kb), 1, 1, device=device))
                _, idxs = lg(da, db, lafa, lafb, hw1=hwa, hw2=hwb)
            if len(idxs) < 15:
                out[(a, b, cos)] = int(len(idxs))
                continue
            pa = ka[idxs[:, 0]].cpu().numpy()
            pb = kb[idxs[:, 1]].cpu().numpy()
            _, mask = cv2.findFundamentalMat(pa, pb, cv2.USAC_MAGSAC, 1.5, 0.999, 10000)
            out[(a, b, cos)] = int(mask.sum()) if mask is not None else 0
        except Exception as e:
            print("verify error", assets[a], assets[b], e, file=sys.stderr)
            out[(a, b, cos)] = 0
        if n % 1000 == 0:
            print(f"…verified {n}/{len(pairs)}", flush=True)
    json.dump([{"a": assets[a], "b": assets[b], "cos": c, "inliers": v} for (a, b, c), v in out.items()], open(DATA / "pairs.json", "w"))
    return out


if __name__ == "__main__":
    main()
