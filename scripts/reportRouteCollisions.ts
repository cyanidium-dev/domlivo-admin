/**
 * Read-only route-collision audit — the backstop for writes that bypass
 * Studio validation (seed/migration scripts, raw API). Run before indexing
 * pushes; see domlivo-workspace docs/engineering/ROUTING.md.
 *
 * Reports:
 *  1. Unique Landings eclipsed by entity slugs (country/city/propertyType win at /<slug>)
 *  2. custom/unique landings sitting on reserved route slugs (redirected or dark)
 *  3. duplicate slugs within the unique-landing family
 * Exit code 1 when any collision is found (CI-friendly).
 * Usage: npm run report:route-collisions
 */
import {getCliClient} from 'sanity/cli'
import {isReservedRouteSlug} from '../schemaTypes/constants/reservedRouteSlugs'

const client = getCliClient({apiVersion: '2024-06-01'})

async function main() {
  const [landings, entities] = await Promise.all([
    client.fetch<Array<{_id: string; pageType?: string; slug?: string}>>(
      `*[_type == "landingPage" && pageType in ["custom", "unique"] && defined(slug.current)]{_id, pageType, "slug": slug.current}`,
    ),
    client.fetch<Array<{_type: string; slug?: string}>>(
      `*[_type in ["country", "city", "propertyType"] && defined(slug.current)]{_type, "slug": slug.current}`,
    ),
  ])

  const entityBySlug = new Map<string, string>()
  for (const e of entities) if (e.slug) entityBySlug.set(e.slug.toLowerCase(), e._type)

  let issues = 0

  console.log('— Unique Landings eclipsed by entity slugs —')
  for (const l of landings) {
    if (l.pageType !== 'unique' || !l.slug) continue
    const owner = entityBySlug.get(l.slug.toLowerCase())
    if (owner) {
      issues++
      console.log(`  ECLIPSED: landing ${l._id} slug="${l.slug}" loses /${l.slug} to ${owner}`)
    }
  }

  console.log('— Landings on reserved route slugs —')
  for (const l of landings) {
    if (!l.slug || l.slug === 'for-realtors') continue // sanctioned coupling
    if (isReservedRouteSlug(l.slug)) {
      issues++
      console.log(`  RESERVED: ${l.pageType} landing ${l._id} slug="${l.slug}" (redirected or dark)`)
    }
  }

  console.log('— Duplicate unique-landing slugs —')
  const seen = new Map<string, string>()
  for (const l of landings) {
    if (l.pageType !== 'unique' || !l.slug) continue
    const key = l.slug.toLowerCase()
    const prev = seen.get(key)
    if (prev && prev.replace(/^drafts\./, '') !== l._id.replace(/^drafts\./, '')) {
      issues++
      console.log(`  DUPLICATE: "${l.slug}" on ${prev} and ${l._id}`)
    }
    seen.set(key, l._id)
  }

  console.log(issues === 0 ? 'OK: no route collisions.' : `FOUND ${issues} collision(s).`)
  if (issues > 0) process.exit(1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
