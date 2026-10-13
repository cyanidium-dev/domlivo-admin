# Geo engine: real map positions for listings

Partners send listings without coordinates and photos without GPS. This engine
places them, following the owner's rule (2026-10-13):

1. **realtor**: the agency's Google Maps point (`googleMapsUrl` in the Studio, or
   Cactus's `locationGmapsLink`) is the truth;
2. **manual**: a pin someone placed in the Studio;
3. **complex / photoMatch / text / vision**: what the tools can prove;
4. **district**: only when nothing else is known.

Realtor and manual pins are never moved. The Studio marks them by itself: pasting
a link, clicking or dragging the map, or typing coordinates sets `locationSource`
to `realtor`/`manual` and the level to `exact`.

## How listings are placed

| Tier | What it uses | Precision | Measured on our data (2026-10-13) |
|---|---|---|---|
| realtor | agency Google Maps link | building | 85 Cactus links resolved |
| complex | named complex in OSM / Cactus pins of sibling listings | building | 21 listings |
| photoMatch | the listing shows **the same photo** as a listing with a trusted pin (pHash + dHash), the same Sanity asset, or the same view verified point by point (DISK + LightGlue, **≥ 200 inliers**) | building | 84/84 links between trusted pins correct; 14 approximate listings placed |
| text | street or landmark named in the text (`geocodeListingsPlan20261011.ts`, OSM/Nominatim) | street / ~250 m | 160 listings; moves over 1 km go to review |
| vision | map screenshots in the photos (coordinates printed, or a pin georeferenced on the ASIG orthophoto), checked by a second agent | building / plot | see `vision-results` in the workspace |
| district | nothing finer | district | the rest, keeps its coordinates |

What did **not** work, and why it is not used:

- photo-to-GPS models (GeoCLIP, G3, GeoRanker, PIGEON...) reach 10-19 % within 1 km on
  street photos and were never tested on interiors or balconies: city level at best;
- "same place, other angle" with fewer than 200 inliers: balcony views of the same sea
  and one developer's look-alike renders match buildings kilometres apart (precision
  0.53 at ≥ 45 inliers, 0.30 at ≥ 25);
- Google Street View / Photorealistic 3D Tiles: their terms forbid image analysis and storing;
- Bird (the Ukrainian app) does not locate by photos either: it extracts the address
  from the text and drops listings without one; photos serve de-duplication only.

## Run

```bash
# 1. listings (live, public API) + 512 px thumbnails  → workspace/geo/photo-engine/
node scripts/geo-engine/download-thumbs.mjs
# 2. photo classes (SigLIP) + descriptors (DINOv2) + perceptual hashes, on the GPU
../domlivo-workspace/geo/photo-engine/.venv/Scripts/python.exe -I scripts/geo-engine/features.py
# 3. same-building groups (reuses pairs.json; add --reverify to recompute LightGlue, ~30 min)
../domlivo-workspace/geo/photo-engine/.venv/Scripts/python.exe -I scripts/geo-engine/match.py
# 4. page of buildings nobody has pinned yet: pin ONE listing per group in the Studio
node scripts/geo-engine/group-review.mjs
# 5. write pins (dry run first; backup of every patched document is written before --execute)
npx tsx scripts/applyGeoEngine20261013.ts
npx tsx scripts/applyGeoEngine20261013.ts --execute
```

`GEO_ENGINE_DATA` overrides the data folder (default `../domlivo-workspace/geo/photo-engine`).
`mapview.py` draws gridded orthophoto (ASIG geoportal WMS, 2018 or 2015) or
OpenStreetMap views around a point; the vision agents georeference map screenshots with it.

After pinning groups by hand, run steps 1, 3 and 5 again: the new pins become trusted
and spread to every listing that shares a photo with them.
