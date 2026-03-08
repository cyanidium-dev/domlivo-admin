# Query Layer (lib/sanity)

GROQ queries and fragments for frontend consumption.

## Placement

These queries are **temporarily** stored in the CMS repo for convenience:

- Frontend (Next.js) can import them directly from this package, or copy them
- Alternatively, move to a shared package (e.g. `@domlivo/groq`) once the monorepo exists
- This repo is the source of truth for schema; queries mirror schema shape

## Usage

```ts
import { client } from 'next-sanity'
import {
  PROPERTIES_LIST_QUERY,
  PROPERTY_BY_SLUG_QUERY,
  PROPERTY_CARD_FRAGMENT,
} from './lib/sanity'
// or from your frontend: import from '@domlivo/admin/lib/sanity'
```

## Rules

- Localized fields are returned as raw objects (`{ en, ru, uk, sq }`); frontend resolves with `getLocalizedValue(field, locale)`
- Do NOT resolve locale inside GROQ
- Fragments are composed in `fragments.ts`; queries use them in `queries.ts`
