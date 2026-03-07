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

### Document Types and Roles

| Document       | Role                     | Multilingual | Notes                                  |
|----------------|--------------------------|--------------|----------------------------------------|
| homePage       | Homepage content         | Yes          | One per language (homePage-en, etc.)   |
| siteSettings   | Global settings          | Yes          | One per language (siteSettings-en)     |
| city           | City landing pages       | Yes          | Document-level i18n                    |
| district       | District pages           | Yes          | Document-level i18n, belongs to city   |
| property       | Property listings        | No           | Localized fields (title, description)  |
| propertyType   | Apartment, House, etc.   | No           | Shared taxonomy                        |
| locationTag    | Tags for filtering       | No           | Near beach, central, etc.              |
| agent          | Real estate agents       | No           | Linked to properties, has userId       |
| blogPost       | Blog articles            | Yes          | Document-level i18n                    |

### Content Flow

1. Editors log into Sanity Studio.
2. Content is stored as documents in the Content Lake.
3. The frontend queries via GROQ using filters like `language == $locale` for multilingual docs.
4. Properties use `localizedString`/`localizedText`; the frontend resolves the correct language at render time.

### Multilingual Content Model

**Document-level (separate documents per language):**

- `homePage`, `siteSettings`, `city`, `district`, `blogPost`
- Each has a hidden `language` field set by `@sanity/document-internationalization`
- Query: `*[_type == "city" && language == $locale]`

**Field-level (single document, localized fields):**

- `property` uses `localizedString` and `localizedText`
- Structure: `{ en: "...", ru: "...", uk: "...", sq: "..." }`
- Frontend uses a helper to pick the right value for the current locale

### Document Ownership

- Each property has `ownerUserId` (Sanity user ID) for security/permissions.
- Agents see "My Properties" filtered by `ownerUserId == currentUser.id`.
- The `agent` reference is for business logic; `ownerUserId` is for access control.

### SEO Architecture

- **SEO object** — Reusable block with metaTitle, metaDescription, ogTitle, ogDescription, ogImage, noIndex.
- **Document-level** — Used by city, district, blogPost, property, homePage, siteSettings.
- **Default SEO** — `siteSettings` has `defaultSeo` for fallbacks.

## Frontend (Next.js)

The frontend is a separate repository. It:

- Fetches content via `next-sanity` or the Sanity HTTP client
- Uses GROQ queries filtered by locale
- Resolves `localizedString`/`localizedText` with a helper
- Generates URLs like `/en/sale/tirana` or `/ru/rent/durres/plazh`

## Singleton Multilingual Pages

`homePage` and `siteSettings` are singletons per language:

- Fixed document IDs: `homePage-en`, `homePage-sq`, `homePage-ru`, `homePage-uk`
- Same pattern for `siteSettings-{locale}`
- Structure exposes language-specific entries (Home Page → English, Albanian, etc.)

## Localized Fields vs Multilingual Documents

| Approach        | Use Case               | Example                        |
|-----------------|------------------------|--------------------------------|
| Multilingual doc| Full page per language | City page for Tirana (en/ru)   |
| Localized field | Same entity, many langs| Property title in 4 languages  |

Properties use localized fields because price, area, and location are shared; only text varies per language.

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
