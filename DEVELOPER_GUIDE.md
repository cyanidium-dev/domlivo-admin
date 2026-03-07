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
│       ├── ctaLink.ts
│       ├── faqItem.ts
│       ├── districtStat.ts
│       ├── districtMetric.ts
│       ├── localizedString.ts
│       ├── localizedText.ts
│       ├── socialLink.ts
│       ├── footerLink.ts
│       └── languageField.ts
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
3. Use existing objects (e.g. `ctaLink`, `seo`) where applicable.

## Adding New Property Fields

1. Open `schemaTypes/documents/property.ts`.
2. Add the field to the right group (basic, pricing, location, details, media, seo, analytics).
3. For translatable text, use `localizedString` or `localizedText`.
4. For numeric/system data, use primitive types (number, string, etc.).

## Multilingual Fields

### Document-level (city, district, blogPost, homePage, siteSettings)

- Add `languageField` from `../objects` as the first field.
- Add the schema to `documentInternationalization` in `sanity.config.ts` if not already there.
- The plugin manages the `language` field; editors create translations via the plugin UI.

### Field-level (property)

- Use `localizedString` or `localizedText` for translatable fields.
- Structure: `{ en, ru, uk, sq }`.
- Frontend resolves the value for the current locale.

## Adding New Languages

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

2. Update `localizedString` and `localizedText` in `schemaTypes/objects/` to include the new locale field.

3. No changes needed in `sanity.config.ts` — languages are read from `lib/languages.ts`.

## Ownership Model

- **ownerUserId** — Set on create from `currentUser.id`. Used for dataset permissions and "My Properties" filter.
- **agent** — Business relationship; required for display and filtering.
- Structure: "My Properties" uses `ownerUserId == $userId`; "All Properties" shows everything.

## Preview Logic

Preview is defined in each schema:

```ts
preview: {
  select: { title: 'title', subtitle: 'slug.current', media: 'heroImage' },
  prepare(selection) {
    return {
      title: selection.title,
      subtitle: selection.subtitle,
      media: selection.media,
    }
  },
}
```

For localized content (e.g. property title), select each locale and choose the first non-empty value in `prepare`.

## Desk Structure

Defined in `structure/index.ts`. Sections:

- Home Page (language list)
- Site Settings (language list)
- Locations (Cities, Districts)
- Properties (My Properties, All Properties)
- Property Types
- Location Tags
- Agents
- Blog

To add a new section, add a `S.listItem()` or `S.documentTypeListItem()` to the `items` array.

## Maintaining Schema Consistency

- Use `defineType`, `defineField`, `defineArrayMember` from `sanity`.
- Reuse objects (`seo`, `ctaLink`, etc.) instead of duplicating fields.
- Keep validation rules in schemas (required, min, max).
- Document deprecated fields with `deprecated: { reason: '...' }` before removal.
