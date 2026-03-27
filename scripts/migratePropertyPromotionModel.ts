/**
 * Migrate property documents from legacy promotion fields to the final model:
 * - featured, featuredTier, sale -> promoted, promotionType, featuredOrder?, discountPercent?
 * - Unsets legacy fields after mapping.
 * - Patches siteSettings with promotion caps if missing (defaults: 6 each).
 *
 * Run:
 *   npx tsx scripts/migratePropertyPromotionModel.ts --dry-run
 *   npx tsx scripts/migratePropertyPromotionModel.ts --execute
 *
 * Requires: SANITY_API_TOKEN in .env
 */

import path from 'path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const projectId = (process.env.SANITY_PROJECT_ID || 'g4aqp6ex').trim()
const dataset = (process.env.SANITY_DATASET || 'production').trim()
const token = process.env.SANITY_API_TOKEN?.trim()
const dryRun = process.argv.includes('--dry-run')
const isExecute = process.argv.includes('--execute')

if (!token) {
  console.error('Error: SANITY_API_TOKEN required')
  process.exit(1)
}

if (!dryRun && !isExecute) {
  console.error('Use --dry-run to preview or --execute to write.')
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  useCdn: false,
  token,
})

type LegacyProperty = {
  _id: string
  featured?: boolean
  featuredTier?: string
  sale?: {isOnSale?: boolean; discountPercent?: number}
  investment?: boolean
  promoted?: boolean
}

type MapCategory =
  | 'premium'
  | 'top'
  | 'sale'
  | 'legacy_featured'
  | 'cleanup_only'
  | 'skipped'

function mapLegacy(doc: LegacyProperty): {
  set: Record<string, unknown>
  unset: string[]
  category: MapCategory
} {
  const tier = doc.featuredTier
  const featured = doc.featured === true
  const sale = doc.sale
  const saleOn = sale?.isOnSale === true

  let promoted = false
  let promotionType: 'premium' | 'top' | 'sale' | undefined
  let discountPercent: number | undefined
  let category: MapCategory = 'cleanup_only'

  if (tier === 'premium') {
    promoted = true
    promotionType = 'premium'
    category = 'premium'
  } else if (tier === 'top') {
    promoted = true
    promotionType = 'top'
    category = 'top'
  } else if (saleOn) {
    promoted = true
    promotionType = 'sale'
    if (typeof sale?.discountPercent === 'number' && !Number.isNaN(sale.discountPercent)) {
      discountPercent = sale.discountPercent
    } else {
      discountPercent = 10
    }
    category = 'sale'
  } else if (
    featured &&
    tier !== 'premium' &&
    tier !== 'top' &&
    !saleOn
  ) {
    promoted = true
    promotionType = 'top'
    category = 'legacy_featured'
  } else {
    promoted = false
    category = 'cleanup_only'
  }

  const unset: string[] = ['featured', 'featuredTier', 'sale']
  if (!promoted) {
    unset.push('promotionType', 'featuredOrder', 'discountPercent')
  }

  const set: Record<string, unknown> = {
    promoted,
  }

  if (promoted && promotionType) {
    set.promotionType = promotionType
    if (promotionType === 'sale') {
      set.discountPercent = discountPercent ?? 10
    }
  }

  return {set, unset, category}
}

async function main() {
  const docs = await client.fetch<LegacyProperty[]>(
    `*[_type == "property"]{_id, featured, featuredTier, sale, investment, promoted}`,
  )

  const stats = {
    scanned: docs.length,
    premium: 0,
    top: 0,
    sale: 0,
    legacy_featured: 0,
    cleanup_only: 0,
    skipped: 0,
    siteSettingsPatched: false,
  }

  const tx = client.transaction()

  for (const doc of docs) {
    const hasLegacy =
      doc.featured !== undefined ||
      doc.featuredTier !== undefined ||
      doc.sale !== undefined

    if (!hasLegacy) {
      stats.skipped++
      continue
    }

    const {set, unset, category} = mapLegacy(doc)

    if (category === 'premium') stats.premium++
    else if (category === 'top') stats.top++
    else if (category === 'sale') stats.sale++
    else if (category === 'legacy_featured') stats.legacy_featured++
    else if (category === 'cleanup_only') stats.cleanup_only++

    if (dryRun) {
      console.log(`  ${doc._id} -> ${category}`, JSON.stringify({set, unset}))
      continue
    }

    tx.patch(doc._id, (p) => p.set(set).unset(unset))
  }

  const ssRows = await client.fetch<
    {
      _id: string
      maxPremiumPromotions?: number
      maxTopPromotions?: number
      maxSalePromotions?: number
    }[]
  >(
    `*[_type == "siteSettings"]{_id, maxPremiumPromotions, maxTopPromotions, maxSalePromotions}`,
  )

  const ss =
    ssRows.find((r) => !r._id.startsWith('drafts.')) ?? ssRows[0] ?? null

  const needsCaps =
    ss &&
    (ss.maxPremiumPromotions == null ||
      ss.maxTopPromotions == null ||
      ss.maxSalePromotions == null)

  if (ss && needsCaps && !dryRun) {
    const capPatch: Record<string, number> = {}
    if (ss.maxPremiumPromotions == null) capPatch.maxPremiumPromotions = 6
    if (ss.maxTopPromotions == null) capPatch.maxTopPromotions = 6
    if (ss.maxSalePromotions == null) capPatch.maxSalePromotions = 6
    if (Object.keys(capPatch).length > 0) {
      tx.patch(ss._id, (p) => p.set(capPatch))
      stats.siteSettingsPatched = true
    }
  } else if (ss && needsCaps && dryRun) {
    console.log(
      `  siteSettings ${ss._id} -> would set missing caps to 6 (merge)`,
    )
    stats.siteSettingsPatched = true
  }

  if (dryRun) {
    console.log('\n--- Summary (dry run) ---')
    console.log(`Total scanned: ${stats.scanned}`)
    console.log(`Premium mapped: ${stats.premium}`)
    console.log(`Top mapped: ${stats.top}`)
    console.log(`Sale mapped: ${stats.sale}`)
    console.log(`Legacy featured -> top: ${stats.legacy_featured}`)
    console.log(`Cleanup only (unpromoted): ${stats.cleanup_only}`)
    console.log(`Skipped (no legacy fields): ${stats.skipped}`)
    console.log('\nRun with --execute to apply patches.')
    return
  }

  await tx.commit()

  console.log('--- Migration complete ---')
  console.log(`Total scanned: ${stats.scanned}`)
  console.log(`Premium mapped: ${stats.premium}`)
  console.log(`Top mapped: ${stats.top}`)
  console.log(`Sale mapped: ${stats.sale}`)
  console.log(`Legacy featured -> top: ${stats.legacy_featured}`)
  console.log(`Cleanup only: ${stats.cleanup_only}`)
  console.log(`Skipped: ${stats.skipped}`)
  if (stats.siteSettingsPatched) {
    console.log('Site settings: caps merged where missing.')
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
