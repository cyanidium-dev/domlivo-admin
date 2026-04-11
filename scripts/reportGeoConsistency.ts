/**
 * Read-only geo consistency report (no mutations).
 * Run: npx tsx scripts/reportGeoConsistency.ts
 * Requires: SANITY_API_TOKEN in .env
 */

import {getSanityClientForScripts} from './lib/sanityEnvClient'

function header(title: string) {
  console.log('\n' + '='.repeat(72))
  console.log(title)
  console.log('='.repeat(72))
}

async function main() {
  const client = getSanityClientForScripts()

  header('A — Duplicate city slugs (slug.current shared by multiple city documents)')
  const cities = await client.fetch<
    {_id: string; slug: string | null; title?: {en?: string}}[]
  >(`*[_type == "city" && defined(slug.current)]{_id, "slug": slug.current, title}`)
  const bySlug = new Map<string, typeof cities>()
  for (const c of cities) {
    const s = c.slug || ''
    const list = bySlug.get(s) ?? []
    list.push(c)
    bySlug.set(s, list)
  }
  const dupSlugs = [...bySlug.entries()].filter(([, list]) => list.length > 1)
  if (dupSlugs.length === 0) {
    console.log('OK — no duplicate slugs.')
  } else {
    for (const [slug, list] of dupSlugs.sort((a, b) => a[0].localeCompare(b[0]))) {
      console.log(`\nSlug "${slug}" (${list.length} documents):`)
      for (const row of list) {
        const t = row.title?.en || row._id
        console.log(`  - ${_idShort(row._id)}  ${t}`)
      }
    }
  }

  header('B — property.country mismatch (legacy string ≠ city → country slug)')
  const withLegacy = await client.fetch<
    {
      _id: string
      country: string
      expected: string | null
      cityRef: string | null
    }[]
  >(
    `*[_type == "property" && defined(country)]{
      _id,
      country,
      "expected": city->country->slug.current,
      "cityRef": city._ref
    }`,
  )
  const realMismatches = withLegacy.filter((r) => String(r.expected ?? '').trim() !== String(r.country ?? '').trim())
  if (realMismatches.length === 0) {
    console.log('OK — no mismatches (or no properties with legacy country set).')
  } else {
    for (const r of realMismatches) {
      console.log(
        `  ${_idShort(r._id)}  property.country="${r.country}"  expected="${r.expected ?? 'null'}"  cityRef=${r.cityRef ?? 'null'}`,
      )
    }
    console.log(`\nTotal: ${realMismatches.length}`)
  }

  header('C — Multiple enabled city landings per linked city')
  const cityLandings = await client.fetch<{_id: string; cityRef: string | null}[]>(
    `*[_type == "landingPage" && pageType == "city" && enabled != false]{_id, "cityRef": linkedCity._ref}`,
  )
  const byCityRef = new Map<string, string[]>()
  for (const row of cityLandings) {
    if (!row.cityRef) continue
    const list = byCityRef.get(row.cityRef) ?? []
    list.push(row._id)
    byCityRef.set(row.cityRef, list)
  }
  const dups = [...byCityRef.entries()].filter(([, ids]) => ids.length > 1)
  if (dups.length === 0) {
    console.log('OK — at most one enabled city landing per linked city.')
  } else {
    for (const [ref, ids] of dups) {
      console.log(`\nCity ref ${ref}:`)
      for (const id of ids) console.log(`  - ${id}`)
    }
  }

  header('D — Cities missing country reference')
  const noCountry = await client.fetch<{_id: string; slug: string | null}[]>(
    `*[_type == "city" && !defined(country)]{_id, "slug": slug.current}`,
  )
  if (noCountry.length === 0) {
    console.log('OK — all cities have a country.')
  } else {
    for (const c of noCountry) {
      console.log(`  ${_idShort(c._id)}  slug=${c.slug ?? '?'}`)
    }
    console.log(`\nTotal: ${noCountry.length}`)
  }

  header('E — City landings with missing linkedCity (invalid for pageType city)')
  const missing = await client.fetch<{_id: string}[]>(
    `*[_type == "landingPage" && pageType == "city" && (!defined(linkedCity) || linkedCity == null)]{_id}`,
  )
  if (missing.length === 0) {
    console.log('OK — none.')
  } else {
    for (const m of missing) console.log(`  ${m._id}`)
  }

  header('F — Duplicate slug: city landings vs city docs (alignment hint)')
  if (dupSlugs.length === 0) {
    console.log('N/A — no duplicate slugs in section A.')
  } else {
    for (const [slug, cityRows] of dupSlugs) {
      const cityIds = cityRows.map((c) => c._id)
      const landings = await client.fetch<{_id: string; linkedRef: string | null}[]>(
        `*[_type == "landingPage" && pageType == "city" && linkedCity._ref in $cityIds]{_id, "linkedRef": linkedCity._ref}`,
        {cityIds},
      )
      console.log(`\nSlug "${slug}": ${cityRows.length} city docs, ${landings.length} city landing(s)`)
      for (const l of landings) {
        console.log(`  landing ${_idShort(l._id)} → linkedCity ${l.linkedRef}`)
      }
    }
  }

  console.log('\nDone. (read-only — no writes)\n')
}

function _idShort(id: string): string {
  return id.replace(/^drafts\./, '')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
