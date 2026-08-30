/**
 * ТЗ-16 one-shot backfill: `topicTags` + `relatedPagesAutoSection` on the
 * city / district / comparison landings that existed before the generators
 * learned to emit them. Merge patches only — never replaces a document or
 * touches unrelated fields. Dry-run by default; `--execute` writes, after
 * snapshotting every to-be-patched document to C:\GitHub23\domlivo-backups.
 *
 * Idempotent: docs whose tags already match and that already carry a
 * `relatedPagesAutoSection` come back as no-ops on a re-run.
 *
 * Comparison docs: the generator's manual sibling block is replaced by the
 * auto section ONLY when it matches the generator fingerprint —
 * `landingCollectionSection` with `mode: 'manual'` whose every ref starts with
 * `landing-comparison-` — keeping the old block's `_key` and localized title.
 * Anything else is left alone and reported loudly.
 *
 * Run: npm run backfill:related-pages [-- --execute]
 * Spec: docs/engineering/SPEC-tz16-related-pages-2026-08-26.md §7
 */

import path from 'node:path'
import fs from 'node:fs'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'
import {
  insertSections,
  isGeneratorSiblingBlock,
  relatedSection,
  sameTags,
  type SectionLite,
} from './lib/relatedPagesBackfill'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const execute = process.argv.includes('--execute')

const client = createClient({
  projectId: (process.env.SANITY_PROJECT_ID || '').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: (process.env.SANITY_API_VERSION || '2024-01-01').trim(),
  token: process.env.SANITY_API_TOKEN?.trim(),
  useCdn: false,
})

const BACKUP_DIR = 'C:/GitHub23/domlivo-backups'

type LandingRow = {
  _id: string
  pageType: string
  topicTags?: string[]
  pageSections?: SectionLite[]
  citySlug?: string
  districtSlug?: string
  districtCitySlug?: string
}

// Pure helpers (sameTags / relatedSection / insertSections /
// isGeneratorSiblingBlock) live in scripts/lib/relatedPagesBackfill.ts so the
// fingerprint matcher is unit-tested (audit F-2).

async function main(): Promise<void> {
  const rows: LandingRow[] = await client.fetch(
    `*[_type == "landingPage" && !(_id in path("drafts.**")) &&
       (pageType in ["city", "district"] || _id match "landing-comparison-*")]{
      _id, pageType, topicTags,
      "citySlug": linkedCity->slug.current,
      "districtSlug": linkedDistrict->slug.current,
      "districtCitySlug": linkedDistrict->city->slug.current,
      pageSections
    }`,
  )

  const comparisonsFile = JSON.parse(
    fs.readFileSync(path.resolve(process.cwd(), 'scripts/data/comparisons.json'), 'utf8'),
  ) as {comparisons: Array<{slug: string; left: {slug: string}; right: {slug: string}}>}
  const comparisonZones = new Map(
    comparisonsFile.comparisons.map((c) => [`landing-comparison-${c.slug}`, [c.left.slug, c.right.slug] as const]),
  )

  const patches: Array<{id: string; ops: Record<string, unknown>; notes: string[]}> = []
  const leftAlone: string[] = []
  let tagPatches = 0
  let sectionAppends = 0
  let replacements = 0
  let noops = 0

  for (const row of rows) {
    const notes: string[] = []
    const ops: Record<string, unknown> = {}

    // 1. Desired tags (registry/Sanity slugs on both sides — see spec §3).
    let tags: string[] | null = null
    if (row.pageType === 'city' && row.citySlug) {
      tags = [`city:${row.citySlug}`, `zone:${row.citySlug}`]
    } else if (row.pageType === 'district' && row.districtSlug && row.districtCitySlug) {
      tags = [`city:${row.districtCitySlug}`, `zone:${row.districtSlug}`]
    } else if (comparisonZones.has(row._id)) {
      const [l, r] = comparisonZones.get(row._id)!
      tags = ['theme:market', 'theme:comparison', `zone:${l}`, `zone:${r}`]
    }
    if (!tags) {
      // F-5: make silent skips loud so a re-run on future data is trustworthy.
      if (row.pageType === 'city' || row.pageType === 'district') {
        console.warn(
          `!  ${row._id}: ${row.pageType} landing with an unresolvable linked slug chain — tags NOT set`,
        )
      } else {
        console.warn(`!  ${row._id}: comparison landing absent from comparisons.json — left untouched`)
      }
    }
    if (tags && !sameTags(row.topicTags, tags)) {
      ops.topicTags = tags
      tagPatches += 1
      notes.push(`tags → ${tags.join(', ')}`)
    }

    // 2/3. Sections. A doc already carrying the section is done.
    const sections = row.pageSections ?? []
    const hasRelated = sections.some((s) => s._type === 'relatedPagesAutoSection')
    if (!hasRelated) {
      if (row.pageType === 'city') {
        ops.pageSections = insertSections(sections, [relatedSection('related-districts', 'cityDistricts')])
        sectionAppends += 1
        notes.push('append cityDistricts')
      } else if (row.pageType === 'district') {
        ops.pageSections = insertSections(sections, [
          relatedSection('related-districts', 'cityDistricts'),
          relatedSection('related-comparisons', 'zoneComparisons'),
        ])
        sectionAppends += 1
        notes.push('append cityDistricts + zoneComparisons')
      } else if (comparisonZones.has(row._id)) {
        const collections = sections.filter((s) => s._type === 'landingCollectionSection')
        const foreign = collections.filter((s) => !isGeneratorSiblingBlock(s))
        for (const f of foreign) {
          leftAlone.push(
            `${row._id}: landingCollectionSection _key=${String(f._key)} does not match the generator fingerprint — LEFT ALONE (editor content?)`,
          )
        }
        const target = collections.find(isGeneratorSiblingBlock)
        if (target) {
          ops.pageSections = sections.map((s) =>
            s === target
              ? relatedSection(target._key ?? 'related', 'zoneComparisons', {
                  title: (target as {title?: unknown}).title,
                })
              : s,
          )
          replacements += 1
          notes.push('replace manual sibling block → zoneComparisons')
        } else if (foreign.length === 0) {
          ops.pageSections = insertSections(sections, [relatedSection('related', 'zoneComparisons')])
          sectionAppends += 1
          notes.push('append zoneComparisons (no manual block present)')
        }
      }
    }

    if (Object.keys(ops).length === 0) {
      noops += 1
      continue
    }
    patches.push({id: row._id, ops, notes})
  }

  for (const p of patches) console.log(`${execute ? 'patch      ' : 'would patch '}${p.id}: ${p.notes.join('; ')}`)
  for (const l of leftAlone) console.log(`!  ${l}`)
  console.log(
    `\n${patches.length} doc(s): ${tagPatches} tag update(s), ${sectionAppends} section append(s), ` +
      `${replacements} replacement(s); ${noops} no-op(s); ${leftAlone.length} left alone.`,
  )

  if (!execute) {
    console.log('Dry run. Re-run with --execute to write.')
    return
  }
  if (patches.length === 0) {
    console.log('Nothing to write.')
    return
  }

  fs.mkdirSync(BACKUP_DIR, {recursive: true})
  const snapshot = await client.fetch(`*[_id in $ids]`, {ids: patches.map((p) => p.id)})
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const backupPath = path.join(BACKUP_DIR, `tz16-backfill-${stamp}.json`)
  fs.writeFileSync(backupPath, JSON.stringify(snapshot, null, 1))
  console.log(`Snapshot of ${(snapshot as unknown[]).length} doc(s) → ${backupPath}`)

  for (const p of patches) {
    await client.patch(p.id).set(p.ops).commit()
    console.log(`  written ${p.id}`)
  }
  console.log('Done.')
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
