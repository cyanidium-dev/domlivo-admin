## 1. Overview
This contract documents the Sanity Studio data model and frontend fetch shape for the Domlivo blog.

Entities:
- `blogPost` — full article content + SEO + relationships
- `blogCategory` — taxonomy used for filtering and categorizing posts
- `blogAuthor` — reusable author profile referenced by posts

How content is structured:
- `blogPost.content` is `localizedBlockContent`:
  - It is an object with per-locale rich content arrays: `content.en`, `content.uk`, `content.ru`, `content.sq`, `content.it`
  - Each locale array is made of mixed block types:
    - Portable text blocks (`_type: "block"`)
    - Image blocks (`_type: "image"`, with `alt` and `caption`)
    - Custom blocks (`blogCtaBlock`, `blogRelatedPostsBlock`, `blogPropertyEmbedBlock`, `blogTable`, `blogFaqBlock`, `blogCallout`)

Field-level localization:
- Localized types are stored as objects with keys for each locale:
  - `localizedString` => `{ en, uk, ru, sq, it }`
  - `localizedText` => `{ en, uk, ru, sq, it }`
  - `localizedSeo` => localized versions of meta fields inside one `seo` object

## 2. Blog Post Data Shape
Note: This is a JSON-like shape describing the frontend-facing data returned by the GROQ queries below.

```jsonc
{
  _type: "blogPost",
  slug: "string",                    // blogPost.slug.current
  publishedAt: "datetime-string",
  featured?: "boolean",

  title: { en?: string, uk?: string, ru?: string, sq?: string, it?: string },
  subtitle?: { en?: string, uk?: string, ru?: string, sq?: string, it?: string },
  excerpt?: { en?: string, uk?: string, ru?: string, sq?: string, it?: string },

  content: {
    en: Array<ContentBlock>,
    uk: Array<ContentBlock>,
    ru: Array<ContentBlock>,
    sq: Array<ContentBlock>,
    it: Array<ContentBlock>
  },

  coverImage?: {
    alt?: string,                    // blogPost.coverImage.alt
    caption?: string,               // blogPost.coverImage.caption
    asset?: { url?: string }        // projected in GROQ
  },

  categories: Array<{
    _id: string,
    slug: "string",                 // blogCategory.slug.current
    title: { en?: string, uk?: string, ru?: string, sq?: string, it?: string },
    order?: number,
    active?: boolean,
    description?: { en?: string, uk?: string, ru?: string, sq?: string, it?: string },
    seo?: LocalizedSeo
  }>,

  author?: {                         // preferred (new schema)
    _id: string,
    slug: "string",                 // blogAuthor.slug.current
    name: "string",
    active?: boolean,
    role?: { en?: string, uk?: string, ru?: string, sq?: string, it?: string },
    bio?: { en?: string, uk?: string, ru?: string, sq?: string, it?: string },
    photo?: { alt?: string, asset?: { url?: string } },
    email?: string,
    socialLinks?: Array<{ platform: string, url: string }>,
    seo?: LocalizedSeo
  },

  // Legacy author fallbacks (still present on old content; Studio hides these when `author` exists)
  authorName?: string,
  authorRole?: string,
  authorImage?: {
    asset?: { url?: string }       // legacy authorImage has no custom alt/caption fields in schema
  },

  seo?: LocalizedSeo,

  relatedPosts?: Array<{
    _id: string,
    slug: "string",
    title: { en?: string, uk?: string, ru?: string, sq?: string, it?: string },
    excerpt?: { en?: string, uk?: string, ru?: string, sq?: string, it?: string },
    coverImage?: { alt?: string, caption?: string, asset?: { url?: string } },
    publishedAt?: "datetime-string",
    categories?: Array<{ _id: string, slug: "string", title: any }>,
    author?: { _id: string, slug: "string", name: string, role?: any, photo?: any },
    authorName?: string,
    authorRole?: string,
    authorImage?: { asset?: { url?: string } }
  }>,

  // Alias for blogPost.relatedProperties[]->... (frontend expects `properties`)
  properties?: Array<{
    _id: string,
    slug: "string",                 // property.slug.current
    title: { en?: string, uk?: string, ru?: string, sq?: string, it?: string },
    shortDescription?: { en?: string, uk?: string, ru?: string, sq?: string, it?: string },
    price?: number,
    currency?: string,
    gallery?: Array<{
      alt?: string,
      asset?: { url?: string }
    }>
  }>
}
```

`LocalizedSeo` (stored as `localizedSeo` objects in Sanity):
```jsonc
{
  metaTitle?: { en?: string, uk?: string, ru?: string, sq?: string, it?: string },
  metaDescription?: { en?: string, uk?: string, ru?: string, sq?: string, it?: string },
  keywords?: { en?: string, uk?: string, ru?: string, sq?: string, it?: string },
  ogTitle?: { en?: string, uk?: string, ru?: string, sq?: string, it?: string },
  ogDescription?: { en?: string, uk?: string, ru?: string, sq?: string, it?: string },
  twitterTitle?: { en?: string, uk?: string, ru?: string, sq?: string, it?: string },
  twitterDescription?: { en?: string, uk?: string, ru?: string, sq?: string, it?: string },
  ogImage?: { alt?: string, asset?: { url?: string } }, // shared image (not per-locale)
  canonicalUrl?: string,
  noIndex?: boolean,
  noFollow?: boolean
}
```

`ContentBlock` (elements of `content.<locale>[]`):
- `_type: "block"` — Sanity Portable Text block
- `_type: "image"` — image with `alt`, `caption`, and `asset`
- `_type: "blogCtaBlock"` — CTA button block
- `_type: "blogRelatedPostsBlock"` — recommended posts block
- `_type: "blogPropertyEmbedBlock"` — property recommendations block
- `_type: "blogTable"` — table/rows block
- `_type: "blogFaqBlock"` — FAQ section block
- `_type: "blogCallout"` — callout/info block

## 3. GROQ Queries

### 3.1 Get all blog posts (listing)
Returns one item per `blogPost`, ordered by `publishedAt desc`.

```groq
*[_type == "blogPost"] | order(publishedAt desc){
  _id,
  slug: slug.current,
  title,
  subtitle,
  excerpt,
  publishedAt,

  coverImage{
    alt,
    caption,
    asset->{url}
  },

  "category": categories[0]->{
    _id,
    slug: slug.current,
    title
  },
  "categories": categories[]->{
    _id,
    slug: slug.current,
    title
  },

  "author": author->{
    _id,
    slug: slug.current,
    name,
    active,
    role,
    bio,
    "photo": photo{
      alt,
      asset->{url}
    },
    seo,
    socialLinks
  },

  // legacy fallback fields (may be present for older content)
  authorName,
  authorRole,
  authorImage{
    asset->{url}
  }
}
```

### 3.2 Get blog post by slug
Returns a single `blogPost` by `slug.current == $slug`, including:
- full localized `content`
- resolved nested references inside `content` blocks (recommended posts + property embeds)
- resolved `relatedPosts` and `properties`
- `seo`

```groq
*[_type == "blogPost" && slug.current == $slug][0]{
  _id,
  _type,
  slug: slug.current,
  title,
  subtitle,
  excerpt,
  publishedAt,
  featured,

  coverImage{
    alt,
    caption,
    asset->{url}
  },

  "categories": categories[]->{
    _id,
    slug: slug.current,
    title,
    description,
    order,
    active,
    seo
  },

  "author": author->{
    _id,
    slug: slug.current,
    name,
    active,
    role,
    bio,
    "photo": photo{
      alt,
      asset->{url}
    },
    email,
    socialLinks,
    seo
  },

  authorName,
  authorRole,
  authorImage{
    asset->{url}
  },

  seo,

  "relatedPosts": relatedPosts[]->{
    _id,
    slug: slug.current,
    title,
    excerpt,
    publishedAt,
    coverImage{
      alt,
      caption,
      asset->{url}
    },
    "categories": categories[]->{
      _id,
      slug: slug.current,
      title
    },
    "author": author->{
      _id,
      slug: slug.current,
      name,
      active,
      role,
      "photo": photo{
        alt,
        asset->{url}
      }
    },
    authorName,
    authorRole,
    authorImage{
      asset->{url}
    }
  },

  "properties": relatedProperties[]->{
    _id,
    slug: slug.current,
    title,
    shortDescription,
    price,
    currency,
    gallery[]{
      alt,
      asset->{url}
    }
  },

  // Full localized article body with resolved references inside blocks
  content{
    en: en[]{
      ...,
      // Resolve recommended-post references inside `blogRelatedPostsBlock`
      "posts": select(
        _type == "blogRelatedPostsBlock" => posts[]->{
          _id,
          slug: slug.current,
          title,
          excerpt,
          publishedAt,
          coverImage{
            alt,
            caption,
            asset->{url}
          },
          "author": author->{
            _id,
            slug: slug.current,
            name,
            role,
            "photo": photo{
              alt,
              asset->{url}
            }
          }
        },
        null
      ),
      // Resolve property references inside `blogPropertyEmbedBlock`
      "properties": select(
        _type == "blogPropertyEmbedBlock" => properties[]->{
          _id,
          slug: slug.current,
          title,
          shortDescription,
          price,
          currency,
          gallery[]{
            alt,
            asset->{url}
          }
        },
        null
      ),

      // Ensure image blocks expose `asset.url` directly
      asset->{url},
      alt,
      caption
    },

    uk: uk[]{
      ...,
      "posts": select(
        _type == "blogRelatedPostsBlock" => posts[]->{
          _id,
          slug: slug.current,
          title,
          excerpt,
          publishedAt,
          coverImage{
            alt,
            caption,
            asset->{url}
          },
          "author": author->{
            _id,
            slug: slug.current,
            name,
            role,
            "photo": photo{
              alt,
              asset->{url}
            }
          }
        },
        null
      ),
      "properties": select(
        _type == "blogPropertyEmbedBlock" => properties[]->{
          _id,
          slug: slug.current,
          title,
          shortDescription,
          price,
          currency,
          gallery[]{
            alt,
            asset->{url}
          }
        },
        null
      ),
      asset->{url},
      alt,
      caption
    },

    ru: ru[]{
      ...,
      "posts": select(
        _type == "blogRelatedPostsBlock" => posts[]->{
          _id,
          slug: slug.current,
          title,
          excerpt,
          publishedAt,
          coverImage{
            alt,
            caption,
            asset->{url}
          },
          "author": author->{
            _id,
            slug: slug.current,
            name,
            role,
            "photo": photo{
              alt,
              asset->{url}
            }
          }
        },
        null
      ),
      "properties": select(
        _type == "blogPropertyEmbedBlock" => properties[]->{
          _id,
          slug: slug.current,
          title,
          shortDescription,
          price,
          currency,
          gallery[]{
            alt,
            asset->{url}
          }
        },
        null
      ),
      asset->{url},
      alt,
      caption
    },

    sq: sq[]{
      ...,
      "posts": select(
        _type == "blogRelatedPostsBlock" => posts[]->{
          _id,
          slug: slug.current,
          title,
          excerpt,
          publishedAt,
          coverImage{
            alt,
            caption,
            asset->{url}
          },
          "author": author->{
            _id,
            slug: slug.current,
            name,
            role,
            "photo": photo{
              alt,
              asset->{url}
            }
          }
        },
        null
      ),
      "properties": select(
        _type == "blogPropertyEmbedBlock" => properties[]->{
          _id,
          slug: slug.current,
          title,
          shortDescription,
          price,
          currency,
          gallery[]{
            alt,
            asset->{url}
          }
        },
        null
      ),
      asset->{url},
      alt,
      caption
    },

    it: it[]{
      ...,
      "posts": select(
        _type == "blogRelatedPostsBlock" => posts[]->{
          _id,
          slug: slug.current,
          title,
          excerpt,
          publishedAt,
          coverImage{
            alt,
            caption,
            asset->{url}
          },
          "author": author->{
            _id,
            slug: slug.current,
            name,
            role,
            "photo": photo{
              alt,
              asset->{url}
            }
          }
        },
        null
      ),
      "properties": select(
        _type == "blogPropertyEmbedBlock" => properties[]->{
          _id,
          slug: slug.current,
          title,
          shortDescription,
          price,
          currency,
          gallery[]{
            alt,
            asset->{url}
          }
        },
        null
      ),
      asset->{url},
      alt,
      caption
    }
  }
}
```

### 3.3 Get categories
```groq
*[_type == "blogCategory"] | order(order asc){
  _id,
  slug: slug.current,
  title,
  description,
  order,
  active,
  seo
}
```

### 3.4 Get authors
```groq
*[_type == "blogAuthor"]{
  _id,
  slug: slug.current,
  name,
  active,
  role,
  bio,
  email,
  socialLinks,
  "photo": photo{
    alt,
    asset->{url}
  },
  seo
}
```

### Block Mapping
Each item inside `content.<locale>[]` has `_type` and fields depending on the block type.

`blogCtaBlock`
```jsonc
{
  _type: "blogCtaBlock",
  variant: "primary" | "secondary" | "link",
  label: { en?: string, uk?: string, ru?: string, sq?: string, it?: string }, // from `cta.label`
  href: "string" // from `cta.href`
}
```

`blogRelatedPostsBlock`
```jsonc
{
  _type: "blogRelatedPostsBlock",
  title?: { en?: string, uk?: string, ru?: string, sq?: string, it?: string },
  posts: Array<BlogPostCard> // from `posts[]`
  // Preview subtitle logic (Studio): `${posts.length} posts selected`
}
```

`blogPropertyEmbedBlock`
```jsonc
{
  _type: "blogPropertyEmbedBlock",
  title?: { en?: string, uk?: string, ru?: string, sq?: string, it?: string },
  mode: "card" | "list" | "compact",
  properties: Array<PropertyCard> // from `properties[]`
  // Preview subtitle logic (Studio): `${properties.length} properties • ${mode}`
}
```

`table` (schema type: `blogTable`)
```jsonc
{
  _type: "blogTable",
  title?: { en?: string, uk?: string, ru?: string, sq?: string, it?: string },
  rows: Array<{ cells: string[] }>,
  caption?: { en?: string, uk?: string, ru?: string, sq?: string, it?: string }
}
```

`FAQ` (schema type: `blogFaqBlock`)
```jsonc
{
  _type: "blogFaqBlock",
  title?: { en?: string, uk?: string, ru?: string, sq?: string, it?: string },
  items: Array<{
    question: { en?: string, uk?: string, ru?: string, sq?: string, it?: string },
    answer: { en?: string, uk?: string, ru?: string, sq?: string, it?: string }
  }>
}
```

`image` (inside `content.<locale>[]`)
```jsonc
{
  _type: "image",
  alt?: string,          // from image block `alt`
  caption?: string,      // from image block `caption`
  asset?: { url?: string }
}
```

### Localization Strategy
- All localized fields are returned as raw objects (no locale selection in GROQ).
- Frontend resolves localized values per UI locale using logic equivalent to:
  - `getLocalizedValue(field, locale)`: prefer `field[locale]`, then fall back (repo Studio previews use `en` first, then `sq`).
- For localized rich content:
  - `content[locale]` is the locale-specific block array.
  - Do not merge arrays across locales.

### Image Handling
- Sanity image assets are projected as:
  - `asset->{url}`
- Frontend should:
  - build image URLs from the returned `asset.url`
  - optionally apply transformations (crop/resize) using its existing Sanity image URL builder (e.g. `urlFor(image)`), if already present in the frontend codebase.

### Notes
- Legacy author fallbacks:
  - `blogPost.author` (reference) is the preferred source.
  - `authorName`, `authorRole`, `authorImage` remain present for older documents; when `author` exists in a document, Studio hides these legacy fields.
- `relatedPosts` and `blogRelatedPostsBlock.posts` are different fields:
  - `relatedPosts` is the top-level list on the post document
  - `blogRelatedPostsBlock` is a content block inside `content.<locale>[]`
- `relatedProperties` is aliased to `properties` in query 3.2 for frontend convenience.
- Limitations:
  - Portable text blocks (`_type: "block"`) are returned using Sanity Portable Text conventions; frontend rendering should use the existing portable text renderer in the frontend codebase.

### Expected Result
This file provides a frontend-ready blog schema contract:
- complete data shape for `blogPost`, including localized fields
- copy-paste GROQ queries to fetch listing, single post, categories, and authors
- block type mapping for custom rich-content blocks
