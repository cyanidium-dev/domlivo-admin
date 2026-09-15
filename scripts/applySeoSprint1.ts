/**
 * Domlivo CMS — SEO sprint of 2026-09-15.
 *
 * Applies the copy in `scripts/data/seoSprint1-2026-09-15.ts` plus two data
 * fixes derived from the live dataset:
 *
 * 1. Titles and H1s on the city prices pages, /cities, two blog posts, the 15
 *    comparison guides (it, and uk/ru where Search Console shows demand), the
 *    city listings (ru/uk locative, pl "Saranda") and one district page.
 * 2. The home city carousel links the city listings instead of the prices pages.
 * 3. Seeded catalogue intros that still offered rentals ("…for sale and rent.")
 *    get a sale-only sentence. Only exact seed matches are replaced.
 * 4. `heroCta.href` / `allPropertiesCta.href` still set to the retired
 *    `/properties` get the place's listing: the district listing when it is
 *    indexable (> 20 listings), else the city listing, else `/sale`.
 *
 * Safety:
 * - Dry run unless `--execute`. The dry run prints every before → after.
 * - Values already equal to the target are skipped, so a second run writes nothing.
 * - Before writing, the full published document is saved under
 *   `scripts/data/backups/seoSprint1-<stamp>/<id>.json`.
 * - Each document is patched with `ifRevisionID`, so an edit made in Studio
 *   between the read and the write fails the transaction instead of being
 *   overwritten.
 * - Published documents are patched directly (there are no drafts of any
 *   target document; the script refuses to run if one appears).
 *
 * Run:
 *   npx tsx scripts/applySeoSprint1.ts
 *   npx tsx scripts/applySeoSprint1.ts --execute
 */
import fs from 'node:fs'
import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'
import {
  BLOG_EDITS,
  GUIDE_TITLES,
  ROOT_INTRO,
  SALE_INTRO,
  SEEDED_INTRO,
  STATIC_EDITS,
  guideTitleEdit,
  type DocEdit,
  type Locale,
} from './data/seoSprint1-2026-09-15'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const execute = process.argv.includes('--execute')
const token = process.env.SANITY_API_TOKEN?.trim()
if (!token) {
  console.error('SANITY_API_TOKEN required in .env')
  process.exit(1)
}

const client = createClient({
  projectId: (process.env.SANITY_PROJECT_ID || 'g4aqp6ex').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: (process.env.SANITY_API_VERSION || '2024-01-01').trim(),
  token,
  useCdn: false,
})

const LOCALES: Locale[] = ['en', 'sq', 'ru', 'uk', 'it', 'pl']
const DISTRICT_LISTING_INDEX_MIN = 21 // LISTING_DISTRICT_NOINDEX_THRESHOLD (20) + 1, frontend listingIndexPolicy.ts
const PUBLIC_PROPERTY = `isPublished == true && (lifecycleStatus == "active" || !defined(lifecycleStatus)) && status in ["sale"]`

type Change = {path: string; value: string}
type Planned = {id: string; why: string; changes: Change[]}

/** Read `a.b[_key=="x"].c` out of a document. */
function readPath(doc: unknown, p: string): unknown {
  const tokens = p.match(/[^.[\]]+|\[_key=="[^"]+"\]/g) ?? []
  let cur: unknown = doc
  for (const t of tokens) {
    if (cur == null) return undefined
    const keyMatch = /^\[_key=="([^"]+)"\]$/.exec(t)
    if (keyMatch) {
      cur = Array.isArray(cur) ? cur.find((x) => (x as {_key?: string})?._key === keyMatch[1]) : undefined
    } else {
      cur = (cur as Record<string, unknown>)[t]
    }
  }
  return cur
}

function flatten(edit: DocEdit): Change[] {
  const out: Change[] = []
  for (const [p, perLocale] of Object.entries(edit.localized ?? {})) {
    for (const l of LOCALES) {
      const v = perLocale[l]
      if (typeof v === 'string') out.push({path: `${p}.${l}`, value: v})
    }
  }
  for (const [p, v] of Object.entries(edit.plain ?? {})) out.push({path: p, value: v})
  return out
}

async function idsBySlug(type: string, slugs: string[], extra = ''): Promise<Map<string, string>> {
  const rows = await client.fetch<Array<{_id: string; slug: string}>>(
    `*[_type == $type && slug.current in $slugs ${extra} && !(_id in path("drafts.**"))]{_id, "slug": slug.current}`,
    {type, slugs},
  )
  return new Map(rows.map((r) => [r.slug, r._id]))
}

async function introEdits(): Promise<DocEdit[]> {
  const docs = await client.fetch<
    Array<{
      _id: string
      pageScope?: string
      intro?: Record<string, unknown>
      cityTitle?: Record<string, string>
      districtTitle?: Record<string, string>
    }>
  >(`*[_type == "catalogSeoPage" && !(_id in path("drafts.**"))]{
    _id, pageScope, intro, "cityTitle": city->title, "districtTitle": district->title
  }`)
  const edits: DocEdit[] = []
  for (const d of docs) {
    const perLocale: Partial<Record<Locale, string>> = {}
    for (const l of LOCALES) {
      const current = d.intro?.[l]
      if (typeof current !== 'string') continue
      if (d._id === 'catalogSeoPage-propertiesRoot') {
        if (current === ROOT_INTRO.seeded[l]) perLocale[l] = ROOT_INTRO.sale[l]
        continue
      }
      const m = SEEDED_INTRO[l].exec(current)
      if (!m) continue
      const city = d.cityTitle?.[l] || d.cityTitle?.en
      const district = d.districtTitle?.[l] || d.districtTitle?.en
      const place = d.pageScope === 'district' ? (district && city ? `${district}, ${city}` : m[1]) : city || m[1]
      perLocale[l] = SALE_INTRO[l](place)
    }
    if (Object.keys(perLocale).length > 0) {
      edits.push({id: d._id, why: 'seeded intro offered rentals', localized: {intro: perLocale}})
    }
  }
  return edits
}

async function propertiesHrefEdits(): Promise<DocEdit[]> {
  const rows = await client.fetch<
    Array<{
      _id: string
      _type: 'city' | 'district'
      slug: string
      citySlug?: string
      countrySlug?: string
      heroHref?: string
      allHref?: string
      ownCount: number
      cityCount: number
    }>
  >(`*[(_type == "district" || _type == "city") && !(_id in path("drafts.**")) &&
      (heroCta.href == "/properties" || allPropertiesCta.href == "/properties")]{
    _id, _type,
    "slug": slug.current,
    "citySlug": select(_type == "district" => city->slug.current, slug.current),
    "countrySlug": select(_type == "district" => city->country->slug.current, country->slug.current),
    "heroHref": heroCta.href,
    "allHref": allPropertiesCta.href,
    "ownCount": select(
      _type == "district" => count(*[_type == "property" && district._ref == ^._id && ${PUBLIC_PROPERTY}]),
      count(*[_type == "property" && city._ref == ^._id && ${PUBLIC_PROPERTY}])
    ),
    "cityCount": select(
      _type == "district" => count(*[_type == "property" && city._ref == ^.city._ref && ${PUBLIC_PROPERTY}]),
      count(*[_type == "property" && city._ref == ^._id && ${PUBLIC_PROPERTY}])
    )
  }`)
  return rows.map((r) => {
    const country = r.countrySlug || 'albania'
    let target = '/sale'
    if (r._type === 'district' && r.ownCount >= DISTRICT_LISTING_INDEX_MIN) {
      target = `/${country}/${r.citySlug}/${r.slug}`
    } else if (r.cityCount > 0) {
      target = `/${country}/${r.citySlug}`
    }
    const plain: Record<string, string> = {}
    if (r.heroHref === '/properties') plain['heroCta.href'] = target
    if (r.allHref === '/properties') plain['allPropertiesCta.href'] = target
    return {id: r._id, why: `retired /properties link (${r._type}, ${r.ownCount} listings)`, plain}
  })
}

async function buildEdits(): Promise<DocEdit[]> {
  const blogIds = await idsBySlug('blogPost', BLOG_EDITS.map((b) => b.slug))
  const guideIds = await idsBySlug('landingPage', Object.keys(GUIDE_TITLES), '&& pageType == "custom"')
  const edits: DocEdit[] = [...STATIC_EDITS]
  for (const b of BLOG_EDITS) {
    const id = blogIds.get(b.slug)
    if (!id) throw new Error(`blog post not found: ${b.slug}`)
    edits.push({id, why: b.why, localized: b.localized})
  }
  for (const [slug, titles] of Object.entries(GUIDE_TITLES)) {
    const id = guideIds.get(slug)
    if (!id) throw new Error(`guide not found: ${slug}`)
    edits.push({id, why: 'comparison guide: title in the form the query takes', localized: guideTitleEdit(titles)})
  }
  edits.push(...(await introEdits()))
  edits.push(...(await propertiesHrefEdits()))
  return edits
}

async function main(): Promise<void> {
  const edits = await buildEdits()
  const ids = [...new Set(edits.map((e) => e.id))]

  const drafts = await client.fetch<string[]>(`*[_id in $ids][]._id`, {ids: ids.map((id) => `drafts.${id}`)})
  if (drafts.length > 0) {
    throw new Error(`drafts exist for ${drafts.join(', ')} — publish or discard them first`)
  }
  const docs = await client.fetch<Array<Record<string, unknown> & {_id: string; _rev: string}>>(`*[_id in $ids]`, {ids})
  const byId = new Map(docs.map((d) => [d._id, d]))

  const planned: Planned[] = []
  let skipped = 0
  for (const edit of edits) {
    const doc = byId.get(edit.id)
    if (!doc) {
      console.warn(`! missing document ${edit.id} — skipped`)
      continue
    }
    const changes = flatten(edit).filter((c) => {
      const same = readPath(doc, c.path) === c.value
      if (same) skipped++
      return !same
    })
    if (changes.length > 0) {
      const existing = planned.find((p) => p.id === edit.id)
      if (existing) existing.changes.push(...changes)
      else planned.push({id: edit.id, why: edit.why, changes})
    }
  }

  for (const p of planned) {
    console.log(`\n# ${p.id} — ${p.why}`)
    for (const c of p.changes) {
      const before = readPath(byId.get(p.id), c.path)
      const long = c.path.includes('Title') && c.value.length > 65 ? `  (!) ${c.value.length} chars` : ''
      console.log(`  ${c.path}\n    - ${JSON.stringify(before)}\n    + ${JSON.stringify(c.value)}${long}`)
    }
  }
  const total = planned.reduce((n, p) => n + p.changes.length, 0)
  console.log(`\n${planned.length} documents, ${total} values to write, ${skipped} already current.`)

  if (!execute) {
    console.log('Dry run. Re-run with --execute to write.')
    return
  }
  if (planned.length === 0) return

  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupDir = path.resolve(process.cwd(), 'scripts/data/backups', `seoSprint1-${stamp}`)
  fs.mkdirSync(backupDir, {recursive: true})
  for (const p of planned) {
    fs.writeFileSync(path.join(backupDir, `${p.id}.json`), JSON.stringify(byId.get(p.id), null, 2))
  }

  const tx = client.transaction()
  for (const p of planned) {
    const set = Object.fromEntries(p.changes.map((c) => [c.path, c.value]))
    tx.patch(p.id, (patch) => patch.ifRevisionId(byId.get(p.id)!._rev).set(set))
  }
  const result = await tx.commit()
  console.log(`Written in transaction ${result.transactionId}. Backups: ${backupDir}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
