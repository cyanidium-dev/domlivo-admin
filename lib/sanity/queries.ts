/**
 * Centralized GROQ queries for the frontend.
 *
 * Rules:
 * - Localized fields returned as raw objects; frontend resolves with getLocalizedValue(field, locale)
 * - Media returned as full Sanity image objects for urlFor()
 * - No locale resolution inside GROQ
 * - City-shaped projections include `"country": country->slug.current` where a city document is
 *   dereferenced. Property-level country uses coalesce in fragments.
 *
 * Import from this file or from lib/sanity.
 */

import {groq} from 'next-sanity'
import {
  CITY_CARD_FRAGMENT,
  PROPERTY_CARD_FRAGMENT,
  PROPERTY_FULL_FRAGMENT,
  PROPERTY_TYPE_FRAGMENT,
  LOCATION_TAG_FRAGMENT,
  AMENITY_FRAGMENT,
  BLOG_AUTHOR_FRAGMENT,
  BLOG_CATEGORY_FRAGMENT,
  BLOG_POST_CARD_FRAGMENT,
  BLOG_POST_FULL_FRAGMENT,
  LANDING_PAGE_SECTIONS_FRAGMENT,
} from './fragments'

// -----------------------------------------------------------------------------
// HOMEPAGE (canonical: landing-home)
// -----------------------------------------------------------------------------

export const HOME_PAGE_QUERY = groq`*[_type == "landingPage" && _id == "landing-home"][0]{
  ${LANDING_PAGE_SECTIONS_FRAGMENT},
  seo
}`

// -----------------------------------------------------------------------------
// LANDING PAGES (canonical)
// -----------------------------------------------------------------------------

/** Params: { slug: string } — landingPage.slug.current */
export const LANDING_PAGE_BY_SLUG_QUERY = groq`*[_type == "landingPage" && slug.current == $slug && enabled != false][0]{
  _id,
  pageType,
  title,
  slug,
  enabled,
  linkedCity->{
    _id,
    title,
    slug,
    "country": country->slug.current
  },
  linkedDistrict->{
    _id,
    title,
    slug,
    "city": city->{
      _id,
      title,
      slug,
      "country": country->slug.current
    }
  },
  linkedPropertyType->{
    _id,
    title,
    "slug": slug.current
  },
  ${LANDING_PAGE_SECTIONS_FRAGMENT},
  seo
}`

/** Params: { citySlug: string } — city.slug.current */
export const CITY_LANDING_BY_CITY_SLUG_QUERY = groq`*[_type == "landingPage" && pageType == "city" && linkedCity->slug.current == $citySlug && enabled != false][0]{
  _id,
  pageType,
  title,
  slug,
  enabled,
  linkedCity->{
    _id,
    title,
    slug,
    heroImage,
    shortDescription,
    "country": country->slug.current
  },
  ${LANDING_PAGE_SECTIONS_FRAGMENT},
  seo
}`

// -----------------------------------------------------------------------------
// SITE SETTINGS
// -----------------------------------------------------------------------------

export const SITE_SETTINGS_QUERY = groq`*[_type == "siteSettings"][0]{
  siteName,
  siteTagline,
  logo,
  contactEmail,
  contactPhone,
  companyAddress,
  contactsManagerPhoto{
    asset,
    crop,
    hotspot,
    alt
  },
  socialLinks,
  footerIntro,
  footerTelegramUrl,
  footerWhatsappUrl,
  footerApp{
    enabled,
    appStoreUrl,
    googlePlayUrl,
    primaryUrl
  },
  footerCodesiteUrl,
  footerWebbondUrl,
  policyLinks,
  copyrightText,
  similarPropertiesCount,
  maxPremiumPromotions,
  maxTopPromotions,
  maxSalePromotions,
  priceRange{
    from,
    to
  },
  areaRange{
    from,
    to
  },
  howToPublishVideoUrl,
  currencyRates[]{
    code,
    rate,
    name,
    symbol
  },
  currencyLastSyncedAt,
  displayCurrencies,
  defaultSeo
}`

// -----------------------------------------------------------------------------
// CITIES
// -----------------------------------------------------------------------------

export const CITIES_LIST_QUERY = groq`*[_type == "city" && isPublished == true] | order(order asc){
  ${CITY_CARD_FRAGMENT}
}`

/** Params: { countrySlug: string } — country.slug.current (route segment, e.g. albania) */
export const CITIES_BY_COUNTRY_QUERY = groq`*[_type == "city" && isPublished == true && country->slug.current == $countrySlug] | order(order asc){
  ${CITY_CARD_FRAGMENT}
}`

/** Params: { slug: string } — slug.current */
export const CITY_PAGE_QUERY = groq`*[_type == "city" && slug.current == $slug][0]{
  title,
  slug,
  "country": country->slug.current,
  heroTitle,
  heroSubtitle,
  heroShortLine,
  heroImage,
  shortDescription,
  description,
  investmentText,
  featuredPropertiesTitle,
  featuredPropertiesSubtitle,
  districtsTitle,
  districtsIntro,
  gallery,
  districtStats,
  faqItems,
  seo
}`

// -----------------------------------------------------------------------------
// DISTRICTS
// -----------------------------------------------------------------------------

/** Params: { slug: string } — slug.current */
export const DISTRICT_PAGE_QUERY = groq`*[_type == "district" && slug.current == $slug][0]{
  title,
  slug,
  heroTitle,
  heroSubtitle,
  heroImage,
  shortDescription,
  description,
  metrics,
  gallery,
  faqItems,
  seo,
  "city": city->{
    _id,
    title,
    slug,
    "country": country->slug.current
  }
}`

/** Params: { city: string, district: string } — city and district slug.current (disambiguates districts with same slug in different cities) */
export const DISTRICT_BY_CITY_AND_SLUG_QUERY = groq`*[_type == "district" && slug.current == $district && city->slug.current == $city][0]{
  title,
  slug,
  heroTitle,
  heroSubtitle,
  heroImage,
  shortDescription,
  description,
  metrics,
  gallery,
  faqItems,
  seo,
  "city": city->{
    _id,
    title,
    slug,
    "country": country->slug.current
  }
}`

// -----------------------------------------------------------------------------
// PROPERTY TYPES
// -----------------------------------------------------------------------------

export const PROPERTY_TYPES_QUERY = groq`*[_type == "propertyType" && active == true] | order(order asc){
  ${PROPERTY_TYPE_FRAGMENT}
}`

// -----------------------------------------------------------------------------
// LOCATION TAGS
// -----------------------------------------------------------------------------

export const LOCATION_TAGS_QUERY = groq`*[_type == "locationTag" && active == true]{
  ${LOCATION_TAG_FRAGMENT}
}`

// -----------------------------------------------------------------------------
// AMENITIES
// -----------------------------------------------------------------------------

export const AMENITIES_QUERY = groq`*[_type == "amenity" && active == true] | order(order asc){
  ${AMENITY_FRAGMENT}
}`

// -----------------------------------------------------------------------------
// PROPERTIES
// -----------------------------------------------------------------------------

/** Listed properties: published, not archived. Treat undefined lifecycleStatus as active. */
export const PROPERTIES_LIST_QUERY = groq`*[_type == "property" && isPublished == true && (lifecycleStatus == "active" || !defined(lifecycleStatus))]{
  ${PROPERTY_CARD_FRAGMENT}
}`

/** Params: { slug: string } — slug.current */
export const PROPERTY_BY_SLUG_QUERY = groq`*[_type == "property" && slug.current == $slug][0]{
  ${PROPERTY_FULL_FRAGMENT}
}`

// -----------------------------------------------------------------------------
// BLOG — Frontend query contract
// -----------------------------------------------------------------------------
//
// BLOG_SETTINGS_QUERY: Returns blog index hero + SEO. Null if document not created.
//   → Create via Studio: Blog > Blog Settings, or "Create new" > Blog Settings template.
//
// BLOG_POSTS_QUERY: Paginated listing. Params: { category?, author?, limit?, offset? }
//   - category: slug string (e.g. 'real-estate'). Omit/empty = all categories.
//   - author: slug string. Omit/empty = all authors.
//   - limit: page size. Default 100 when omitted.
//   - offset: skip N. Default 0. Use offset = (page - 1) * limit for ?page=N.
//   → /blog: { limit: 12, offset: 0 }
//   → /blog?category=X: { category: 'X', limit: 12, offset: 0 }
//   → /blog?page=2: { limit: 12, offset: 12 }
//
// BLOG_POSTS_COUNT_QUERY: Total count for same filter. Params: { category?, author? }
//   → Pass same category/author as BLOG_POSTS_QUERY for pagination UI.
//
// BLOG_POST_BY_SLUG_QUERY: Single post. Params: { slug: string }
//
// BLOG_CATEGORIES_QUERY: Active categories for filter bar. No params.
//
// BLOG_AUTHORS_QUERY: Active authors. No params.
//
// BLOG_AUTHOR_BY_SLUG_QUERY: Single author. Params: { slug: string }
//
// -----------------------------------------------------------------------------

/** Blog index page config. Singleton documentId: blog-settings. Returns null if not created. */
export const BLOG_SETTINGS_QUERY = groq`*[_type == "blogSettings" && _id == "blog-settings"][0]{
  heroTitle,
  heroDescription,
  seo
}`

/** Active authors for author index and filter. */
export const BLOG_AUTHORS_QUERY = groq`*[_type == "blogAuthor" && active != false] | order(name asc){
  ${BLOG_AUTHOR_FRAGMENT}
}`

/**
 * Filter expression for blog posts. Shared by BLOG_POSTS_QUERY and BLOG_POSTS_COUNT_QUERY.
 * - category: filter by category slug (categories[].slug.current)
 * - author: filter by author slug (author->slug.current)
 */
const BLOG_POSTS_FILTER = `_type == "blogPost" &&
  (!defined($category) || $category == "" || $category in categories[]->slug.current) &&
  (!defined($author) || $author == "" || author->slug.current == $author)`

/**
 * Blog posts with optional filters and pagination.
 * Params: { category?: string, author?: string, limit?: number, offset?: number }
 * For ?category=real-estate: pass { category: 'real-estate' }
 * For ?page=2 with pageSize=12: pass { limit: 12, offset: 12 }
 */
export const BLOG_POSTS_QUERY = groq`*[${BLOG_POSTS_FILTER}] | order(publishedAt desc)[coalesce($offset, 0)...coalesce($offset, 0) + coalesce($limit, 100)]{
  ${BLOG_POST_CARD_FRAGMENT}
}`

/** Total count of posts matching the same filter as BLOG_POSTS_QUERY. Use for pagination. Params: { category?: string, author?: string } */
export const BLOG_POSTS_COUNT_QUERY = groq`count(*[${BLOG_POSTS_FILTER}])`

/** Params: { slug: string } — slug.current */
export const BLOG_POST_BY_SLUG_QUERY = groq`*[_type == "blogPost" && slug.current == $slug][0]{
  ${BLOG_POST_FULL_FRAGMENT}
}`

// -----------------------------------------------------------------------------
// BLOG CATEGORIES
// -----------------------------------------------------------------------------

/** Active categories for filter UI, sorted by order. Stable slug-based taxonomy. */
export const BLOG_CATEGORIES_QUERY = groq`*[_type == "blogCategory" && active != false] | order(order asc){
  ${BLOG_CATEGORY_FRAGMENT}
}`

/** Params: { slug: string } — author slug for author profile page */
export const BLOG_AUTHOR_BY_SLUG_QUERY = groq`*[_type == "blogAuthor" && slug.current == $slug][0]{
  ${BLOG_AUTHOR_FRAGMENT}
}`

// -----------------------------------------------------------------------------
// POPULAR CITIES
// -----------------------------------------------------------------------------

export const POPULAR_CITIES_QUERY = groq`*[_type == "city" && isPublished == true && popular == true] | order(order asc){
  ${CITY_CARD_FRAGMENT}
}`

// -----------------------------------------------------------------------------
// PROMOTED PROPERTIES
// -----------------------------------------------------------------------------

/** Listed promotions: published, active lifecycle, promoted. */
export const PROMOTED_PROPERTIES_QUERY = groq`*[_type == "property" && isPublished == true && promoted == true && (lifecycleStatus == "active" || !defined(lifecycleStatus))]{
  ${PROPERTY_CARD_FRAGMENT}
}`

/** @deprecated Use PROMOTED_PROPERTIES_QUERY */
export const FEATURED_PROPERTIES_QUERY = PROMOTED_PROPERTIES_QUERY
