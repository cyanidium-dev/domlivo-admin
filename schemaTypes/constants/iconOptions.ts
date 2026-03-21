/**
 * Canonical icon keys for property amenities and property offers.
 * Single source of truth — frontend maps these to Iconify IDs (ph: prefix).
 *
 * Used in:
 * - propertyAmenity.iconKey
 * - propertyOffer.iconKey
 */

/** Allowed icon key values (use for validation and frontend mapping) */
export const PROPERTY_ICON_KEYS = [
  'elevator',
  'balcony',
  'parking',
  'snowflake',
  'car',
  'waves',
  'map-pin',
  'key',
  'smartphone',
  'layout',
  'sun',
  'shield',
  'wifi',
  'home',
  'building',
  'tree',
  'sofa',
  'cloud',
  'zap',
] as const

export type PropertyIconKey = (typeof PROPERTY_ICON_KEYS)[number]

/** Editor-friendly options for schema dropdown (title + value) */
export const PROPERTY_ICON_OPTIONS: readonly {title: string; value: PropertyIconKey}[] = [
  {title: 'Elevator', value: 'elevator'},
  {title: 'Balcony', value: 'balcony'},
  {title: 'Parking', value: 'parking'},
  {title: 'Air Conditioning', value: 'snowflake'},
  {title: 'Car', value: 'car'},
  {title: 'Sea View / Pool', value: 'waves'},
  {title: 'Location', value: 'map-pin'},
  {title: 'Move-in Ready', value: 'key'},
  {title: 'Smart Home', value: 'smartphone'},
  {title: 'Spacious Layout', value: 'layout'},
  {title: 'Natural Light', value: 'sun'},
  {title: 'Security', value: 'shield'},
  {title: 'WiFi', value: 'wifi'},
  {title: 'Home / Terrace', value: 'home'},
  {title: 'Building', value: 'building'},
  {title: 'Garden / Nature', value: 'tree'},
  {title: 'Furnished', value: 'sofa'},
  {title: 'Outdoor Spaces', value: 'cloud'},
  {title: 'Energy Efficiency', value: 'zap'},
]

/** Deterministic fallback icons when catalog match fails (used by migration scripts) */
export const PROPERTY_ICON_FALLBACK_POOL: readonly PropertyIconKey[] = [
  'home',
  'shield',
  'sun',
  'wifi',
  'building',
  'car',
  'tree',
  'key',
]
