# District Creation Flow Fix Report

## 1. Root cause

- **Blank rows / inconsistent behavior** — District preview and create flow were not robust for drafts or newly created documents with partial data.
- **No city auto-assignment** — Creating a district from "Districts in this City" did not pre-fill the `city` reference; editors had to choose the city manually.
- **Preview fallbacks** — Preview used "Untitled" and "No city", but did not enforce string types or explicit fallbacks for empty/undefined values, which could lead to blank list rows.

## 2. Files changed

| File | Change |
|------|--------|
| `templates/districtInCity.ts` | **NEW** — Initial value template that pre-fills `city` from `cityId` parameter. |
| `sanity.config.ts` | Registered `districtInCityTemplate` in `schema.templates`. |
| `structure/index.ts` | Added `.initialValueTemplates([S.initialValueTemplateItem('district-in-city', {cityId: c._id})])` to the city-scoped district list so create uses the template with the current city. |
| `schemaTypes/documents/district.ts` | Preview: changed fallback to "Untitled district", wrapped title/subtitle in `String()` for robustness. |

## 3. How city auto-assignment was implemented

- Added an initial value template `district-in-city` with parameter `cityId`.
- Template `value` returns `{ city: { _type: 'reference', _ref: params.cityId } }`.
- The city-scoped district list calls `.initialValueTemplates([S.initialValueTemplateItem('district-in-city', {cityId: c._id})])`, so the Create flow uses this template with the selected city’s ID.
- New districts created from "Districts in this City" receive the correct city reference automatically.

## 4. How preview fallback was fixed

- Title fallback changed from `'Untitled'` to `'Untitled district'`.
- Subtitle fallback kept as `'No city'` when the city reference is missing or unresolved.
- Title and subtitle are normalized with `String(...)` so values are always strings and list rows never appear blank.

## 5. How the filtered list now behaves

- Filter: `_type == "district" && city._ref == $cityId`.
- Districts are scoped to the selected city.
- New districts created from this list have `city` set, so they show up in the list right away.
- Single template + parameter means the Create flow always uses the correct city.

## 6. Whether existing data needs migration

**No.** All changes are additive and work with existing data:

- The template only sets initial values for new documents.
- Preview changes apply to all districts, including drafts and partial data.
- Existing districts without a city show "No city" in the subtitle but remain editable.
