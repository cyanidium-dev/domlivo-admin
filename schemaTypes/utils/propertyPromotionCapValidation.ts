import type {ValidationContext} from 'sanity'

const DEFAULT_CAP = 6

const LABEL: Record<string, string> = {
  premium: 'Premium',
  top: 'Top',
  sale: 'Sale',
}

/**
 * Document-level validation: enforces siteSettings caps per promotion type.
 * Uses draft site settings when present (so editors see cap changes before publish), else published.
 * Deduplicates property draft/published pairs by normalizing _id with and without `drafts.` prefix.
 */
export async function validatePropertyPromotionCaps(
  context: ValidationContext,
): Promise<string | true> {
  const doc = context.document as {
    _id?: string
    promoted?: boolean
    promotionType?: string
  } | null

  if (!doc?.promoted || !doc.promotionType) return true

  const id = doc._id
  if (!id) return true

  if (typeof context.getClient !== 'function') return true

  const client = context.getClient({apiVersion: '2024-01-01'})

  const settingsRows = await client.fetch<
    {
      _id: string
      maxPremiumPromotions?: number
      maxTopPromotions?: number
      maxSalePromotions?: number
    }[]
  >(`*[_type == "siteSettings"]{_id, maxPremiumPromotions, maxTopPromotions, maxSalePromotions}`)

  // Prefer draft site settings when present so cap checks match unsaved Studio edits.
  const settings =
    settingsRows.find((r) => r._id.startsWith('drafts.')) ??
    settingsRows.find((r) => !r._id.startsWith('drafts.')) ??
    settingsRows[0] ??
    null

  const pt = doc.promotionType
  if (pt !== 'premium' && pt !== 'top' && pt !== 'sale') return true

  const capRaw =
    pt === 'premium'
      ? settings?.maxPremiumPromotions
      : pt === 'top'
        ? settings?.maxTopPromotions
        : settings?.maxSalePromotions

  const cap =
    typeof capRaw === 'number' && Number.isFinite(capRaw)
      ? capRaw
      : DEFAULT_CAP

  const rows = await client.fetch<Array<{_id: string}>>(
    `*[_type == "property" && promoted == true && promotionType == $ptype]{_id}`,
    {ptype: pt},
  )

  const bases = new Set(rows.map((r) => r._id.replace(/^drafts\./, '')))
  const curBase = id.replace(/^drafts\./, '')
  bases.delete(curBase)
  const othersCount = bases.size

  if (othersCount + 1 > cap) {
    const label = LABEL[pt] ?? pt
    return `${label} promotion cap reached (${cap}). Disable another ${label} property or raise the cap in Site Settings.`
  }

  return true
}
