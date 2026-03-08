# CITY DISTRICT STUDIO UX REPORT

## 1. Problems fixed

- **Flat district list** — Districts from all cities were mixed in one list. Now districts can be browsed per city.
- **Duplicate names confusing** — "City Center" and similar names appear in multiple cities. District preview now shows the parent city in the subtitle.
- **No city-to-district path** — Editors could not easily go from a city to its districts. Now each city has "Edit City" and "Districts in this City".
- **Preview used slug** — District preview showed slug or raw city ref. It now shows the parent city title (localized).

## 2. Files changed

| File | Change |
|------|--------|
| `schemaTypes/documents/district.ts` | Preview: `select` uses `city->title.en/sq/ru/uk`; `prepare` sets `subtitle` to city title (fallback: "No city"). |
| `structure/index.ts` | Cities: async child fetches cities and builds a list where each city expands to "Edit City" and "Districts in this City". Added "All Cities" at bottom. Renamed "Districts" to "All Districts". |

## 3. How district preview was improved

- **Before:** Title = district title; subtitle = slug or city `_ref` id.
- **After:** Title = district title (en/sq/ru/uk fallback); subtitle = parent city title (en/sq/ru/uk fallback, or "No city" if missing).

The preview uses Sanity reference resolution: `city->title.en`, `city->title.sq`, etc., so the referenced city’s title is shown instead of the ref id.

## 4. How Studio structure was changed

**Before:**
```
- Cities (flat list)
- Districts (flat list)
```

**After:**
```
- Cities
  - [Each city by name]
    - Edit City
    - Districts in this City (filtered by city._ref)
  ─────────────
  - All Cities (flat list)
- All Districts (flat list)
```

- The Cities list item uses an async child that fetches cities and builds one list item per city.
- Each city expands to "Edit City" and "Districts in this City".
- Districts are filtered with `city._ref == $cityId`.
- "All Cities" provides a flat list when needed.
- "All Districts" remains for global management and shows the improved preview.

## 5. Whether data model was kept normalized

Yes. No schema changes.

- `district.city` remains the single source of truth.
- No `city.districts[]` or other denormalized arrays.
- Structure uses `district.city` via a filter on `city._ref`.
- No custom components; only Structure Builder and standard document types.

## 6. Any limitations that still remain

- **Async structure** — The Cities child is async and re-fetches on expand. A large number of cities could add a short delay.
- **New cities** — New cities appear in the Cities tree after refresh; no live updates without re-opening the tree.
- **Ordering by city** — "All Districts" does not group by city; it uses `order` and `title.en`. District preview still clarifies city context.
- **Missing city** — Districts with no city show "No city" in the preview; they remain editable.
