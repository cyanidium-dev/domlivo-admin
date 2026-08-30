# FULL CONTENT RESET AND RESEED REPORT

## 1. What was deleted

### Wipe script status

The wipe script `scripts/wipeDataset.ts` was created and executed. It **failed** due to API token permissions:

- **Error:** `Insufficient permissions; permission "manage" required`
- **Cause:** The `SANITY_API_TOKEN` in `.env` does not have "manage" permission (needed for delete operations)
- **Result:** **No documents were deleted.** The dataset still contains the previous 69 documents

### To complete a full wipe

1. Create an API token in [Sanity Manage](https://www.sanity.io/manage) with **Editor** or **Administrator** role (or a custom role with "manage" permission)
2. Update `SANITY_API_TOKEN` in `.env` with that token
3. Run: `npm run wipe:dataset`
4. Then run: `npm run seed`

### What the wipe script deletes (when run with correct token)

| Deleted | Description |
|---------|-------------|
| All documents | Every document in the dataset |
| All drafts | Documents with `drafts.` prefix |
| Singletons | homePage, siteSettings, etc. |
| Cities, districts, properties | All content documents |
| Blog posts/categories | All blog content |
| Agents, property types, location tags, amenities | All taxonomy documents |

### What is NOT deleted

| Preserved | Description |
|-----------|-------------|
| **Media assets** | Images and files are NOT deleted. They remain in the dataset. The wipe script only deletes documents. |

---

## 2. Reset method

### Script

- **Command:** `npm run wipe:dataset`
- **Script:** `scripts/wipeDataset.ts`
- **Reusable:** Yes. Run whenever you need a full content reset.

### Flow

1. Fetches all document IDs: `*[defined(_id)]{_id}`
2. Deletes in batches of 100 via `client.transaction()`
3. Logs progress
4. Does not touch assets

---

## 3. Slug fixes

### Schemas updated

| Schema | Change |
|--------|--------|
| **city** | Already used single slug; source: `title.en` |
| **district** | Already used single slug; source: `title.en` |
| **property** | Already used single slug; source: `title.en` |
| **locationTag** | Changed from `localizedSlug` to single `slug`; source: `title.en` |
| **blogCategory** | Changed from `localizedSlug` to single `slug`; source: `title.en` |
| **blogPost** | Changed from `localizedSlug` to single `slug`; source: `title.en` |

### Slug source pattern

All slug fields now use:

```ts
options: {
  source: (doc: Record<string, unknown>) => {
    const t = doc?.title as {en?: string} | undefined
    return t?.en ?? ''
  },
  maxLength: 96,
}
```

- **Primary source:** English title (`title.en`)
- **Generate button:** Uses this source to produce the slug
- **Single canonical slug:** `slug.current` (no localized slug objects)

### Unchanged

- **propertyType:** No slug field
- **amenity:** No slug field
- **agent:** No slug field

---

## 4. Seeded content

The seed script ran successfully. Content created:

| Type | Count |
|------|-------|
| Property Types | 5 |
| Location Tags | 8 |
| Amenities | 10 |
| Agents | 3 |
| Cities | 4 |
| Districts | 9 |
| HomePage | 1 (singleton) |
| SiteSettings | 1 (singleton) |
| Properties | 10 |
| Blog Categories | 2 |
| Blog Posts | 4 |

### Content details

- **Cities:** Tirana, Durres, Vlore, Sarande
- **Districts:** 2–3 per city (Blloku, Qender, Komuna e Parisit, Plazh, City Center, Lungomare, Uji i Ftohte, Ksamil, etc.)
- **Properties:** Mix of apartments, villas, houses, commercial, short-term rental
- **Translations:** Albanian, English, Russian, Ukrainian
- **Relations:** Districts → cities; properties → city, district, type, agent

---

## 5. Relation integrity

| Relation | Status |
|----------|--------|
| District → City | All districts reference the correct city |
| Property → City | All properties reference a valid city |
| Property → District | All properties reference a valid district |
| Property → PropertyType | All properties reference a valid type |
| Property → Agent | All properties reference a valid agent |
| Property → LocationTags | References valid location tags |
| Property → Amenities | References valid amenities |
| BlogPost → BlogCategory | All posts reference valid categories |

---

## 6. Remaining issues

### Wipe not executed

- **Issue:** Wipe script failed due to token permissions
- **Action required:** Create a token with "manage" permission and run `npm run wipe:dataset` before `npm run seed` if you want a fully clean dataset
- **Current state:** Seed ran with `createOrReplace`, so seeded documents were created/overwritten. Any documents not in the seed (e.g. old test content) remain in the dataset.

### District creation flow

- The district initial value template (`district-in-city`) is configured
- Structure passes `cityId` to the template
- If city auto-fill still fails in Studio, check browser console for template-related warnings

---

## 7. Files changed

| File | Change |
|------|--------|
| `scripts/wipeDataset.ts` | **NEW** – Content wipe script |
| `package.json` | Added `wipe:dataset` script |
| `schemaTypes/documents/locationTag.ts` | Replaced `localizedSlug` with single `slug`; source `title.en` |
| `schemaTypes/documents/blogCategory.ts` | Replaced `localizedSlug` with single `slug`; source `title.en` |
| `schemaTypes/documents/blogPost.ts` | Replaced `localizedSlug` with single `slug`; source `title.en` |
| `scripts/seed.ts` | Updated `locationTag`, `blogCategory`, `blogPost` to use `slug: {current: slugBase}` |

### Files not changed

- `schemaTypes/documents/city.ts` – slug already correct
- `schemaTypes/documents/district.ts` – slug already correct
- `schemaTypes/documents/property.ts` – slug already correct
- `structure/index.ts` – district-in-city template already in place
- `templates/districtInCity.ts` – template already configured
- `sanity.config.ts` – no changes
