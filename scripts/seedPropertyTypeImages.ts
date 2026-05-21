/**
 * Migration: Upload local PNGs and set them as `image` on propertyType docs.
 *
 * Hardcoded map below pairs a filename (in --from dir) with a propertyType
 * slug. Every entry:
 *   - reads the file from disk
 *   - uploads it as a Sanity asset (image)
 *   - patches the propertyType doc:
 *       image.asset._ref = <uploaded asset id>
 *       image.alt        = "<English title>"
 *
 * This OVERWRITES any existing image on the target doc. That is the
 * intended behaviour: editor explicitly wants these PNGs in place.
 *
 * Run:
 *   npx tsx scripts/seedPropertyTypeImages.ts --dry-run
 *   npx tsx scripts/seedPropertyTypeImages.ts --execute
 *   npx tsx scripts/seedPropertyTypeImages.ts --execute --from="C:/some/dir"
 *
 * Requires: SANITY_API_TOKEN in .env
 */

import path from 'path'
import fs from 'fs'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const projectId = (process.env.SANITY_PROJECT_ID || 'g4aqp6ex').trim()
const dataset = (process.env.SANITY_DATASET || 'production').trim()
const token = process.env.SANITY_API_TOKEN?.trim()

const isDryRun = process.argv.includes('--dry-run')
const isExecute = process.argv.includes('--execute')
const fromArg = process.argv.find((a) => a.startsWith('--from='))
const DEFAULT_FROM = 'C:/Users/User/Pictures/Screenshots/domlivo'
const fromDir = (fromArg ? fromArg.slice('--from='.length) : DEFAULT_FROM).trim()

if (!isDryRun && !isExecute) {
  console.error('Use --dry-run to preview or --execute to apply patches.')
  process.exit(1)
}
if (!token) {
  console.error('Error: SANITY_API_TOKEN required in .env')
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  useCdn: false,
  token,
})

/** filename in --from dir → property-type slug */
const FILE_TO_SLUG: Record<string, string> = {
  'villa.png': 'villa',
  'apart.png': 'apartment',
  'commercial.png': 'commercial-space',
  'house.png': 'house',
  'shortterm.png': 'short-term-rent',
}

type PT = {_id: string; slug?: string; titleEn?: string}

async function main() {
  // 1) find target docs
  const docs = await client.fetch<PT[]>(
    `*[_type=="propertyType" && slug.current in $slugs]{
      _id,
      "slug": slug.current,
      "titleEn": title.en
    }`,
    {slugs: Object.values(FILE_TO_SLUG)},
  )
  const bySlug = new Map(docs.map((d) => [d.slug!, d]))

  console.log(`Source dir: ${fromDir}`)
  console.log(`Found ${docs.length} propertyType docs for the configured slugs.\n`)

  const plan: {file: string; abs: string; slug: string; doc: PT}[] = []
  const missingFiles: string[] = []
  const missingDocs: string[] = []

  for (const [file, slug] of Object.entries(FILE_TO_SLUG)) {
    const abs = path.resolve(fromDir, file)
    const doc = bySlug.get(slug)
    if (!fs.existsSync(abs)) {
      missingFiles.push(`${file}  (looked for ${abs})`)
      continue
    }
    if (!doc) {
      missingDocs.push(`${file} -> slug "${slug}"`)
      continue
    }
    plan.push({file, abs, slug, doc})
  }

  if (missingFiles.length) {
    console.log('Files missing on disk (skipping):')
    missingFiles.forEach((m) => console.log(`  ${m}`))
    console.log()
  }
  if (missingDocs.length) {
    console.log('propertyType docs not found (skipping):')
    missingDocs.forEach((m) => console.log(`  ${m}`))
    console.log()
  }
  if (plan.length === 0) {
    console.log('Nothing to apply.')
    return
  }

  console.log('Plan:')
  plan.forEach((p) => {
    console.log(`  ${p.file}  ->  ${p.doc._id}  (${p.doc.titleEn || p.slug})`)
  })

  if (isDryRun) {
    console.log('\nDry run. Re-run with --execute to upload and patch.')
    return
  }

  // 2) upload each, then patch doc
  for (const p of plan) {
    const buf = fs.readFileSync(p.abs)
    const asset = await client.assets.upload('image', buf, {
      filename: p.file,
      contentType: 'image/png',
    })
    await client
      .patch(p.doc._id)
      .set({
        image: {
          _type: 'image',
          asset: {_type: 'reference', _ref: asset._id},
          alt: p.doc.titleEn || p.slug,
        },
      })
      .commit()
    console.log(`  ✓ ${p.file}  ->  ${p.doc._id}  asset=${asset._id}`)
  }

  console.log(`\nUpdated ${plan.length} propertyType document(s).`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
