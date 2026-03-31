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

/** Resolved agent reference for investor logos row (landing page builder). */
export const AGENT_INVESTOR_LOGOS_FRAGMENT = `_id,
  name,
  "slug": slug.current,
  photo{
    ${IMAGE_FRAGMENT}
  },
  agentLogo{
    ${IMAGE_FRAGMENT}
  },
  telegramUrl,
  facebookUrl,
  instagramUrl,
  youtubeUrl`

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

/** Amenity: for filters, property detail (refs), and catalog UI */
export const AMENITY_FRAGMENT = `_id,
  title,
  "slug": slug.current,
  description,
  iconKey,
  customIcon{
    ${IMAGE_FRAGMENT}
  },
  order,
  active`

/** Property card: catalog / list */
export const PROPERTY_CARD_FRAGMENT = `_id,
  title,
  slug,
  price,
  promoted,
  promotionType,
  featuredOrder,
  discountPercent,
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

// -----------------------------------------------------------------------------
// BLOG
// -----------------------------------------------------------------------------

/** Blog author: full selection for byline and author pages */
export const BLOG_AUTHOR_FRAGMENT = `_id,
  name,
  "slug": slug.current,
  role,
  bio,
  photo,
  socialLinks`

/** Blog category: full selection (stable for filter UI) */
export const BLOG_CATEGORY_FRAGMENT = `_id,
  title,
  "slug": slug.current,
  description,
  order,
  active`

/** Blog category ref (for post embedding) */
export const BLOG_CATEGORY_REF_FRAGMENT = `_id,
  title,
  "slug": slug.current,
  description,
  order`

/** Blog post card: list */
export const BLOG_POST_CARD_FRAGMENT = `_id,
  title,
  slug,
  excerpt,
  coverImage,
  "ogImage": seo.ogImage,
  publishedAt,
  featured,
  "author": author->{
    ${BLOG_AUTHOR_FRAGMENT}
  },
  "categories": categories[]->{
    _id,
    title,
    "slug": slug.current,
    description,
    order
  }`

/**
 * Single `articlesSection` object (e.g. on property) with resolved post cards.
 * Matches landing page projection for the same block shape.
 */
export const PROPERTY_ARTICLES_SECTION_FRAGMENT = `title,
  subtitle,
  cta{
    ${LOCALIZED_CTA_LINK_FRAGMENT}
  },
  cardCtaLabel,
  mode,
  "posts": posts[]->{
    ${BLOG_POST_CARD_FRAGMENT}
  }`

/** Property full: detail page */
export const PROPERTY_FULL_FRAGMENT = `_id,
  title,
  slug,
  shortDescription,
  description,
  price,
  status,
  lifecycleStatus,
  promoted,
  promotionType,
  featuredOrder,
  discountPercent,
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
  "amenitiesRefs": amenitiesRefs[]->{
    ${AMENITY_FRAGMENT}
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
  articlesSection{
    ${PROPERTY_ARTICLES_SECTION_FRAGMENT}
  },
  seo`

/** Blog post full: article page */
export const BLOG_POST_FULL_FRAGMENT = `_id,
  title,
  slug,
  excerpt,
  content,
  coverImage,
  "ogImage": seo.ogImage,
  publishedAt,
  featured,
  "author": author->{
    ${BLOG_AUTHOR_FRAGMENT}
  },
  "categories": categories[]->{
    _id,
    title,
    "slug": slug.current,
    description,
    order
  },
  "relatedPosts": relatedPosts[]->{
    _id,
    title,
    slug,
    excerpt,
    coverImage,
    publishedAt,
    "author": author->{
      _id,
      name,
      "slug": slug.current,
      photo
    },
    "categories": categories[]->{
      _id,
      title,
      "slug": slug.current
    }
  },
  "relatedProperties": relatedProperties[]->{
    ${PROPERTY_CARD_FRAGMENT}
  },
  seo,
  "schemaType": _type`

// -----------------------------------------------------------------------------
// LANDING PAGE SECTIONS (canonical builder for landingPage)
// -----------------------------------------------------------------------------

/** Polymorphic landing page section projection for landingPage.pageSections[]. */
export const LANDING_PAGE_SECTIONS_FRAGMENT = `pageSections[]{
  _type,
  _key,
  enabled,
  title,
  subtitle,
  shortLine,
  tabs[]{
    _key,
    key,
    label,
    enabled
  },
  backgroundImage,
  cta,
  secondaryCta,
  mode,
  linkTargetType,
  limit,
  sort,
  autoMode,
  seoTextUnderCta,
  search,
  mediaType,
  imageMode,
  image,
  media,
  videoUrl,
  headings,
  rows,
  closingText,
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
  variant,
  eyebrow,
  supportingText,
  contentGroups[]{
    _key,
    groupTitle,
    description,
    groupDisplay,
    bullets,
    cards[]{
      _key,
      value,
      label,
      description
    }
  },
  mediaMode,
  promoMediaType,
  benefits,
  highlightsDisplay,
  highlightsCards[]{
    _key,
    value,
    label,
    description
  },
  groupedMediaMode,
  mediaSide,
  images[]{
    _key,
    ${IMAGE_FRAGMENT}
  },
  "posts": posts[]->{
    ${BLOG_POST_CARD_FRAGMENT}
  },
  content,
  cardCtaLabel,
  "items": items,
  "agents": agents[]->{
    ${AGENT_INVESTOR_LOGOS_FRAGMENT}
  },
  sourceMode,
  auto,
  "landings": select(
    sourceMode == "manual" => manualItems[]->{
      _id,
      pageType,
      slug,
      title,
      cardTitle,
      cardDescription,
      cardImage,
      linkedCity->{_id, slug, title},
      linkedDistrict->{_id, slug, title, "city": city->{_id, slug, title}},
      linkedPropertyType->{_id, title, "slug": slug.current}
    },
    sourceMode == "auto" && auto.sort == "createdAtDesc" => *[
      _type == "landingPage" &&
      (^.auto.enabledOnly != true || enabled != false) &&
      pageType in ^.auto.pageTypes &&
      _id != "landing-home" &&
      _id != ^.^._id
    ] | order(_createdAt desc)[0...200]{
      _id,
      pageType,
      slug,
      title,
      cardTitle,
      cardDescription,
      cardImage,
      linkedCity->{_id, slug, title},
      linkedDistrict->{_id, slug, title, "city": city->{_id, slug, title}},
      linkedPropertyType->{_id, title, "slug": slug.current}
    },
    sourceMode == "auto" && auto.sort == "createdAtAsc" => *[
      _type == "landingPage" &&
      (^.auto.enabledOnly != true || enabled != false) &&
      pageType in ^.auto.pageTypes &&
      _id != "landing-home" &&
      _id != ^.^._id
    ] | order(_createdAt asc)[0...200]{
      _id,
      pageType,
      slug,
      title,
      cardTitle,
      cardDescription,
      cardImage,
      linkedCity->{_id, slug, title},
      linkedDistrict->{_id, slug, title, "city": city->{_id, slug, title}},
      linkedPropertyType->{_id, title, "slug": slug.current}
    },
    sourceMode == "auto" && auto.sort == "titleDesc" => *[
      _type == "landingPage" &&
      (^.auto.enabledOnly != true || enabled != false) &&
      pageType in ^.auto.pageTypes &&
      _id != "landing-home" &&
      _id != ^.^._id
    ] | order(title.en desc)[0...200]{
      _id,
      pageType,
      slug,
      title,
      cardTitle,
      cardDescription,
      cardImage,
      linkedCity->{_id, slug, title},
      linkedDistrict->{_id, slug, title, "city": city->{_id, slug, title}},
      linkedPropertyType->{_id, title, "slug": slug.current}
    },
    sourceMode == "auto" => *[
      _type == "landingPage" &&
      (^.auto.enabledOnly != true || enabled != false) &&
      pageType in ^.auto.pageTypes &&
      _id != "landing-home" &&
      _id != ^.^._id
    ] | order(title.en asc)[0...200]{
      _id,
      pageType,
      slug,
      title,
      cardTitle,
      cardDescription,
      cardImage,
      linkedCity->{_id, slug, title},
      linkedDistrict->{_id, slug, title, "city": city->{_id, slug, title}},
      linkedPropertyType->{_id, title, "slug": slug.current}
    }
  ),
  manualItems,
  auto,
  "resolvedManualItems": select(
    _type == "locationCarouselSection" && mode == "manual" => manualItems[]->{
      _id,
      _type,
      title,
      "slug": slug.current,
      heroImage,
      popular,
      order,
      "city": select(
        _type == "district" => city->{
          _id,
          title,
          "slug": slug.current
        }
      )
    }
  )
}`
