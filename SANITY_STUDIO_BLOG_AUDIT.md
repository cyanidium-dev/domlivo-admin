# Sanity Studio Blog Readiness Audit

Scope: `domlivo-admin` repository only (Sanity Studio/admin panel).  
Method: code-level audit of Studio config, schema registration, document/object schemas, desk structure, localization objects, and validation patterns.  
Date: 2026-03-19

---

## 1) Studio Configuration

### Findings

- Studio entry/config is in `sanity.config.ts` using `defineConfig` (Sanity Studio v5 style).
- Project/dataset are hardcoded in config:
  - `projectId: 'g4aqp6ex'`
  - `dataset: 'production'`
- Plugins configured in `sanity.config.ts`:
  - `structureTool({structure})`
  - `visionTool()`
- Custom desk structure is wired via `structure` from `structure/index.ts`.
- Custom initial value template is wired via `districtInCityTemplate` from `templates/districtInCity.ts`.
- CLI config in `sanity.cli.ts` repeats `projectId`/`dataset` and sets `deployment.autoUpdates = true`.
- Runnable scripts in `package.json`: `dev`, `start`, `build`, `deploy`, `deploy-graphql`.

### Environment/runtime dependencies

- `.env.example` defines:
  - `SANITY_PROJECT_ID`
  - `SANITY_DATASET`
  - `SANITY_API_TOKEN`
- Studio runtime itself does not read env vars in `sanity.config.ts` (project/dataset are currently hardcoded there).
- API token appears required for scripts/migrations/seeding, not for basic Studio boot.
- `scripts/postinstall-fix-sanity-cli-worker.cjs` runs on install via `postinstall`.

### Reuse classification

- **Reusable as-is**: `sanity.config.ts`, `sanity.cli.ts`, base plugin setup, desk integration.
- **Reusable with light adaptation**: none required for this audit goal.
- **Likely needs rebuild/new**: none.
- **Unknown / needs clarification**: whether production dataset is intended for local development in all environments.

---

## 2) Schema Registration and Inventory

### Schema aggregation files

- `schemaTypes/index.ts` combines `documents` + `objects`.
- `schemaTypes/documents/index.ts` registers document schemas.
- `schemaTypes/objects/index.ts` registers object schemas.

### Registered document schemas

From `schemaTypes/documents/index.ts`:

- `catalogSeoPage` (`schemaTypes/documents/catalogSeoPage.ts`)
- `landingPage` (`schemaTypes/documents/landingPage.ts`)
- `city` (`schemaTypes/documents/city.ts`)
- `district` (`schemaTypes/documents/district.ts`)
- `amenity` (`schemaTypes/documents/amenity.ts`)
- `blogCategory` (`schemaTypes/documents/blogCategory.ts`)
- `blogPost` (`schemaTypes/documents/blogPost.ts`)
- `agent` (`schemaTypes/documents/agent.ts`)
- `property` (`schemaTypes/documents/property.ts`)
- `propertyType` (`schemaTypes/documents/propertyType.ts`)
- `locationTag` (`schemaTypes/documents/locationTag.ts`)
- `siteSettings` (`schemaTypes/documents/siteSettings.ts`)

### Registered object schemas

From `schemaTypes/objects/index.ts`:

- `seo`
- `faqItem`
- `blogTable`
- `blogCallout`
- `blogFaqBlock`
- `ctaLink`
- `socialLink`
- `footerLink`
- `districtStat`
- `districtMetric`
- `localizedString`
- `localizedText`
- `localizedBlockContent`
- `localizedSlug`
- `localizedFaqItem`
- `localizedFaqItemRich`
- `localizedCtaLink`
- `localizedSeo`
- `localizedFooterLink`
- `heroSearchTab`
- `heroSection`
- `propertyCarouselSection`
- `homePropertyCarouselTab`
- `locationCarouselSection`
- `propertyTypesSection`
- `investmentSection`
- `aboutSection`
- `agentsPromoSection`
- `articlesSection`
- `seoTextSection`
- `landingCarouselSection`
- `cityRichDescriptionSection`
- `districtsComparisonSection`
- `linkedGallerySection`
- `faqSection`
- `landingGridSection`

### Existence checks requested

- Blog/article model exists: **Yes** (`blogPost`, `blogCategory`).
- Author model exists:
  - Dedicated `blogAuthor` schema: **No**.
  - Blog author data is embedded fields on `blogPost` (`authorName`, `authorRole`, `authorImage`).
- Category model exists: **Yes** (`blogCategory`), referenced from `blogPost.categories`.
- Tag-like blog taxonomy: **No dedicated blog tag schema found**.
- Property/real-estate docs exist: **Yes** (`property`, `city`, `district`, `propertyType`, `amenity`, `locationTag`, `agent`).

### Reuse classification

- **Reusable as-is**: existing schema registry structure and blog/property document coverage.
- **Reusable with light adaptation**: embedded author approach if more author metadata/governance is later required.
- **Likely needs rebuild/new**: dedicated blog author/tag schemas (if required by roadmap).
- **Unknown / needs clarification**: whether embedded author fields are intentional long-term model.

---

## 3) Shared Schema Patterns and Helpers

### Reusable SEO fields/objects

- `schemaTypes/objects/seo.ts`: non-localized SEO object (used in `property.seo`).
- `schemaTypes/objects/localizedSeo.ts`: localized SEO object (used by `blogPost`, `landingPage`, `city`, `district`, `catalogSeoPage`, `siteSettings.defaultSeo`).

### Slug patterns/helpers

- No central slug helper function/factory found.
- Repeated per-schema pattern: `type: 'slug'` with `source` from `title.en` and `validation: Rule.required()` in multiple document schemas.
- No custom `isUnique` handler found.

### Localization helpers/config

- Locale source-of-truth file exists: `lib/languages.ts` (`en`, `uk`, `ru`, `sq`, `it`).
- Schema layer uses field-level localization objects:
  - `localizedString`, `localizedText`, `localizedBlockContent`, `localizedSeo`, `localizedCtaLink`, etc.
- Locale fields are hardcoded in localized objects (not dynamically generated from `lib/languages.ts` at schema build time).

### Image/media helper objects

- No dedicated shared image object/factory found.
- Repeated inline image patterns with `hotspot` and optional `alt` fields.

### Validation utilities

- No central validation utility module found in schema layer.
- Validation is defined inline per field (`Rule.required`, `Rule.max`, `Rule.custom`, etc.).

### Preview helpers

- No shared preview helper utility found.
- Previews are defined inline in each schema (`preview.select` + `prepare`).

### Reference factories

- No reference field factory/helper found.
- References are defined inline via `type: 'reference'` and `to`.

### Conventions for new blog schemas

- Group tabs are used for editor UX in major docs (`groups` + `group`).
- Localized content fields generally use object types rather than per-locale documents.
- Slugs generally generated from English title.
- Array/editor blocks use clear validation and explanatory descriptions.

### Reuse classification

- **Reusable as-is**: localized objects, localized/non-localized SEO objects, inline preview/validation conventions.
- **Reusable with light adaptation**: slug pattern (if custom uniqueness or per-locale slug strategy needed).
- **Likely needs rebuild/new**: centralized schema helper factories (if desired for consistency), currently absent.
- **Unknown / needs clarification**: whether schema team wants dynamic locale-driven field generation from `lib/languages.ts`.

---

## 4) Rich Content Support (Blog/Editorial Blocks)

### Existing support in schema layer

Primary rich content object: `schemaTypes/objects/localizedBlockContent.ts`

Per-locale arrays support:
- Portable text blocks (`normal`, `h2`, `h3`, `h4`, `blockquote`)
- Lists (`bullet`, `number`)
- Marks/decorators (`strong`, `em`, `code`)
- Link annotation (`href` URL)
- Image block with `alt` and `caption`
- Embedded object blocks:
  - `blogTable` (`schemaTypes/objects/blogTable.ts`)
  - `blogFaqBlock` (`schemaTypes/objects/blogFaqBlock.ts`)
  - `blogCallout` (`schemaTypes/objects/blogCallout.ts`)

### Requested capability check

- Title/subtitle: **Supported** (e.g., `blogPost.title`, `blogPost.excerpt`, section-level localized title/subtitle patterns).
- Rich text body: **Supported** (`blogPost.content: localizedBlockContent`).
- Images in body: **Supported** via image block in `localizedBlockContent`.
- Tables: **Supported** (`blogTable`).
- FAQ blocks: **Supported** (`blogFaqBlock`).
- List-like editorial structures: **Supported** (portable text lists + array-based sections in multiple objects).
- CTA/button blocks in article body: **Not explicitly supported as a dedicated inline body block** (CTA objects exist, but not part of `localizedBlockContent` `of` array).
- Recommendation blocks: **Partially supported** via `blogPost.relatedPosts` field (document-level relation), but no dedicated rich block type.
- Embedded property/real-estate blocks inside article body: **Not supported** in current `localizedBlockContent` block types.

### Reuse classification

- **Reusable as-is**: current rich content setup for core editorial blog content.
- **Reusable with light adaptation**: can extend `localizedBlockContent` with new block members later.
- **Likely needs rebuild/new**: dedicated inline CTA/recommendation/property embed body blocks (if required in planned blog UX).
- **Unknown / needs clarification**: required editorial behavior for recommendation/property embeds (inline vs separate section).

---

## 5) Property / Real-Estate Modeling and Blog Referencing

### Property modeling presence

- Property document exists: `schemaTypes/documents/property.ts`.
- Related taxonomy/relations:
  - `agent` ref
  - `propertyType` ref
  - `city` ref
  - optional `district` ref filtered by selected city
  - `locationTags` refs
  - `amenitiesRefs` refs

### Property references in content schemas

- `propertyCarouselSection.properties` can reference multiple `property` docs (`schemaTypes/objects/propertyCarouselSection.ts`).
- `blogPost` currently has no field referencing `property`.
- `localizedBlockContent` has no block type that references `property`.

### Requested capability check

- Can content documents reference property documents? **Yes**, in existing non-blog schemas (`propertyCarouselSection`).
- Can editorially select 2-3 properties inside an article now? **No, not structurally in `blogPost` as currently defined**.
- Is current property/reference shape reusable for blog use case? **Yes, reference pattern is reusable** (already proven in section objects).

### Reuse classification

- **Reusable as-is**: `property` schema and reference patterns.
- **Reusable with light adaptation**: reuse reference-array approach for future blog-property linking fields/blocks.
- **Likely needs rebuild/new**: blog-specific property embed/select fields if article-level property curation is required.
- **Unknown / needs clarification**: exact UX for property insertion (inline block, side rail, or fixed related properties section).

---

## 6) Multilingual Handling

### Current approach

- Model type: **field-level localization** (not document-per-locale).
- Locale representation:
  - Schema fields in localized objects: `en`, `uk`, `ru`, `sq`, `it`.
  - Locale config file: `lib/languages.ts` with same locale IDs.
- No i18n plugin-based document translation model is configured in Studio plugins.

### Requested checks

- Titles/slugs/SEO/categories/authors approach:
  - Titles/content/SEO/category titles use localized fields.
  - Slugs in most docs are single `slug` fields generated from `title.en` (not localized slug objects).
  - Blog author fields (`authorName`, `authorRole`) are currently plain `string` (non-localized).
  - No dedicated `author` translation model for blog authors.

### Suitability for multilingual blog content

- Suitable for multilingual blog body/title/excerpt/SEO given existing `localizedBlockContent` + `localizedSeo`.
- Author localization is not aligned with field-level localized approach (author strings are non-localized).

### Reuse classification

- **Reusable as-is**: field-level i18n object system for blog text content and SEO.
- **Reusable with light adaptation**: slug strategy if multilingual slugs become required.
- **Likely needs rebuild/new**: author modeling/localization if multilingual author metadata is required.
- **Unknown / needs clarification**: desired multilingual URL strategy for blog (`slug` vs locale-specific slug).

---

## 7) Editorial UX Structure

### Desk structure organization

Defined in `structure/index.ts`:

- Singletons:
  - Home Landing (`landingPage` doc id `landing-home`)
  - Site Settings (`siteSettings` doc id `siteSettings`)
  - Cities Index Landing (`landingPage` doc id `landing-cities`)
- Grouped sections for:
  - Landing Pages (sub-lists by `pageType`)
  - Catalog SEO Pages
  - Cities with nested city-specific districts list and template-based district creation
  - All Districts
  - Properties (My Properties filtered by current user + All Properties)
  - Taxonomies (`propertyType`, `locationTag`, `amenity`)
  - Agents
  - Blog (`blogCategory`, `blogPost`)

### Groups/fieldsets/tabs in schemas

- Document groups are used widely (`blogPost`, `property`, `landingPage`, `city`, `district`, `catalogSeoPage`, `siteSettings`).
- This yields tabbed editorial sections such as Basic/Content/SEO/Categorization, etc.

### Preview configuration

- Most document/object schemas define `preview.select` and `prepare`.
- Common pattern: fallback title selection from localized fields and compact subtitles with status/meta.

### Ordering/sorting and initial values

- Desk-level default ordering exists in several lists (e.g., by `order`, `title.en`, `createdAt`).
- Initial values used for booleans and some metadata (`createdAt`, status flags, enabled flags, etc.).
- Initial value template `district-in-city` auto-fills district city reference.

### Editor-facing conventions worth reusing

- Enabled/Visible booleans on section objects.
- Mode toggles (`auto` vs `selected`/`manual`) with conditional fields and validation.
- Explicit descriptions on fields to clarify frontend expectations.

### Reuse classification

- **Reusable as-is**: desk structure patterns, grouped tabs, preview conventions, ordering and initial-value template usage.
- **Reusable with light adaptation**: blog desk grouping if additional blog entities are added.
- **Likely needs rebuild/new**: none strictly required for baseline blog model (already present).
- **Unknown / needs clarification**: whether blog workflow requires singleton editorial pages or custom blog-focused desk panes.

---

## 8) Validation and Publishing Readiness

### Required fields and validation

- Many core required validations already present across docs (titles, slugs, key references, etc.).
- Conditional validation patterns exist (`Rule.custom`) for mode-dependent fields and linked entities.
- Notable examples:
  - `landingPage`: requires at least one section when enabled; linked refs required by `pageType`.
  - `catalogSeoPage`: scope-based `city`/`district` requirements.
  - `property`: required refs and numeric validations.
  - `blogPost`: required `slug`, `title`; max 6 `relatedPosts`.

### Slug uniqueness handling

- No custom slug uniqueness functions (`isUnique`) found.
- Uses default Sanity slug behavior with per-document `source` generators.

### Reference validation

- Present in key schemas:
  - Required refs (e.g., property agent/type/city).
  - Contextual filtering (e.g., district by city in property/catalog schemas).
  - Conditional required refs based on mode/page scope.

### Media/image requirements (including alt text)

- Alt fields are present in multiple image definitions (cover/hero/gallery/SEO og image/etc.).
- Alt text is generally **not required** by validation in most image fields.
- Some image arrays enforce minimum count (e.g., property gallery min 1).

### SEO validation

- `seo.ts` includes max-length warnings for title/description.
- `landingPage.seo` adds strict locale completeness check for `metaTitle` and `metaDescription` when enabled.
- Other schemas using `localizedSeo` generally do not enforce equivalent locale-completeness checks.

### Publishing constraints relevant to blog quality

- Blog has baseline constraints but no strict content completeness checks for:
  - `publishedAt` (optional)
  - `coverImage` (optional)
  - `excerpt` (optional)
  - localized completeness across all locales (not enforced)
  - category requirement (not enforced)

### Reuse classification

- **Reusable as-is**: existing validation style and contextual custom validations.
- **Reusable with light adaptation**: locale completeness and media/accessibility constraints if stricter blog governance is needed.
- **Likely needs rebuild/new**: none mandatory; only if stricter publishing policy is desired.
- **Unknown / needs clarification**: desired minimum blog publishing standards (required locales, image/alt requirements, category policy).

---

## 9) Direct Answers to Key Goal Questions

- Blog/article model already exists: **Yes** (`blogPost`).
- SEO modeled: **Yes** (`seo`, `localizedSeo` and usage across docs including blog).
- Authors modeled: **Partially** (inline blog author fields on `blogPost`; no dedicated blog author document).
- Categories modeled: **Yes** (`blogCategory`, refs from `blogPost`).
- Property content modeled: **Yes** (`property` and supporting real-estate docs/taxonomies).
- Property references inside blog content: **Not currently in `blogPost` or `localizedBlockContent`**.
- Multilingual support present: **Yes** (field-level localized objects, multi-locale content including blog).

---

## 10) Blockers / Risks / Unknowns

- No code-level evidence of a dedicated blog author document/workflow.
- No current schema support for embedding/referencing properties directly inside blog articles.
- Slug strategy is primarily English-derived single slug; multilingual URL requirements are not encoded.
- Alt text is often available but not consistently required.
- Locale completeness rules are strict in `landingPage.seo` but not uniformly enforced across blog and other SEO-bearing schemas.
- Unknown whether production dataset hardcoding is intentional across all environments.

