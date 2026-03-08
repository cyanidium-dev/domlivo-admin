# Domlivo Admin — Technical Overview

A structured technical report for senior developers onboarding to the project.

---

## 1. Project Purpose

**domlivo-admin** is the **content management backend** for **Domlivo**, a production-ready multilingual real estate platform for Albania. It is **not** the public-facing website — it is the Sanity Studio CMS where editors manage content.

### What it does

- **Property listings** — Sale, rent, short-term; localized in 4 languages
- **City and district SEO pages** — Landing pages for locations (Tirana, Durres, Vlore, Sarande, etc.)
- **Blog** — Articles and categories with full localization
- **Site-wide settings** — Branding, contact info, footer, default SEO
- **Homepage content** — Hero, featured section, cities, property types, investment, about, agents, blog, FAQ
- **Agents** — Real estate agents linked to properties; “My Properties” view for agents

### Main features

- Field-level i18n (en, ru, uk, sq)
- Agent-owned properties with filtered Studio views
- Centralized GROQ queries for the frontend
- Reusable fragments for maintainable query composition
- Seed and reset scripts for content management

### Problem it solves

Provides a headless CMS that the Next.js frontend (separate repo) consumes via the Sanity Content API. Editors manage all multilingual real estate content in one place without needing to deploy or touch frontend code.

---

## 2. Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Sanity Studio v5 |
| **Language** | TypeScript |
| **Database** | Sanity Content Lake (hosted, document store) |
| **Query language** | GROQ |
| **Package manager** | npm |
| **Build** | Vite (via Sanity) |
| **UI** | React 19, styled-components |
| **External services** | Sanity.io (hosting, CDN, APIs) |

### Dependencies (main)

- `sanity` — Studio and schema
- `next-sanity` — GROQ queries and client (used by frontend; also in this repo for query layer)
- `@sanity/client` — API client for scripts
- `@sanity/vision` — GROQ playground in Studio
- `styled-components` — Styling
- `tsx` — Run TypeScript scripts
- `dotenv` — Env loading in scripts

---

## 3. Architecture Overview

```
┌─────────────────────┐         ┌──────────────────────┐
│   Next.js Frontend  │  GROQ   │   Sanity Content     │
│   (separate repo)   │ ──────► │   Lake (API)         │
└─────────────────────┘         └──────────────────────┘
                                         ▲
                                         │
                                ┌────────┴────────┐
                                │  Sanity Studio  │
                                │  (this repo)    │
                                └─────────────────┘
```

- **This repo** — Sanity Studio (admin UI) + schemas + GROQ queries
- **Sanity Content Lake** — Hosted document store; exposes GROQ/GraphQL APIs
- **Frontend** — Separate Next.js app; fetches content via GROQ, resolves localized fields with `getLocalizedValue()`

### Backend (this repo)

- Sanity Studio: SPA for content editing
- Schemas: `schemaTypes/documents/`, `schemaTypes/objects/`
- Structure: `structure/index.ts` defines the Studio sidebar
- Query layer: `lib/sanity/queries.ts` and `lib/sanity/fragments.ts`
- Scripts: seed, reset, audit (Node + tsx)

### API structure

- No custom REST API in this repo
- Content access via Sanity HTTP API (GROQ)
- Project ID and dataset: `g4aqp6ex` / `production` (in `sanity.config.ts`)

### Data flow

1. Editor edits in Studio → documents saved to Content Lake
2. Frontend runs GROQ queries against Content Lake
3. Frontend resolves localized fields for the current locale
4. Images served via Sanity CDN (urlFor)

### SSR / CSR / state

- Studio runs as a React SPA (CSR)
- State handled by Sanity/P React context
- Frontend architecture (SSR/CSR) is in the separate Next.js repo

---

## 4. Project Structure

```
domlivo-admin/
├── docs/                   # Documentation
│   └── ACCESS_CONTROL.md   # Ownership and access control model
├── lib/                    # Shared code
│   ├── languages.ts        # Supported locales (en, ru, uk, sq)
│   └── sanity/             # Query layer for frontend
│       ├── fragments.ts    # GROQ fragments
│       ├── queries.ts      # Page-level GROQ queries
│       ├── index.ts        # Re-exports
│       └── README.md       # Query layer placement and usage
├── schemaTypes/
│   ├── index.ts            # Schema registry
│   ├── documents/          # Document schemas
│   │   ├── city.ts
│   │   ├── district.ts
│   │   ├── property.ts
│   │   ├── propertyType.ts
│   │   ├── locationTag.ts
│   │   ├── amenity.ts
│   │   ├── agent.ts
│   │   ├── blogPost.ts
│   │   ├── blogCategory.ts
│   │   ├── homePage.ts
│   │   └── siteSettings.ts
│   └── objects/            # Reusable object schemas
│       ├── seo.ts
│       ├── localizedString.ts
│       ├── localizedText.ts
│       ├── localizedSlug.ts
│       ├── localizedSeo.ts
│       ├── localizedCtaLink.ts
│       ├── localizedFaqItem.ts
│       ├── localizedFooterLink.ts
│       ├── ctaLink.ts
│       ├── faqItem.ts
│       ├── socialLink.ts
│       ├── footerLink.ts
│       ├── districtStat.ts
│       └── districtMetric.ts
├── structure/
│   └── index.ts            # Studio desk structure
├── scripts/                # Node scripts
│   ├── seed.ts             # Create demo content
│   ├── resetContentForFieldLevelI18n.ts
│   ├── resetBlogContent.ts
│   ├── resetTypesAndTags.ts
│   ├── resetPropertyTypesAndTags.ts
│   ├── auditOldBlogContent.ts
│   ├── fixMissingKeys.ts
│   ├── fix-translation-groups.ts
│   └── lib/
│       └── addKeysToArrayItems.ts
├── static/                 # Static assets
├── sanity.config.ts        # Studio config
├── sanity.cli.ts           # CLI config (projectId, dataset)
├── package.json
├── tsconfig.json
└── .env.example
```

### Directory roles

| Directory | Role |
|-----------|------|
| `lib/` | Shared utilities and query layer |
| `schemaTypes/` | Sanity schemas (documents + objects) |
| `structure/` | Studio sidebar structure |
| `scripts/` | Seed, reset, audit, migration scripts |
| `static/` | Static files for Studio |

---

## 5. Key Modules and Logic

### Authentication

- Uses Sanity’s built-in auth (sanity.io)
- No custom auth in this repo
- Agents linked via `agent.userId` and `property.ownerUserId` for access control

### Data fetching

- Content fetched by the **frontend** via GROQ
- Queries live in `lib/sanity/queries.ts`
- Fragments in `lib/sanity/fragments.ts`
- Frontend must use `next-sanity` or `@sanity/client` and import from this layer

### API layer

- No custom API in this repo
- Sanity exposes: GROQ API, GraphQL API
- Scripts use `@sanity/client` with `SANITY_API_TOKEN`

### Admin panel (Studio)

- `sanity.config.ts` — plugins, schema
- `structure/index.ts` — sidebar (Home Page, Site Settings, Cities, Districts, Properties, Property Types, Location Tags, Amenities, Agents, Blog)
- “My Properties” filter: `ownerUserId == $userId`

### Property management

- Property schema: `schemaTypes/documents/property.ts`
- References: city, district, agent, type (propertyType), locationTags, amenitiesRefs (amenity[])
- Fields: title, slug, description, price, status, lifecycleStatus, gallery, amenities (legacy string[]), amenitiesRefs, etc.
- `lifecycleStatus`: draft, active, reserved, sold, rented, archived (for filtering; listings show active)
- `ownerUserId` for agent ownership; `agent` for business logic. See `docs/ACCESS_CONTROL.md`

### Localization

- **Field-level only** — one document per entity
- Localized types: `localizedString`, `localizedText`, `localizedSlug`, `localizedSeo`, `localizedCtaLink`, `localizedFaqItem`, `localizedFooterLink`
- Locales: en, ru, uk, sq (in `lib/languages.ts`)
- Frontend resolves with `getLocalizedValue(field, locale)`
- No document-level i18n for main types

### Search / filtering

- Handled by frontend
- Content supports: status (sale/rent/short-term), lifecycleStatus (active/archived/…), city, district, propertyType, locationTags, amenitiesRefs, price, area, bedrooms

### Booking / inquiry

- Not implemented in this repo
- Roadmap mentions lead management, CRM

---

## 6. Database / Data Models

### Database

- **Sanity Content Lake** — hosted document store
- No SQL database
- Documents stored as JSON

### Main entities

| Type | Role | Key fields |
|------|------|------------|
| `homePage` | Singleton | hero, featured, cities, propertyTypes, investment, about, agents, blog, seo, faq |
| `siteSettings` | Singleton | siteName, logo, contact, social, footer, defaultSeo |
| `city` | SEO pages | title (localized), slug (single), hero, description, districts, gallery, faq, seo |
| `district` | SEO pages | title (localized), slug (single), city, hero, description, gallery, faq, seo |
| `property` | Listings | title, slug, price, status, lifecycleStatus, city, district, agent, type, locationTags, amenitiesRefs, gallery |
| `propertyType` | Taxonomy | title, shortDescription, image, order, active |
| `locationTag` | Taxonomy | title, slug, description, active |
| `amenity` | Taxonomy | title, order, active |
| `agent` | People | name, email, phone, photo, userId |
| `blogPost` | Articles | title, slug, excerpt, content, categories, seo |
| `blogCategory` | Blog taxonomy | title, slug, description, order |

### Relationships

```
city
  └── district (many)

district
  └── city (required)

property
  ├── city (required)
  ├── district (required)
  ├── agent (required)
  ├── type → propertyType
  ├── locationTags → locationTag[]
  └── amenitiesRefs → amenity[]

blogPost
  └── categories[] → blogCategory[]
```

### Schemas

- Document schemas: `schemaTypes/documents/*.ts`
- Object schemas: `schemaTypes/objects/*.ts`
- Registered in `schemaTypes/index.ts`

---

## 7. Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `SANITY_PROJECT_ID` | Sanity project ID | `g4aqp6ex` |
| `SANITY_DATASET` | Dataset name | `production` |
| `SANITY_API_TOKEN` | API token for scripts (seed, reset) | Token from sanity.io/manage |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Optional override | Same as above |
| `NEXT_PUBLIC_SANITY_DATASET` | Optional override | Same as above |
| `NEXT_PUBLIC_SANITY_API_VERSION` | API version | `2024-01-01` |

Default projectId and dataset are set in `sanity.config.ts` and `sanity.cli.ts`. Use `.env` or `.env.local` to override.

---

## 8. Integrations

| Service | Usage |
|---------|--------|
| **Sanity.io** | Content Lake, CDN, Studio hosting, APIs |
| **No Stripe** | Not integrated |
| **No analytics** | Not in this repo |
| **No email** | Not in this repo |
| **No maps** | Not in this repo |
| **No external storage** | Sanity CDN for images |

This repo focuses on CMS; integrations are expected in the frontend or backend services.

---

## 9. Build and Deployment

### Build

```bash
npm install
npm run build
```

- Sanity Studio builds with Vite
- Output in `dist/` (default)

### Deploy

```bash
npm run deploy
```

- Deploys to Sanity’s hosted Studio
- Or connect to custom host and serve the built Studio

### Hosting

- Studio: Sanity-hosted or self-hosted
- Content: Sanity Content Lake
- Frontend: Separate (e.g. Vercel)

### CI/CD

- No CI/CD config in the repo
- Deployment typically via Sanity CLI or sanity.io dashboard

---

## 10. Current Development Status

### Complete

- Field-level i18n for all main content
- Schemas: city, district, property, propertyType, locationTag, agent, blogPost, blogCategory, homePage, siteSettings
- Studio structure and “My Properties” filter
- GROQ queries and fragments
- Seed script for demo content
- Reset scripts (content, blog, types/tags)
- Documentation (README, ARCHITECTURE, DATA_MODEL, DEVELOPER_GUIDE, CMS_GUIDE, SEO_GUIDE)

### Partially implemented

- Access control: Studio filtering in place; backend enforcement not described. See `docs/ACCESS_CONTROL.md`
- `ownerUserId` on properties: TODO in structure to migrate existing docs

### Missing / planned

- Lead management
- Analytics
- Preview mode
- Document scheduling
- Advanced search (handled by frontend)

---

## 11. Known Technical Debt or Issues

1. **Access control** — Studio filters are UX-level; backend/API must enforce agent restrictions. See `docs/ACCESS_CONTROL.md`
2. **ownerUserId migration** — Structure comments a TODO to populate `ownerUserId` for existing properties.
3. **Amenities migration** — Properties may have legacy `amenities` (string[]); prefer `amenitiesRefs` (reference[]) for filtering. Migration script not yet provided.

---

## 12. How to Run the Project Locally

### Prerequisites

- Node.js 18+
- npm

### Steps

1. **Clone the repository**

   ```bash
   git clone <repo-url>
   cd domlivo-admin
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment**

   Copy `.env.example` to `.env` (optional for Studio; required for scripts):

   ```bash
   cp .env.example .env
   ```

   Fill in `SANITY_API_TOKEN` for seed/reset scripts.

4. **Run Studio**

   ```bash
   npm run dev
   ```

   Studio: http://localhost:3333

5. **Seed content (optional)**

   ```bash
   $env:SANITY_API_TOKEN="your_token"; npm run seed
   ```

   (Windows PowerShell). On Unix: `SANITY_API_TOKEN=your_token npm run seed`

### NPM scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start Studio (dev) |
| `npm run build` | Build Studio |
| `npm run start` | Run built Studio |
| `npm run deploy` | Deploy to Sanity |
| `npm run seed` | Create demo content |
| `npm run reset:content:dry` | Preview content reset |
| `npm run reset:content` | Execute content reset |
| `npm run reset:blog:dry` | Preview blog reset |
| `npm run reset:blog` | Execute blog reset |
| `npm run reset:types-tags:dry` | Preview taxonomy reset |
| `npm run reset:types-tags` | Execute taxonomy reset |
| `npm run fix:keys` | Add `_key` to array items (required for Studio editing) |
| `npm run audit:blog` | Audit old vs new blog content |

### Token

Create an API token at [sanity.io/manage](https://sanity.io/manage) → project → **API** → **Tokens**, with Editor or Admin access.
