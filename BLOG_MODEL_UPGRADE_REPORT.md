# BLOG MODEL UPGRADE REPORT

## 1. What was missing before

### blogPost
- **Cover image** – No main image for cards and Open Graph
- **Reading time** – No estimated read time
- **Featured flag** – No way to highlight posts on the homepage
- **Author/agent** – No author association
- **Related posts** – No way to suggest related articles
- **Rich content** – Content was plain Portable Text only:
  - No images inline in the article body
  - No tables (comparison, price lists)
  - No FAQ blocks embedded in content
  - No callout/info boxes (tips, warnings, summaries)
  - No explicit block styles (H2, H3, H4, blockquote)
  - No link annotations
- **Editor UX** – Groups existed but lacked descriptions and structure
- **Preview** – Minimal (title, slug); no category, date, or featured status

### blogCategory
- **Active flag** – No way to hide categories
- **Structure** – No groups; sparse descriptions

### Reusable objects
- **Table block** – None; tables could not be added to posts
- **Callout block** – None; no info/tip/warning/summary boxes
- **FAQ block** – `localizedFaqItem` existed but there was no block to embed FAQ sections inside article content

### Limitations that blocked a proper SEO blog
- Articles could not include structured tables (e.g. price comparisons)
- No FAQ blocks in the body for schema markup and SEO
- No callouts for investment tips or important notes
- No cover image for social sharing and listings
- No author attribution
- No related-posts suggestions
- Basic Portable Text only, no images in body
- Editor lacked guidance (descriptions, structure)

---

## 2. What was changed

### blogPost
- **New fields:**
  - `coverImage` – Main image with alt and caption
  - `readingTimeMinutes` – Optional estimated read time
  - `featured` – Highlight on blog homepage
  - `author` – Reference to `agent`
  - `relatedPosts` – Array of references (max 6)
- **Content field:**
  - Block styles: normal, h2, h3, h4, blockquote
  - Lists: bullet, numbered
  - Decorators: strong, emphasis, code
  - Link annotations
  - Inline image blocks with alt and caption
  - `blogTable` blocks
  - `blogFaqBlock` blocks
  - `blogCallout` blocks
- **Groups:** content, media, categorization, seo
- **Descriptions:** Added for all main fields
- **Preview:** Title, slug, category, featured, published date

### blogCategory
- **New field:** `active` (boolean, default true)
- **Descriptions:** For title, slug, description, order, active
- **Preview:** Shows active/inactive status

### New objects
- **blogTable** – Table block with optional title, rows (array of cells), optional caption (localized)
- **blogCallout** – Callout block with variant (info, tip, important, warning, summary), optional title, content (block array)
- **blogFaqBlock** – FAQ block with optional section title and array of `localizedFaqItem`

---

## 3. Files changed

| File | Change |
|------|--------|
| `schemaTypes/documents/blogPost.ts` | Refactored with rich content, new fields, groups |
| `schemaTypes/documents/blogCategory.ts` | Added active flag, descriptions |
| `schemaTypes/objects/blogTable.ts` | **NEW** – Table block |
| `schemaTypes/objects/blogCallout.ts` | **NEW** – Callout/info box block |
| `schemaTypes/objects/blogFaqBlock.ts` | **NEW** – FAQ block |
| `schemaTypes/objects/index.ts` | Registered new objects |

---

## 4. New or updated schema objects

### blogTable
- `title` (localizedString) – Optional table heading
- `rows` – Array of row objects, each with `cells` (string[])
- `caption` (localizedString) – Optional caption/note

### blogCallout
- `variant` – 'info' | 'tip' | 'important' | 'warning' | 'summary'
- `title` (localizedString) – Optional heading
- `content` – Block array (paragraphs, lists)

### blogFaqBlock
- `title` (localizedString) – Optional section title
- `items` – Array of `localizedFaqItem` (reused)

---

## 5. How rich content is modeled now

The article body is an array that accepts:

1. **Block** – Portable Text with:
   - Paragraph, H2, H3, H4, blockquote
   - Bullet and numbered lists
   - Strong, emphasis, code
   - Link annotations
2. **Image** – Inline images with alt and caption
3. **blogTable** – Structured tables
4. **blogFaqBlock** – FAQ sections using `localizedFaqItem`
5. **blogCallout** – Info boxes (info, tip, warning, summary)

Editors can freely mix these in any order (e.g. paragraph → image → table → callout → FAQ).

---

## 6. How FAQ / tables / callouts are supported

### FAQ
- **Reused:** `localizedFaqItem` (question/answer per language)
- **New block:** `blogFaqBlock` – wraps an array of `localizedFaqItem` with optional section title
- FAQ blocks can be placed anywhere in the article

### Tables
- **New block:** `blogTable`
- Rows as objects with `cells` (string array)
- Optional localized title and caption
- Suitable for price comparisons, feature lists, etc.

### Callouts
- **New block:** `blogCallout`
- Variants: info, tip, important, warning, summary
- Optional localized title
- Content as Portable Text
- Suited for investment tips, legal notes, warnings

---

## 7. How SEO support works now

- **Reused:** `localizedSeo` (metaTitle, metaDescription, ogTitle, ogDescription, ogImage, noIndex)
- **Cover image:** `coverImage` can be used as fallback for OG when `seo.ogImage` is empty (frontend decision)
- **Excerpt:** Used for meta descriptions and cards; linked to SEO intent
- **Slug:** Single canonical slug from English title
- **Author:** Optional `agent` reference for bylines and schema
- **Structured content:** Tables and FAQ blocks support schema markup (JSON-LD) on the frontend

---

## 8. Any migration impact

### Existing blog posts
- Existing content (block array) remains valid; no migration required
- New fields (`coverImage`, `readingTimeMinutes`, `featured`, `author`, `relatedPosts`) are optional
- Existing posts continue to work; new features can be added over time

### blogCategory
- `active` defaults to `true`; existing categories are unaffected

### Seed script
- Current seed creates blog posts with title, slug, excerpt, content, categories, seo
- New fields are optional; seed can run as-is
- Phase 2 seeding can add cover images, featured flags, authors, related posts

---

## 9. Follow-up recommendations before bulk mock content generation

1. **Seed script** – Update blog seed to optionally set `coverImage`, `featured`, `author` where relevant.
2. **Frontend rendering** – Implement renderers for `blogTable`, `blogFaqBlock`, `blogCallout` in `@portabletext/react`.
3. **Reading time** – Consider computing it from content (word count) on the frontend when `readingTimeMinutes` is empty.
4. **Schema.org** – Add JSON-LD for Article, FAQPage (when FAQ blocks exist), and author.
5. **Table UX** – Editors must manually align column counts; consider a custom input for tables later.
6. **localizedSeo.ogImage** – Document fallback to `coverImage` when `seo.ogImage` is empty.
