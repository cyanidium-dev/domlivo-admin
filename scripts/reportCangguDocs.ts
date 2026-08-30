/**
 * Read-only report on the "canggu" city (Bali city currently sitting under
 * country "albania"): the city doc, its districts, and every document that
 * references any of them. No mutations — deletion is a separate reviewed step.
 * Run: npm run report:canggu  (or: npx tsx scripts/reportCangguDocs.ts)
 * Requires: SANITY_API_TOKEN in .env
 */

import {getSanityClientForScripts} from './lib/sanityEnvClient'

const CITY_SLUG = 'canggu'

function header(title: string) {
  console.log('\n' + '='.repeat(72))
  console.log(title)
  console.log('='.repeat(72))
}

type CityRow = {
  _id: string
  _type: string
  slug: string | null
  title?: {en?: string}
  countrySlug?: string | null
  countryId?: string | null
}

type DistrictRow = {
  _id: string
  _type: string
  slug: string | null
  title?: {en?: string}
  isPublished?: boolean
}

type RefRow = {
  _id: string
  _type: string
  slug?: string | null
  title?: unknown
  name?: string | null
}

function label(row: RefRow): string {
  const t = row.title as {en?: string} | string | undefined
  if (typeof t === 'string' && t) return t
  if (t && typeof t === 'object' && t.en) return t.en
  if (row.name) return row.name
  return ''
}

async function main() {
  const client = getSanityClientForScripts()

  header(`A — City documents with slug "${CITY_SLUG}" (drafts included)`)
  const cities = await client.fetch<CityRow[]>(
    `*[_type == "city" && slug.current == $slug]{
      _id,
      _type,
      "slug": slug.current,
      title,
      "countrySlug": country->slug.current,
      "countryId": country->_id
    }`,
    {slug: CITY_SLUG},
  )
  if (cities.length === 0) {
    console.log(`None — no city document with slug "${CITY_SLUG}".`)
  } else {
    for (const c of cities) {
      console.log(
        `  ${c._id}  title="${c.title?.en ?? '?'}"  slug=${c.slug}  country=${c.countrySlug ?? 'null'} (${c.countryId ?? 'no ref'})`,
      )
    }
  }
  const cityIds = cities.map((c) => c._id)

  header('B — Districts of these city documents (drafts included)')
  const districts =
    cityIds.length === 0
      ? []
      : await client.fetch<DistrictRow[]>(
          `*[_type == "district" && city._ref in $cityIds]{
            _id,
            _type,
            "slug": slug.current,
            title,
            isPublished
          }`,
          {cityIds},
        )
  if (districts.length === 0) {
    console.log('None.')
  } else {
    for (const d of districts) {
      console.log(
        `  ${d._id}  title="${d.title?.en ?? '?'}"  slug=${d.slug}  isPublished=${d.isPublished ?? 'undefined'}`,
      )
    }
  }

  header('C — All documents referencing the city or any of its districts')
  const targetIds = [...cityIds, ...districts.map((d) => d._id)]
  const referencing =
    targetIds.length === 0
      ? []
      : await client.fetch<RefRow[]>(
          `*[references($targetIds)]{
            _id,
            _type,
            "slug": slug.current,
            title,
            name
          } | order(_type asc, _id asc)`,
          {targetIds},
        )
  // Districts referencing their own city show up too — keep them visible but marked.
  const districtIdSet = new Set(districts.map((d) => d._id))
  if (referencing.length === 0) {
    console.log('None.')
  } else {
    const byType = new Map<string, RefRow[]>()
    for (const row of referencing) {
      const list = byType.get(row._type) ?? []
      list.push(row)
      byType.set(row._type, list)
    }
    for (const [type, rows] of [...byType.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
      console.log(`\n${type} (${rows.length}):`)
      for (const row of rows) {
        const marker = districtIdSet.has(row._id) ? '  [own district, listed in B]' : ''
        const extra = [row.slug ? `slug=${row.slug}` : '', label(row) ? `"${label(row)}"` : '']
          .filter(Boolean)
          .join('  ')
        console.log(`  - ${row._id}  ${extra}${marker}`)
      }
    }
    console.log(`\nTotal referencing documents: ${referencing.length}`)
  }

  console.log('\nDone. (read-only — no writes, no deletions)\n')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
