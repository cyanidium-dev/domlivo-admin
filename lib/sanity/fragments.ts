/**
 * Reusable GROQ fragments for query composition.
 *
 * Localized fields stay raw; frontend resolves via getLocalizedValue().
 * Do NOT resolve locale inside GROQ.
 */

import {groq} from 'next-sanity'

/** Re-export groq for query composition alongside fragments */
export {groq}

// -----------------------------------------------------------------------------
// COMMON — basic localized field patterns (return raw objects)
// -----------------------------------------------------------------------------

/** Select raw localized title (localizedString) */
export const LOCALIZED_TITLE_FRAGMENT = `title`

/** Select raw localized text (localizedText) */
export const LOCALIZED_TEXT_FRAGMENT = `description`

/** Select raw localized slug (localizedSlug) */
export const LOCALIZED_SLUG_FRAGMENT = `slug`

// -----------------------------------------------------------------------------
// MEDIA — image projection for urlFor()
// -----------------------------------------------------------------------------

/** Image fields for urlFor(): asset, crop, hotspot, alt */
export const IMAGE_FRAGMENT = `asset,
  crop,
  hotspot,
  alt`

/** Gallery array projection using image shape */
export const GALLERY_FRAGMENT = `[]{
  asset,
  crop,
  hotspot,
  alt
}`

// -----------------------------------------------------------------------------
// SEO
// -----------------------------------------------------------------------------

/** Localized SEO object: meta, og, noIndex. Text fields raw. */
export const LOCALIZED_SEO_FRAGMENT = `metaTitle,
  metaDescription,
  ogTitle,
  ogDescription,
  ogImage,
  noIndex`

// -----------------------------------------------------------------------------
// CTA / LINKS
// -----------------------------------------------------------------------------

/** Localized CTA link: href, label per locale */
export const LOCALIZED_CTA_LINK_FRAGMENT = `href,
  label`

/** Localized footer link: href, label per locale */
export const LOCALIZED_FOOTER_LINK_FRAGMENT = `href,
  label`

/** Social link: platform, url */
export const SOCIAL_LINK_FRAGMENT = `platform,
  url`

// -----------------------------------------------------------------------------
// CITY / DISTRICT
// -----------------------------------------------------------------------------

/** City card: list / card view */
export const CITY_CARD_FRAGMENT = `_id,
  title,
  slug,
  heroImage,
  popular,
  order`

/** District card: list / card view */
export const DISTRICT_CARD_FRAGMENT = `_id,
  title,
  slug,
  heroImage,
  "city": city->{
    _id,
    title,
    slug
  }`

/** City ref (minimal) */
export const CITY_REF_FRAGMENT = `_id,
  title,
  slug`

/** District ref (minimal) */
export const DISTRICT_REF_FRAGMENT = `_id,
  title,
  slug`

// -----------------------------------------------------------------------------
// PROPERTY
// -----------------------------------------------------------------------------

/** Property type: full selection */
export const PROPERTY_TYPE_FRAGMENT = `_id,
  title,
  "slug": slug.current,
  shortDescription,
  image,
  order,
  active`

/** Property type ref (minimal) */
export const PROPERTY_TYPE_REF_FRAGMENT = `_id,
  title,
  "slug": slug.current`

/** Property type ref (for detail page) */
export const PROPERTY_TYPE_FULL_REF_FRAGMENT = `_id,
  title,
  "slug": slug.current,
  shortDescription,
  image`

/** Location tag: full selection */
export const LOCATION_TAG_FRAGMENT = `_id,
  title,
  description,
  active`

/** Location tag ref */
export const LOCATION_TAG_REF_FRAGMENT = `_id,
  title,
  description`

/** Amenity: for filters and display */
export const AMENITY_FRAGMENT = `_id,
  title,
  order,
  active`

/** Property card: catalog / list */
export const PROPERTY_CARD_FRAGMENT = `_id,
  title,
  slug,
  price,
  currency,
  featured,
  investment,
  status,
  lifecycleStatus,
  "city": city->{
    _id,
    title,
    slug
  },
  "district": district->{
    _id,
    title,
    slug
  },
  "type": type->{
    _id,
    title,
    "slug": slug.current
  },
  "gallery": gallery[0],
  bedrooms,
  bathrooms,
  area`

/** Property full: detail page */
export const PROPERTY_FULL_FRAGMENT = `_id,
  title,
  slug,
  shortDescription,
  description,
  price,
  currency,
  status,
  lifecycleStatus,
  featured,
  investment,
  "city": city->{
    _id,
    title,
    slug
  },
  "district": district->{
    _id,
    title,
    slug
  },
  "type": type->{
    _id,
    title,
    "slug": slug.current,
    shortDescription,
    image
  },
  "locationTags": locationTags[]->{
    _id,
    title,
    description
  },
  gallery,
  amenities,
  "amenitiesRefs": amenitiesRefs[]->{
    _id,
    title,
    order
  },
  area,
  bedrooms,
  bathrooms,
  yearBuilt,
  coordinatesLat,
  coordinatesLng,
  propertyCode,
  "agent": agent->{
    _id,
    name,
    email,
    phone,
    photo
  },
  seo`

// -----------------------------------------------------------------------------
// BLOG
// -----------------------------------------------------------------------------

/** Blog category: full selection */
export const BLOG_CATEGORY_FRAGMENT = `_id,
  title,
  slug,
  description,
  order`

/** Blog category ref */
export const BLOG_CATEGORY_REF_FRAGMENT = `_id,
  title,
  slug`

/** Blog post card: list */
export const BLOG_POST_CARD_FRAGMENT = `_id,
  title,
  slug,
  excerpt,
  "coverImage": seo.ogImage,
  publishedAt,
  "categories": categories[]->{
    _id,
    title,
    slug
  }`

/** Blog post full: article page */
export const BLOG_POST_FULL_FRAGMENT = `_id,
  title,
  slug,
  excerpt,
  content,
  "coverImage": seo.ogImage,
  publishedAt,
  authorName,
  authorRole,
  authorImage,
  "categories": categories[]->{
    _id,
    title,
    slug
  },
  seo,
  "schemaType": _type`

// -----------------------------------------------------------------------------
// HOMEPAGE SECTIONS
// -----------------------------------------------------------------------------

/** Polymorphic homepage section projection. Each section type returns only its fields; others are null. */
export const HOMEPAGE_SECTIONS_FRAGMENT = `homepageSections[]{
  _type,
  _key,
  title,
  subtitle,
  shortLine,
  backgroundImage,
  cta,
  mode,
  "properties": properties[]->{
    ${PROPERTY_CARD_FRAGMENT}
  },
  "cities": cities[]->{
    ${CITY_CARD_FRAGMENT}
  },
  "districts": districts[]->{
    ${DISTRICT_CARD_FRAGMENT}
  },
  "propertyTypes": propertyTypes[]->{
    ${PROPERTY_TYPE_FRAGMENT}
  },
  description,
  benefits,
  primaryImage,
  secondaryImage,
  "posts": posts[]->{
    ${BLOG_POST_CARD_FRAGMENT}
  },
  content,
  "items": items
}`
