/**
 * Shared vocabularies for the AI knowledge base (research folder
 * `knowledge-base/12-ai-database`). Kept in one place because the same lists
 * are used by the three knowledge document types, the import scripts and the
 * frontend retrieval layer — a value invented in one of them is a fact the
 * assistant can never find again.
 */

/** How much the value can be trusted. See 03-data-dictionary.md §5. */
export const KNOWLEDGE_CONFIDENCE = [
  {title: '🟢 HIGH — official source or 3+ independent sources', value: 'HIGH'},
  {title: '🟡 MEDIUM — established analytics / media / sample ≥ 30', value: 'MEDIUM'},
  {title: '🟠 LOW — small sample, single agency, indirect', value: 'LOW'},
  {title: '🧮 ESTIMATE — derived by a stored formula', value: 'ESTIMATE'},
  {title: '🔮 FORECAST — scenario for a future period', value: 'FORECAST'},
] as const

/** Source priority ladder, 1 = government, 9 = forum. See 01-methodology.md §3. */
export const KNOWLEDGE_SOURCE_TYPES = [
  {title: '1 · Official government', value: 'official_government'},
  {title: '2 · Official regulator / utility', value: 'official_utility'},
  {title: '3 · Official statistics', value: 'official_statistics'},
  {title: '4 · Research institution (IMF, WB, EBRD, EU)', value: 'research_institution'},
  {title: '5 · Market analytics (Deloitte, AirDNA, GPG)', value: 'market_analytics'},
  {title: '6 · Established media', value: 'established_media'},
  {title: '7 · Marketplace / listings portal', value: 'marketplace'},
  {title: '8 · Agency / developer', value: 'agency'},
  {title: '9 · Blog / forum / social', value: 'forum_social'},
  {title: '— · Derived by our own calculation', value: 'internal_calculation'},
] as const

export const SOURCE_TYPE_RANK: Record<string, number> = {
  official_government: 1,
  official_utility: 2,
  official_statistics: 3,
  research_institution: 4,
  market_analytics: 5,
  established_media: 6,
  marketplace: 7,
  agency: 8,
  forum_social: 9,
  internal_calculation: 9,
}

/**
 * What kind of number this is. The distinction that matters most in Albania:
 * asking prices are not transaction prices and advertised rents are not
 * achieved rents.
 */
export const KNOWLEDGE_DATA_KINDS = [
  {title: 'Tariff (regulated price)', value: 'tariff'},
  {title: 'Statistic', value: 'statistic'},
  {title: 'Asking price', value: 'asking_price'},
  {title: 'Transaction price', value: 'transaction_price'},
  {title: 'Reference price (state schedule)', value: 'reference_price'},
  {title: 'Advertised rent', value: 'advertised_rent'},
  {title: 'Achieved rent', value: 'achieved_rent'},
  {title: 'Model estimate (analytics platform)', value: 'model_estimate'},
  {title: 'Forecast', value: 'forecast'},
  {title: 'Specification (datasheet)', value: 'spec'},
  {title: 'Fee', value: 'fee'},
  {title: 'Tax rate', value: 'tax_rate'},
  {title: 'Survey', value: 'survey'},
] as const

/** Taxonomy slugs. See 03-data-dictionary.md §4. */
export const KNOWLEDGE_CATEGORIES = [
  'real_estate',
  'property_prices',
  'rental_prices',
  'short_term_rental',
  'long_term_rental',
  'airbnb',
  'booking',
  'occupancy',
  'tourism',
  'utilities',
  'electricity',
  'water',
  'internet',
  'gas',
  'heating',
  'air_conditioning',
  'appliances',
  'maintenance',
  'building_fees',
  'elevator',
  'cleaning',
  'repairs',
  'renovation',
  'furniture',
  'taxes',
  'legal',
  'purchase_costs',
  'property_management',
  'investment',
  'roi',
  'market_analysis',
  'districts',
  'forecast',
  'macro',
  'climate',
  'insurance',
  'banking',
].map((value) => ({title: value.replace(/_/g, ' '), value}))

/** Seasons a figure can describe. Coastal cities need month-level rows. */
export const KNOWLEDGE_SEASONS = [
  'annual',
  'winter',
  'summer',
  'shoulder',
  'peak',
  'low',
  'jan',
  'feb',
  'mar',
  'apr',
  'may',
  'jun',
  'jul',
  'aug',
  'sep',
  'oct',
  'nov',
  'dec',
].map((value) => ({title: value, value}))

export const KNOWLEDGE_PROPERTY_TYPES = [
  'any',
  'studio',
  '1+1',
  '2+1',
  '3+1',
  '4+1',
  'penthouse',
  'villa',
  'house',
  'land',
  'commercial',
].map((value) => ({title: value, value}))

export const KNOWLEDGE_BUILDING_CLASSES = [
  {title: 'Any', value: 'any'},
  {title: 'New build', value: 'new_build'},
  {title: 'Resale', value: 'resale'},
  {title: 'Under construction', value: 'under_construction'},
] as const

/** ID shapes, enforced on input so citations never break. */
export const DATA_ID_PATTERN = /^DATA-[A-Z0-9]+(-[A-Z0-9]+)*$/
export const SOURCE_ID_PATTERN = /^[A-Z][A-Z0-9]*(-[A-Z0-9]+){0,3}-\d{3}$/
export const DOCUMENT_ID_PATTERN = /^[A-Z][A-Z0-9]*(-[A-Z0-9]+)*$/

/** Re-verification cadence by category, in days. Used by the freshness cron. */
export const KNOWLEDGE_REVIEW_DAYS: Record<string, number> = {
  electricity: 180,
  water: 180,
  internet: 180,
  gas: 180,
  taxes: 180,
  legal: 180,
  building_fees: 180,
}
export const KNOWLEDGE_REVIEW_DAYS_DEFAULT = 365
