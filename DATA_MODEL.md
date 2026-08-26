# Domlivo Data Model

> Regenerated 2026-08-14 from `schemaTypes/` — the schema files are the source of truth.

Content model reference for the Domlivo CMS (Sanity Studio). All multilingual content uses **field-level i18n**: one document per entity, with localized object types (`localizedString`, `localizedText`, `localizedBlockContent`, `localizedSeo`, …) holding one value per locale. Supported locales (from `lib/languages.ts`): **en, uk, ru, sq, it**. Images, numbers, references, and flags are shared across languages.

The schema registers **18 document types** (`schemaTypes/documents/index.ts`) and **61 object types** (`schemaTypes/objects/index.ts`).

## Singletons

Managed via the Studio structure (`structure/index.ts`), pinned to fixed `_id`s:

| `_id` | Type | Role |
|---|---|---|
| `landing-home` | `landingPage` | Homepage (`pageType: "home"`) |
| `landing-cities` | `landingPage` | Cities index landing (`pageType: "cityIndex"`) |
| `siteSettings` | `siteSettings` | Global site settings |
| `blog-settings` | `blogSettings` | Blog index configuration |

## Document Types (18)

### landingPage
Universal editorial/SEO landing built from an ordered `pageSections[]` block array (see the section catalog below). `pageType` is presented in the Studio as **"Route family"** and determines where the landing renders (contract: `domlivo-workspace/docs/engineering/ROUTING.md`): editorial families `custom` (Guide → `/guides/<slug>`), `city` (→ `/<country>/<city>/info` via `linkedCity`), `district` (overlays the district page via `linkedDistrict`), `unique` (top-level `/<slug>`; **no index page — wire navigation manually**); system families `home` (singleton `landing-home`), `cityIndex` (singleton `landing-cities` → `/cities`), `investment` (slug-addressed deal landings: `sale`, `long-term-rent`, `short-term-rent`). The former `propertyType` family was retired 2026-08-14 (0 docs, no consumer route). Slug validation rejects reserved route segments for `custom`/`unique` (allowlisted exception: `for-realtors`), and async eclipse checks block a `unique` slug already owned by a `country`/`city`/`propertyType` (entity routes win at `/<slug>`) — with the mirror check on those entity schemas; audit backstop: `npm run report:route-collisions`. Key fields: `enabled`, `title`, `slug` (required except home), `pageSections[]`, card overrides (`cardTitle`, `cardDescription`, `cardImage`) for landing carousels, `linkedCity` / `linkedDistrict` (validated per family; one enabled city landing per city), `contentUpdatedAt` (freshness badge), `topicTags[]` (plain matching keys `city:<slug>` / `zone:<slug>` / `theme:<key>` for automatic interlinking — ТЗ-16), `seo` (all 5 locales required for enabled pages).

### property
A property listing (sale / rent / short-term). Key fields: localized `title`/`shortDescription`/`description`/`address`, `slug`, required refs to `agent`, `propertyType` (`type`) and `city`, optional `developer` and city-filtered `district`, `status`, `isPublished`, `lifecycleStatus` (draft/active/reserved/sold/rented/archived), `price` (EUR base currency), promotion fields (`promoted`, `promotionType` premium/top/sale with agent-scoped caps validated via `utils/propertyPromotionCapValidation`, `featuredOrder`, `discountPercent`), `investment`, coordinates, `locationTags[]`, `area`/`bedrooms`/`bathrooms`/`yearBuilt`, `amenitiesRefs[]` (→ `amenity`), `propertyOffers[]`, `articlesSection`, `gallery` (1–30 images), `seo`, read-only analytics counters (`viewCount`, `saveCount`, `contactCount`) and hidden `ownerUserId`. Legacy hidden `country` string is deprecated — country derives from `city.country`.

### city
Canonical geo entity for a city; properties, districts, city landings and catalog SEO pages all reference it. Key fields: localized `title`, `slug`, required `country` ref, `popular`, `vibe` (card chip), `order`, `isPublished`, hero block (`heroTitle`/`heroSubtitle`/`heroShortLine`/`heroImage`/`heroCta`), content blocks (`shortDescription`, `description`, `investmentText`, featured-properties labels, `allPropertiesCta`), districts section (`districtsTitle`, `districtsIntro`, `districtStats[]`), media (`cityVideoUrl`, gallery 1–20), FAQ (`faqTitle`, `faqItems[]`), `seoText`, `seo`.

### district
District within a city (required `city` ref). Same landing-page shape as `city` minus country/districts: localized `title`, `slug`, `popular`, `isPublished`, `order`, hero block, `shortDescription`/`description`, `metricsTitle` + `metrics[]` (`districtMetric`, max 10), `allPropertiesCta`, gallery (1–20), FAQ, `seoText`, `seo`.

### country
Canonical geo route segment for city-aware URLs (`/{country}/{city}/…`). Fields: `title`, `slug`, optional `code` (e.g. AL). Cities reference exactly one country.

### catalogSeoPage
SEO content for catalog listing routes — one document per scope: catalog root, city scope, or district scope (`pageScope`, plus `city`/`district` refs as required). Fields: `active`, localized `title` (H1), `intro`, `bottomText`, `seo`.

### propertyType
Taxonomy for property kinds (Apartment, House, Villa, …) used in filters, cards and SEO. Fields: localized `title` and `shortDescription`, `slug`, `image`, `order`, `active`.

### amenity
Global amenity taxonomy (pool, parking, sea view, …) referenced from `property.amenitiesRefs` for catalog filters and detail display. Fields: localized `title` and `description`, `slug` (stable non-localized key), `iconKey` (preset list from `constants/iconOptions.ts`) or `customIcon` (monochrome SVG override), `order`, `active`.

### locationTag
Discovery/filter tag (near beach, city center, …) referenced from properties. Fields: localized `title` and `description`, `slug`, `active`.

### agent
Real-estate agent shown on listings and the contact page. Fields: `name`, unique `slug` (async-validated), required `email`, `phone`, localized `bio`, `photo`, `agentLogo`, social URLs (Telegram/Facebook/Instagram/YouTube, format-validated), `seo`, `userId` (links a Sanity user account), and per-agent promotion cap overrides (`maxPremiumPromotionsOverride`, `maxTopPromotionsOverride`; defaults come from Site Settings).

### developer
Developer reference card with a traffic-light rating (green/yellow/red), mirroring the research base `06-developers`. Fields: `name`, `slug`, `isPublished`, `logo`, `tier` + required localized `tierNote` (neutral, sourced wording), required `lastReviewedAt` (quarterly cadence; frontend flags stale entries), `sources[]` (`sourceItem`, mandatory for yellow/red), localized `description`/`revenueNote`/`risks`, `foundedYear`, `keyProjects[]` (name / location / url), optional `linkedGuide` (→ custom `landingPage`), `seo`. Referenced from `property.developer` and rendered via `developersRatingSection` / `developerCardSection`.

### tracker
Continuously-maintained status fact sheet ("what is happening with X right now"), rendered on landings via `trackerSection`; mirrors the research base `08-infrastructure`. Fields: localized `title` and `subject`, `slug`, `isPublished`, `currentStatus` (onTrack/delayed/blocked/done) + optional `statusLabel` override, required localized `statusSummary` (the direct AEO answer), required `lastCheckedAt`, required `timeline[]` (1–50 dated events with optional source URLs), optional `faq[]` and `sources[]`, `seo`.

### blogPost
SEO blog article; all locales in one document. Fields: `slug` (from EN title), `publishedAt`, localized `title` (EN required) / `subtitle` / `excerpt`, `content` (`localizedBlockContent` — rich text with images, tables, callouts, FAQ/CTA blocks, etc.), `coverImage` (alt enforced), `categories[]` (1–3 → `blogCategory`), required `author` (→ `blogAuthor`; legacy `authorName`/`authorRole`/`authorImage` fallbacks remain hidden once set), `featured`, `relatedPosts[]` (max 5, no self-reference), `relatedProperties[]` (max 3), `seo` (EN meta required before publishing).

### blogAuthor
Reusable author profile for bylines and author pages. Fields: `name`, `slug`, `active`, localized `role` and `bio`, `photo`, internal `email`, `socialLinks[]`, `seo`.

### blogCategory
Blog category for filtering and category pages. Fields: localized `title` (EN required) and `description`, `slug`, `order`, `active`, `seo`.

### blogSettings
Singleton (`blog-settings`) configuring the `/blog` index: localized `heroTitle`/`heroDescription`, `relatedPostsSidebarCount` (0–50, default 5), `seo`.

### siteSettings
Singleton (`siteSettings`) for global configuration. Groups: branding (`siteName`, `siteTagline`, `logo`), contact (`contactEmail`, `contactPhone`, `companyAddress`, `contactsManagerPhoto`), social (`socialLinks[]`), footer (intro, Telegram/WhatsApp/Codesite/Webbond URLs, `footerApp`, `policyLinks[]`, `footerGuideLinks[]` (ТЗ-16 Guides column, max 6), `copyrightText`), content (`howToPublishVideoUrl`), properties (`propertySettings` — promotion defaults and catalog banner candidates), currency (read-only cron-synced `currencyRates[]` + `currencyLastSyncedAt`, editor-selected `displayCurrencies[]`), SEO (`defaultSeo` fallback).

### registrationRequest
Operational inbox (not public content) for website registration requests; create contract in `docs/registration-request-sanity-frontend-contract.md`. Read-only submitted fields (`name`, `phone`, `email`, `realtorOrAgency`, `language`) plus editorial `status` (unread/read/inWork/registered/declined) and `internalComment`.

## Page-Builder Sections (`landingPage.pageSections`, 25 types)

Every section carries an `enabled` toggle; editors add/reorder freely.

| Type | What it renders |
|---|---|
| `heroSection` | Landing hero (headline, media, search tabs via `heroSearchTab`) |
| `propertyCarouselSection` | Property card carousel (with `homePropertyCarouselTab` tabs) |
| `locationCarouselSection` | Cities/districts location carousel |
| `propertyTypesSection` | Property-type tiles |
| `marketingContentSection` | Generic marketing block — layout picker + content + optional media (`marketingBenefit` items) |
| `articlesSection` | Blog-post preview strip |
| `seoTextSection` | Rich text / SEO block (with `seoStat`, `seoAuthor`, `seoPullQuote` embeds) |
| `ctaSection` | Call-to-action banner |
| `faqSection` | FAQ accordion (`localizedFaqItem` / rich variant, `faqCallout`) |
| `districtsComparisonSection` | District comparison table |
| `linkedGallerySection` | Gallery linked to an entity |
| `landingCollectionSection` | Cards linking to other landing pages |
| `relatedPagesAutoSection` | Auto-interlinking cards: districts of this city / comparisons involving this zone / guides by `topicTags` / manual (ТЗ-16) |
| `investorLogosSection` | Investor / partner logo band |
| `priceTableSection` | Data table with sources (price/indicator data from the research base) |
| `statsBandSection` | Key-figures band: 2–6 large numbers with labels/trends |
| `sourcesSection` | "Sources & methodology" numbered reference list |
| `mortgageCalcSection` | Interactive mortgage (annuity) calculator; editor-set defaults |
| `roiCalcSection` | Rental ROI calculator (LTR/STR) with editor-maintained zone presets |
| `purchaseCostCalcSection` | Full purchase-cost calculator (editor-maintained cost items) |
| `trackerSection` | Embeds a `tracker` document (full or compact) |
| `developersRatingSection` | Grouped traffic-light list of `developer` documents |
| `developerCardSection` | Single expanded developer card |
| `zoneStatsAutoSection` | Key figures for a zone from its newest `zoneMetrics` record (automatic) |
| `zonePriceTableAutoSection` | Price table across a city's districts or hand-picked zones, from `zoneMetrics` (automatic) |

## Localized Primitives & Shared Objects

- **`localizedString` / `localizedText`** — one string / multi-line text per locale (`{en, uk, ru, sq, it}`).
- **`localizedBlockContent`** — per-locale Portable Text for blog bodies: paragraphs (normal/H2–H4/quote), inline links (relative, http(s), mailto, tel, #anchor), images, and block embeds `blogTable`, `blogCallout`, `blogFaqBlock`, `blogCtaBlock`; includes a paste-translations helper input.
- **`localizedSlug`** — slug per locale (legacy; most documents use a single non-localized `slug`).
- **`localizedSeo`** — per-locale `metaTitle`, `metaDescription`, Open Graph fields, noIndex. Non-localized `seo` object also exists.
- **`localizedCtaLink`** — CTA with per-locale label + href rules; non-localized `ctaLink` also exists.
- **`localizedFaqItem` / `localizedFaqItemRich`** — per-locale question/answer (plain or rich answer); non-localized `faqItem` also exists.
- **`localizedFooterLink` / `footerLink`** — footer link label + href (localized / plain).
- **Misc data objects** — `socialLink`, `footerApp`, `districtStat`, `districtMetric`, `sourceItem` (label + URL for sourced claims), `propertyOffer` (title + icon for "what this property offers"), `propertySettings` (promotion defaults, `propertyCatalogBanner` candidates), `currencyRate` (code + cron-synced rate, EUR base), `priceRange` / `areaRange`, `heroSearchTab`, `homePropertyCarouselTab`, `marketingBenefit`, `seoStat` / `seoAuthor` / `seoPullQuote`, `faqCallout`.
