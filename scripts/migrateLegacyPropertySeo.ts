/**
 * Converts `property.seo` from the legacy per-locale shape into the schema's.
 *
 * The field is declared `localizedSeo`:
 *   {metaTitle: {en, sq, …}, metaDescription: {…}, ogTitle, ogDescription, …}
 *
 * The DatoCMS import wrote the transpose instead:
 *   {en: {title, description}, ru: {…}, …}
 *
 * Nothing reads that. `buildPropertyMetadata` looks for `seo.metaTitle` and
 * `seo.metaDescription`, finds neither, and falls through to the property's own
 * title and description — which is why the live meta description has always
 * come from `description.<locale>`. Studio renders the declared fields, which
 * are empty, so an editor cannot see or fix it either.
 *
 * `migratePropertySeoToLocalized.ts` does NOT cover this: it converts a
 * different legacy shape (flat `metaTitle` strings into `metaTitle.en`).
 *
 * Rules:
 * - `<locale>.title`       → `metaTitle.<locale>`
 * - `<locale>.description` → `metaDescription.<locale>`
 * - a document already carrying schema keys is SKIPPED, never merged blindly
 * - empty strings are dropped rather than written
 * - a document whose legacy block yields nothing is unset instead of migrated
 *
 * Every document is snapshotted before the write.
 *
 * Run:
 * - npm run migrate:legacy-property-seo            (dry)
 * - npm run migrate:legacy-property-seo -- --execute
 */

import path from 'node:path'
import fs from 'node:fs'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const execute = process.argv.slice(2).includes('--execute')

const LOCALES = ['en', 'sq', 'ru', 'uk', 'it'] as const
const SCHEMA_KEYS = ['metaTitle', 'metaDescription', 'keywords', 'ogTitle', 'ogDescription', 'ogImage', 'noIndex']

const client = createClient({
  projectId: (process.env.SANITY_PROJECT_ID || '').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: (process.env.SANITY_API_VERSION || '2024-01-01').trim(),
  token: process.env.SANITY_API_TOKEN?.trim(),
  useCdn: false,
})

type LegacyBlock = {title?: string; description?: string}

export function convert(seo: Record<string, unknown>): {
  metaTitle: Record<string, string>
  metaDescription: Record<string, string>
} {
  const metaTitle: Record<string, string> = {}
  const metaDescription: Record<string, string> = {}
  for (const locale of LOCALES) {
    const block = seo[locale] as LegacyBlock | undefined
    if (!block || typeof block !== 'object') continue
    const title = typeof block.title === 'string' ? block.title.trim() : ''
    const description = typeof block.description === 'string' ? block.description.trim() : ''
    if (title) metaTitle[locale] = title
    if (description) metaDescription[locale] = description
  }
  return {metaTitle, metaDescription}
}

async function main(): Promise<void> {
  const rows = await client.fetch(
    `*[_type=="property" && defined(seo)]{_id, "s":slug.current, seo} | order(_id)`,
  )

  const patches: Array<{_id: string; s: string; set?: Record<string, unknown>; unset?: boolean}> = []
  const snapshot: Array<{_id: string; seo: unknown}> = []
  const skipped: string[] = []

  for (const row of rows) {
    const seo = (row.seo ?? {}) as Record<string, unknown>
    const keys = Object.keys(seo).filter((k) => !k.startsWith('_'))
    const legacy = keys.filter((k) => (LOCALES as readonly string[]).includes(k))
    const schema = keys.filter((k) => SCHEMA_KEYS.includes(k))
    if (legacy.length === 0) continue
    if (schema.length > 0) {
      // Both shapes present. Merging blind could overwrite a value an editor
      // typed, so this is a human's call, not a script's.
      skipped.push(`${row.s} (carries ${schema.join(',')} as well)`)
      continue
    }

    const {metaTitle, metaDescription} = convert(seo)
    snapshot.push({_id: row._id, seo: row.seo})
    if (Object.keys(metaTitle).length === 0 && Object.keys(metaDescription).length === 0) {
      // Nothing survives the conversion — the block held only empty strings.
      patches.push({_id: row._id, s: row.s, unset: true})
      continue
    }
    patches.push({
      _id: row._id,
      s: row.s,
      set: {
        seo: {
          _type: 'localizedSeo',
          ...(Object.keys(metaTitle).length
            ? {metaTitle: {_type: 'localizedString', ...metaTitle}}
            : {}),
          ...(Object.keys(metaDescription).length
            ? {metaDescription: {_type: 'localizedText', ...metaDescription}}
            : {}),
        },
      },
    })
  }

  for (const p of patches) {
    const t = p.set
      ? Object.keys((p.set.seo as Record<string, unknown>).metaTitle ?? {}).filter((k) => !k.startsWith('_')).length
      : 0
    const d = p.set
      ? Object.keys((p.set.seo as Record<string, unknown>).metaDescription ?? {}).filter((k) => !k.startsWith('_')).length
      : 0
    console.log(`  ${p.unset ? 'UNSET ' : 'MIGRATE'} ${p.s}  metaTitle:${t} metaDescription:${d}`)
  }
  for (const s of skipped) console.log(`  SKIP    ${s}`)
  console.log(`\n${patches.length} document(s) to migrate, ${skipped.length} skipped`)

  if (!execute) {
    console.log('Dry run. Re-run with --execute to write.')
    return
  }
  if (patches.length === 0) return

  const dir = path.resolve(process.cwd(), 'scripts/data')
  fs.mkdirSync(dir, {recursive: true})
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const file = path.join(dir, `legacyPropertySeo-backup-${stamp}.json`)
  fs.writeFileSync(file, JSON.stringify(snapshot, null, 2), 'utf8')
  console.log(`snapshot written to ${file}`)

  let tx = client.transaction()
  for (const p of patches) {
    tx = p.unset
      ? tx.patch(p._id, (patch) => patch.unset(['seo']))
      : tx.patch(p._id, (patch) => patch.set(p.set as Record<string, unknown>))
  }
  await tx.commit()
  console.log(`patched ${patches.length} document(s)`)
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
