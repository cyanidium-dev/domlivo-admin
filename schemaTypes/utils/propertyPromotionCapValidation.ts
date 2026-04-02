import type {SanityClient, ValidationContext} from 'sanity'

const DEFAULT_CAP = 6

const LABEL: Record<'premium' | 'top' | 'sale', string> = {
  premium: 'Premium',
  top: 'Top',
  sale: 'Sale',
}

type PromotionType = 'premium' | 'top' | 'sale'
type CappedPromotionType = 'premium' | 'top'

type PromotionCheckDoc = {
  _id?: string
  promoted?: boolean
  promotionType?: string
  agent?: {_ref?: string}
} | null

type SiteSettingsRow = {
  _id: string
  propertySettings?: {
    promotionDefaults?: {
      maxPremiumPromotions?: number
      maxTopPromotions?: number
    }
  }
}

type AgentRow = {
  _id: string
  name?: string
  maxPremiumPromotionsOverride?: number
  maxTopPromotionsOverride?: number
}

export type PromotionCapSource = 'agentOverride' | 'globalDefault' | 'hardcodedFallback'

export type PromotionCapCheckResult =
  | {ok: true}
  | {
      ok: false
      label: string
      cap: number
      currentCount: number
      agentName: string
      message: string
      autoUnpromoteMessage: string
    }

export type PromotionSlotsInfo =
  | {ok: false; message: string}
  | {
      ok: true
      promotionType: 'premium' | 'top'
      agentName: string
      cap: number
      used: number
      remaining: number
      capSource: PromotionCapSource
      capSourceLabel: string
      message: string
    }

export type AgentPromotionUsageInfo =
  | {ok: false; message: string}
  | {
      ok: true
      agentName: string
      premium: {
        used: number
        cap: number
        capSource: PromotionCapSource
        capSourceLabel: string
      }
      top: {
        used: number
        cap: number
        capSource: PromotionCapSource
        capSourceLabel: string
      }
    }

function isPromotionType(value: unknown): value is PromotionType {
  return value === 'premium' || value === 'top' || value === 'sale'
}

function isCappedPromotionType(value: unknown): value is CappedPromotionType {
  return value === 'premium' || value === 'top'
}

function baseId(id: string): string {
  return id.replace(/^drafts\./, '')
}

function asFinitePositiveInt(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  if (!Number.isInteger(value) || value < 1) return null
  return value
}

function pickSettings(rows: SiteSettingsRow[]): SiteSettingsRow | null {
  return (
    rows.find((r) => r._id.startsWith('drafts.')) ??
    rows.find((r) => !r._id.startsWith('drafts.')) ??
    rows[0] ??
    null
  )
}

function capFieldForType(pt: CappedPromotionType): 'maxPremiumPromotions' | 'maxTopPromotions' {
  return pt === 'premium' ? 'maxPremiumPromotions' : 'maxTopPromotions'
}

function overrideFieldForType(
  pt: CappedPromotionType,
): 'maxPremiumPromotionsOverride' | 'maxTopPromotionsOverride' {
  return pt === 'premium' ? 'maxPremiumPromotionsOverride' : 'maxTopPromotionsOverride'
}

async function resolveCap(
  client: SanityClient,
  pt: CappedPromotionType,
  agentRef: string,
): Promise<{cap: number; agentName: string; capSource: PromotionCapSource}> {
  const [settingsRows, agentRows] = await Promise.all([
    client.fetch<SiteSettingsRow[]>(
      `*[_type == "siteSettings"]{
        _id,
        propertySettings{
          promotionDefaults{
            maxPremiumPromotions,
            maxTopPromotions
          }
        }
      }`,
    ),
    client.fetch<AgentRow[]>(
      `*[_type == "agent" && _id in [$agentId, "drafts." + $agentId]]{
        _id,
        name,
        maxPremiumPromotionsOverride,
        maxTopPromotionsOverride
      }`,
      {agentId: agentRef},
    ),
  ])

  const settings = pickSettings(settingsRows)
  const agent =
    agentRows.find((r) => r._id.startsWith('drafts.')) ??
    agentRows.find((r) => !r._id.startsWith('drafts.')) ??
    null

  const overrideValue = asFinitePositiveInt(agent?.[overrideFieldForType(pt)])
  const globalValue = asFinitePositiveInt(
    settings?.propertySettings?.promotionDefaults?.[capFieldForType(pt)],
  )
  // Cap resolution order: agent override -> siteSettings.propertySettings defaults -> hardcoded fallback.
  const cap = overrideValue ?? globalValue ?? DEFAULT_CAP
  const agentName = agent?.name?.trim() || 'this agent'

  const capSource: PromotionCapSource = overrideValue
    ? 'agentOverride'
    : globalValue
      ? 'globalDefault'
      : 'hardcodedFallback'

  return {cap, agentName, capSource}
}

async function countCompetingLivePromotions(
  client: SanityClient,
  pt: CappedPromotionType,
  agentRef: string,
): Promise<Set<string>> {
  // Count only effectively published/public properties:
  // - exclude draft docs via draft-path `_id` logic (do not rely on `isPublished`)
  // - treat undefined `lifecycleStatus` as active (intentional fallback for visibility)
  const rows = await client.fetch<Array<{_id: string}>>(
    `*[
      _type == "property" &&
      promoted == true &&
      promotionType == $ptype &&
      agent._ref == $agentRef &&
      !(_id in path("drafts.**")) &&
      (lifecycleStatus == "active" || !defined(lifecycleStatus))
    ]{_id}`,
    {ptype: pt, agentRef},
  )
  return new Set(rows.map((r) => baseId(r._id)))
}

export async function checkPromotionCapForDocument(
  client: SanityClient,
  doc: PromotionCheckDoc,
): Promise<PromotionCapCheckResult> {
  if (!doc?.promoted || !isPromotionType(doc.promotionType)) return {ok: true}
  if (doc.promotionType === 'sale') return {ok: true}
  if (!isCappedPromotionType(doc.promotionType)) return {ok: true}

  const id = doc._id
  if (!id) return {ok: true}

  const agentRef = doc.agent?._ref
  if (!agentRef) {
    return {
      ok: false,
      label: LABEL[doc.promotionType],
      cap: 0,
      currentCount: 0,
      agentName: 'this agent',
      message: `Select an agent before setting ${LABEL[doc.promotionType]} promotion.`,
      autoUnpromoteMessage: `This property was unpromoted because ${LABEL[doc.promotionType]} promotions require an assigned agent.`,
    }
  }

  const {cap, agentName} = await resolveCap(client, doc.promotionType, agentRef)
  const competingBaseIds = await countCompetingLivePromotions(client, doc.promotionType, agentRef)
  competingBaseIds.delete(baseId(id))
  const currentCount = competingBaseIds.size
  const label = LABEL[doc.promotionType]

  if (currentCount + 1 <= cap) return {ok: true}

  return {
    ok: false,
    label,
    cap,
    currentCount,
    agentName,
    message: `Agent "${agentName}" already has ${currentCount} ${label.toLowerCase()} promotions (limit: ${cap}). Unpromote another ${label.toLowerCase()} property, increase this agent's override, or raise the global default in Site Settings.`,
    autoUnpromoteMessage: `This property was unpromoted because agent "${agentName}" already has ${currentCount} ${label.toLowerCase()} promotions and the limit is ${cap}.`,
  }
}

export async function getPromotionSlotsInfoForDocument(
  client: SanityClient,
  doc: PromotionCheckDoc,
): Promise<PromotionSlotsInfo> {
  if (!doc?.promoted || !isPromotionType(doc.promotionType)) {
    return {ok: false, message: 'Enable "Promoted" to see promotion slot availability.'}
  }

  if (doc.promotionType === 'sale') {
    return {ok: false, message: 'Sale promotions are unlimited.'}
  }

  // Only premium/top are capped.
  if (!isCappedPromotionType(doc.promotionType)) {
    return {ok: false, message: 'Promotion slot availability is unavailable for this promotion type.'}
  }

  const agentRef = doc.agent?._ref
  if (!agentRef) {
    return {ok: false, message: 'Select an agent to see promotion slot availability.'}
  }

  const id = doc._id
  const {cap, agentName, capSource} = await resolveCap(client, doc.promotionType, agentRef)
  const competingBaseIds = await countCompetingLivePromotions(client, doc.promotionType, agentRef)
  if (id) competingBaseIds.delete(baseId(id))

  // Used = competitors (excluding current doc) + 1 slot for this property (since it is promoted).
  const used = competingBaseIds.size + 1
  const remaining = Math.max(0, cap - used)
  const label = LABEL[doc.promotionType]

  const capSourceLabel =
    capSource === 'agentOverride'
      ? `Agent override (${agentName})`
      : capSource === 'globalDefault'
        ? 'Global default (Site Settings)'
        : 'Hardcoded fallback'

  const message =
    used >= cap
      ? `No ${label} slots remain for agent "${agentName}" (limit: ${cap}).`
      : `${label} slots: ${used}/${cap} used, ${remaining} remaining for agent "${agentName}". ${capSourceLabel}`

  return {
    ok: true,
    promotionType: doc.promotionType,
    agentName,
    cap,
    used,
    remaining,
    capSource,
    capSourceLabel,
    message,
  }
}

export async function getAgentPromotionUsageInfoForAgentId(
  client: SanityClient,
  agentRef: string,
): Promise<AgentPromotionUsageInfo> {
  if (!agentRef) return {ok: false, message: 'No agent selected.'}

  const [premium, top] = await Promise.all([
    resolveCap(client, 'premium', agentRef),
    resolveCap(client, 'top', agentRef),
  ])

  const [premiumUsed, topUsed] = await Promise.all([
    countCompetingLivePromotions(client, 'premium', agentRef),
    countCompetingLivePromotions(client, 'top', agentRef),
  ])

  const premiumCapSourceLabel =
    premium.capSource === 'agentOverride'
      ? `Agent override (${premium.agentName})`
      : premium.capSource === 'globalDefault'
        ? 'Global default (Site Settings)'
        : 'Hardcoded fallback'

  const topCapSourceLabel =
    top.capSource === 'agentOverride'
      ? `Agent override (${top.agentName})`
      : top.capSource === 'globalDefault'
        ? 'Global default (Site Settings)'
        : 'Hardcoded fallback'

  // Used = count of effectively live/public promoted properties for this agent+type.
  return {
    ok: true,
    agentName: premium.agentName,
    premium: {
      used: premiumUsed.size,
      cap: premium.cap,
      capSource: premium.capSource,
      capSourceLabel: premiumCapSourceLabel,
    },
    top: {
      used: topUsed.size,
      cap: top.cap,
      capSource: top.capSource,
      capSourceLabel: topCapSourceLabel,
    },
  }
}

/**
 * Document-level validation for property promotions.
 * - Premium/Top: capped by agent override -> site settings -> hardcoded fallback.
 * - Sale: uncapped.
 * - Counts only effectively live/public properties (published + active lifecycle).
 */
export async function validatePropertyPromotionCaps(
  context: ValidationContext,
): Promise<string | true> {
  const doc = context.document as PromotionCheckDoc
  if (!doc?.promoted || !isPromotionType(doc.promotionType)) return true
  if (doc.promotionType === 'sale') return true
  if (!doc.agent?._ref) {
    return `Select an agent before setting ${LABEL[doc.promotionType]} promotion.`
  }
  if (typeof context.getClient !== 'function') return true

  const client = context.getClient({apiVersion: '2024-01-01'})
  const result = await checkPromotionCapForDocument(client, doc)
  return result.ok ? true : result.message
}
