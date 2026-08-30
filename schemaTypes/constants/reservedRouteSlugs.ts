/**
 * Reserved URL slugs — the CMS-side half of the routing contract.
 *
 * Source of truth: domlivo-workspace/docs/engineering/ROUTING.md.
 * Frontend counterparts that MUST stay in sync when a static route is added:
 *   - your-house-albania/src/lib/routes/catalog.ts  (FILTER_ROUTE_RESERVED_SEGMENTS)
 *   - your-house-albania/src/app/[locale]/guides/[slug]/page.tsx  (GUIDES_CANONICAL_SLUG_REDIRECTS)
 *
 * Why: a `landingPage` slug that collides with a static route shadows or
 * duplicates it (the 2026-08 "for-realtors" duplicate-URL case). Validation
 * here stops the collision at document-creation time; the frontend redirect
 * map remains defense-in-depth for pre-existing data.
 */

/** Static routes + route namespaces under /[locale]/. */
export const STATIC_ROUTE_SLUGS = [
  'about',
  'agent',
  'appartment',
  'blog',
  'catalog',
  'cities',
  'contact',
  'contacts',
  'contactus',
  'country',
  'districts',
  'favorites',
  'for-realtors',
  'guides',
  'how-to-publish',
  'info',
  'investment',
  'luxury-villa',
  'office-spaces',
  'properties',
  'property',
  'register',
  'residential-homes',
  'sell',
] as const

/** Deal-type catalog segments; also the slugs of the deal-type landing documents. */
export const DEAL_ROUTE_SLUGS = ['sale', 'rent', 'long-term-rent', 'short-term-rent', 'short-term'] as const

/** Locale prefixes (current + legacy `al` + planned `pl`). */
export const LOCALE_SLUGS = ['en', 'uk', 'ru', 'sq', 'it', 'al', 'pl'] as const

/** System / infrastructure segments and namespaces reserved for future routes. */
export const SYSTEM_SLUGS = [
  'admin',
  'api',
  'author', // planned: /blog/author/[slug] (ТЗ-13)
  'category',
  'editor',
  'manifest',
  'robots',
  'search',
  'sitemap',
  'studio',
  'thank-you',
] as const

const ALL_RESERVED = new Set<string>([
  ...STATIC_ROUTE_SLUGS,
  ...DEAL_ROUTE_SLUGS,
  ...LOCALE_SLUGS,
  ...SYSTEM_SLUGS,
])

/** True when a slug may not be used because a route or namespace owns it. */
export function isReservedRouteSlug(slug: string | undefined | null): boolean {
  if (!slug) return false
  return ALL_RESERVED.has(slug.trim().toLowerCase())
}

/**
 * Sanctioned slug-couplings: custom landings whose reserved slug IS the
 * contract — a static route fetches them by this literal slug (ROUTING.md §4).
 * The /guides route 301s these to their static home, so no duplicate URL.
 */
const CUSTOM_LANDING_SLUG_ALLOWLIST = new Set(['for-realtors'])

/** Deal-landing documents legitimately use deal slugs — everything else reserved. */
export function isReservedForCustomLanding(slug: string | undefined | null): boolean {
  if (!slug) return false
  const s = slug.trim().toLowerCase()
  if (CUSTOM_LANDING_SLUG_ALLOWLIST.has(s)) return false
  return isReservedRouteSlug(s)
}

/** propertyType slugs render inside catalog filter paths — deal words and statics collide. */
export function isReservedForPropertyType(slug: string | undefined | null): boolean {
  return isReservedRouteSlug(slug)
}

/** city/district slugs live in the geo path — statics and deal words collide with sub-segments. */
export function isReservedForGeoEntity(slug: string | undefined | null): boolean {
  return isReservedRouteSlug(slug)
}

/** Blog post slugs only collide with planned /blog sub-namespaces. */
const BLOG_SUBROUTE_SLUGS = new Set(['author', 'category'])
export function isReservedForBlogPost(slug: string | undefined | null): boolean {
  if (!slug) return false
  return BLOG_SUBROUTE_SLUGS.has(slug.trim().toLowerCase())
}

/** Standard validation message. */
export function reservedSlugMessage(slug: string): string {
  return `"${slug}" is a reserved route segment (see docs/engineering/ROUTING.md in domlivo-workspace). Pick a different slug — this one is owned by an app route, deal segment, locale, or system namespace.`
}

// ─── Async cross-document collision checks (dataset-driven slugs) ────────────
// The top-level /<slug> resolver gives entity routes (country, city,
// propertyType, deal) precedence over Unique Landings. These checks close both
// eclipse directions at save time; scripts/reportRouteCollisions.ts is the
// backstop for writes that bypass Studio validation.

type ValidationClient = {
  fetch: <T>(query: string, params?: Record<string, unknown>) => Promise<T>
}

/** Doc types whose slugs occupy the top-level segment ahead of unique landings. */
const TOP_LEVEL_ENTITY_TYPES = ['country', 'city', 'propertyType'] as const

/** Returns the entity type owning this slug, or null when the slug is free. */
export async function findTopLevelEntityOwningSlug(
  client: ValidationClient,
  slug: string,
): Promise<string | null> {
  const hit = await client.fetch<{_type?: string} | null>(
    `*[_type in $types && slug.current == $slug][0]{_type}`,
    {types: [...TOP_LEVEL_ENTITY_TYPES], slug: slug.trim().toLowerCase()},
  )
  return hit?._type ?? null
}

/** Returns the title/slug of a Unique Landing already using this slug, or null. */
export async function findUniqueLandingOwningSlug(
  client: ValidationClient,
  slug: string,
  excludeDocId?: string,
): Promise<string | null> {
  const hit = await client.fetch<{slug?: string} | null>(
    `*[_type == "landingPage" && pageType == "unique" && slug.current == $slug && !(_id in [$id, "drafts." + $id])][0]{"slug": slug.current}`,
    {slug: slug.trim().toLowerCase(), id: excludeDocId ?? '-'},
  )
  return hit?.slug ?? null
}

export function entityOwnsSlugMessage(slug: string, entityType: string): string {
  return `"${slug}" is already a ${entityType} slug — entity routes take precedence at /<slug>, so this Unique Landing would never render. Pick another slug.`
}

export function landingOwnsSlugMessage(slug: string): string {
  return `"${slug}" is used by a Unique Landing (top-level /${slug}). Creating this entity would take over that URL and the landing would silently stop rendering. Rename one of them (see ROUTING.md).`
}
