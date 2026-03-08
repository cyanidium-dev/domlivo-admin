import type {Template} from 'sanity'

/**
 * Initial value template for district created from city-scoped list.
 * Pre-fills the city reference so the editor does not need to select it.
 */
export const districtInCityTemplate: Template = {
  id: 'district-in-city',
  title: 'District in this city',
  schemaType: 'district',
  parameters: [{name: 'cityId', type: 'string', title: 'City ID'}],
  value: (paramsOrIntent: Record<string, unknown> = {}) => {
    // Sanity may pass params directly, or nested under parameters/templateParams
    const params =
      (paramsOrIntent?.parameters as Record<string, unknown>) ??
      (paramsOrIntent?.templateParams as Record<string, unknown>) ??
      paramsOrIntent
    const cityId = params?.cityId != null ? String(params.cityId) : ''
    if (!cityId) return {}
    return {
      city: {
        _type: 'reference' as const,
        _ref: cityId,
      },
    }
  },
}
