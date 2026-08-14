# AMENITY SIMPLIFICATION REPORT

## 1. What was removed

- **slug** — Removed from amenity schema. Amenities are internal taxonomy for filtering, not routed/SEO entities.
- **shortLabel** — Removed. Not used in seed or current UI; title suffices for filters.
- **icon** — Removed. Not used anywhere in the repo.

## 2. Files changed

| File | Change |
|------|--------|
| `schemaTypes/documents/amenity.ts` | Removed slug, shortLabel, icon. Simplified preview. Updated description. |
| `lib/sanity/fragments.ts` | AMENITY_FRAGMENT: removed shortLabel, slug. amenitiesRefs projection: removed shortLabel, slug; removed active from projection (not needed for display). |
| `scripts/seed.ts` | Amenities: `slug` → `id` (used only for `_id` and `amenityIds` mapping). No slug field in created docs. |
| `TECHNICAL_OVERVIEW.md` | Amenity row: `title, order, active` |
| `REFACTOR_REPORT.md` | Amenity schema note updated to reference this simplification. |

## 3. Why slug was unnecessary

- Amenities are not routed; there are no amenity detail pages or URL-based lookups.
- Filtering uses references (amenity `_id`), not slug. The frontend filters by selected amenity reference, not by slug in the URL.
- `_id` (e.g. `amenity-pool`) is sufficient for stable identification in the CMS and in references.

## 4. Related fields simplified

- **shortLabel** — Removed. Never used in seed or UI; title is enough for filter labels.
- **icon** — Removed. Not used in the codebase; would add complexity without current value.

## 5. Migration needed?

**No.** Changes are additive from a data perspective:

- Existing amenity documents will have orphaned `slug`, `shortLabel`, `icon` fields in the dataset. Sanity ignores unknown fields; the schema no longer defines them, so Studio will not show or edit them.
- Queries and fragments no longer request these fields; frontend receives only `_id`, `title`, `order` (and `active` in AMENITY_FRAGMENT).
- Optional migration: run a script to `unset` slug, shortLabel, icon from amenity documents if you want to clean stored data. Not required for correctness.

## 6. Final amenity schema

```
amenity (document)
├── title     (localizedString, required)
├── order     (number, optional)
└── active    (boolean, optional, default true)
```
