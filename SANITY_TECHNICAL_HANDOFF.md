# Sanity CMS — Technical Handoff for Senior Engineers

This document describes the actual Sanity CMS/admin architecture of the domlivo real estate platform. It is based on direct inspection of the codebase (schema, structure, queries, fragments, config).

---

# 1. CMS architecture overview

**Stack:** Sanity v5 (studio), `@sanity/client` / `next-sanity` for queries. Project ID `g4aqp6ex`, dataset `production`. Single dataset; no environment split in config.

**Schema architecture:**
- **Flat schema:** All types are registered in two arrays — `documents` and `objects` — and combined in `schemaTypes/index.ts` as `[...documents, ...objects]`. No nested schema packages.
- **Documents:** `landingPage`, `city`, `district`, `amenity`, `blogCategory`, `blogPost`, `agent`, `property`, `propertyType`, `locationTag`, `catalogSeoPage`, `siteSettings`.
- **Objects (canonical):** Reusable/embedding types: SEO (non-localized `seo` + localized `localizedSeo`), link/CTA types, localized field wrappers (`localizedString`, `localizedText`, `localizedBlockContent`, etc.), **generic landing section blocks** (`heroSection`, `propertyCarouselSection`, …), FAQ/item types, blog block types (`blogTable`, `blogCallout`, `blogFaqBlock`), district stats/metrics.
- **Singletons:** Homepage is `landingPage` with `_id == "landing-home"` (pageType `home`), and `siteSettings` (documentId `siteSettings`) is forced in the desk. Editors manage the homepage via the canonical landing builder.
- **References:** Property → agent, propertyType, city, district, locationTags[], amenitiesRefs[]; district → city; blogPost → blogCategory[]; homepage sections → property[], city[], district[], propertyType[], blogPost[]. Filtering is used (e.g. district list filtered by `city._ref`) and one initial-value template exists for “district in city”.
- **Localization:** Field-level only. No document-level or “language document” pattern. Locales are fixed: `en`, `uk`, `ru`, `sq`, `it` (see `lib/languages.ts`). Localized content is stored in object types that hold one key per language (e.g. `localizedString`: `{ en, uk, ru, sq, it }`). Slug is **single** (Sanity `slug` type with `current`) for city, district, property, propertyType, blogPost, blogCategory, locationTag — not per-locale.
- **Admin workflow:** Desk is custom (`structure/index.ts`). Top-level: Home Landing (canonical), Landing Pages, Site Settings, then Cities (with nested “Districts in this City”), All Districts, Properties, taxonomies, Blog. Ordering is set for districts (order asc, title.en asc) and properties (createdAt desc).
- **Frontend relation:** Next.js consumes GROQ via `lib/sanity/queries.ts` and `lib/sanity/fragments.ts`. Homepage query reads the canonical homepage landing: `landingPage` with `_id == "landing-home"`.

---

# 2. Project map of Sanity

**Entry points / config**
- `sanity.config.ts` — projectId, dataset, `schemaTypes`, custom `structure`, `visionTool`, one template (`districtInCityTemplate`).
- `sanity.cli.ts` — CLI projectId/dataset, deployment autoUpdates.
- `schemaTypes/index.ts` — concatenates `documents` and `objects`.

**Document schemas (all under `schemaTypes/documents/`)**
- `index.ts` — exports array `documents`.
- `landingPage.ts`, `siteSettings.ts`, `city.ts`, `district.ts`, `property.ts`, `propertyType.ts`, `agent.ts`, `amenity.ts`, `locationTag.ts`, `blogPost.ts`, `blogCategory.ts`.

**Object schemas (all under `schemaTypes/objects/`)**
- `index.ts` — exports array `objects`.
- Localization: `localizedString.ts`, `localizedText.ts`, `localizedSlug.ts`, `localizedCtaLink.ts`, `localizedSeo.ts`, `localizedFaqItem.ts`, `localizedFooterLink.ts`, `localizedBlockContent.ts`.
- SEO: `seo.ts` (non-localized), used by `property`; `localizedSeo.ts` used by landing pages (`landingPage`), siteSettings, city, district, blogPost.
- Links: `ctaLink.ts`, `footerLink.ts`, `socialLink.ts`.
- Landing sections (canonical): `heroSection.ts`, `propertyCarouselSection.ts`, `locationCarouselSection.ts`, `propertyTypesSection.ts`, `investmentSection.ts`, `aboutSection.ts`, `agentsPromoSection.ts`, `articlesSection.ts`, `seoTextSection.ts`, `faqSection.ts`.
- Blog blocks: `blogTable.ts`, `blogCallout.ts`, `blogFaqBlock.ts`.
- Other: `faqItem.ts`, `districtStat.ts`, `districtMetric.ts`.

**Desk / structure**
- `structure/index.ts` — single `StructureResolver`; defines list items, singletons, document type lists, nested city → districts list with filter and initialValueTemplates, “My Properties” filter by `ownerUserId`.

**Templates**
- `templates/districtInCity.ts` — template `district-in-city`; pre-fills `city` reference from param `cityId`.

**Query layer**
- `lib/sanity/index.ts` — re-exports queries and fragments.
- `lib/sanity/queries.ts` — named GROQ queries (HOME_PAGE_QUERY, SITE_SETTINGS_QUERY, city/district/property/blog/settings lists and by-slug).
- `lib/sanity/fragments.ts` — reusable GROQ fragments (PROPERTY_CARD_FRAGMENT, CITY_CARD_FRAGMENT, LANDING_PAGE_SECTIONS_FRAGMENT, etc.). Fragments do not resolve locale; they return raw fields.

**Localization config**
- `lib/languages.ts` — list of 5 languages (en, uk, ru, sq, it). Referenced in comments as source of truth for localized types.

**Validation / helpers**
- Validation is inline in schema (Rule.required(), Rule.custom(), etc.). No shared validation helpers in a dedicated file.
- `scripts/lib/addKeysToArrayItems.ts` — utility used by seeds to add `_key` to array items; no schema dependency.

**Seeds / migrations (reference only; do not run without intent)**
- `scripts/seed.ts`, `scripts/seedFull.ts` — populate data (canonical homepage seeds `landing-home`).
- `scripts/migrateCityDistrictSlug.ts`, `scripts/migratePropertyTypeSlugs.ts` — slug migrations.
- `scripts/wipeDataset.ts`, `scripts/resetContentForFieldLevelI18n.ts`, etc. — reset/migration helpers.

---

# 3. Content model explanation

**Property (listings)**  
- **Role:** Core listing entity (sale/rent/short-term).  
- **Fields:** title, slug (single), shortDescription, description (all localized where applicable), agent (ref), type (ref propertyType), status (sale|rent|short-term), isPublished, lifecycleStatus (draft|active|reserved|sold|rented|archived), price, currency, featured, investment, city (ref), district (ref, filter by city), address, coordinates, locationTags[] (ref), area, bedrooms, bathrooms, yearBuilt, amenities (legacy string[]), amenitiesRefs[] (ref amenity), propertyCode, gallery (image[], min 1), seo (non-localized `seo`), createdAt, viewCount/saveCount/contactCount, ownerUserId (hidden).  
- **Relations:** Required agent, propertyType, city; optional district; optional locationTags, amenitiesRefs.  
- **Visibility:** Listings are considered “live” when `isPublished == true` and `lifecycleStatus == 'active'` (queries and desk logic align with this).  
- **Scaling:** Rich but heavy. Two amenity concepts (amenities vs amenitiesRefs) and mixed slug/localized patterns elsewhere suggest incremental evolution; adding more languages or locales does not change property’s slug (single).

**City**  
- **Role:** Geographic hub; has districts, hero/content/FAQ/SEO.  
- **Fields:** title, slug (single), popular, order, isPublished, heroTitle/heroSubtitle/heroShortLine/heroImage/heroCta, shortDescription, description, investmentText, featuredPropertiesTitle/Subtitle, allPropertiesCta, districtsTitle/districtsIntro, districtStats[], cityVideoUrl, galleryTitle/Subtitle, gallery[], faqTitle/faqItems[], seoText, seo (localizedSeo).  
- **Relations:** Districts are separate documents with `city` reference; desk shows “Districts in this City” via filter.  
- **Scaling:** Fine. Single slug and field-level i18n are consistent.

**District**  
- **Role:** Sub-location of a city.  
- **Fields:** title, slug (single), city (ref), isPublished, order, hero/content/media/FAQ/SEO (same idea as city).  
- **Relations:** Required city. Template “district-in-city” pre-fills city.  
- **Scaling:** Fine.

**Property type**  
- **Role:** Taxonomy (Apartment, House, Villa, etc.).  
- **Fields:** title (localizedString), slug (single), image (with alt), shortDescription (localizedText), order, active.  
- **Relations:** Referenced by property.type.  
- **Scaling:** Fine; used in filters and homepage section.

**Home page**  
- **Role:** Single page built from ordered sections.  
- **Fields:** `pageSections[]` (polymorphic builder), `seo` (localizedSeo). Validation is per-section; homepage is a `landingPage` singleton (`landing-home`).
- **Section types (canonical):** heroSection, propertyCarouselSection, locationCarouselSection, propertyTypesSection, investmentSection, aboutSection, agentsPromoSection, articlesSection, seoTextSection, faqSection. Sections reference property[], city[], district[], propertyType[], blogPost[] where applicable; some have “mode” (e.g. auto vs selected) and conditional validation.
- **Scaling:** Adding section types is straightforward; adding many more could make the array long for editors.

**Site settings**  
- **Role:** Global branding, contact, footer, default SEO.  
- **Fields:** siteName, siteTagline, logo (localized where applicable), contactEmail, contactPhone, companyAddress, socialLinks[] (socialLink), footerQuickLinks[] (localizedFooterLink), copyrightText (localizedString), defaultSeo (localizedSeo).  
- **Scaling:** Fine.

**Blog**  
- **blogPost:** slug (single), publishedAt, title, excerpt, content (localizedBlockContent), coverImage, categories[] (ref blogCategory), featured, authorName/authorRole/authorImage, relatedPosts[] (ref blogPost), seo (localizedSeo).  
- **blogCategory:** title, slug (single), description, order, active.  
- **Scaling:** Single slug per post; frontend must use one canonical URL per post. localizedBlockContent is heavy (full block array per language).

**Agent**  
- **Role:** Contact/owner for properties.  
- **Fields:** name, email, phone, photo, userId (Sanity user link). No localization.  
- **Scaling:** Fine for internal use; if agents become public-facing and multilingual, the model would need extension.

**Amenity / Location tag**  
- Taxonomy-like: title (localized for amenity/locationTag), slug (single for locationTag), order/active, description for locationTag. Used for filtering and display.  
- **Scaling:** Fine.

**Filters / option sources**  
- No dedicated “filter config” document. Options are derived from data: cities (isPublished), property types (active), location tags (active), amenities (active). Deal type comes from property.status (sale/rent/short-term). Catalog filters are expected to be built from these entities and property aggregates (e.g. price range, bedrooms).

---

# 4. Localization architecture

**Model:** Field-level only. Each “localized” field is an object with one key per language.

**Locale set:** `en`, `uk`, `ru`, `sq`, `it` (5). Defined in `lib/languages.ts` and reflected in:
- `localizedString` — object with en, uk, ru, sq, it (string).
- `localizedText` — same keys, type text.
- `localizedBlockContent` — same keys, each value an array of blocks (portable text + custom blocks).
- `localizedSeo` — metaTitle (localizedString), metaDescription (localizedText), ogTitle, ogDescription, ogImage (single image), noIndex.
- `localizedCtaLink` — href (string), label (localizedString).
- `localizedFaqItem` — question (localizedString), answer (localizedText).
- `localizedFooterLink` — href, label (localizedString).

**Slug strategy:** All routed documents use a **single** Sanity `slug` (source usually `title.en`). So: one URL per entity; locale is not part of the slug. Documents using this: city, district, property, propertyType, blogPost, blogCategory, locationTag. The type `localizedSlug` exists in the schema but is **not** used by any of these documents (migration reports indicate migration from localized slug to single slug). So `localizedSlug` is effectively legacy/dead for current docs.

**Consistency:**  
- Localized content: consistent use of en/uk/ru/sq/it in the object types above.  
- Slug: consistent use of single slug for all main documents.  
- One inconsistency: **blog post by-slug query** in `lib/sanity/queries.ts` uses `slug.en == $slug || slug.sq == $slug || ...` but the blogPost schema has `type: 'slug'` (single), so the correct filter is `slug.current == $slug`. This is a bug.

**Editor experience:** Editors see one field per language in each localized block. For 5 languages that’s manageable but repetitive; no in-studio “pick one locale to edit” abstraction. Risk of leaving a language empty is high; there is no validation enforcing “at least one language” on localizedString/localizedText.

**Frontend consumption:** Queries return raw objects (e.g. `title: { en: "...", uk: "...", ... }`). Frontend must consistently use a single helper (e.g. `getLocalizedValue(field, locale)`) and fallback order (e.g. locale → en → first present). If the frontend assumes a different key set or missing keys, rendering can break. So consumption is “safe” only if the frontend is strict about presence and fallbacks.

**Adding a 6th language:** Would require adding the new key to: localizedString, localizedText, localizedBlockContent, localizedSeo, localizedCtaLink, localizedFaqItem, localizedFooterLink, and to `lib/languages.ts`. localizedSlug is unused. No document-level or slug-per-locale change needed with current design.

---

# 5. Schema quality analysis

**Naming:** Consistent: camelCase, document names match domain (city, district, property, propertyType, blogPost, landingPage, siteSettings). Section types are currently prefixed `home*Section` but are used as universal builder blocks.

**Field design:**  
- Good: groups used on heavy documents (property, city, district, blogPost, siteSettings); descriptions present on many fields; required fields and options (e.g. status, lifecycleStatus) are clear.  
- Weak: property has both `amenities` (string[]) and `amenitiesRefs` (ref[]); one is deprecated in description but still in schema.  
- Slug: source is consistently `title.en` (or similar) across documents; maxLength 96.

**References:** Correct use of `to: [{type: '...'}]`. Filter on district by city ref is correct. No weak refs used in the inspected code.

**Duplication:** Two SEO types — `seo` (non-localized, used by property) and `localizedSeo` (used by landingPage, siteSettings, city, district, blogPost). So property is the only document with non-localized SEO; that’s a deliberate but inconsistent choice.

**Normalization:** Entities are normalized (city, district, propertyType, agent, etc. as separate documents). Homepage sections embed references and resolve them in queries; no denormalization of full content into sections.

**Validation:**  
- Present: required(), min/max, custom() for conditional rules (e.g. “at least one property when mode is selected”).  
- Missing: no “at least one language” on localizedString/localizedText; no cross-field rules (e.g. maxPrice >= minPrice if both set).  
- Hero count enforcement (max one hero) is currently done on the legacy homePage schema (removed from active schema). Landing pages can implement similar validation if needed.

**Editor UX:** Groups and ordering improve UX. Hidden fields based on parent (e.g. “selected” list when mode is “selected”) are used. Initial value templates only for district-in-city. No document-level preview that shows a chosen locale.

**Maintainability:** Schema is in one place and easy to find. Adding a new landing section type requires: new object schema, registration in objects/index, and adding to `landingPage.pageSections` `of` array plus to `LANDING_PAGE_SECTIONS_FRAGMENT`. Risk: fragment and section type list can get out of sync.

---

# 6. Frontend contract analysis

**Data model:** Document-centric and reference-based; fits GROQ and Next.js. List pages and by-slug pages are well supported by existing queries. Localized fields are returned as objects; frontend must resolve locale. That’s a clear contract.

**Coupling to UI:** Section types are named after UI (hero, carousel, etc.) but carry content and references, not layout. So they’re “content blocks” that the frontend can map to components; coupling is acceptable. No layout or breakpoint data in schema.

**Sections/blocks:** Homepage is an array of polymorphic sections with `_type` and `_key`; each section type has a known shape. Fragment returns all possible fields; non-applicable fields are null for other section types. Frontend can switch on `_type` and use only the relevant subset. Mode (auto vs selected) implies that for “auto” the frontend must run a separate query (e.g. featured properties, latest posts); contract is documented in section descriptions.

**SEO:** Page-level SEO is in localizedSeo (landingPage, city, district, blogPost) or defaultSeo (siteSettings). Property uses non-localized `seo`. Fragment exposes meta/og fields; no resolution in GROQ.

**Catalog/filters:** There is no single “catalog config” document. Properties list and featured properties queries exist; filter options (cities, property types, status, price range, bedrooms) must be computed from the same dataset (e.g. distinct status, min/max price, etc.) or from separate queries. Fragments don’t include a dedicated “filter options” query; that’s expected to be built by the frontend or additional GROQ. So catalog structure is “data-driven and flexible” but not “pre-shaped” for filters in the schema.

**Query/mapping issues:**  
- **Blog post by slug:** Query uses `slug.en`, `slug.sq`, etc., but schema has single `slug`; should be `slug.current == $slug`.  
- **City/district card fragments** return `slug` as the full slug object; frontend must use `slug.current` for URLs. Property type fragment already uses `"slug": slug.current`. So slug shape is inconsistent between fragments.  
- **Cover image:** BLOG_POST_CARD_FRAGMENT and BLOG_POST_FULL_FRAGMENT use `"coverImage": seo.ogImage`. Schema has a top-level `coverImage`; using seo.ogImage may be intentional for OG but differs from the main “article image” field.

---

# 7. Admin usability and editorial workflow risks

**Content model clarity:** Relations are clear (city → districts, property → city/district/type/agent). “My Properties” vs “All Properties” depends on ownerUserId; if that’s not set, “My” is empty. So editors need to understand that linking to current user is required for “My” to work.

**Singleton vs collection:** Home Page and Site Settings as singletons are correct. No other singletons; rest are collections. Boundaries are clear.

**Desk structure:** Cities with nested districts and Properties split (My / All) are good. Blog is a simple list. Missing: no quick access to “home page” from within a section; no dashboard or “draft” view. Editors may not see validation errors until they try to publish if they use mode “selected” but leave the list empty (validation is in place for that).

**Risks:**  
- Leaving a locale empty is easy; no validation forces completeness.  
- Property has many groups; new editors may miss required fields in non-default groups.  
- District filter by city is correct, but “All Districts” is a flat list; editors might create a district without going through a city and then set city manually (template helps when creating from city).  
- If someone changes a slug, frontend routes can break unless the app uses redirects or stable IDs in addition to slugs.

---

# 8. Critical weaknesses and future bottlenecks

1. **Blog post by-slug query uses wrong slug shape**  
   - **What:** `BLOG_POST_BY_SLUG_QUERY` filters on `slug.en`, `slug.sq`, etc., but blogPost has single `slug` (slug.current).  
   - **Why it’s a problem:** Query will not match; blog post by slug will fail.  
   - **Severity:** High.  
   - **Future pain:** 404s or broken blog routes.

2. **Two SEO types and property using non-localized SEO**  
   - **What:** property uses `seo` (string/text, single language); other pages use `localizedSeo`.  
   - **Why it’s a problem:** Inconsistent; property detail pages can’t have per-locale meta without frontend or schema change.  
   - **Severity:** Medium.  
   - **Future pain:** Multilingual SEO for listings will require migration or duplication.

3. **No validation that at least one language is filled**  
   - **What:** localizedString and localizedText have no Rule requiring any key to be non-empty.  
   - **Why it’s a problem:** Documents can be “valid” with all locales empty; frontend has nothing to show.  
   - **Severity:** Medium.  
   - **Future pain:** Empty or broken localized UI; hard to fix in bulk.

4. **localizedSlug type still in schema but unused**  
   - **What:** localizedSlug is exported in objects and referenced in comments/docs; no document uses it.  
   - **Why it’s a problem:** Confusion; risk of someone using it and reintroducing per-locale slugs.  
   - **Severity:** Low.  
   - **Future pain:** Wrong slug model if reused.

5. **Property amenities duplication**  
   - **What:** property has both `amenities` (string[]) and `amenitiesRefs` (ref amenity); schema marks one as deprecated.  
   - **Why it’s a problem:** Two sources of truth; queries/frontend must decide which to use.  
   - **Severity:** Medium.  
   - **Future pain:** Inconsistent filter/display behavior; migration cost to remove one.

6. **City/district card fragments return slug object, not string**  
   - **What:** CITY_CARD_FRAGMENT and DISTRICT_CARD_FRAGMENT select `slug`; propertyType fragment selects `"slug": slug.current`.  
   - **Why it’s a problem:** Frontend must handle both `slug` (object) and `slug` (string) depending on entity.  
   - **Severity:** Low.  
   - **Future pain:** Bugs if frontend assumes a single shape.

7. **Homepage section fragment is a single large projection**  
  - **What:** `LANDING_PAGE_SECTIONS_FRAGMENT` lists every section field and nested reference; unused fields are null per section type.
   - **Why it’s a problem:** Any new section field must be added to the fragment; easy to forget.  
   - **Severity:** Low.  
   - **Future pain:** New fields not visible to frontend until fragment is updated.

8. **Catalog filter options not provided by schema**  
   - **What:** No document or query that returns “available filter options” (e.g. min/max price, list of statuses, bedrooms) for the catalog.  
   - **Why it’s a problem:** Frontend or API must derive these with custom GROQ or multiple queries.  
   - **Severity:** Medium (if catalog is central to product).  
   - **Future pain:** Repeated logic, possible inconsistency, and no single source of truth for “what can be filtered.”

---

# 9. What is already done well

- **Single slug per document** for all main entities (city, district, property, propertyType, blogPost, blogCategory, locationTag): clear URLs and no locale-in-slug complexity.  
- **Field-level localization** with a fixed locale set (en, uk, ru, sq, it) and shared object types: consistent and extendable to one more language by adding keys.  
- **Desk structure:** Singletons for home and site settings; cities with nested districts and template for “district in city”; Properties split into My/All; clear document type lists.  
- **Fragments and query centralization** in `lib/sanity`: one place for GROQ and fragments; frontend contract is explicit (localized raw, resolve on client).  
- **Conditional section logic:** Mode (auto/selected) with hidden fields and validation so that “selected” requires at least one reference; descriptions explain frontend behavior.  
- **Groups and validation** on heavy documents (property, city, district, blogPost): required fields and enums are defined; district filter by city and hero-count rule on home page.  
- **One initial value template** (district-in-city) that pre-fills city reference: reduces editor error and keeps relation consistent.  
- **lib/languages.ts** as single source of truth for locale IDs: avoids magic strings in many places.

---

# 10. Refactor priorities

**Fix first (before scaling content or adding features):**  
- Correct `BLOG_POST_BY_SLUG_QUERY` to use `slug.current == $slug` (and align params/comments).  
- Decide and document slug shape for cards: either normalize all card fragments to return `"slug": slug.current` (or equivalent) for city/district, or document that city/district return full slug object and frontend must use `.current`.

**Acceptable for now:**  
- Two SEO types (seo vs localizedSeo) and property using non-localized SEO, as long as product accepts single-language meta for listings.  
- localizedSlug in schema but unused (could be removed or marked “do not use” in a follow-up).  
- `LANDING_PAGE_SECTIONS_FRAGMENT` as one big projection, with a discipline to update it when section schemas change.

**Do not touch without a bigger plan:**  
- Changing from field-level to document-level localization.  
- Introducing per-locale slugs again.  
- Adding a 6th language (requires a coordinated pass over all localized types and languages.ts).

**Stabilize before scaling content volume:**  
- Add “at least one language” validation (or warning) for localizedString/localizedText where it’s critical (e.g. title, key CTAs).  
- Resolve property amenities: either remove deprecated `amenities` and use only amenitiesRefs, or document and enforce a single source in queries/frontend.  
- Introduce a single “catalog filter options” query or document so filter behavior and options are consistent and maintainable.

---

# 11. Handoff summary for another engineer

**What this CMS is:** A single-dataset Sanity v5 studio for a real estate platform. Content is document-centric and reference-based. The homepage is the canonical `landingPage` singleton (`landing-home`) with an ordered array of section blocks (hero, carousels, about, blog, FAQ, etc.). Listings (property), locations (city, district), taxonomy (propertyType, amenity, locationTag), and blog (blogPost, blogCategory) are separate collections. Two singletons: landing-home and siteSettings. Localization is field-level only: every localized field is an object with keys en, uk, ru, sq, it. Slugs are single (slug.current) for all main entities; there is no per-locale slug. The frontend gets raw localized objects and is expected to resolve locale with a helper like getLocalizedValue(field, locale).

**Entities that matter most:**  
- **property** — core listing; has status (sale/rent/short-term), price, city, district, type, agent, gallery, and visibility (isPublished + lifecycleStatus).  
- **city / district** — location hierarchy; district belongs to city; both have hero, content, FAQ, SEO.  
- **propertyType** — type of property (apartment, house, etc.); used in filters and homepage.  
- **landing-home (landingPage)** — singleton; `pageSections[]` drives the whole page; sections can reference properties, cities, districts, property types, blog posts, and other landing pages.
- **siteSettings** — global branding, footer, contact, default SEO.  
- **blogPost / blogCategory** — blog with single slug per post and localized content/blocks.

**How localization actually works:**  
- All localized content lives in object types (localizedString, localizedText, localizedBlockContent, localizedSeo, localizedCtaLink, etc.) with exactly the keys en, uk, ru, sq, it.  
- No document-level locale or “language document.”  
- Slug is one per document (slug.current), not per language.  
- Queries do not resolve locale; they return these objects. The frontend must pick a value by locale (and fallback order) everywhere.

**What frontend developers must be careful with:**  
- Use `slug.current` for routing for all entities; do not use slug.en/slug.sq for blog (schema is single slug).  
- Handle both slug shapes: some fragments return slug as object (city, district), others as string (e.g. propertyType’s "slug": slug.current). Prefer normalizing to string in fragments or in the client.  
- Assume localized fields can have missing keys; implement fallback (e.g. locale → en → first non-empty).  
- For homepage sections with mode “auto,” do not rely on the section’s reference array; run the appropriate list query (e.g. featured properties, latest posts) yourself.  
- Blog post by-slug: current query is wrong (uses slug.en etc.); fix to slug.current == $slug before relying on it.

**Top 5 risks:**  
1. **BLOG_POST_BY_SLUG_QUERY** uses slug.en/sq/ru/uk while schema has single slug → broken blog routes.  
2. **No “at least one language” validation** → empty localized fields and broken or blank UI.  
3. **Property has two amenity concepts** (amenities vs amenitiesRefs) → ambiguous filters/display.  
4. **No single contract for catalog filter options** → duplicated or inconsistent filter logic on frontend.  
5. **Property SEO is non-localized** → multilingual SEO for listings will need a schema or data change.

**Rules to avoid making the CMS worse:**  
- Do not introduce a new localization pattern (e.g. document-per-locale or localized slug) without a project-wide decision.  
- Do not add a new locale key without updating every localized object type and lib/languages.ts.  
- When adding a new landing section type, add it to the schema, to `landingPage.pageSections` `of` array, and to `LANDING_PAGE_SECTIONS_FRAGMENT`.
- Keep slug as single (slug.current) for any new routed document.  
- When adding a new query that filters by slug, use `slug.current == $slug` for documents that use the Sanity slug type.

---

# 12. Final engineering verdict

**Quality:** The architecture is **average to good** for a single-dataset, field-level localized CMS. The model is clear, references are correct, and the desk is usable. Inconsistencies (blog slug query, two SEO types, slug shape in fragments, amenities duality) and missing safeguards (no “at least one language” validation, no catalog filter contract) hold it back from “good” without fixes.

**Suitability for scaling a multilingual real estate platform:** **Suitable with fixes.** Five languages are already in the model; adding content in all of them is possible. The main gaps are: (1) fixing the blog slug query, (2) tightening validation and slug/fragment consistency, and (3) defining a clear catalog/filter contract. Without those, scaling content and adding more locales or features will increase technical debt and bugs.

**Needed work:** **Targeted cleanup and small fixes**, not a full redesign. Prioritize: correct BLOG_POST_BY_SLUG_QUERY; normalize slug in card fragments or document the contract; add optional “at least one language” validation where it matters; resolve property amenities to one source; and introduce a single, documented way to get catalog filter options. Optionally align property SEO with localizedSeo if multilingual listing meta is required.

**Confidence:** **Medium–high** for continuing feature work and content growth, provided the listed fixes and rules are applied. Confidence would be higher after the blog query fix and a short “schema and query contract” doc that the frontend team can follow.
