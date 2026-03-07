# Domlivo CMS

Sanity Studio backend for **Domlivo** — a production-ready multilingual real estate platform for Albania.

## Project Overview

Domlivo is a headless CMS that powers property listings, city and district landing pages, blog content, and site-wide settings. The frontend is a separate Next.js application that consumes this CMS via the Sanity Content API.

**Key capabilities:**

- Multilingual content (English, Russian, Ukrainian, Albanian)
- Property listings with localized fields
- City and district SEO landing pages
- Agent-owned properties with filtered views
- Global site settings and homepage content per language

## Tech Stack

- **Sanity Studio v5** — Content management
- **TypeScript** — Type safety
- **@sanity/document-internationalization** — Document-level translations
- **GROQ** — Content querying (from frontend)

## Architecture Overview

```
domlivo-admin/
├── lib/
│   └── languages.ts          # Supported locales (single source of truth)
├── schemaTypes/
│   ├── documents/            # Document schemas (city, property, etc.)
│   ├── objects/              # Reusable objects (seo, ctaLink, etc.)
│   └── index.ts              # Schema registry
├── structure/
│   └── index.ts              # Custom desk structure
├── sanity.config.ts
├── sanity.cli.ts
└── package.json
```

## Multilingual Strategy

The project uses two approaches:

1. **Document-level i18n** — Separate documents per language (`homePage`, `siteSettings`, `city`, `district`, `blogPost`). Managed via `@sanity/document-internationalization`.

2. **Field-level localization** — Single document with localized fields (`property` uses `localizedString`, `localizedText` for `title`, `description`, etc.).

**Supported locales:** `en`, `ru`, `uk`, `sq` (configurable in `lib/languages.ts`).

## Data Model Overview

| Type         | Multilingual | Purpose                          |
|--------------|--------------|----------------------------------|
| homePage     | Yes          | Homepage content per language    |
| siteSettings | Yes          | Global site settings per language|
| city         | Yes          | City landing pages               |
| district     | Yes          | District landing pages           |
| blogPost     | Yes          | Blog articles                    |
| property     | No (localized fields) | Property listings        |
| propertyType | No           | Apartment, House, Land, etc.     |
| locationTag  | No           | Tags (near beach, central, etc.) |
| agent        | No           | Real estate agents               |

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

## Deployment Notes

- Deploy via `npm run deploy` or connect to [sanity.io](https://sanity.io) for hosted deployment
- Set CORS origins in the Sanity project dashboard for the frontend domain
- Ensure `projectId` and `dataset` match the target environment
