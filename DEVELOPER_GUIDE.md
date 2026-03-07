# Developer Guide

Guide for developers working on the Domlivo Sanity CMS.

## Project Structure

```
domlivo-admin/
├── lib/
│   └── languages.ts          # Supported locales (en, ru, uk, sq)
├── schemaTypes/
│   ├── index.ts              # Exports documents + objects
│   ├── documents/            # Document schemas
│   │   ├── index.ts
│   │   ├── city.ts
│   │   ├── district.ts
│   │   ├── property.ts
│   │   ├── propertyType.ts
│   │   ├── locationTag.ts
│   │   ├── agent.ts
│   │   ├── blogPost.ts
│   │   ├── homePage.ts
│   │   └── siteSettings.ts
│   └── objects/              # Reusable object schemas
│       ├── index.ts
│       ├── seo.ts
│       ├── localizedSeo.ts
│       ├── ctaLink.ts
│       ├── localizedCtaLink.ts
│       ├── faqItem.ts
│       ├── localizedFaqItem.ts
│       ├── districtStat.ts
│       ├── districtMetric.ts
│       ├── localizedString.ts
│       ├── localizedText.ts
│       ├── localizedSlug.ts
│       ├── socialLink.ts
│       ├── footerLink.ts
│       └── localizedFooterLink.ts
├── structure/
│   └── index.ts              # Custom desk structure
├── sanity.config.ts
└── sanity.cli.ts
```

## Adding New Schemas

### New document type

1. Create `schemaTypes/documents/myType.ts`:

```ts
import { defineType, defineField } from 'sanity'

export const myType = defineType({
  name: 'myType',
  title: 'My Type',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', validation: (Rule) => Rule.required() }),
    // ...
  ],
})
```

2. Register in `schemaTypes/documents/index.ts`:

```ts
import { myType } from './myType'
export const documents = [/* ... */, myType]
```

3. Add to `schemaTypes/index.ts` if needed (documents are already included).

4. Add to `structure/index.ts` for Studio navigation.

### New object type

1. Create `schemaTypes/objects/myObject.ts`.
2. Add to `schemaTypes/objects/index.ts` (both `objects` array and exports).
3. Use in document fields: `type: 'myObject'`.

## Extending City or District Pages

City and district schemas use field groups. To add a field:

1. Open `schemaTypes/documents/city.ts` or `district.ts`.
2. Add a `defineField` in the appropriate group.
3. For **text that varies by language**, use `localizedString` or `localizedText`. For **shared values** (e.g. one image, one URL, one number), use `image`, `string`, or `number`.
4. Use existing objects (e.g. `localizedCtaLink`, `localizedSeo`) where applicable.

## Adding New Property Fields

1. Open `schemaTypes/documents/property.ts`.
2. Add the field to the right group (basic, pricing, location, details, media, seo, analytics).
3. For translatable text, use `localizedString` or `localizedText`.
4. For numeric/system data (price, area, coordinates), use primitive types — they are shared across languages.

## Multilingual Content (Field-Level Only)

The project uses **field-level i18n** only. There are no per-language document variants for city, district, homePage, siteSettings, blogPost, propertyType, or locationTag.

### Adding localized fields to a document

- Use `localizedString` or `localizedText` for text that varies by language.
- Use `localizedSlug` for slugs per language, `localizedCtaLink` for CTAs, `localizedSeo` for SEO meta per language, `localizedFaqItem` for FAQ items, `localizedFooterLink` for footer links.
- **Shared across languages:** images, videos, URLs, numbers, references, booleans. Use `image`, `string`, `number`, `reference`, `boolean` etc. without localization.
- Frontend resolves the value for the current locale (e.g. `title[locale]` with fallback).

### Frontend compatibility

For all field-level i18n types (city, district, homePage, siteSettings, property, blogPost, blogCategory, **propertyType**, **locationTag**), the frontend must resolve localized fields with a helper such as `getLocalizedValue(obj, locale)` (or equivalent). In particular: `propertyType.title`, `locationTag.title`, `locationTag.slug` (and their `shortDescription` / `description`) are objects `{ en, ru, uk, sq }` — do not render them as raw objects; pick the value for the current locale with fallback.

### Adding new languages

1. Edit `lib/languages.ts`:

```ts
export const languages: Language[] = [
  { id: 'en', title: 'English' },
  { id: 'ru', title: 'Russian' },
  { id: 'uk', title: 'Ukrainian' },
  { id: 'sq', title: 'Albanian' },
  { id: 'de', title: 'German' },  // new
]
```

2. Update `localizedString`, `localizedText`, `localizedSlug`, and any other localized objects in `schemaTypes/objects/` to include the new locale key (e.g. `de`).

## Ownership Model

- **ownerUserId** — Set on property create from `currentUser.id`. Used for dataset permissions and "My Properties" filter in Studio.
- **agent** — Business relationship; required for display and filtering.
- Structure: "My Properties" uses `ownerUserId == $userId`; "All Properties" shows everything. Access control must also be enforced in the backend/API layer.

## Preview Logic

Preview is defined in each schema:

```ts
preview: {
  select: { titleEn: 'title.en', titleSq: 'title.sq', slugEn: 'slug.en', media: 'heroImage' },
  prepare(selection) {
    const title = selection.titleEn || selection.titleSq || 'Untitled'
    const subtitle = selection.slugEn || selection.slugSq || 'no-slug'
    return { title, subtitle, media: selection.media }
  },
}
```

For localized content, select each locale and choose the first non-empty value in `prepare`.

## Desk Structure

Defined in `structure/index.ts`:

- **Home Page** — Singleton (documentId: homePage).
- **Site Settings** — Singleton (documentId: siteSettings).
- **Locations** — **Cities** list, **Districts** list (ordered by `order`, then title).
- **Properties** — **My Properties** (filtered by `ownerUserId == $userId`), **All Properties**.
- **Property Types** — Taxonomy list.
- **Location Tags** — Taxonomy list.
- **Agents** — List.
- **Blog** — Blog posts (and categories if added).

To add a new section, add a `S.listItem()` or `S.documentTypeListItem()` to the `items` array.

## Maintaining Schema Consistency

- Use `defineType`, `defineField`, `defineArrayMember` from `sanity`.
- Reuse objects (`seo`, `localizedSeo`, `ctaLink`, `localizedCtaLink`, etc.) instead of duplicating fields.
- Keep validation rules in schemas (required, min, max).
- Document deprecated fields with `deprecated: { reason: '...' }` before removal.
