/**
 * Map a CMS href onto the URL the app serves directly, instead of the one it
 * redirects away from. Pure and side-effect free so it can be unit-tested —
 * `fixRedirectingLinks.ts` is the script that walks documents and applies it.
 *
 * Two shapes, both leftovers from routing changes the content never caught up
 * with (Ahrefs crawl 2026-09-10, 393 internal links landing on a 307):
 *
 *   /albania/{city}/{deal}?district={d}  →  /albania/{city}/{d}/{deal}
 *   /catalog?city={city}                 →  /albania/{city}
 */

const DEAL_SEGMENTS = new Set(['sale', 'rent', 'short-term-rent'])

/**
 * Countries whose listing paths take a district segment. Only the catalog
 * spine has that shape, and without this check a `?district=` on any other
 * two-segment path — `/guides/something?district=plazh` — would be rewritten
 * into a URL that has never existed. Add a slug here when a second country
 * ships.
 */
const CATALOG_COUNTRIES = new Set(['albania'])

/** The rewritten href, or null when the href is already fine or not understood. */
export function rewriteRedirectingHref(href: string): string | null {
  if (typeof href !== 'string' || !href.startsWith('/')) return null
  const [pathname, query = ''] = href.split('?')
  if (!query) return null

  const params = new URLSearchParams(query)

  const district = params.get('district')
  if (district) {
    const segs = pathname.split('/').filter(Boolean)
    // ["albania", city] or ["albania", city, deal] — anything else is a shape
    // this does not understand, and guessing would be worse than one redirect.
    const isCatalogShape =
      CATALOG_COUNTRIES.has(segs[0]) &&
      (segs.length === 2 || (segs.length === 3 && DEAL_SEGMENTS.has(segs[2])))
    if (isCatalogShape) {
      const [country, city, deal] = segs
      params.delete('district')
      const rest = params.toString()
      const next = `/${country}/${city}/${district}${deal ? `/${deal}` : ''}`
      return rest ? `${next}?${rest}` : next
    }
  }

  if (pathname === '/catalog') {
    const city = params.get('city')
    // `/catalog?investment=…` answers 200 and has no path form to move to.
    if (!city) return null
    const cityDistrict = params.get('district')
    params.delete('city')
    params.delete('district')
    const rest = params.toString()
    const next = `/albania/${city}${cityDistrict ? `/${cityDistrict}` : ''}`
    return rest ? `${next}?${rest}` : next
  }

  return null
}
