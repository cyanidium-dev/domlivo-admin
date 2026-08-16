/**
 * The zone identity registry — parse, validate, and flatten
 * `scripts/data/zones.json`.
 *
 * See docs/engineering/SPEC-zone-generation-2026-08-16.md §4. Kept separate
 * from the script so it can be unit-tested without a Sanity connection: this
 * file decides what a city and a district *are*, and a silent mistake here
 * creates a public page for a place that does not exist.
 *
 * Identity only. Market figures live in `zone-metrics-seed.json` and change
 * every period; a zone's name changes once. The two are joined by
 * `crossCheckMetricsZones`, which runs in the test suite so an orphan metrics
 * record fails before anyone connects to production.
 */

export const LOCALES = ['en', 'uk', 'ru', 'sq', 'it'] as const
export type Locale = (typeof LOCALES)[number]
export type Localized = Record<Locale, string>

/**
 * `page` — a real place that gets a district page.
 * `metric-only` — a zone that exists to carry figures and must never be
 *   published. `golem-1st-line` and `lungomare-2nd-line` are price *lines*
 *   within a district, not toponyms: no seller writes "1st line" as an address,
 *   so a page would target a search nobody performs. The distinction is real
 *   market data (Vlorë's 2nd line is the +33–67% y/y story) and worth keeping
 *   as figures. See ZONE-TAXONOMY.md, "Descriptor vs toponym".
 */
export type ZoneRole = 'page' | 'metric-only'

export type DistrictEntry = {
  slug: string
  title: Localized
  role?: ZoneRole
  /** Why this zone is modelled the way it is. Never written to a content field. */
  note?: string
  /** KB file and section the zone is drawn from. */
  kbSource?: string
}

export type CityEntry = {
  slug: string
  title: Localized
  vibe?: Localized
  note?: string
  kbSource?: string
  districts: DistrictEntry[]
}

export type ZoneRegistry = {
  countries: Record<string, {cities: Record<string, Omit<CityEntry, 'slug'>>}>
}

export type FlatCity = CityEntry & {countrySlug: string}
export type FlatDistrict = DistrictEntry & {countrySlug: string; citySlug: string}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function assertLocalized(value: unknown, where: string, field: string): Localized {
  if (!value || typeof value !== 'object') {
    throw new Error(`${where}: ${field} must be an object with all five locales`)
  }
  const record = value as Record<string, unknown>
  const missing = LOCALES.filter((l) => typeof record[l] !== 'string' || !record[l])
  if (missing.length) {
    // Italian is the one that silently goes missing — it was added as a locale
    // after the original seed and only `title.it` was ever backfilled, leaving
    // 26 documents falling back to English for an Italian reader.
    throw new Error(`${where}: ${field} is missing locale(s) ${missing.join(', ')}`)
  }
  return Object.fromEntries(LOCALES.map((l) => [l, String(record[l]).trim()])) as Localized
}

function assertSlug(slug: unknown, where: string): string {
  if (typeof slug !== 'string' || !SLUG_RE.test(slug)) {
    throw new Error(`${where}: "${String(slug)}" is not a valid slug (lowercase, digits, single hyphens)`)
  }
  return slug
}

/** Throws on the first structural problem, naming the path that caused it. */
export function parseRegistry(raw: unknown): ZoneRegistry {
  if (!raw || typeof raw !== 'object' || !('countries' in raw)) {
    throw new Error('zones.json: expected a top-level "countries" object')
  }
  const countries = (raw as {countries: unknown}).countries
  if (!countries || typeof countries !== 'object') {
    throw new Error('zones.json: "countries" must be an object keyed by country slug')
  }

  const seenDistrictSlugs = new Map<string, string>()

  for (const [countrySlug, country] of Object.entries(countries as Record<string, unknown>)) {
    assertSlug(countrySlug, 'zones.json')
    const cities = (country as {cities?: unknown})?.cities
    if (!cities || typeof cities !== 'object') {
      throw new Error(`${countrySlug}: expected a "cities" object`)
    }

    for (const [citySlug, city] of Object.entries(cities as Record<string, unknown>)) {
      const where = `${countrySlug}/${citySlug}`
      assertSlug(citySlug, 'zones.json')
      const c = city as Record<string, unknown>
      assertLocalized(c.title, where, 'title')
      if (c.vibe !== undefined) assertLocalized(c.vibe, where, 'vibe')

      const districts = c.districts
      if (!Array.isArray(districts)) throw new Error(`${where}: "districts" must be an array`)

      for (const district of districts) {
        const d = district as Record<string, unknown>
        const slug = assertSlug(d.slug, where)
        assertLocalized(d.title, `${where}/${slug}`, 'title')
        if (d.role !== undefined && d.role !== 'page' && d.role !== 'metric-only') {
          throw new Error(`${where}/${slug}: role must be "page" or "metric-only"`)
        }
        // District slugs are globally unique because the id convention
        // (`district-<slug>`) is global, not per-city.
        const previous = seenDistrictSlugs.get(slug)
        if (previous) throw new Error(`district slug "${slug}" is declared twice: ${previous} and ${where}`)
        seenDistrictSlugs.set(slug, where)
      }
    }
  }

  return raw as ZoneRegistry
}

export function flattenCities(registry: ZoneRegistry): FlatCity[] {
  return Object.entries(registry.countries).flatMap(([countrySlug, country]) =>
    Object.entries(country.cities).map(([slug, city]) => ({...city, slug, countrySlug})),
  )
}

export function flattenDistricts(registry: ZoneRegistry): FlatDistrict[] {
  return flattenCities(registry).flatMap((city) =>
    city.districts.map((d) => ({...d, countrySlug: city.countrySlug, citySlug: city.slug})),
  )
}

/** `page` unless the entry says otherwise. */
export function roleOf(district: DistrictEntry): ZoneRole {
  return district.role ?? 'page'
}

/**
 * Every zone named by the metrics seed must be declared here or already exist
 * in the dataset. Without this, an unknown slug is only caught at run time
 * against production, halfway through a seed.
 */
export function crossCheckMetricsZones(
  registry: ZoneRegistry,
  metricsZoneSlugs: string[],
  knownDatasetSlugs: string[] = [],
): string[] {
  const declared = new Set<string>([
    ...flattenDistricts(registry).map((d) => d.slug),
    ...flattenCities(registry).map((c) => c.slug),
    ...knownDatasetSlugs,
  ])
  return [...new Set(metricsZoneSlugs)].filter((slug) => !declared.has(slug)).sort()
}
