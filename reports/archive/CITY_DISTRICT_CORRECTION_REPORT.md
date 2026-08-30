# City District Correction Report

## 1. What was wrong

- **City and district used localized slug** — Slug was modeled as `localizedSlug` (en, sq, ru, uk). Slugs are canonical URL identifiers, not translatable content.
- **District creation did not auto-assign city** — Creating from "Districts in this City" still asked the editor to choose the city manually.
- **City context was not inherited** — The initial value template existed but city was not reliably pre-filled.
- **Added complexity** — Localized slug and unclear flows made the CMS harder to use.

## 2. What schema mistakes were corrected

| Before | After |
|--------|-------|
| `city.slug` = `localizedSlug` (en/sq/ru/uk) | `city.slug` = single `slug` (current) |
| `district.slug` = `localizedSlug` (en/sq/ru/uk) | `district.slug` = single `slug` (current) |
| Slug required in 4 languages | One canonical slug per document |
| Preview used slug.en, slug.sq | Preview uses slug.current |
| Queries matched slug.en, slug.sq, slug.ru, slug.uk | Queries match slug.current |

## 3. How slug is modeled now

- **City:** `slug` = standard Sanity slug type, stored as `{current: string}`. One slug per city.
- **District:** `slug` = standard Sanity slug type, stored as `{current: string}`. One slug per district.
- **Blog, locationTag, blogCategory:** Still use `localizedSlug` (unchanged).
- **Property:** Uses standard `slug` (unchanged).
- **Frontend:** For city/district, use `slug.current` in URLs. No locale-specific slug.

## 4. How city auto-assignment now works

- Template `district-in-city` is registered in schema.templates.
- City-scoped district list uses `.initialValueTemplates([S.initialValueTemplateItem('district-in-city', {cityId: c._id})])`.
- When the editor clicks Create in "Districts in this City", the only option is "District in this city".
- The template’s `value` sets `city: {_type: 'reference', _ref: params.cityId}`.
- The new district has `city` pre-filled; the editor does not choose it.
- The district appears in the filtered list immediately.

## 5. Files changed

| File | Change |
|------|--------|
| `schemaTypes/documents/city.ts` | Replaced `localizedSlug` with single `slug`; updated preview. |
| `schemaTypes/documents/district.ts` | Replaced `localizedSlug` with single `slug`; preview already correct. |
| `lib/sanity/queries.ts` | `CITY_PAGE_QUERY`, `DISTRICT_PAGE_QUERY` now use `slug.current == $slug`. |
| `scripts/seed.ts` | City and district seed data use `slug: {current: slugBase}`. |
| `templates/districtInCity.ts` | More robust params handling for city reference. |
| `scripts/migrateCityDistrictSlug.ts` | New migration script for existing data. |
| `package.json` | Added `migrate:city-district-slug` script. |
| `CMS_GUIDE.md` | Slug description and district creation flow updated. |
| `DEVELOPER_GUIDE.md` | Note on city/district single slug. |
| `TECHNICAL_OVERVIEW.md` | Data model table updated. |

## 6. Whether migration is required

**Yes.** Existing city and district documents with `slug: {en, sq, ru, uk}` must be migrated to `slug: {current: string}`.

**How to migrate:**

```bash
npm run migrate:city-district-slug
```

This patches city and district documents by setting `slug.current` from the first available locale (en, sq, ru, uk).

## 7. Remaining limitations

- **City field is editable** — When editing a district from the city-scoped list, the city field remains editable. Making it read-only in that context would require additional logic (e.g. document badge or form overrides). Not implemented.
- **Template picker** — If the create flow still shows a template picker, the editor must choose "District in this city"; it is the only option.
- **Migration must run before deploy** — Run the migration script after deploying the schema change and before the frontend uses the new slug format.
