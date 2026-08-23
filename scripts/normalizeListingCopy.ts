/**
 * Normalizes `property.description` on published listings: strips seller
 * contacts and invisible padding, unwraps the source ad's hard line breaks,
 * drops the call to action the contacts left behind, and renames the district
 * retired on 2026-08-15. Wording, emoji headers, bullets and the in-copy price
 * line all survive.
 *
 * See docs/engineering/SPEC-normalize-listing-copy-2026-08-23.md.
 *
 * A draft sharing a published document's _id is patched too — otherwise
 * publishing it later puts the defect straight back. Standalone drafts (the
 * test-ai-* parse fixtures) are left alone.
 *
 * Run:
 * - npm run normalize:listing-copy                      (dry)
 * - npm run normalize:listing-copy -- --execute
 * - npm run normalize:listing-copy -- --slug <slug>
 * - npm run normalize:listing-copy -- --restore <file>
 */

import path from 'node:path'
import fs from 'node:fs'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'
import {normalizeDescription} from '../lib/listingCopy/normalize'
import {scrubContacts} from '../lib/listingCopy/scrubContacts'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const args = process.argv.slice(2)
const execute = args.includes('--execute')

function flag(name: string): string {
  const inline = args.find((a) => a.startsWith(`--${name}=`))
  if (inline) return inline.slice(name.length + 3)
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : ''
}

const onlySlug = flag('slug')
const restoreFile = flag('restore')

const LOCALES = ['en', 'sq', 'ru', 'uk', 'it'] as const

const client = createClient({
  projectId: (process.env.SANITY_PROJECT_ID || '').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: (process.env.SANITY_API_VERSION || '2024-01-01').trim(),
  token: process.env.SANITY_API_TOKEN?.trim(),
  useCdn: false,
})

type Row = {_id: string; slug?: {current?: string}; description?: Record<string, string>}
type Snapshot = {_id: string; description: Record<string, string>}

async function restore(file: string): Promise<void> {
  const snapshot: Snapshot[] = JSON.parse(fs.readFileSync(file, 'utf8'))
  let tx = client.transaction()
  for (const row of snapshot) tx = tx.patch(row._id, (p) => p.set({description: row.description}))
  await tx.commit()
  console.log(`restored ${snapshot.length} documents from ${file}`)
}

async function main(): Promise<void> {
  if (restoreFile) return restore(restoreFile)

  const rows: Row[] = await client.fetch(
    onlySlug
      ? `*[_type == "property" && !(_id in path("drafts.**")) && slug.current == $slug]{_id, slug, description} | order(_id)`
      : `*[_type == "property" && !(_id in path("drafts.**"))]{_id, slug, description} | order(_id)`,
    onlySlug ? {slug: onlySlug} : {},
  )
  const draftIds: string[] = await client.fetch(`*[_type == "property" && _id in path("drafts.**")]._id`)
  const shadowed = new Set(draftIds.map((id) => id.replace(/^drafts\./, '')))

  const snapshot: Snapshot[] = []
  const patches: Array<{id: string; description: Record<string, string>}> = []
  const blocked: Array<{slug: string; locale: string}> = []
  const reported: Array<{slug: string; locale: string; mentions: string[]}> = []
  let renamedTotal = 0

  for (const row of rows) {
    const slug = row.slug?.current ?? row._id
    const before = row.description ?? {}
    const after: Record<string, string> = {...before}
    let touched = false
    let residual = false

    for (const locale of LOCALES) {
      const text = before[locale]
      if (typeof text !== 'string' || text === '') continue
      const r = normalizeDescription(text, locale)
      if (r.skippedZoneMentions.length) reported.push({slug, locale, mentions: r.skippedZoneMentions})

      // Residual-contact gate. A phone split across two source lines would be
      // half-removed — worse in public copy than not touching it at all — so
      // that listing goes to a human instead of to the dataset.
      if (scrubContacts(r.text).removed) {
        blocked.push({slug, locale})
        residual = true
        continue
      }
      if (!r.changed) continue

      after[locale] = r.text
      renamedTotal += r.renamed
      touched = true
      console.log(`\n=== ${slug} · ${locale} ===`)
      console.log('--- before ---\n' + text)
      console.log('--- after ---\n' + r.text)
    }

    if (residual || !touched) continue
    snapshot.push({_id: row._id, description: before})
    patches.push({id: row._id, description: after})
    if (shadowed.has(row._id)) patches.push({id: `drafts.${row._id}`, description: after})
  }

  console.log(
    `\n${rows.length} published listings · ${snapshot.length} to change · ` +
      `${patches.length} documents to patch (published + shadowing drafts) · ` +
      `${renamedTotal} zone renames`,
  )
  for (const b of blocked) {
    console.log(`BLOCKED  ${b.slug} · ${b.locale} — a contact survived the pipeline, not written`)
  }
  for (const r of reported) {
    console.log(`REPORTED ${r.slug} · ${r.locale} — zone mention outside the pattern: ${r.mentions.join(', ')}`)
  }

  if (!execute) {
    console.log('\nDry run. Re-run with --execute to write.')
    return
  }
  if (!patches.length) {
    console.log('Nothing to write.')
    return
  }

  const dir = path.resolve(process.cwd(), 'scripts/data')
  fs.mkdirSync(dir, {recursive: true})
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const file = path.join(dir, `normalizeListingCopy-backup-${stamp}.json`)
  fs.writeFileSync(file, JSON.stringify(snapshot, null, 2), 'utf8')
  console.log(`\nsnapshot written to ${file}`)

  let tx = client.transaction()
  for (const p of patches) tx = tx.patch(p.id, (patch) => patch.set({description: p.description}))
  await tx.commit()
  console.log(`patched ${patches.length} documents`)
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
