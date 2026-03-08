# REFACTOR REPORT

## 1. Summary

### What was wrong

- **Legacy i18n code:** `@sanity/document-internationalization`, `languageField`, `slugUniqueByLanguage` were remnants of document-level i18n. The project uses field-level i18n only.
- **Duplicate scripts:** `fix:keys` and `fix-keys` pointed to different files; `fix:translations` targeted deprecated document-i18n.
- **No property lifecycle:** Properties lacked a lifecycle/status model (draft, active, sold, archived) for filtering and listing.
- **Weak amenities model:** Amenities were free-text strings; no taxonomy for filters or future filtering.
- **Query layer unclear:** GROQ queries in the CMS repo had no explanation for placement or future frontend use.
- **Access control undocumented:** Ownership (`ownerUserId`, “My Properties”) was only described in code comments, not in docs.
- **Schema validation gaps:** Property slug was not explicitly unique.

### What was fixed

- Removed `@sanity/document-internationalization`, `languageField.ts`, `slugUniqueByLanguage.ts`.
- Cleaned `package.json` scripts: single `fix:keys`, removed `fix-keys` and `fix:translations`.
- Added `lifecycleStatus` to property (draft, active, reserved, sold, rented, archived).
- Added `amenity` document type and `amenitiesRefs` on property; kept `amenities` (string[]) as deprecated.
- Added `lib/sanity/README.md`, `docs/ACCESS_CONTROL.md`.
- Enabled slug uniqueness on property with `isUnique: true`.
- Updated `TECHNICAL_OVERVIEW.md` for structure, scripts, and known debt.

### What was intentionally left unchanged

- Property `status` (sale/rent/short-term) kept as listing type; `lifecycleStatus` is lifecycle.
- `ownerUserId` migration still TODO; no automatic population script added.
- `amenities` (string[]) kept for backward compatibility; migration to `amenitiesRefs` left as a future task.
- Structure builder, Studio layout, and existing document types unchanged beyond schema additions.
- No changes to i18n patterns (field-level only).

---

## 2. Files changed

| File | What changed | Why |
|------|--------------|-----|
| `package.json` | Removed `@sanity/document-internationalization`. Removed duplicate `fix:keys` / `fix-keys`. Removed `fix:translations`. Single `fix:keys` → `fixMissingKeys.ts` | Remove unused deps and duplicate scripts |
| `schemaTypes/objects/index.ts` | Removed `languageField` export | languageField deleted; no schemas use it |
| `schemaTypes/objects/languageField.ts` | **DELETED** | Legacy document-i18n; not used |
| `lib/slugUniqueByLanguage.ts` | **DELETED** | Legacy document-i18n; blogPost uses localizedSlug |
| `lib/languages.ts` | Comment updated: no longer references document-internationalization | Reflect field-level i18n only |
| `schemaTypes/documents/property.ts` | Added `lifecycleStatus`. Replaced `amenities` with deprecated `amenities` (string[]) + `amenitiesRefs` (reference[]). Added `isUnique: true` to slug | Lifecycle, amenity taxonomy, slug validation |
| `schemaTypes/documents/amenity.ts` | **NEW** | Normalized amenity taxonomy for filtering |
| `schemaTypes/documents/index.ts` | Added `amenity` import/export | Register amenity schema |
| `structure/index.ts` | Added Amenities list item | Expose amenities in Studio |
| `lib/sanity/fragments.ts` | Added `lifecycleStatus`, `amenitiesRefs` to property fragments. Added `AMENITY_FRAGMENT` | Support new fields in queries |
| `lib/sanity/queries.ts` | Added `AMENITIES_QUERY`. Added `lifecycleStatus` filter to PROPERTIES_LIST_QUERY and FEATURED_PROPERTIES_QUERY | Filter by lifecycle; query amenities |
| `lib/sanity/index.ts` | Exported `AMENITIES_QUERY`, `AMENITY_FRAGMENT` | Public API for frontend |
| `lib/sanity/README.md` | **NEW** | Document query layer placement and usage |
| `docs/ACCESS_CONTROL.md` | **NEW** | Document ownership, “My Properties”, and backend enforcement limits |
| `scripts/fix-translation-groups.ts` | Added deprecation comment; removed from package.json | Script kept for reference; not for normal use |
| `scripts/seed.ts` | Added amenity docs, `amenitiesRefs` and `lifecycleStatus` to properties | Demo content reflects new schema |
| `TECHNICAL_OVERVIEW.md` | Updated deps, structure, property schema, search/filtering, known debt, scripts | Match current state of repo |

---

## 3. Architecture improvements

### Query layer placement

- GROQ queries remain in `lib/sanity/`; `lib/sanity/README.md` explains they are shared for frontend and can move to a shared package later.
- Fragments stay in `fragments.ts`; queries use them in `queries.ts`.

### Access control model

- `docs/ACCESS_CONTROL.md` clarifies:
  - `ownerUserId` and “My Properties” are Studio-only.
  - Content Lake has no row-level security.
  - Backend enforcement would need a custom API (e.g. Next.js API routes) checking ownership before mutations.
- Existing `ownerUserId` logic and structure filter left as-is.

### Dependency and script cleanup

- Removed `@sanity/document-internationalization` (not used).
- One `fix:keys` script; `fix:translations` removed from scripts (file kept but deprecated).
- `fixMissingKeys.ts` kept as the fix:keys implementation (handles gallery, districtStats, blogPost, etc.).

---

## 4. Schema changes

### New document type: `amenity`

Internal taxonomy for filtering (not routed). Simplified: title, order, active. See AMENITY_SIMPLIFICATION_REPORT.md for later simplification.

### Property schema updates

| Field | Change |
|-------|--------|
| `lifecycleStatus` | NEW. string: draft, active, reserved, sold, rented, archived. Default: active |
| `amenities` | Renamed/kept as deprecated (string[]). Description marks as legacy |
| `amenitiesRefs` | NEW. array of reference → amenity |
| `slug` | `isUnique: true` added |

### Structure

- Added “Amenities” to Studio sidebar under Location Tags.

---

## 5. Data model impact

### Safe changes

- New `amenity` documents and `amenitiesRefs` on properties — additive.
- `lifecycleStatus` — optional; existing docs get `undefined`; queries treat as `active`.
- `slug` uniqueness — only affects new or edited slugs.
- Removing `languageField` / `slugUniqueByLanguage` — no schemas used them.

### Risky / migration-needed changes

- **amenities:**  
  - `amenities` (string[]) kept for backward compatibility.  
  - New editing should use `amenitiesRefs`.  
  - Migration script to create amenity docs from unique strings and patch `amenitiesRefs` not included.
- **lifecycleStatus:**  
  - Existing properties: `lifecycleStatus` is undefined.  
  - Queries use `(lifecycleStatus == "active" \|\| !defined(lifecycleStatus))` so they remain visible.  
  - Optional migration: set `lifecycleStatus: "active"` on all existing properties for clarity.

### Slug uniqueness

- If existing data has duplicate slugs, Studio will block saving until slugs are unique.
- Existing duplicates will not auto-fix; manual review required.

---

## 6. Removed technical debt

| Item | Action |
|------|--------|
| `@sanity/document-internationalization` | Removed from dependencies |
| `languageField` | Deleted; export removed |
| `slugUniqueByLanguage` | Deleted (unused) |
| Duplicate `fix:keys` / `fix-keys` | Consolidated to single `fix:keys` |
| `fix:translations` | Removed from package.json; script deprecated |
| Outdated TECHNICAL_OVERVIEW | Updated for current structure and debt |

---

## 7. Follow-up recommendations

1. **Before frontend integration**
   - Import queries from `lib/sanity` (or shared package).
   - Handle `lifecycleStatus` in filters; treat `undefined` as active.
   - Use `amenitiesRefs` for filters; fallback to `amenities` if needed.

2. **Amenities migration (optional)**
   - Script to: collect unique `amenities` strings → create amenity docs → set `amenitiesRefs` and optionally clear `amenities`.

3. **ownerUserId migration**
   - Populate `ownerUserId` on existing properties (e.g. from `agent.userId`) so “My Properties” works.

4. **Access control (optional)**
   - If ownership must be enforced: implement custom API that validates `ownerUserId == currentUser.id` before PATCH/DELETE.

---

## 8. Breaking changes

| Change | Impact |
|--------|--------|
| Property `lifecycleStatus` filter | Frontend must either include lifecycle in filters or rely on current query (active or undefined). |
| Property `amenitiesRefs` | New field; frontend should prefer it over `amenities` for display/filtering. |
| Slug uniqueness | Duplicate slugs will cause validation errors; existing duplicates need manual fix. |
| Removed `fix:keys` / `fix-keys` | Use only `npm run fix:keys`. |
| Removed `fix:translations` | Script still exists; run with `tsx scripts/fix-translation-groups.ts` if needed for legacy document-i18n. |
| `languageField` export removed | Any external code importing it will break; none found in this repo. |

---

## 9. Migration checklist

### If migrating existing properties to lifecycleStatus

1. [ ] Run GROQ to list properties with `!defined(lifecycleStatus)`.
2. [ ] Patch each: `lifecycleStatus: "active"` (or appropriate value).
3. [ ] Re-run listing queries to confirm behavior.

### If migrating amenities to amenitiesRefs

1. [ ] Collect unique strings from `property.amenities`.
2. [ ] Create `amenity` documents for each unique value (slug, title).
3. [ ] For each property: set `amenitiesRefs` from matching amenities; optionally unset `amenities`.
4. [ ] Update frontend to read `amenitiesRefs` and optionally fallback to `amenities`.

### If fixing duplicate property slugs

1. [ ] Query: `*[_type == "property"]{_id, "slug": slug.current}`.
2. [ ] Detect duplicates.
3. [ ] Manually update slugs in Studio or via patch.
