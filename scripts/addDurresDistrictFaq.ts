/**
 * Adds a six-locale `faqSection` to the Durrës district landing pages from
 * `scripts/data/durresDistrictFaq-2026-09-15.ts`.
 *
 * Why: none of the ten published Durrës district pages had an FAQ, while every
 * Tirana district does (addDistrictFaq.ts, 2026-09-03), and none of the pages
 * ranking for Durrës districts answers price, fit or risk questions at all.
 *
 * Differences from addDistrictFaq.ts, and why:
 * - All six locales are written from the source file. The Studio translate
 *   endpoint is not configured in this environment, so nothing would fill them.
 * - Writes the published document directly, like applySeoSprint1.ts, with a
 *   full backup and ifRevisionID; the Tirana pipeline's draft → translate →
 *   publish round trip has no translate step to wait for here.
 *
 * Kept from addDistrictFaq.ts:
 * - English answers must be 35–75 words; questions must end with "?" — checked
 *   before any write.
 * - A page that already has an faqSection is skipped, never overwritten.
 * - The block goes before the closing ctaSection; `_key`s are deterministic.
 *
 * Run:
 *   npx tsx scripts/addDurresDistrictFaq.ts
 *   npx tsx scripts/addDurresDistrictFaq.ts --execute
 */
import fs from 'node:fs'
import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'
import {DURRES_DISTRICT_FAQ, FAQ_SUBTITLE, type L6} from './data/durresDistrictFaq-2026-09-15'

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

const LOCALES = ['en', 'sq', 'ru', 'uk', 'it', 'pl'] as const

function words(text: string): number {
  return text.trim().split(/\s+/).length
}

function localized(type: 'localizedString' | 'localizedText', v: L6) {
  return {_type: type, ...Object.fromEntries(LOCALES.map((l) => [l, v[l]]))}
}

function validate(): string[] {
  const problems: string[] = []
  for (const [slug, faq] of Object.entries(DURRES_DISTRICT_FAQ)) {
    faq.items.forEach((item, i) => {
      for (const l of LOCALES) {
        if (!item.q[l]?.trim().endsWith('?')) problems.push(`${slug} #${i} ${l}: question must end with "?"`)
        if (!item.a[l]?.trim()) problems.push(`${slug} #${i} ${l}: empty answer`)
      }
      const n = words(item.a.en)
      if (n < 35 || n > 75) problems.push(`${slug} #${i}: English answer is ${n} words (35–75)`)
    })
  }
  return problems
}

type Landing = {_id: string; _rev: string; slug: string; pageSections?: Array<{_key: string; _type: string}>}

async function main(): Promise<void> {
  const problems = validate()
  if (problems.length > 0) {
    console.error(problems.join('\n'))
    process.exit(1)
  }

  const slugs = Object.keys(DURRES_DISTRICT_FAQ)
  const landings = await client.fetch<Landing[]>(
    `*[_type == "landingPage" && !(_id in path("drafts.**")) && linkedDistrict->slug.current in $slugs]{
      _id, _rev, "slug": linkedDistrict->slug.current, "pageSections": pageSections[]{_key, _type}
    }`,
    {slugs},
  )
  const drafts = await client.fetch<string[]>(`*[_id in $ids][]._id`, {ids: landings.map((l) => `drafts.${l._id}`)})
  if (drafts.length) throw new Error(`drafts exist for ${drafts.join(', ')} — publish or discard them first`)

  const plans: Array<{landing: Landing; section: Record<string, unknown>; ctaKey: string | null}> = []
  for (const slug of slugs) {
    const landing = landings.find((l) => l.slug === slug)
    if (!landing) {
      console.warn(`! no published landing for ${slug}`)
      continue
    }
    if (landing.pageSections?.some((s) => s._type === 'faqSection')) {
      console.log(`- ${landing._id}: already has an FAQ, skipped`)
      continue
    }
    const faq = DURRES_DISTRICT_FAQ[slug]
    const section = {
      _key: `faq-${slug}`,
      _type: 'faqSection',
      enabled: true,
      imageMode: 'withoutImage',
      title: localized('localizedString', faq.title),
      subtitle: localized('localizedText', FAQ_SUBTITLE),
      items: faq.items.map((item, i) => ({
        _key: `faq-${slug}-${i}`,
        _type: 'localizedFaqItem',
        question: localized('localizedString', item.q),
        answer: localized('localizedText', item.a),
      })),
    }
    const ctaKey = landing.pageSections?.find((s) => s._type === 'ctaSection')?._key ?? null
    plans.push({landing, section, ctaKey})
    console.log(`+ ${landing._id}: ${faq.items.length} questions, ${ctaKey ? 'before ctaSection' : 'appended'}`)
    for (const item of faq.items) console.log(`    ${item.q.en} (${words(item.a.en)} words)`)
  }

  console.log(`\n${plans.length} pages to update.`)
  if (!execute) {
    console.log('Dry run. Re-run with --execute to write.')
    return
  }
  if (plans.length === 0) return

  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupDir = path.resolve(process.cwd(), 'scripts/data/backups', `durresDistrictFaq-${stamp}`)
  fs.mkdirSync(backupDir, {recursive: true})
  const full = await client.fetch<Array<{_id: string}>>(`*[_id in $ids]`, {ids: plans.map((p) => p.landing._id)})
  for (const doc of full) fs.writeFileSync(path.join(backupDir, `${doc._id}.json`), JSON.stringify(doc, null, 2))

  const tx = client.transaction()
  for (const p of plans) {
    tx.patch(p.landing._id, (patch) => {
      const pinned = patch.ifRevisionId(p.landing._rev)
      return p.ctaKey
        ? pinned.insert('before', `pageSections[_key=="${p.ctaKey}"]`, [p.section])
        : pinned.setIfMissing({pageSections: []}).append('pageSections', [p.section])
    })
  }
  const res = await tx.commit()
  console.log(`Written in transaction ${res.transactionId}. Backups: ${backupDir}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
