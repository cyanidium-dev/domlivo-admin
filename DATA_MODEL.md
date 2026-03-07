# Domlivo Data Model

Complete content model reference for the Domlivo CMS.

## Document Types

### City

**Purpose:** SEO landing pages for cities (e.g. Tirana, Durres, Vlore, Saranda).

**Multilingual:** Yes (document-level).

**Groups:** basic, hero, content, districts, media, faq, seo

| Field              | Type           | Notes                                      |
|--------------------|----------------|--------------------------------------------|
| language           | string         | Hidden, set by i18n plugin                 |
| title              | string         | Required                                   |
| slug               | slug           | Required, from title, max 96               |
| popular            | boolean        | For filtering/highlighting                 |
| order              | number         | Display order                              |
| isPublished        | boolean        | Default true                               |
| heroTitle, heroSubtitle, heroShortLine | string/text | Hero section |
| heroImage          | image          | Hotspot                                    |
| heroCta            | ctaLink        | Call-to-action                             |
| shortDescription   | text           | For cards/listings                         |
| description        | blocks         | Main content                               |
| investmentText     | blocks         | Investment section                         |
| featuredPropertiesTitle/Subtitle | string/text | Above featured slider      |
| allPropertiesCta   | ctaLink        | Link to all properties                     |
| districtsTitle     | string         | Districts section title                    |
| districtsIntro     | blocks         | Intro text                                 |
| districtStats      | districtStat[] | Max 20                                     |
| cityVideoUrl       | string         | YouTube/Vimeo URL                          |
| galleryTitle/Subtitle | string/text | Gallery section                          |
| gallery            | image[]        | Min 1, max 20, hotspot                     |
| faqTitle           | string         | FAQ section                                |
| faqItems           | faqItem[]      | Max 20                                     |
| seoText            | blocks         | Extra SEO content                          |
| seo                | seo            | Meta, OG, noIndex                          |

**Relations:** Districts reference city.

---

### District

**Purpose:** SEO landing pages for districts within cities.

**Multilingual:** Yes (document-level).

**Groups:** basic, hero, content, media, faq, seo

| Field        | Type           | Notes                             |
|--------------|----------------|-----------------------------------|
| language     | string         | Hidden, set by i18n plugin        |
| title        | string         | Required                          |
| slug         | slug           | Required, from title              |
| city         | reference      | Required → city                   |
| isPublished  | boolean        | Default true                      |
| order        | number         | Display order                     |
| heroTitle, heroSubtitle, heroShortLine | string/text | Hero section |
| heroImage    | image          | Hotspot                           |
| heroCta      | ctaLink        |                                   |
| shortDescription | text         |                                   |
| description  | blocks         |                                   |
| metricsTitle | string         | Metrics section                   |
| metrics      | districtMetric[] | Max 10                          |
| allPropertiesCta | ctaLink     |                                   |
| galleryTitle/Subtitle | string/text |                        |
| gallery      | image[]        | Min 1, max 20, hotspot            |
| faqTitle     | string         |                                   |
| faqItems     | faqItem[]      | Max 20                            |
| seoText      | blocks         |                                   |
| seo          | seo            |                                   |

**Relations:** Required reference to city.

---

### Property

**Purpose:** Property listings (sale, rent, short-term).

**Multilingual:** No at document level; uses `localizedString` and `localizedText`.

**Groups:** basic, pricing, location, details, media, seo, analytics

| Field           | Type            | Notes                                  |
|-----------------|-----------------|----------------------------------------|
| title           | localizedString | Required                               |
| slug            | slug            | Required, from title.en/ru/uk/sq       |
| shortDescription| localizedText   |                                        |
| description     | localizedText   |                                        |
| agent           | reference       | Required → agent                       |
| type            | reference       | Required → propertyType                |
| status          | string          | sale, rent, short-term                 |
| isPublished     | boolean         | Default true                           |
| price           | number          | Required, ≥ 0                          |
| currency        | string          | EUR, USD, ALL, default EUR             |
| featured        | boolean         | Default false                          |
| investment      | boolean         | Default false                          |
| city            | reference       | Required → city                        |
| district        | reference       | Filtered by city                       |
| address         | localizedString |                                        |
| coordinatesLat  | number          | -90 to 90                              |
| coordinatesLng  | number          | -180 to 180                            |
| locationTags    | reference[]     | → locationTag                          |
| area            | number          | m², ≥ 0                                |
| bedrooms        | number          | ≥ 0                                    |
| bathrooms       | number          | ≥ 0                                    |
| yearBuilt       | number          | 1800–2100                              |
| amenities       | string[]        | Plain strings                          |
| propertyCode    | string          | Internal reference                     |
| gallery         | image[]         | Min 1, max 30, hotspot                 |
| seo             | seo             |                                        |
| createdAt       | datetime        |                                        |
| viewCount       | number          | Read-only, default 0                   |
| saveCount       | number          | Read-only, default 0                   |
| contactCount    | number          | Read-only, default 0                   |
| ownerUserId     | string          | Hidden, read-only, current user        |

**Relations:** city, district, agent, type, locationTags.

---

### PropertyType

**Purpose:** Taxonomy (Apartment, House, Land, etc.).

**Multilingual:** No.

| Field            | Type   | Notes                    |
|------------------|--------|--------------------------|
| title            | string | Required                 |
| slug             | slug   | Required, from title     |
| image            | image  | Hotspot                  |
| shortDescription | string |                          |
| order            | number | Display order            |
| active           | boolean| Default true             |

---

### LocationTag

**Purpose:** Tags for filtering (e.g. near beach, central).

**Multilingual:** No.

| Field       | Type    | Notes                |
|-------------|---------|----------------------|
| title       | string  | Required             |
| slug        | slug    | Required, from title |
| description | text    |                      |
| active      | boolean | Default true         |

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

**Purpose:** Blog articles.

**Multilingual:** Yes (document-level).

| Field       | Type   | Notes        |
|-------------|--------|--------------|
| language    | string | Hidden       |
| title       | string | Required     |
| slug        | slug   | Required     |
| excerpt     | text   |              |
| content     | blocks |              |
| publishedAt | datetime |             |
| seo         | seo    |              |

---

### HomePage

**Purpose:** Homepage content per language.

**Multilingual:** Yes (singleton per language: homePage-en, homePage-sq, etc.).

**Groups:** hero, featured, cities, propertyTypes, investment, about, agents, blog, seo, faq

Sections: hero, featured, cities, propertyTypes, investment, about, agents, blog, seo, faq. Each section has titles, subtitles, CTAs, and optional enable switches. FAQ items use `faqItem` (max 20).

---

### SiteSettings

**Purpose:** Global site settings per language.

**Multilingual:** Yes (singleton per language: siteSettings-en, etc.).

**Groups:** branding, contact, social, footer, seo

| Field            | Type      | Notes                    |
|------------------|-----------|--------------------------|
| language         | string    | Hidden                   |
| siteName         | string    | Required                 |
| siteTagline      | string    |                          |
| logo             | image     | Hotspot                  |
| contactEmail     | string    | Email validation         |
| contactPhone     | string    |                          |
| companyAddress   | text      |                          |
| socialLinks      | socialLink[] | Max 10               |
| footerQuickLinks | footerLink[] | Max 20               |
| copyrightText    | string    |                          |
| defaultSeo       | seo       |                          |

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

### ctaLink

| Field | Type   | Notes     |
|-------|--------|-----------|
| label | string | Required  |
| href  | string | Required  |

### faqItem

| Field   | Type   | Notes    |
|---------|--------|----------|
| question| string | Required |
| answer  | blocks | Required |

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
