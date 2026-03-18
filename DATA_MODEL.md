# Domlivo Data Model

Complete content model reference for the Domlivo CMS. All multilingual content uses **field-level i18n**: one document per entity, with localized field types (`localizedString`, `localizedText`, etc.) for text. Images, URLs, numbers, references, and flags are shared across languages.

## Document Types

### LandingPage

**Purpose:** Universal SEO/editorial landing pages using an ordered section builder.

**Homepage:** `landingPage` singleton with `_id: "landing-home"` and `pageType: "home"` (route `/` on frontend).

**Key fields (high-level):**
- `pageType` (home/city/district/propertyType/investment/custom)
- `enabled`
- `title` (localized)
- `slug` (non-home)
- `pageSections[]` (ordered block builder)
- optional linked entity refs (`linkedCity`, `linkedDistrict`, `linkedPropertyType`, …)
- `seo` (localizedSeo)

---

### City

**Purpose:** SEO landing pages for cities (e.g. Tirana, Durres, Vlore, Saranda).

**Multilingual:** Field-level (localizedString, localizedText, localizedSlug, localizedCtaLink, localizedSeo, localizedFaqItem).

**Groups:** basic, hero, content, districts, media, faq, seo

| Field              | Type             | Notes                                      |
|--------------------|------------------|--------------------------------------------|
| title              | localizedString  | Required                                   |
| slug               | localizedSlug    | Required, from title, max 96               |
| popular            | boolean          | For filtering/highlighting                 |
| order              | number           | Display order                              |
| isPublished        | boolean          | Default true                               |
| heroTitle, heroSubtitle, heroShortLine | localizedString / localizedText | Hero section |
| heroImage          | image            | Hotspot (shared)                            |
| heroCta            | localizedCtaLink | Call-to-action                             |
| shortDescription   | localizedText    | For cards/listings                         |
| description        | localizedText    | Main content                               |
| investmentText     | localizedText    | Investment section                         |
| featuredPropertiesTitle/Subtitle | localizedString / localizedText | Above featured slider |
| allPropertiesCta   | localizedCtaLink | Link to all properties                     |
| districtsTitle     | localizedString  | Districts section title                    |
| districtsIntro     | localizedText    | Intro text                                 |
| districtStats      | districtStat[]   | Max 20                                     |
| cityVideoUrl       | string           | YouTube/Vimeo URL (shared)                 |
| galleryTitle/Subtitle | localizedString / localizedText | Gallery section |
| gallery            | image[]          | Min 1, max 20, hotspot (shared)             |
| faqTitle           | localizedString  | FAQ section                                |
| faqItems           | localizedFaqItem[] | Max 20                                  |
| seoText            | localizedText    | Extra SEO content                          |
| seo                | localizedSeo     | Meta, OG, noIndex per language             |

**Relations:** Districts reference city.

---

### District

**Purpose:** SEO landing pages for districts within cities.

**Multilingual:** Field-level (localizedString, localizedText, localizedSlug, localizedCtaLink, localizedSeo, localizedFaqItem).

**Groups:** basic, hero, content, media, faq, seo

| Field        | Type             | Notes                             |
|--------------|------------------|-----------------------------------|
| title        | localizedString  | Required                          |
| slug         | localizedSlug     | Required, from title              |
| city         | reference        | Required → city                   |
| isPublished  | boolean          | Default true                      |
| order        | number           | Display order                     |
| heroTitle, heroSubtitle, heroShortLine | localizedString / localizedText | Hero section |
| heroImage    | image            | Hotspot (shared)                  |
| heroCta      | localizedCtaLink |                                   |
| shortDescription | localizedText  |                                   |
| description  | localizedText    |                                   |
| metricsTitle | localizedString  | Metrics section                   |
| metrics      | districtMetric[] | Max 10                          |
| allPropertiesCta | localizedCtaLink |                               |
| galleryTitle/Subtitle | localizedString / localizedText |            |
| gallery      | image[]          | Min 1, max 20, hotspot (shared)   |
| faqTitle     | localizedString  |                                   |
| faqItems     | localizedFaqItem[] | Max 20                          |
| seoText      | localizedText    |                                   |
| seo          | localizedSeo     |                                   |

**Relations:** Required reference to city.

---

### Property

**Purpose:** Property listings (sale, rent, short-term).

**Multilingual:** Field-level (localizedString, localizedText for title, descriptions, address).

**Groups:** basic, pricing, location, details, media, seo, analytics

| Field           | Type            | Notes                                  |
|-----------------|-----------------|----------------------------------------|
| title           | localizedString | Required                               |
| slug            | slug            | Required, from title (or first locale) |
| shortDescription| localizedText   |                                        |
| description     | localizedText   |                                        |
| agent           | reference       | Required → agent                       |
| type            | reference       | Required → propertyType                |
| status          | string          | sale, rent, short-term                 |
| isPublished     | boolean         | Default true                           |
| price           | number          | Required, ≥ 0 (shared)                 |
| currency        | string          | EUR, USD, ALL, default EUR            |
| featured        | boolean         | Default false                          |
| investment      | boolean         | Default false                          |
| city            | reference       | Required → city                        |
| district        | reference       | Filtered by city                       |
| address         | localizedString |                                        |
| coordinatesLat   | number          | -90 to 90 (shared)                     |
| coordinatesLng  | number          | -180 to 180 (shared)                   |
| locationTags    | reference[]     | → locationTag                          |
| area            | number          | m², ≥ 0 (shared)                       |
| bedrooms        | number          | ≥ 0                                    |
| bathrooms       | number          | ≥ 0                                    |
| yearBuilt       | number          | 1800–2100                              |
| amenities       | string[]        | Plain strings                          |
| propertyCode    | string          | Internal reference                     |
| gallery         | image[]         | Min 1, max 30, hotspot (shared)        |
| seo             | seo or localizedSeo |                                 |
| createdAt       | datetime        |                                        |
| viewCount       | number          | Read-only, default 0                   |
| saveCount       | number          | Read-only, default 0                   |
| contactCount    | number          | Read-only, default 0                   |
| ownerUserId     | string          | Hidden, read-only, current user        |

**Relations:** city, district, agent, type, locationTags.

---

### PropertyType

**Purpose:** Taxonomy (Apartment, House, Land, etc.). User-facing in filters, homepage, cards, SEO.

**Multilingual:** Field-level (localizedString, localizedText).

| Field            | Type             | Notes                    |
|------------------|------------------|--------------------------|
| title            | localizedString  | Required                 |
| image            | image            | Hotspot (shared)         |
| shortDescription | localizedText    |                          |
| order            | number           | Display order            |
| active           | boolean          | Default true             |

**Frontend:** Resolve `propertyType.title`, `propertyType.shortDescription` with `getLocalizedValue(obj, locale)`.

---

### LocationTag

**Purpose:** Tags for filtering (e.g. near beach, central). User-facing in filters, cards, SEO.

**Multilingual:** Field-level (localizedString, localizedSlug, localizedText).

| Field       | Type             | Notes                |
|-------------|------------------|----------------------|
| title       | localizedString  | Required             |
| slug        | localizedSlug    | Required             |
| description | localizedText    |                      |
| active      | boolean          | Default true         |

**Frontend:** Resolve `locationTag.title`, `locationTag.slug`, `locationTag.description` with `getLocalizedValue(obj, locale)`.

---

### Agent

**Purpose:** Real estate agents linked to properties.

**Multilingual:** No.

| Field  | Type   | Notes                                      |
|--------|--------|--------------------------------------------|
| name   | string | Required                                   |
| email  | string | Required, validated as email               |
| phone  | string |                                            |
| photo  | image  | Hotspot                                    |
| userId | string | Sanity user ID for ownership/permissions   |

---

### BlogPost

**Purpose:** Blog articles. One document per post; all languages in the same document via localized fields.

**Multilingual:** Field-level (e.g. localizedString for title, localizedText for excerpt, localized blocks or locale-keyed content, localizedSeo for SEO). If the schema still exposes a language field from a previous setup, the intended model is field-level only.

| Field       | Type   | Notes        |
|-------------|--------|--------------|
| title       | string or localizedString | Required     |
| slug        | slug or localizedSlug | Required     |
| excerpt     | text or localizedText |              |
| content     | blocks |              |
| publishedAt | datetime |             |
| seo         | seo or localizedSeo |              |

---

### BlogCategory (if used)

**Purpose:** Blog categories. One document per category with localized name/slug/description.

**Multilingual:** Field-level (localizedString, localizedSlug, etc.).

---

### HomePage

**Purpose:** Homepage content is the canonical landing: `landingPage` singleton with `_id: "landing-home"` and `pageType: "home"`.

**Multilingual:** Field-level. All sections use localizedString, localizedText, localizedCtaLink, localizedSeo, localizedFaqItem where text varies; images and toggles are shared.

**Groups:** hero, featured, cities, propertyTypes, investment, about, agents, blog, seo, faq

Sections: hero, featured, cities, propertyTypes, investment, about, agents, blog, seo, faq. Each section has titles, subtitles, CTAs, and optional enable switches. FAQ items use localizedFaqItem (max 20).

---

### SiteSettings

**Purpose:** Global site settings. **Singleton** — one document (documentId: `siteSettings`).

**Multilingual:** Field-level for text (e.g. siteName, siteTagline, copyrightText, footer links via localizedFooterLink); logo, contact, and social are shared or per-field as defined in schema.

**Groups:** branding, contact, social, footer, seo

| Field            | Type      | Notes                    |
|------------------|-----------|--------------------------|
| siteName         | localizedString | Required           |
| siteTagline      | localizedString |                          |
| logo             | image     | Hotspot (shared)         |
| contactEmail     | string    | Email validation         |
| contactPhone     | string    |                          |
| companyAddress   | text      |                          |
| socialLinks      | socialLink[] | Max 10               |
| footerQuickLinks | footerLink[] or localizedFooterLink[] | Max 20 |
| copyrightText    | localizedString |                          |
| defaultSeo       | seo       | Fallback for pages       |

---

## Reusable Objects

### seo

| Field         | Type    | Notes                  |
|---------------|---------|------------------------|
| metaTitle     | string  | Max 60                 |
| metaDescription | text  | Max 160                |
| ogTitle       | string  |                        |
| ogDescription | text    |                        |
| ogImage       | image   | Hotspot                |
| noIndex       | boolean | Default false          |

### localizedSeo

SEO object with per-language fields (e.g. metaTitle, metaDescription per locale). Used where the whole page is localized.

### ctaLink

| Field | Type   | Notes     |
|-------|--------|-----------|
| label | string | Required  |
| href  | string | Required  |

### localizedCtaLink

CTA with label (and optionally href) per language.

### faqItem

| Field   | Type   | Notes    |
|---------|--------|----------|
| question| string | Required |
| answer  | blocks | Required |

### localizedFaqItem

FAQ item with question/answer per language.

### districtStat

Used in city schema for district statistics.

| Field           | Type   | Notes    |
|-----------------|--------|----------|
| districtName    | string | Required |
| averagePricePerM2 | number |        |
| averageArea     | number |          |
| popularity      | string |          |

### districtMetric

Used in district schema for metrics.

| Field | Type   | Notes    |
|-------|--------|----------|
| label | string | Required |
| value | string | Required |

### localizedString

Field-level localization: `{ en, ru, uk, sq }` (strings).

### localizedText

Field-level localization: `{ en, ru, uk, sq }` (text).

### localizedSlug

Slug per language: `{ en, ru, uk, sq }` (slug values).

### socialLink

| Field    | Type   | Notes   |
|----------|--------|---------|
| platform | string | Required|
| url      | string | Required|

### footerLink

| Field | Type   | Notes   |
|-------|--------|---------|
| label | string | Required|
| href  | string | Required|

### localizedFooterLink

Footer link with label/href per language.
