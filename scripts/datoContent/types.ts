/**
 * Rewritten content for the partner listings imported from DatoCMS.
 *
 * The source records are Telegram sales posts: emoji, line-noise, "write to me
 * in DMs", and in two cases the partner's own Telegram and WhatsApp handles.
 * None of that belongs on the site, so every description here is rewritten from
 * the source rather than copied — same facts, plain prose, no call to action.
 *
 * Rules followed while rewriting:
 * - No fact that is not in the source record. Where the source contradicts
 *   itself (certificate area vs total area), both numbers are kept and labelled.
 * - Residence-permit eligibility claims are dropped. Several posts assert a flat
 *   "qualifies for residence permit for 2/3 people"; that is a legal claim about
 *   Albanian residency tied to a specific buyer's circumstances, and publishing
 *   it as fact could mislead a buyer into a purchase. Flagged per object in
 *   `review` so the owner can decide with a lawyer.
 * - Partner contact details are removed; the site has its own contact flow.
 * - Albanian is written natively, with the locative after "në" (në Durrës,
 *   në Vlorë, në Sarandë, në Shëngjin). Marked pending native review.
 */

export type Li = {
  en: string
  ru: string
  uk: string
  sq: string
  it: string
  pl: string
}

export type Offer = {
  title: Li
  /** One of PROPERTY_ICON_OPTIONS in schemaTypes/constants/iconOptions.ts. */
  iconKey: string
}

export type PropertyContent = {
  /** DatoCMS record id, kept so a rerun can be traced back to the source. */
  datoId: string
  slug: string
  /** Sanity city slug. */
  city: string
  /** Sanity district slug, only where the source names a district we have. */
  district?: string
  /** Sanity propertyType slug. */
  type: string
  status: 'sale'
  price?: number
  area?: number
  bedrooms?: number
  bathrooms?: number
  title: Li
  shortDescription: Li
  description: Li
  /**
   * The most precise location the source supports. DatoCMS has no address
   * field at all, so this is district and landmark level — never an invented
   * street or number.
   */
  address: Li
  offers: Offer[]
  /** Anything the owner should look at before or after publishing. */
  review?: string
}
