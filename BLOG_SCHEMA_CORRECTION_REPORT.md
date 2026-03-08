# BLOG SCHEMA CORRECTION REPORT

## 1. What was wrong in the previous implementation

### Problem 1 — Blog post became single-language

The previous blog upgrade introduced a **single-language content model**:

- **title** and **excerpt** were already localized (localizedString, localizedText) ✓
- **content (body)** was a single array of blocks — not localized ✗
- This violated the project's architecture: the entire CMS uses localized fields (en, sq, ru, uk)

The body stored one stream of Portable Text for all languages, so editors could not maintain separate article content per language.

### Problem 2 — readingTime field

A `readingTimeMinutes` field was added to the blog post schema. This is incorrect because:

- Reading time is derived from article text
- It should be computed on the frontend, not stored in the CMS
- Storing it creates redundant, potentially stale data

---

## 2. What was refactored

### Content field → localized body

- **Before:** `content` was `type: 'array'` (single Portable Text array)
- **After:** `content` is `type: 'localizedBlockContent'` with `en`, `sq`, `ru`, `uk` — each an array of rich blocks

### New object: localizedBlockContent

Added `schemaTypes/objects/localizedBlockContent.ts` with four fields:

- `en` (array) — English body
- `sq` (array) — Albanian body
- `ru` (array) — Russian body
- `uk` (array) — Ukrainian body

Each field supports the same rich content: blocks, images, tables, FAQ blocks, callouts.

### Removed: readingTimeMinutes

- Removed from `blogPost` schema
- Reading time should be computed on the frontend from the article text

### Field grouping

Groups adjusted to:

- **Basic** — slug, publishedAt
- **Content** — title, excerpt, content (all localized)
- **Media** — coverImage
- **Categorization** — categories, featured, author, relatedPosts
- **SEO** — seo (localizedSeo)

---

## 3. How localization now works for blog posts

| Field      | Type                 | Localization |
|-----------|----------------------|--------------|
| title     | localizedString      | en, sq, ru, uk |
| excerpt   | localizedText        | en, sq, ru, uk |
| content   | localizedBlockContent| en, sq, ru, uk (each = array of blocks) |
| slug      | slug                 | Single canonical (from English title) |
| seo       | localizedSeo         | Per-language meta, ogImage shared |

All content fields (title, excerpt, body, SEO) are localized in line with the rest of the CMS.

---

## 4. How Portable Text blocks work per language

Each language body (`content.en`, `content.sq`, etc.) is its own Portable Text array and supports:

- **Blocks:** paragraphs, H2, H3, H4, blockquote, bullet and numbered lists
- **Decorators:** strong, emphasis, code
- **Link annotations**
- **Images** (with alt and caption)
- **blogTable** (structured tables)
- **blogFaqBlock** (FAQ sections using localizedFaqItem)
- **blogCallout** (info, tip, warning, summary boxes)

Editors work on each language body separately. No duplicate documents — one `blogPost` per article, with all languages in one document.

---

## 5. Confirmation that readingTime was removed

`readingTimeMinutes` has been removed from the blog post schema. Reading time should be calculated on the frontend (e.g. from word count).
