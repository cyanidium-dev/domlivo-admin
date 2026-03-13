/**
 * Centralized GROQ queries for the frontend.
 *
 * Rules:
 * - Localized fields returned as raw objects; frontend resolves with getLocalizedValue(field, locale)
 * - Media returned as full Sanity image objects for urlFor()
 * - No locale resolution inside GROQ
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
  BLOG_CATEGORY_FRAGMENT,
  BLOG_POST_CARD_FRAGMENT,
  BLOG_POST_FULL_FRAGMENT,
  HOMEPAGE_SECTIONS_FRAGMENT,
} from './fragments'

// -----------------------------------------------------------------------------
// HOMEPAGE
// -----------------------------------------------------------------------------

export const HOME_PAGE_QUERY = groq`*[_type == "homePage"][0]{
  ${HOMEPAGE_SECTIONS_FRAGMENT},
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
  socialLinks,
  footerQuickLinks,
  copyrightText,
  defaultSeo
}`

// -----------------------------------------------------------------------------
// CITIES
// -----------------------------------------------------------------------------

export const CITIES_LIST_QUERY = groq`*[_type == "city" && isPublished == true] | order(order asc){
  ${CITY_CARD_FRAGMENT}
}`

/** Params: { slug: string } — slug.current */
export const CITY_PAGE_QUERY = groq`*[_type == "city" && slug.current == $slug][0]{
  title,
  slug,
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
    slug
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
// BLOG
// -----------------------------------------------------------------------------

export const BLOG_POSTS_QUERY = groq`*[_type == "blogPost"] | order(publishedAt desc){
  ${BLOG_POST_CARD_FRAGMENT}
}`

/** Params: { slug: string } — use slug.en or slug for locale */
export const BLOG_POST_BY_SLUG_QUERY = groq`*[_type == "blogPost" && (slug.en == $slug || slug.sq == $slug || slug.ru == $slug || slug.uk == $slug)][0]{
  ${BLOG_POST_FULL_FRAGMENT}
}`

// -----------------------------------------------------------------------------
// BLOG CATEGORIES
// -----------------------------------------------------------------------------

export const BLOG_CATEGORIES_QUERY = groq`*[_type == "blogCategory"] | order(order asc){
  ${BLOG_CATEGORY_FRAGMENT}
}`

// -----------------------------------------------------------------------------
// POPULAR CITIES
// -----------------------------------------------------------------------------

export const POPULAR_CITIES_QUERY = groq`*[_type == "city" && isPublished == true && popular == true] | order(order asc){
  ${CITY_CARD_FRAGMENT}
}`

// -----------------------------------------------------------------------------
// FEATURED PROPERTIES
// -----------------------------------------------------------------------------

/** Featured properties: published, active lifecycle, featured. */
export const FEATURED_PROPERTIES_QUERY = groq`*[_type == "property" && isPublished == true && featured == true && (lifecycleStatus == "active" || !defined(lifecycleStatus))]{
  ${PROPERTY_CARD_FRAGMENT}
}`
