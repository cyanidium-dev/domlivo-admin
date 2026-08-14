# Sanity Blog Seed Report

## 1. Changed Files

| File | Action |
|------|--------|
| `scripts/seed-blog.ts` | Created |
| `scripts/clear-blog.ts` | Created |
| `package.json` | Modified — added `clear:blog` script |

---

## 2. Diffs

### scripts/seed-blog.ts (new file)

```diff
diff --git a/scripts/seed-blog.ts b/scripts/seed-blog.ts
new file mode 100644
--- /dev/null
+++ b/scripts/seed-blog.ts
@@ -0,0 +1,698 @@
+/**
+ * Domlivo CMS — Blog Seed Script
+ *
+ * Seeds blog settings, categories, author, and 2 published blog posts
+ * using the current blog schema and content structure.
+ *
+ * Run: npm run seed:blog
+ * Requires: SANITY_API_TOKEN in .env
+ *
+ * Idempotent: uses createOrReplace with deterministic _id.
+ * Reuses existing properties for embed blocks if available; skips if none.
+ */
+
+import path from 'path'
+import {config as loadDotenv} from 'dotenv'
+import {createClient} from '@sanity/client'
+import {addKeysToArrayItems} from './lib/addKeysToArrayItems'
+
+loadDotenv({path: path.resolve(process.cwd(), '.env')})
+
+const ENV = {
+  projectId: (process.env.SANITY_PROJECT_ID || 'g4aqp6ex').trim(),
+  dataset: (process.env.SANITY_DATASET || 'production').trim(),
+  token: process.env.SANITY_API_TOKEN?.trim() || null,
+}
+
+// ... (full script: blog settings, categories, author, 2 posts with content blocks)
```

*(Full diff omitted for brevity; file is ~700 lines.)*

---

## 3. What the Script Creates

### Blog settings

- **Document ID:** `blog-settings`
- **Type:** `blogSettings`
- **Fields:** `heroTitle`, `heroDescription`, `seo` (localizedSeo with metaTitle, metaDescription, ogTitle, ogDescription, noIndex)
- **Localization:** All text fields populated for en, uk, ru, sq, it

### Categories

| ID | Slug | Title (en) |
|----|------|------------|
| `blogCategory-real-estate` | `real-estate` | Real Estate |
| `blogCategory-recreation` | `recreation` | Lifestyle & Recreation |

Both categories have localized `title`, `description`, `order: 1/2`, `active: true`.

### Author

- **Document ID:** `blogAuthor-domlivo`
- **Slug:** `domlivo-team`
- **Fields:** `name`, `slug`, `role`, `bio`, `photo` (placeholder image)
- **Localization:** `role` and `bio` for en, uk, ru, sq, it

### Blog posts

| ID | Slug | Title (en) |
|----|------|------------|
| `blogPost-real-estate-durres` | `real-estate-durres` | Real Estate in Durres: A Buyer's Guide |
| `blogPost-living-albania` | `living-albania` | Living in Albania: Lifestyle, Recreation and Investment |

### Optional related entities reused

- **Properties:** The script queries for up to 3 published properties (`isPublished == true`). If found, they are used in:
  - `blogPropertyEmbedBlock` inside post content
  - `relatedProperties` on both posts
- If no properties exist, property embed blocks and `relatedProperties` are omitted/skipped safely.

---

## 4. Seeded Content Summary

### Post 1: Real Estate in Durres

| Field | Value |
|-------|-------|
| **Title** | Real Estate in Durres: A Buyer's Guide |
| **Slug** | `real-estate-durres` |
| **Categories** | real-estate |
| **Author** | Domlivo Team (domlivo-team) |
| **Featured** | Yes |
| **Content block types** | block (paragraphs), block (h2 headings), blogCallout (tip), blogTable, blogFaqBlock, blogCtaBlock, blogPropertyEmbedBlock (if properties exist), blogRelatedPostsBlock (references post 2) |

### Post 2: Living in Albania

| Field | Value |
|-------|-------|
| **Title** | Living in Albania: Lifestyle, Recreation and Investment |
| **Slug** | `living-albania` |
| **Categories** | recreation, real-estate |
| **Author** | Domlivo Team (domlivo-team) |
| **Featured** | No |
| **Content block types** | block (paragraphs), block (h2 headings), blogCallout (summary), blogFaqBlock, blogRelatedPostsBlock (references post 1), blogCtaBlock, blogPropertyEmbedBlock (if properties exist) |

---

## 5. Run Instructions

**Exact command:**

```bash
npm run seed:blog
```

**Clear before seeding (optional):**

```bash
npm run clear:blog
npm run seed:blog
```

The `clear:blog` script deletes only the documents created by `seed:blog` (blog-settings, 2 categories, 1 author, 2 posts) to avoid reference conflicts with landing pages or other content.

**Prerequisites:**

- `SANITY_API_TOKEN` in `.env` (with write access to the dataset)
- Optional: `SANITY_PROJECT_ID` and `SANITY_DATASET` (default: `g4aqp6ex` / `production`)

**Behavior:**

- Idempotent: safe to run multiple times; uses `createOrReplace` with fixed `_id`s
- Reuses existing published properties for embed blocks when available
- Skips property embed blocks if no published properties exist

---

## 6. Notes / Assumptions

| Topic | Assumption / note |
|-------|-------------------|
| **Localization** | All required locales (en, uk, ru, sq, it) are populated. English is primary; other locales use fallback or translated demo text. |
| **Cover images** | A single placeholder image is uploaded via picsum.photos and reused for all posts and the author photo. |
| **Property references** | Only published properties (`isPublished == true`) are used. If none exist, property embed blocks and `relatedProperties` are omitted. |
| **Related posts** | Post 1 references post 2 and vice versa. Post 1 is created first, then post 2 (with related block to post 1), then post 1 is updated with related block to post 2. |
| **Publishing state** | Documents are created with `createOrReplace` and non-draft `_id`s, so they are immediately queryable as published content. |
| **Block types** | Only schema-supported types are used: block, image, blogCallout, blogCtaBlock, blogFaqBlock, blogTable, blogRelatedPostsBlock, blogPropertyEmbedBlock. |
| **localizedFaqItem** | FAQ items use `_type: 'localizedFaqItem'` with `question` (localizedString) and `answer` (localizedText). |
| **localizedCtaLink** | CTA blocks use `href` (string) and `label` (localizedString). |

---

## Validation

- [x] Only necessary files were changed (scripts/seed-blog.ts created)
- [x] No unrelated schema refactors were introduced
- [x] Script is idempotent (createOrReplace with deterministic _id)
- [x] Script uses only supported schema fields and block types
- [x] Blog settings creation is handled safely
- [x] Category/author/post links are valid (reference by _id)
- [x] Property references used only when valid existing property docs are found
- [x] No broken imports/exports
- [x] No dead code
