# CMS Troubleshooting

## Missing keys in Sanity arrays

### Why this happens

Sanity Studio requires each object in an array-of-object field to have a unique `_key` property. Without it, the Studio cannot reliably track, reorder, or edit array items, and you may see errors or broken editing behavior.

Documents created by the seed script (or imported/migrated without `_key`) can have array items missing `_key`, which breaks editing for those fields.

### Affected fields

The following array-of-object fields may be affected:

| Document type  | Field            |
|----------------|------------------|
| siteSettings   | socialLinks      |
| siteSettings   | footerQuickLinks |
| homePage       | faqItems         |
| district       | metrics          |
| district       | faqItems         |
| city           | districtStats    |
| city           | faqItems         |
| property       | locationTags     |

### How to fix existing documents

Run the repair script:

```bash
npm run fix:keys
```

This script:

1. Fetches documents with the affected array fields
2. Adds `_key` to any array item that lacks it
3. Patches the documents via the Sanity API

Requires `SANITY_API_TOKEN` in `.env` with write permissions.

### Preventing the issue in future seeds

The seed script now uses `addKeysToArrayItems()` for all array-of-object data. Any new array-of-object fields added to the seed must wrap the array with this helper so every object gets a `_key`:

```ts
import {addKeysToArrayItems} from './lib/addKeysToArrayItems'

// ✅ Correct
socialLinks: addKeysToArrayItems([
  {platform: 'Facebook', url: 'https://facebook.com/domlivo'},
  ...
]),

// ❌ Incorrect – items lack _key
socialLinks: [
  {platform: 'Facebook', url: 'https://facebook.com/domlivo'},
  ...
],
```
