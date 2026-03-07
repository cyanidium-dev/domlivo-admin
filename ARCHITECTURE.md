# Domlivo Architecture

This document describes the architecture of the Domlivo real estate platform: the Sanity CMS, frontend, and how they interact.

## System Overview

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

- **Sanity Studio** — Editors create and manage content in this admin interface.
- **Sanity Content Lake** — Stores documents and serves them via GROQ/GraphQL APIs.
- **Next.js Frontend** — Consumes content and renders the public website.

## CMS (Sanity Studio)

### Document Types and i18n

| Document       | Role                     | Multilingual        | Notes                                  |
|----------------|--------------------------|---------------------|----------------------------------------|
| homePage       | Homepage content         | Field-level         | Singleton (documentId: homePage)       |
| siteSettings   | Global settings          | Field-level         | Singleton (documentId: siteSettings)   |
| city           | City landing pages       | Field-level         | One doc per city, localized fields      |
| district       | District pages           | Field-level         | One doc per district, belongs to city  |
| property       | Property listings        | Field-level         | Localized title, description, etc.     |
| blogPost       | Blog articles            | Field-level         | One doc per post, localized fields      |
| blogCategory   | Blog categories          | Field-level         | One doc per category (if used)         |
| propertyType   | Apartment, House, etc.   | Field-level         | One doc per type, localized title      |
| locationTag    | Tags for filtering       | Field-level         | One doc per tag, localized title/slug  |
| agent          | Real estate agents       | No                  | Linked to properties, has userId      |

**Document-level i18n is not used** for city, district, homePage, siteSettings, blogPost, propertyType, or locationTag. There are no per-language document variants (e.g. no `homePage-en`, `city-tirana-sq`). All multilingual content is stored in a single document per entity using localized field types.

### Content Flow

1. Editors log into Sanity Studio.
2. Content is stored as documents in the Content Lake.
3. The frontend queries via GROQ and resolves localized fields (e.g. `title.en`, `title.sq`) for the current locale.
4. No `language == $locale` filter is needed for these types — one document holds all languages.

### Field-Level i18n Model

- **Localized fields** — Use `localizedString`, `localizedText`, `localizedSlug`, `localizedCtaLink`, `localizedSeo`, `localizedFaqItem`, `localizedFooterLink` where text varies by language. Structure: `{ en, ru, uk, sq }`.
- **Shared across languages** — Images, videos, URLs, numbers, references, and booleans are stored once and reused for all locales.
- **Frontend** — Uses a helper to pick the correct value for the current locale (e.g. `title[locale]` or fallback chain).

### Studio Structure

- **Home Page** — Single document (singleton).
- **Site Settings** — Single document (singleton).
- **Locations** — **Cities** list and **Districts** list. Districts are grouped under their city via the `city` reference; structure can group districts by city for UX.
- **Properties** — Grouped by business views: **My Properties** (filtered by `ownerUserId`), **All Properties**.
- **Property Types** — Taxonomy list.
- **Location Tags** — Taxonomy list.
- **Agents** — List of agents.
- **Blog** — **Categories** (if present) and **Posts**; each is one document with localized fields.

### Access Model

- **Realtors (agents)** — Can only work with their own properties (filtered by `ownerUserId == currentUser.id`). Site-wide content (homePage, siteSettings, cities, districts, blog) is restricted; only authorized roles should edit it.
- **Studio hiding/filtering** — “My Properties” vs “All Properties” and visibility of singletons/locations/blog are UX-level restrictions in the desk structure.
- **Hard security** — Must be enforced in the backend/API layer (dataset permissions, custom API) as well; Studio structure alone is not sufficient for access control.

### Document Ownership

- Each property has `ownerUserId` (Sanity user ID) for security and permissions.
- Agents see “My Properties” filtered by `ownerUserId == currentUser.id`.
- The `agent` reference is for business logic and display; `ownerUserId` is for access control.

### SEO Architecture

- **SEO object** — Reusable block with metaTitle, metaDescription, ogTitle, ogDescription, ogImage, noIndex. Used by city, district, blogPost, property, homePage, siteSettings. Where needed, a **localized** SEO object (e.g. `localizedSeo`) is used so each language has its own meta.
- **Default SEO** — `siteSettings` has `defaultSeo` for fallbacks.

## Frontend (Next.js)

The frontend is a separate repository. It:

- Fetches content via `next-sanity` or the Sanity HTTP client
- Resolves localized fields with a helper for the current locale (no document-level language filter for field-level types)
- Generates URLs like `/en/sale/tirana` or `/ru/rent/durres/plazh`
- Can build schema.org data from CMS fields for articles, places, etc.

## Singletons

- **homePage** — One document with fixed ID `homePage`. All languages live in the same document (localized fields).
- **siteSettings** — One document with fixed ID `siteSettings`. Same pattern.
- There are no per-language singleton IDs (no `homePage-en`, `siteSettings-sq`, etc.).

## Document Relationships

```
city
  └── district (many districts per city)

district
  └── city (required)

property
  ├── city (required)
  ├── district (filtered by city)
  ├── agent (required)
  ├── type → propertyType
  └── locationTags → locationTag[]

agent
  └── userId (links to Sanity user)
```
