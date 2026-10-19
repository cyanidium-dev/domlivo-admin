# Listing validation — 2026-10-19

Run: 2026-10-19T05:26:05.595Z · `npx tsx scripts/validateListings.ts` · read-only, nothing was changed.

Scope: public sale listings (`isPublished == true`, lifecycle active or unset, `status == "sale"`, published documents) — **727** checked.

| Source | Listings | Main locale |
|---|---:|---|
| cactus | 361 | ru |
| getal | 254 | sq |
| findall | 74 | sq |
| other | 38 | sq |

Listings with at least one finding: **93**.

Location context: 680 descriptions name their own city/district, 46 name no place at all, 5 name another place next to their own (not flagged).

## Summary

| Group | Issue | Total | cactus | getal | findall | other |
|---|---|---:|---:|---:|---:|---:|
| 1. Location mismatch | Text names another city | 1 | 0 | 0 | 0 | 1 |
| 1. Location mismatch | Text names another district of the same city (lower confidence) | 7 | 4 | 2 | 1 | 0 |
| 2. Rooms vs layout | Rooms / bedrooms contradict the layout in the text | 15 | 1 | 9 | 5 | 0 |
| 3. Implausible area / price | Area missing | 16 | 4 | 10 | 2 | 0 |
| 3. Implausible area / price | Area outside the plausible range for the type | 3 | 1 | 2 | 0 | 0 |
| 3. Implausible area / price | Area per room absurd | 2 | 2 | 0 | 0 | 0 |
| 3. Implausible area / price | Price per m² outside band | 3 | 0 | 3 | 0 | 0 |
| 3. Implausible area / price | Price unit looks wrong | 0 | 0 | 0 | 0 | 0 |
| 4. Truncated description | Description ends mid-sentence | 1 | 0 | 0 | 1 | 0 |
| 5. Photos | No photos | 0 | 0 | 0 | 0 | 0 |
| 5. Photos | Fewer than 3 photos | 54 | 17 | 15 | 21 | 1 |
| 5. Photos | Gallery items without a usable asset | 0 | 0 | 0 | 0 | 0 |

## 1. Location mismatch

### Text names another city — 1

Rule: Description (en; main locale when en names no place) names a city, a district of another city, or a town outside the catalogue, outside distance/landmark phrases, and names neither the listing city nor any of its districts. An en hit is dropped when the main locale names the own city.

By source: cactus 0, getal 0, findall 0, other 1.

All 1:

| Listing | Source | Evidence |
|---|---|---|
| `property-tg-39d826df-0319-49ad-bf49-662fb31b8a6d` | other | fields: Sarande / —; en text names Orikum (district of Vlore) |

### Text names another district of the same city (lower confidence) — 7

Rule: Same city; the description names one or more other districts of that city (outside distance phrases) and never the listing district. Generic districts (City Center, Lungomare, Old Town ...) are not in the vocabulary, so a listing filed under "City Center" whose text says "Plazh" lands here.

By source: cactus 4, getal 2, findall 1, other 0.

All 7:

| Listing | Source | Evidence |
|---|---|---|
| `property-cactus-2987860a-ccbd-4124-b053-434020649bb6` | cactus | fields: Durres / City Center; en text names Plazh |
| `property-cactus-8bcfaaa1-ca4f-4f92-9871-e2bb414af4c1` | cactus | fields: Durres / Golem; en text names Plazh |
| `property-cactus-bfa6f88c-20c9-46e2-a4e2-c4e9e9d64b48` | cactus | fields: Durres / City Center; en text names Plazh |
| `property-cactus-c4d8c7cd-7c81-4985-97dc-60bd26e02632` | cactus | fields: Durres / Golem; en text names Shkëmbi, Shkëmbi i Kavajës |
| `property-findall-179` | findall | fields: Durres / Kavajë; en text names Plazhi |
| `property-getal-13525` | getal | fields: Durres / City Center; en text names Spitallë |
| `property-getal-16530` | getal | fields: Durres / City Center; en text names Plazh |

## 2. Rooms vs layout

### Rooms / bedrooms contradict the layout in the text — 15

Rule: N+1 = N bedrooms + living room: bedrooms must be N, rooms N+1. Studio/garsonierë = bedrooms 0, rooms 1. "N bedrooms" = bedrooms N. Russian N-комнатная = rooms N. Read from en + main-locale title and description; skipped when the text claims several values.

By source: cactus 1, getal 9, findall 5, other 0.

All 15:

| Listing | Source | Evidence |
|---|---|---|
| `property-cactus-ee92b3e7-f2b4-4f53-ab5a-c14d7b7460e3` | cactus | text "2+1" → bedrooms 2, rooms 3; fields bedrooms=0, rooms=1 |
| `property-findall-171` | findall | text "studio apartment" → bedrooms 0, rooms 1; fields bedrooms=1 |
| `property-findall-279` | findall | text "1+1" → bedrooms 1, rooms 2; fields bedrooms=2 |
| `property-findall-316` | findall | text "studio apartment" → bedrooms 0, rooms 1; fields bedrooms=1 |
| `property-findall-317` | findall | text "garsoniere" → bedrooms 0, rooms 1; fields bedrooms=1 |
| `property-findall-320` | findall | text "furnished studio" → bedrooms 0, rooms 1; fields bedrooms=1 |
| `property-getal-14094` | getal | text "garsoniere" → bedrooms 0, rooms 1; fields bedrooms=1 |
| `property-getal-14615` | getal | text "2+1" → bedrooms 2, rooms 3; fields rooms=4 |
| `property-getal-15328` | getal | text "two bedrooms" → bedrooms 2; fields bedrooms=1 |
| `property-getal-18338` | getal | text "garsoniere" → bedrooms 0, rooms 1; fields bedrooms=1, rooms=2 |
| `property-getal-18477` | getal | text "2+1" → bedrooms 2, rooms 3; fields bedrooms=1 |
| `property-getal-19228` | getal | text "garsoniere" → bedrooms 0, rooms 1; fields bedrooms=1 |
| `property-getal-2365` | getal | text "garsoniere" → bedrooms 0, rooms 1; fields bedrooms=1 |
| `property-getal-2492` | getal | text "garsoniere" → bedrooms 0, rooms 1; fields bedrooms=1 |
| `property-getal-8001` | getal | text "4+1" → bedrooms 4, rooms 5; fields rooms=6 |

## 3. Implausible area / price

### Area missing — 16

Rule: No `area` value.

By source: cactus 4, getal 10, findall 2, other 0.

All 16:

| Listing | Source | Evidence |
|---|---|---|
| `property-cactus-51dff073-6dbf-4212-820d-f07eb421ef82` | cactus | type apartment; area empty; plotArea — |
| `property-cactus-7d7bb851-54ac-4c52-8e6e-ac22e7316de1` | cactus | type apartment; area empty; plotArea — |
| `property-cactus-ae7fd6b1-daa9-4e89-8d04-0ad85e03cf87` | cactus | type apartment; area empty; plotArea — |
| `property-cactus-df85997e-7897-4dd3-9bf2-cda90f3954b6` | cactus | type apartment; area empty; plotArea — |
| `property-findall-153` | findall | type commercial-space; area empty; plotArea — |
| `property-findall-155` | findall | type land; area empty; plotArea — |
| `property-getal-12865` | getal | type commercial-space; area empty; plotArea — |
| `property-getal-16851` | getal | type commercial-space; area empty; plotArea — |
| `property-getal-17178` | getal | type apartment; area empty; plotArea — |
| `property-getal-17269` | getal | type apartment; area empty; plotArea — |
| `property-getal-17469` | getal | type apartment; area empty; plotArea — |
| `property-getal-17522` | getal | type land; area empty; plotArea — |
| `property-getal-18351` | getal | type apartment; area empty; plotArea — |
| `property-getal-19015` | getal | type apartment; area empty; plotArea — |
| `property-getal-19621` | getal | type apartment; area empty; plotArea — |
| `property-getal-19655` | getal | type commercial-space; area empty; plotArea — |

### Area outside the plausible range for the type — 3

Rule: apartment 20-400 m², penthouse 30-600, studio 15-80, house/villa 40-2000, land >= 50, commercial/office >= 10.

By source: cactus 1, getal 2, findall 0, other 0.

All 3:

| Listing | Source | Evidence |
|---|---|---|
| `property-cactus-885a8d56-9025-4fee-90ee-32f4ee6af1a4` | cactus | type studio; area 260 m² (range 15-80) |
| `property-getal-10597` | getal | type apartment; area 5800 m² (range 20-400) |
| `property-getal-3069` | getal | type studio; area 146 m² (range 15-80) |

### Area per room absurd — 2

Rule: area / rooms (or bedrooms+1) < 10 m² for any residential type, or > 150 m² for apartments/studios.

By source: cactus 2, getal 0, findall 0, other 0.

All 2:

| Listing | Source | Evidence |
|---|---|---|
| `property-cactus-4f024507-9408-45d9-8af9-b4f9b7692b17` | cactus | type apartment; 400 m² / 1 rooms = 400 m² per room |
| `property-cactus-885a8d56-9025-4fee-90ee-32f4ee6af1a4` | cactus | type studio; 260 m² / 1 rooms = 260 m² per room |

### Price per m² outside band — 3

Rule: apartment/studio/penthouse 300-10,000 €/m², house/villa 150-10,000, commercial/office 150-15,000, land 5-5,000. Price per m² = price when priceUnit = per-sqm, else price / area.

By source: cactus 0, getal 3, findall 0, other 0.

All 3:

| Listing | Source | Evidence |
|---|---|---|
| `property-getal-10597` | getal | type apartment; 50 €/m² (price 50 €/m², area 5800 m²; band 300-10000) |
| `property-getal-17402` | getal | type commercial-space; 134 €/m² (price 75000 €, area 560 m²; band 150-15000) |
| `property-getal-17740` | getal | type office; 14 €/m² (price 75000 €, area 5500 m²; band 150-15000) |

### Price unit looks wrong — 0

Rule: priceUnit per-sqm with price > 20,000 (looks like a total), or a total price < 15,000 € on a non-land listing (looks like a per-m² figure or a typo).

By source: cactus 0, getal 0, findall 0, other 0.

_None._

## 4. Truncated description

### Description ends mid-sentence — 1

Rule: en or main locale ends with "..."/"…", with scraper button text (See less / Shiko më shumë), on , ; : - ( or a dangling function word, or its last paragraph is 80+ characters of prose without . ! ?

By source: cactus 0, getal 0, findall 1, other 0.

All 1:

| Listing | Source | Evidence |
|---|---|---|
| `property-findall-107` | findall | sq: scraper button text at end: "a e 1 Bregdetare Ju mirëpresim! See less" |

## 5. Photos

### No photos — 0

Rule: Gallery empty.

By source: cactus 0, getal 0, findall 0, other 0.

_None._

### Fewer than 3 photos — 54

Rule: Gallery has 1 or 2 images.

By source: cactus 17, getal 15, findall 21, other 1.

First 50 of 54:

| Listing | Source | Evidence |
|---|---|---|
| `property-cactus-06b95748-12f4-4cf5-be0c-c3419ba10d37` | cactus | 2 image(s) |
| `property-cactus-06e0b4e6-e653-4ab8-af6d-ac83e434d099` | cactus | 2 image(s) |
| `property-cactus-176fd1a0-bd3a-4a9e-a766-782a5ac09b0a` | cactus | 2 image(s) |
| `property-cactus-3dc8ad8e-d934-4359-b752-f0397a8ce0f0` | cactus | 1 image(s) |
| `property-cactus-49850744-0022-4783-afd6-5b93655420dc` | cactus | 1 image(s) |
| `property-cactus-7367d94a-4cd9-449f-9d48-55d8ea9a4687` | cactus | 1 image(s) |
| `property-cactus-77957932-ad2d-4031-a8c0-da47c4602e1c` | cactus | 1 image(s) |
| `property-cactus-7d7bb851-54ac-4c52-8e6e-ac22e7316de1` | cactus | 2 image(s) |
| `property-cactus-850d67b7-f417-4d10-a686-a74ff00c2949` | cactus | 2 image(s) |
| `property-cactus-85538771-b92d-4c95-a0f6-d1354ae242d6` | cactus | 2 image(s) |
| `property-cactus-89235a9b-003e-4b61-960e-e672180c0fee` | cactus | 2 image(s) |
| `property-cactus-8d785b6f-1bc6-440f-8adf-9418042f30e8` | cactus | 1 image(s) |
| `property-cactus-9ca0e4b1-c0d3-40fd-8abc-ac4e5c0d7495` | cactus | 2 image(s) |
| `property-cactus-9f4e159e-0947-4d64-b3bf-92e98ca8539e` | cactus | 2 image(s) |
| `property-cactus-d248f285-a349-4c7f-9762-d3ec4f2f87a4` | cactus | 2 image(s) |
| `property-cactus-e4da3417-713e-4e1b-8711-38ec1cc0f463` | cactus | 1 image(s) |
| `property-cactus-f0766467-cacd-4df7-8745-4d9f132ab99e` | cactus | 2 image(s) |
| `property-findall-107` | findall | 1 image(s) |
| `property-findall-151` | findall | 1 image(s) |
| `property-findall-153` | findall | 2 image(s) |
| `property-findall-154` | findall | 1 image(s) |
| `property-findall-155` | findall | 1 image(s) |
| `property-findall-156` | findall | 1 image(s) |
| `property-findall-157` | findall | 1 image(s) |
| `property-findall-159` | findall | 1 image(s) |
| `property-findall-179` | findall | 2 image(s) |
| `property-findall-232` | findall | 1 image(s) |
| `property-findall-246` | findall | 2 image(s) |
| `property-findall-249` | findall | 1 image(s) |
| `property-findall-250` | findall | 1 image(s) |
| `property-findall-279` | findall | 2 image(s) |
| `property-findall-288` | findall | 1 image(s) |
| `property-findall-289` | findall | 1 image(s) |
| `property-findall-291` | findall | 1 image(s) |
| `property-findall-299` | findall | 1 image(s) |
| `property-findall-76` | findall | 1 image(s) |
| `property-findall-77` | findall | 1 image(s) |
| `property-findall-9` | findall | 2 image(s) |
| `property-getal-10898` | getal | 2 image(s) |
| `property-getal-10899` | getal | 2 image(s) |
| `property-getal-11204` | getal | 2 image(s) |
| `property-getal-12865` | getal | 2 image(s) |
| `property-getal-12979` | getal | 2 image(s) |
| `property-getal-13215` | getal | 1 image(s) |
| `property-getal-13404` | getal | 1 image(s) |
| `property-getal-18550` | getal | 2 image(s) |
| `property-getal-1861` | getal | 1 image(s) |
| `property-getal-18815` | getal | 2 image(s) |
| `property-getal-19235` | getal | 2 image(s) |
| `property-getal-2007` | getal | 1 image(s) |

### Gallery items without a usable asset — 0

Rule: Gallery item has no asset reference, or the referenced asset document does not exist.

By source: cactus 0, getal 0, findall 0, other 0.

_None._
