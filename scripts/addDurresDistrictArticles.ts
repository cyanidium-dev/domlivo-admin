/**
 * Adds a "read before you buy" articles block to the four largest Durrës
 * district landings, linking the research posts of 2026-09-16 that concern
 * each district. Until now the district pages linked comparisons and sibling
 * districts but no article, so the posts on Golem's sewage or the 2019
 * earthquake had no link from the very pages whose buyers need them.
 *
 * The block goes before the FAQ. A landing that already has an articlesSection
 * is skipped. Posts that do not exist yet are left out rather than linked.
 *
 * Run:
 *   npx tsx scripts/addDurresDistrictArticles.ts
 *   npx tsx scripts/addDurresDistrictArticles.ts --execute
 */
import fs from 'node:fs'
import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})
const execute = process.argv.includes('--execute')
const client = createClient({
  projectId: (process.env.SANITY_PROJECT_ID || '').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN?.trim(),
  useCdn: false,
})

const POSTS: Record<string, string[]> = {
  'landing-district-golem-durres': ['golem-sewage-buying-2026', 'durres-old-apartment-earthquake-check', 'durres-reference-prices-2026'],
  'landing-district-plazh': ['durres-old-apartment-earthquake-check', 'durres-marina-eagle-hills-2026', 'durres-reference-prices-2026'],
  'landing-district-shkembi-durres': ['durres-old-apartment-earthquake-check', 'golem-sewage-buying-2026', 'durres-reference-prices-2026'],
  'landing-district-city-center-durres': ['durres-reference-prices-2026', 'tirana-durres-train-property-prices', 'durres-marina-eagle-hills-2026'],
}

const TITLE = {
  _type: 'localizedString',
  en: 'Read before you buy',
  uk: 'Прочитайте перед покупкою',
  ru: 'Прочитайте перед покупкой',
  sq: 'Lexoni para se të blini',
  it: 'Da leggere prima di comprare',
  pl: 'Przeczytaj przed zakupem',
}
const CTA_LABEL = {
  en: 'View all articles',
  uk: 'Усі статті',
  ru: 'Все статьи',
  sq: 'Shiko të gjithë artikujt',
  it: 'Tutti gli articoli',
  pl: 'Zobacz wszystkie artykuły',
}

async function main(): Promise<void> {
  const ids = Object.keys(POSTS)
  const drafts = await client.fetch<string[]>(`*[_id in $ids]._id`, {ids: ids.map((i) => `drafts.${i}`)})
  if (drafts.length) throw new Error(`drafts exist: ${drafts.join(', ')}`)
  const docs = await client.fetch<Array<{_id: string; _rev: string; pageSections: Array<{_key: string; _type: string}>}>>(
    `*[_id in $ids]{_id, _rev, "pageSections": pageSections[]{_key, _type}}`,
    {ids},
  )
  const wanted = [...new Set(Object.values(POSTS).flat())].map((s) => `blogPost-${s}`)
  const existing = new Set(await client.fetch<string[]>(`*[_id in $ids]._id`, {ids: wanted}))

  const plans: Array<{doc: (typeof docs)[number]; section: Record<string, unknown>; faqKey?: string}> = []
  for (const doc of docs) {
    if (doc.pageSections.some((s) => s._type === 'articlesSection')) {
      console.log(`- ${doc._id}: already has an articles block`)
      continue
    }
    const refs = POSTS[doc._id].map((s) => `blogPost-${s}`).filter((id) => existing.has(id))
    if (refs.length === 0) continue
    plans.push({
      doc,
      faqKey: doc.pageSections.find((s) => s._type === 'faqSection')?._key,
      section: {
        _key: 'articles-before-you-buy',
        _type: 'articlesSection',
        enabled: true,
        mode: 'selected',
        title: TITLE,
        cta: {href: '/blog', label: CTA_LABEL},
        posts: refs.map((ref) => ({_type: 'reference', _key: `post-${ref}`, _ref: ref})),
      },
    })
    console.log(`+ ${doc._id}: ${refs.join(', ')}`)
  }
  if (!execute) {
    console.log(`\nDry run: ${plans.length} landings.`)
    return
  }
  if (!plans.length) return
  const dir = path.resolve(process.cwd(), 'scripts/data/backups', `durresDistrictArticles-${Date.now()}`)
  fs.mkdirSync(dir, {recursive: true})
  for (const d of await client.fetch<Array<{_id: string}>>(`*[_id in $ids]`, {ids: plans.map((p) => p.doc._id)})) {
    fs.writeFileSync(path.join(dir, `${d._id}.json`), JSON.stringify(d, null, 2))
  }
  const tx = client.transaction()
  for (const p of plans) {
    tx.patch(p.doc._id, (patch) =>
      p.faqKey
        ? patch.ifRevisionId(p.doc._rev).insert('before', `pageSections[_key=="${p.faqKey}"]`, [p.section])
        : patch.ifRevisionId(p.doc._rev).append('pageSections', [p.section]),
    )
  }
  console.log(`Written in transaction ${(await tx.commit()).transactionId}.`)
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
