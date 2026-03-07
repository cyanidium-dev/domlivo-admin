# SEO Guide for Domlivo

Guide for SEO specialists and editors managing search visibility on the Domlivo platform.

## SEO Architecture

Domlivo uses a shared **SEO object** across key content types:

- **metaTitle** — Up to 60 characters (recommended).
- **metaDescription** — Up to 160 characters (recommended).
- **ogTitle** — Open Graph title for social sharing.
- **ogDescription** — Open Graph description.
- **ogImage** — Image for social sharing (recommended 1200×630 px).
- **noIndex** — When enabled, asks search engines not to index the page.

## Where SEO Fields Appear

| Content Type  | SEO Fields                | Notes                           |
|---------------|---------------------------|----------------------------------|
| Home Page     | seo object                | Per language                     |
| Site Settings | defaultSeo                | Default for pages without SEO    |
| City          | seo, seoText              | Per language                     |
| District      | seo, seoText              | Per language                     |
| Property      | seo                       | Single document, localized text  |
| Blog Post     | seo                       | Per language                     |

## Page Types and SEO

### City landing pages

**URL pattern:** `/en/sale/tirana`, `/ru/rent/durres`

**Content to optimize:**

- **Hero** — Clear title and subtitle with primary keywords.
- **Description** — Main body text for the city.
- **Investment text** — Investment-related content.
- **District stats** — Structured data (price per m², area, popularity).
- **SEO text** — Extra content for search engines (can be placed at bottom).
- **SEO object** — Unique meta title and description per city and language.

**Guidelines:**

- Unique meta title and description per city and language.
- Use the city name and market type (sale/rent) where relevant.
- Target long-tail terms (e.g. “apartments for sale in Tirana”).

### District pages

**URL pattern:** `/en/sale/tirana/blloku`, `/ru/rent/durres/plazh`

**Content to optimize:**

- **Hero** — District name and context.
- **Description** — Main content about the district.
- **Metrics** — Price, area, popularity.
- **Gallery** — Relevant images with alt text.
- **FAQ** — Questions that match search intent.
- **SEO text** — Additional SEO content.

**Guidelines:**

- Unique meta title and description per district and language.
- Include city and district in titles (e.g. “Blloku, Tirana – Apartments for Sale”).

### Blog posts

**Content to optimize:**

- **Title** — Clear, keyword-oriented.
- **Excerpt** — Short summary for listings and meta.
- **Content** — Structured with headings and keywords.
- **SEO object** — Meta title, description, OG image.

### Homepage

**Content to optimize:**

- **Hero** — Main headline and tagline.
- **Section titles** — Cities, Property Types, etc.
- **SEO text** — Extra content for meta and indexing.
- **SEO object** — Meta title, description, OG image.

Each language version has its own homepage and SEO.

## Meta Title and Description Best Practices

### Meta title

- Up to 60 characters.
- Include brand and main keyword.
- Different per page and language.
- Avoid generic, duplicate titles.

### Meta description

- Up to 160 characters.
- Clear summary with a call-to-action.
- Include primary keywords naturally.
- Different from meta title.

## Multilingual SEO

- **Document-level content** (cities, districts, blog, homepage) — One document per language; URLs and meta should reflect the language.
- **Property** — Single document with localized title/description; frontend picks the right language.
- Use `hreflang` on the frontend for language versions.

## Internal Linking

- Link cities to districts and vice versa.
- Link city/district pages to featured properties.
- Link blog posts to relevant cities and property types.
- Use **allPropertiesCta** and similar CTAs for internal links.

## Structured Content

- Use headings (H1, H2, H3) in descriptions and SEO text.
- Fill **shortDescription** for listings and snippets.
- Keep **districtStats** and **districtMetric** consistent for potential structured data (e.g. LocalBusiness, Product).

## Recommended Workflow

1. Create or edit the page (city, district, blog post, etc.).
2. Fill the main content (hero, description, etc.) first.
3. Write a unique meta title and meta description in the SEO object.
4. Add or update **ogImage** for social sharing.
5. Use **seoText** for extra SEO content where available.
6. Check **noIndex** only for pages that should not be indexed.
7. Ensure Site Settings **defaultSeo** is set as fallback for pages without their own SEO.
