# Domlivo CMS

Sanity Studio backend for **Domlivo** — a production-ready multilingual real estate platform for Albania.

## Project Overview

Domlivo is a headless CMS that powers property listings, city and district landing pages, blog content, and site-wide settings. The frontend is a separate Next.js application that consumes this CMS via the Sanity Content API.

**Key capabilities:**

- Multilingual content (English, Russian, Ukrainian, Albanian) via **field-level i18n**
- Property listings with localized fields
- City and district SEO landing pages (one document each, localized fields)
- Agent-owned properties with filtered views in Studio
- Global site settings and homepage as **singletons** (one document each, localized fields)
- Blog: one post / one category = one document with localized fields

## Tech Stack

- **Sanity Studio v5** — Content management
- **TypeScript** — Type safety
- **GROQ** — Content querying (from frontend)
- **Field-level localization** — `localizedString`, `localizedText`, and related objects for multilingual fields

## Architecture Overview

```
domlivo-admin/
├── lib/
│   └── languages.ts          # Supported locales (single source of truth)
├── schemaTypes/
│   ├── documents/            # Document schemas (city, property, homePage, etc.)
│   ├── objects/              # Reusable objects (seo, ctaLink, localizedString, etc.)
│   └── index.ts              # Schema registry
├── structure/
│   └── index.ts              # Custom desk structure (Locations, Properties, Blog, etc.)
├── sanity.config.ts
├── sanity.cli.ts
└── package.json
```

## Multilingual Strategy

The project uses **field-level i18n** only:

- **One document per entity** — One city, one district, one home page, one site settings document, one property, one blog post, one property type, one location tag.
- **Localized fields** — Text fields use `localizedString`, `localizedText`, or other localized objects (`{ en, ru, uk, sq }`). Images, URLs, numbers, references, and flags are **shared** across languages.
- **Supported locales:** `en`, `ru`, `uk`, `sq` (configurable in `lib/languages.ts`).
- **Frontend:** Resolve `propertyType.title`, `locationTag.title`, `locationTag.slug` (and other localized fields) with `getLocalizedValue(obj, locale)` or equivalent.

Document-level translations (separate documents per language) are **not** used for city, district, homePage, siteSettings, blogPost, propertyType, or locationTag.

## Data Model Overview

| Type           | Multilingual        | Purpose                          |
|----------------|---------------------|----------------------------------|
| homePage       | Field-level         | Homepage content (singleton)     |
| siteSettings   | Field-level         | Global site settings (singleton) |
| city           | Field-level         | City landing pages               |
| district       | Field-level         | District landing pages           |
| property       | Field-level         | Property listings                |
| blogPost       | Field-level         | Blog articles                    |
| blogCategory   | Field-level         | Blog categories (if used)        |
| propertyType   | Field-level         | Apartment, House, Land, etc.     |
| locationTag    | Field-level         | Tags (near beach, central, etc.) |
| agent          | No                  | Real estate agents               |

## Development Setup

### Prerequisites

- Node.js 18+
- npm or pnpm

### Install

```bash
npm install
```

### Environment Variables

| Variable                | Description              | Example      |
|-------------------------|--------------------------|--------------|
| (configured in sanity.cli.ts) | projectId, dataset | g4aqp6ex, production |

Project ID and dataset are defined in `sanity.config.ts`. For custom env overrides, create `.env` or `.env.local`.

## Running Sanity Studio

```bash
# Development
npm run dev

# Production build
npm run build

# Production start
npm start
```

Studio runs at `http://localhost:3333` by default.

## Seed Script

To populate the dataset with demo content (properties, cities, agents, blog posts, etc.):

1. Create an API token at [sanity.io/manage](https://sanity.io/manage) → your project → **API** → **Tokens**
2. Grant **Editor** or **Admin** permission
3. Run:

```bash
SANITY_API_TOKEN=your_token npm run seed
```

On Windows (PowerShell):

```powershell
$env:SANITY_API_TOKEN="your_token"; npm run seed
```

The script creates: property types, location tags, cities (one doc per city with localized fields), districts (one doc per district), agents, homePage (singleton), siteSettings (singleton), properties, and blog posts.

## Content Reset (optional)

To clear content that was created with an older document-level i18n setup and reseed with the current field-level model:

```bash
npm run reset:content:dry   # Preview what would be deleted
npm run reset:content       # Execute reset (requires SANITY_API_TOKEN)
npm run seed                # Seed fresh content
```

## Deployment Notes

- Deploy via `npm run deploy` or connect to [sanity.io](https://sanity.io) for hosted deployment
- Set CORS origins in the Sanity project dashboard for the frontend domain
- Ensure `projectId` and `dataset` match the target environment
