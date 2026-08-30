/**
 * Create `imageCredit` documents from the provenance stored in asset
 * descriptions — see docs/engineering/SPEC-zone-generation-2026-08-16.md and
 * the imageCredit schema.
 *
 * The images sourced on 2026-08-16 recorded source, licence and author as free
 * text in the asset description because there was nowhere structured to put
 * them. This lifts that into documents the credits page can query, and reports
 * every asset in use that has no provenance at all — those are the ones that
 * need a decision rather than a migration.
 *
 * Run:
 * - npm run backfill:image-credits -- --dry
 * - npm run backfill:image-credits -- --execute
 */
import path from 'path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const projectId = (process.env.SANITY_PROJECT_ID || '').trim()
const dataset = (process.env.SANITY_DATASET || 'production').trim()
const token = process.env.SANITY_API_TOKEN?.trim()

const args = process.argv.slice(2)
const isDry = args.includes('--dry')
const isExecute = args.includes('--execute')
if (!token || !projectId) {
  console.error('Error: SANITY_PROJECT_ID and SANITY_API_TOKEN required.')
  process.exit(1)
}
if (!isDry && !isExecute) {
  console.error('Use --dry or --execute.')
  process.exit(1)
}

const client = createClient({projectId, dataset, apiVersion: '2024-01-01', useCdn: false, token})

/** Map a Commons/Openverse licence string onto the schema's enum. */
function normaliseLicence(raw: string): string | null {
  const s = raw.toLowerCase()
  if (s.includes('cc0')) return 'cc0'
  if (s.includes('pdm') || s.includes('public domain mark')) return 'pdm'
  if (s.includes('public domain') || s.startsWith('pd')) return 'pd'
  if (s.includes('by-sa') || s.includes('by sa')) return s.includes('3.0') ? 'cc-by-sa-3.0' : 'cc-by-sa-4.0'
  if (s.includes('cc by') || s.includes('cc-by')) return s.includes('3.0') ? 'cc-by-3.0' : 'cc-by-4.0'
  if (s.includes('unsplash') || s.includes('pexels')) return 'unsplash-pexels'
  return null
}

const LICENCE_URL: Record<string, string> = {
  cc0: 'https://creativecommons.org/publicdomain/zero/1.0/',
  pdm: 'https://creativecommons.org/publicdomain/mark/1.0/',
  'cc-by-4.0': 'https://creativecommons.org/licenses/by/4.0/',
  'cc-by-sa-4.0': 'https://creativecommons.org/licenses/by-sa/4.0/',
  'cc-by-3.0': 'https://creativecommons.org/licenses/by/3.0/',
  'cc-by-sa-3.0': 'https://creativecommons.org/licenses/by-sa/3.0/',
}

/** "Source: URL · Licence: X · Author: Y." plus an optional STAND-IN clause. */
function parseDescription(desc: string) {
  const source = desc.match(/Source:\s*(\S+)/)?.[1]?.replace(/[·.]$/, '')
  const licence = desc.match(/Licence:\s*([^·]+)/)?.[1]?.trim().replace(/[·.]$/, '')
  const author = desc.match(/Author:\s*([^·]+?)(?:\s*·|\s*STAND-IN|\.$|$)/)?.[1]?.trim()
  const standIn = /STAND-IN/i.test(desc)
  const standInNote = desc.match(/STAND-IN[^:]*:\s*([^.]+\.)/i)?.[1]?.trim()
  return {source, licence, author, standIn, standInNote}
}

/** A readable subject line from a filename when nothing better exists. */
function prettify(filename: string): string {
  return filename
    .replace(/\.[^.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\[\d+\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

async function main() {
  // Every asset actually referenced by a zone, with its recorded provenance.
  const usage: any[] = await client.fetch(`*[_type in ["district", "city"]]{
    _type, "slug": slug.current, isPublished,
    "assets": [heroImage.asset->{_id, originalFilename, description}] + gallery[].asset->{_id, originalFilename, description}
  }`)

  const byAsset = new Map<string, {id: string; filename: string; description: string; used: string[]}>()
  for (const row of usage) {
    for (const a of row.assets ?? []) {
      if (!a?._id) continue
      const entry = byAsset.get(a._id) ?? {
        id: a._id as string,
        filename: (a.originalFilename ?? a._id) as string,
        description: (a.description ?? '') as string,
        used: [] as string[],
      }
      entry.used.push(`${row._type}/${row.slug}${row.isPublished === false ? ' (unpublished)' : ''}`)
      byAsset.set(a._id, entry)
    }
  }

  const existing = new Set<string>(
    await client.fetch(`*[_type == "imageCredit" && defined(image.asset._ref)].image.asset._ref`),
  )

  const docs: Record<string, unknown>[] = []
  const noProvenance: {filename: string; used: string[]}[] = []
  let already = 0

  for (const asset of byAsset.values()) {
    if (existing.has(asset.id)) {
      already += 1
      continue
    }
    const parsed = parseDescription(asset.description)
    const licence = parsed.licence ? normaliseLicence(parsed.licence) : null
    if (!licence || !parsed.source) {
      noProvenance.push({filename: asset.filename, used: asset.used})
      continue
    }
    docs.push({
      _id: `imageCredit-${asset.id.replace(/^image-/, '').slice(0, 40)}`,
      _type: 'imageCredit',
      image: {_type: 'image', asset: {_type: 'reference', _ref: asset.id}},
      title: prettify(asset.filename),
      author: parsed.author || 'unknown',
      licence,
      ...(LICENCE_URL[licence] ? {licenceUrl: LICENCE_URL[licence]} : {}),
      sourceUrl: parsed.source,
      isStandIn: parsed.standIn,
      ...(parsed.standIn ? {standInNote: parsed.standInNote || 'Not a photo of the zone it illustrates.'} : {}),
    })
  }

  for (const d of docs) {
    console.log(`credit   ${String(d.title).slice(0, 52).padEnd(54)} ${d.licence}${d.isStandIn ? '  [stand-in]' : ''}`)
  }

  console.log(
    `\n${docs.length} credit(s) to create, ${already} already present, ` +
      `${noProvenance.length} asset(s) with NO recorded provenance.`,
  )
  if (noProvenance.length) {
    console.log('\nNo provenance — these need a decision, not a migration:')
    for (const n of noProvenance) {
      console.log(`  ${n.filename.slice(0, 62).padEnd(64)} used by: ${n.used.join(', ').slice(0, 70)}`)
    }
  }

  if (isDry || docs.length === 0) {
    if (isDry) console.log('\nDry run — nothing written.')
    return
  }
  const tx = docs.reduce((t, d) => t.createIfNotExists(d as never), client.transaction())
  await tx.commit()
  console.log(`\nCreated ${docs.length} image credits.`)
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
