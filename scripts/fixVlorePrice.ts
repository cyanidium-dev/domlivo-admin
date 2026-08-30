/**
 * One-shot. `prodazha-doma-vo-vlere` was published at €18,421 for a 109 m²
 * house — exactly 169 × 109. Its Russian source ad states no price at all and
 * its propertyCode (`DATO-CHDI9GS3`) marks it a legacy DatoCMS import, so both
 * the price field and the composed copy descend from a stored `169`.
 *
 * €169,000 is €1,550/m², inside the €875–2 500 band every other sale listing
 * occupies. This figure is INFERRED, not read from a source — see
 * docs/engineering/SPEC-jsonld-and-price-2026-08-23.md §A2.
 *
 * The copy replacement is anchored on `€169.` so the `109 m²` in the same
 * sentence is never touched.
 *
 * Run:
 * - npm run fix:vlore-price            (dry)
 * - npm run fix:vlore-price -- --execute
 */

import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const execute = process.argv.slice(2).includes('--execute')
const SLUG = 'prodazha-doma-vo-vlere'
const OLD_PRICE = 18421
const NEW_PRICE = 169000
const EXPECTED_COPY_FIELDS = 12

const client = createClient({
  projectId: (process.env.SANITY_PROJECT_ID || '').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: (process.env.SANITY_API_VERSION || '2024-01-01').trim(),
  token: process.env.SANITY_API_TOKEN?.trim(),
  useCdn: false,
})

function fixPrice(text: string): string {
  return text.replace(/€169\./g, '€169 000.')
}

async function main(): Promise<void> {
  const doc = await client.fetch(`*[_type=="property" && slug.current==$slug][0]`, {slug: SLUG})
  if (!doc) throw new Error(`${SLUG} not found`)
  if (doc.price !== OLD_PRICE) {
    console.log(`price is ${doc.price}, expected ${OLD_PRICE} — already fixed or changed. Nothing done.`)
    return
  }

  const patch: Record<string, unknown> = {price: NEW_PRICE}
  let fields = 0

  for (const field of ['description', 'shortDescription'] as const) {
    const map = doc[field] as Record<string, string> | undefined
    if (!map) continue
    const next: Record<string, string> = {...map}
    let touched = false
    for (const [locale, value] of Object.entries(map)) {
      if (locale.startsWith('_') || typeof value !== 'string') continue
      const fixed = fixPrice(value)
      if (fixed !== value) {
        next[locale] = fixed
        fields += 1
        touched = true
        console.log(`  ${field}.${locale}`)
      }
    }
    if (touched) patch[field] = next
  }

  const seo = doc.seo as Record<string, {title?: string; description?: string}> | undefined
  if (seo) {
    const nextSeo: Record<string, unknown> = {...seo}
    let touched = false
    for (const [locale, block] of Object.entries(seo)) {
      if (locale.startsWith('_') || !block || typeof block !== 'object') continue
      const description = block.description
      if (typeof description !== 'string') continue
      const fixed = fixPrice(description)
      if (fixed !== description) {
        nextSeo[locale] = {...block, description: fixed}
        fields += 1
        touched = true
        console.log(`  seo.${locale}.description`)
      }
    }
    if (touched) patch.seo = nextSeo
  }

  console.log(
    `\nprice ${OLD_PRICE} → ${NEW_PRICE} (€${Math.round(NEW_PRICE / doc.area)}/m²), ${fields} copy fields`,
  )
  if (fields !== EXPECTED_COPY_FIELDS) {
    throw new Error(
      `expected ${EXPECTED_COPY_FIELDS} copy fields to change, found ${fields}. The document has moved since the spec was written — re-read it before writing.`,
    )
  }

  if (!execute) {
    console.log('Dry run. Re-run with --execute to write.')
    return
  }
  await client.patch(doc._id).set(patch).commit()
  console.log('written')
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
