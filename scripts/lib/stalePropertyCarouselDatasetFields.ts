/**
 * Legacy field names that may still exist on `propertyCarouselSection` objects in the dataset
 * from pre-unification development. They are not in the current schema and are not in GROQ fragments.
 */
export const STALE_PROPERTY_CAROUSEL_DATASET_FIELDS = [
  'allowedPropertyKinds',
  'cardFields',
  'detailsCtaLabel',
  'maxItems',
  'minItems',
  'rankingStrategy',
] as const
