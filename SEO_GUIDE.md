# SEO Guide for Domlivo

Guide for SEO specialists and editors managing search visibility on the Domlivo platform.

## SEO Architecture

Domlivo uses a shared **SEO object** (and **localizedSeo** where needed) across key content types:

- **metaTitle** — Up to 60 characters (recommended).
- **metaDescription** — Up to 160 characters (recommended).
- **ogTitle** — Open Graph title for social sharing.
- **ogDescription** — Open Graph description.
- **ogImage** — Image for social sharing (recommended 1200×630 px).
- **noIndex** — When enabled, asks search engines not to index the page.

Where content is multilingual in one document (city, district, homePage, siteSettings, blogPost), the **localizedSeo** object stores meta and OG values **per language** (en, ru, uk, sq) in the same document. The frontend picks the correct set for the current locale.

## Where SEO Fields Appear

| Content Type  | SEO Fields                | Notes                                           |
|---------------|---------------------------|-------------------------------------------------|
| Home Page     | localizedSeo / seo         | One document; meta per language in same doc     |
| Site Settings | defaultSeo                | Default for pages without their own SEO         |
| City          | localizedSeo, seoText      | One doc per city; meta per language             |
| District      | localizedSeo, seoText      | One doc per district; meta per language         |
| Property      | seo or localizedSeo       | One doc per property; localized if used         |
| Blog Post     | seo or localizedSeo       | One doc per post; meta per language             |

## Page Types and SEO

### City landing pages

**URL pattern:** `/en/sale/tirana`, `/ru/rent/durres`

**Content to optimize:**

- **Hero** — Clear title and subtitle with primary keywords (each language in the same document).
- **Description** — Main body text for the city (per language).
- **Investment text** — Investment-related content (per language).
- **District stats** — Structured data (price per m², area, popularity).
- **SEO text** — Extra content for search engines (per language), often at bottom of page.
- **SEO object (localizedSeo)** — Unique meta title and description per language, stored in the same city document.

**Guidelines:**

- Unique meta title and description per language in the localizedSeo fields.
- Use the city name and market type (sale/rent) where relevant.
- Target long-tail terms (e.g. “apartments for sale in Tirana”).

### District pages

**URL pattern:** `/en/sale/tirana/blloku`, `/ru/rent/durres/plazh`

**Content to optimize:**

- **Hero** — District name and context (per language).
- **Description** — Main content about the district (per language).
- **Metrics** — Price, area, popularity.
- **Gallery** — Relevant images with alt text.
- **FAQ** — Questions that match search intent (per language).
- **SEO text** — Additional SEO content (per language).

**Guidelines:**

- Unique meta title and description per language in the district’s SEO fields.
- Include city and district in titles (e.g. “Blloku, Tirana – Apartments for Sale”).

### Blog posts

**Content to optimize:**

- **Title** — Clear, keyword-oriented (per language if localized).
- **Excerpt** — Short summary for listings and meta (per language if localized).
- **Content** — Structured with headings and keywords.
- **SEO object** — Meta title, description, OG image (per language if localized).

**Schema.org (Article, etc.):** Structured data is built on the **frontend** using the CMS fields (title, excerpt, publishedAt, image, etc.). The CMS stores the content; the frontend outputs JSON-LD or equivalent.

### Homepage

**Content to optimize:**

- **Hero** — Main headline and tagline (per language).
- **Section titles** — Cities, Property Types, etc. (per language).
- **SEO text** — Extra content for meta and indexing (per language).
- **SEO object (localizedSeo)** — Meta title, description, OG image per language.

All languages live in the single Home Page document; the frontend serves the correct meta for each locale.

## Meta Title and Description Best Practices

### Meta title

- Up to 60 characters.
- Include brand and main keyword.
- Different per page and per language.
- Avoid generic, duplicate titles.

### Meta description

- Up to 160 characters.
- Clear summary with a call-to-action.
- Include primary keywords naturally.
- Different from meta title.

## Multilingual SEO

- **Field-level content** (cities, districts, blog, homepage, site settings) — One document per entity; meta and content are stored per language (en, ru, uk, sq) in the same document. The frontend selects the right values for the requested locale.
- **Property** — One document per property with localized title/description (and SEO if localized); frontend picks the right language.
- Use **hreflang** on the frontend for language versions.

## Internal Linking

- Link cities to districts and vice versa.
- Link city/district pages to featured properties.
- Link blog posts to relevant cities and property types.
- Use **allPropertiesCta** and similar CTAs for internal links.

## Structured Content

- Use headings (H1, H2, H3) in descriptions and SEO text.
- Fill **shortDescription** for listings and snippets.
- Keep **districtStats** and **districtMetric** consistent for potential structured data (e.g. LocalBusiness, Product).
- **Schema.org** (Article, Place, Product, etc.) is generated on the frontend from CMS fields; ensure required fields (title, description, image, dates) are filled so the frontend can output valid markup.

## Recommended Workflow

1. Create or edit the page (city, district, blog post, etc.).
2. Fill the main content (hero, description, etc.) for each language in the same document.
3. Write a unique meta title and meta description **per language** in the SEO / localizedSeo object.
4. Add or update **ogImage** for social sharing (per language if the field is localized).
5. Use **seoText** for extra SEO content where available (per language).
6. Check **noIndex** only for pages that should not be indexed.
7. Ensure Site Settings **defaultSeo** is set as fallback for pages without their own SEO.
