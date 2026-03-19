# Blog Domain Schema Plan (Design Only)

Scope: planning/design only for `domlivo-admin` Sanity Studio.  
Status: no schema code changes in this task.  
Basis: repository audit findings and existing Studio conventions.

---

## 1) Target Entities and Objects

### Document entities (target)

- `blogPost` (existing, to extend)
- `blogCategory` (existing, mostly reuse)
- `blogAuthor` (new, dedicated reusable author document)

### Object entities (target)

- `localizedSeo` (existing, reuse as article/category SEO object)
- `localizedBlockContent` (existing, extend with additional modular blocks)
- Existing reusable content block objects:
  - `blogTable` (reuse)
  - `blogFaqBlock` (reuse)
  - `blogCallout` (reuse)
- New block objects (target):
  - `blogCtaBlock` (new)
  - `blogRelatedPostsBlock` (new)
  - `blogPropertyEmbedBlock` (new)

---

## 2) Reuse vs Extend vs New

### Reuse as-is

- `localizedSeo`
- `blogTable`
- `blogFaqBlock`
- `blogCallout`
- Field-level localization approach (`localizedString`, `localizedText`, `localizedBlockContent`, etc.)
- Existing editorial conventions:
  - groups/tabs
  - inline validation (`Rule.*`, `Rule.custom`)
  - `preview.select/prepare`
  - reference arrays with `to: [{type: ...}]`

### Extend existing

- `blogPost`
  - keep core model, extend for author reference and property-linking strategy
- `blogCategory`
  - keep core, optionally add localized SEO metadata
- `localizedBlockContent`
  - keep current rich text capabilities, add new block members for CTA/related/property embeds

### Create new

- `blogAuthor` document
- `blogCtaBlock` object
- `blogRelatedPostsBlock` object
- `blogPropertyEmbedBlock` object

---

## 3) Article Model (`blogPost`) - Final Intended Design

Reference file today: `schemaTypes/documents/blogPost.ts`.

## Keep Existing Fields

- `slug` (single slug field)
- `publishedAt`
- `title` (`localizedString`)
- `excerpt` (`localizedText`)
- `content` (`localizedBlockContent`)
- `coverImage` (image + alt/caption)
- `categories` (array of `blogCategory` references)
- `featured` (boolean)
- `seo` (`localizedSeo`)
- `relatedPosts` (array of `blogPost` references, max 6)

## Change / Extend Existing

- **Author strategy**: replace article-level embedded author fields with reusable reference model.
  - Current embedded fields in `blogPost`: `authorName`, `authorRole`, `authorImage`
  - Target: `author` reference to `blogAuthor` (single primary author)
  - Optional later: `coAuthors` array of `blogAuthor` refs (open question)

- **Property linking**: add explicit related-properties support.
  - Keep editorial body flexibility via inline property embed block (new object in `localizedBlockContent`)
  - Add separate article-level `relatedProperties` reference array for predictable “Recommended properties” section

## Required Core Fields (for publish-ready content)

- `slug` (required)
- `title` (required; at least primary locale)
- `content` (required; at least primary locale block content)
- `author` reference (required for publish-ready rule)
- `categories` (require at least 1 for publish-ready rule)
- `publishedAt` (required for publish-ready rule)

Note: rollout can start with softer validation; see fallback strategy.

## Publication Metadata

- Keep `publishedAt` as publish date
- Keep `featured` boolean
- Optional additions (new fields, not yet implemented):
  - `updatedAt` datetime (editorial freshness)
  - `readingTimeMinutes` number (optional/manual or computed externally)

## Category Relationships

- Keep `categories` as array of references to `blogCategory`
- Recommended max count: 3 categories per article

## Author Relationship Strategy

- Target: single `author` reference to `blogAuthor` document
- Optional future: `coAuthors` array if editorial requirement emerges
- Migration plan concept (design level):
  - preserve old embedded fields temporarily during migration window
  - map embedded data to `blogAuthor` docs
  - then deprecate/remove embedded fields

## SEO Usage

- Keep `seo: localizedSeo` in article
- Follow existing fallback concept used in repo:
  - article SEO if provided
  - otherwise fallback to broader defaults (`siteSettings.defaultSeo`) at frontend/query layer

## Related Posts Strategy

- Keep `relatedPosts` manual curation
- Max 6 (existing pattern)
- Add custom validation to prevent self-reference (planned)

## Property-linking Strategy

- Target model: **both**
  - Inline body embeds (`blogPropertyEmbedBlock`) for contextual property mentions
  - Separate `relatedProperties` field for bottom-of-article recommendations

Rationale: matches current Studio pattern of explicit reference arrays (e.g., `propertyCarouselSection`) while preserving modular editorial storytelling in body blocks.

## Localization Behavior Per Field

- Localized:
  - `title`, `excerpt`, `content`, `seo`
- Shared/non-localized:
  - `slug`, `publishedAt`, `featured`, references (`author`, `categories`, `relatedPosts`, `relatedProperties`), `coverImage`
- Cover image alt:
  - keep shared alt initially to align with existing repo image patterns
  - localized alt is optional future enhancement, not required for initial rollout

---

## 4) Category Model (`blogCategory`) - Final Intended Design

Reference file today: `schemaTypes/documents/blogCategory.ts`.

## Sufficiency

- Existing `blogCategory` is close to sufficient for initial rollout.

## Keep Existing Fields

- `title` (`localizedString`)
- `slug` (single slug field, generated from English title)
- `description` (`localizedText`)
- `order` (number)
- `active` (boolean)

## Recommended Extension

- Add optional `seo: localizedSeo` for category landing pages (if category pages are SEO-targeted).

## Localization Behavior

- Localize `title`, `description`, optional `seo`
- Keep `slug` shared single value (current repo convention)

## Extra Metadata

- Optional future (not mandatory now):
  - category image
  - category accent color/icon for UI

---

## 5) Author Model (`blogAuthor`) - Chosen Direction

### Decision

- **Choose dedicated reusable author document** over embedded article fields.

### Why this direction (repo-grounded)

- The repo already uses reference-driven reusable entities (`propertyType`, `locationTag`, `amenity`, `agent`) and section-level references.
- Current embedded author fields in `blogPost` are not localized and duplicate data across posts.
- A document model supports consistency, easier updates, and future scaling (author bios, social, multiple posts).

### Target Author Fields

- Core:
  - `name` (`string`, required, shared)
  - `slug` (`slug`, required, shared)
  - `role` (`localizedString`, optional)
  - `bio` (`localizedText` or localized rich content, optional)
  - `photo` (`image`, optional, with alt)
- Optional:
  - `email` (optional/internal)
  - `socialLinks` (array, similar to existing social link patterns)
  - `active` boolean
  - `seo` (`localizedSeo`) only if author profile pages are SEO-routed

### Localization for authors

- Localize editorial/public-facing text (`role`, `bio`, optional SEO).
- Keep identity fields shared (`name`, `slug`, image asset).

---

## 6) Modular Article Content Blocks - Final Set

Primary container remains `localizedBlockContent`.

### Already reusable as-is

- Portable text block
- Inline image block
- `blogTable`
- `blogFaqBlock`
- `blogCallout`

### Should be extended

- `localizedBlockContent` `of` array to include new block objects below.

### Should be created new

- `blogCtaBlock`
  - Localized label/text + URL/reference target + optional style variant
- `blogRelatedPostsBlock`
  - Manual curated array of `blogPost` references (for inline “Read next” modules)
- `blogPropertyEmbedBlock`
  - One or more `property` references
  - Optional localized heading/description
  - Optional display mode (card/list/compact) as enum

---

## 7) Property Reference Strategy for Blog

### Intended model

- **Both inline and section-level**

1) Inline body block:
- via `blogPropertyEmbedBlock` in `localizedBlockContent`
- use when specific paragraphs discuss concrete properties

2) Separate article-level related section:
- `relatedProperties` field (array of `property` refs, recommended max 3)
- use for consistent “Recommended properties” placement

### Why this matches current repo patterns

- Reuses existing direct reference pattern used in `propertyCarouselSection`.
- Keeps editor control and ordering explicit.
- Avoids forcing all property linking into rich text only.

---

## 8) Localization / Translation Strategy

### Chosen model

- Keep existing **field-level localized object** approach (repo standard).
- Do not introduce per-locale separate documents.

### Fields that must be localized

- Article:
  - `title`, `excerpt`, `content`, `seo`
- Category:
  - `title`, `description`, optional `seo`
- Author:
  - `role`, `bio`, optional `seo`
- Block text labels/content:
  - CTA labels/titles/descriptions
  - block headings and explanatory copy

### Fields that remain shared/non-localized

- Slugs (single shared slug)
- references and relationships
- publish/status flags
- dates/timestamps
- shared media assets (initially)

### Slug strategy

- Continue single slug derived from English title/name for consistency with current repo.
- Keep multilingual URL strategy out of scope unless product requires locale-specific slugs later.

### Locale completeness expectations (design)

- Primary locale (`en`) required for publish-ready article/category/author core fields.
- Other locales can be soft-required during initial rollout; enforce incrementally.
- For SEO, follow stricter locale completeness only where SEO-critical pages demand it.

---

## 9) Validation and Publishing Rules (Design-Level Recommendations)

### Article

- Required:
  - `slug`, `title.en`, `content.en`, `publishedAt`, `author`, at least 1 category
- Limits:
  - `relatedPosts` max 6 (retain)
  - `relatedProperties` max 3 (recommended)
  - categories max 3 (recommended)
- Reference integrity:
  - prevent self in `relatedPosts`
  - optionally prevent duplicates in reference arrays
- Image/accessibility:
  - cover image optional for draft
  - require `coverImage.alt` when cover image is set for publish-ready content
- SEO:
  - require at least `seo.metaTitle.en` and `seo.metaDescription.en` for publish-ready
  - optional warning for missing non-primary locale SEO

### Category

- Required:
  - `title.en`, `slug`
- Optional:
  - `description`, `seo`
- Keep `active` and optional `order`

### Author

- Required:
  - `name`, `slug`
- Optional:
  - localized `role`, localized `bio`, photo, links

---

## 10) Fallback / Mock Content Strategy (Schema-Plan Level)

### Incomplete localization fallback (conceptual)

- Treat `en` as minimum publish baseline.
- Missing locale values can fallback to `en` at content consumption layer.
- Schema should allow partial locale fill during early rollout.

### Mock/test content support

- Keep enough optional fields to allow lightweight seeded/demo content:
  - article cover image optional
  - optional secondary SEO/social fields
  - optional rich supplementary blocks
- Keep hard requirements focused on core editorial viability only.

### Placeholder/demo data expectations

- Demo author/category/article content is expected for initial QA and editorial onboarding.
- Plan should support both:
  - minimal “smoke test” article
  - fully enriched article with modular blocks

### Optional vs required for early rollout

- Required early:
  - article title/content/slug/publishedAt/author/category
  - category title/slug
  - author name/slug
- Optional early:
  - extensive SEO per all locales
  - advanced blocks
  - extended author metadata
  - related content and related properties

---

## 11) Relationship Map (Target)

- `blogPost.author` -> `blogAuthor` (single reference)
- `blogPost.categories[]` -> `blogCategory`
- `blogPost.relatedPosts[]` -> `blogPost`
- `blogPost.relatedProperties[]` -> `property`
- `blogPost.content` -> `localizedBlockContent`
  - includes block objects like `blogTable`, `blogFaqBlock`, `blogCallout`
  - and planned `blogCtaBlock`, `blogRelatedPostsBlock`, `blogPropertyEmbedBlock`

---

## 12) Open Questions (Need Confirmation Before Implementation)

1. Should article support multiple authors at launch, or strictly one primary author?
2. Should category have dedicated `localizedSeo` in v1, or defer to page/default SEO strategy?
3. For property embeds, is recommended-card style enough, or are multiple layout variants required at launch?
4. Should `coverImage` be strictly required for publish-ready in v1, or only strongly recommended?
5. Should non-English locale completeness be enforced as warnings only, or blocking validations?

---

## 13) Implementation Readiness Summary

This plan is aligned with current repo patterns and avoids architectural deviation:

- keeps field-level localization
- keeps current desk/plugin style
- reuses existing SEO/localized/content block objects where available
- introduces only domain-specific additions needed for blog maturity:
  - dedicated author entity
  - property linking in blog
  - missing modular editorial blocks (CTA/related/property embed)

No schema code is implemented in this task.

