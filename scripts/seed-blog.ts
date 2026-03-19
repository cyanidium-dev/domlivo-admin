/**
 * Blog domain safe seed/backfill.
 * - Backfills missing author/SEO/localization (best-effort)
 * - Seeds a tiny deterministic set when the dataset is sparse
 * Run: `npm run seed:blog` (use `--dry` to preview only)
 */

import path from 'path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'
import {addKeysToArrayItems} from './lib/addKeysToArrayItems'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const projectId = (process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'g4aqp6ex').trim()
const dataset = (process.env.SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || 'production').trim()
const apiVersion = (process.env.SANITY_API_VERSION || '2024-01-01').trim()
const token = process.env.SANITY_API_TOKEN?.trim() || null

const isDry = process.argv.includes('--dry') || process.argv.includes('--dry-run')
if (!projectId || !dataset) throw new Error('SANITY_PROJECT_ID and SANITY_DATASET required')
if (!isDry && !token) throw new Error('SANITY_API_TOKEN required for writes (or run with --dry)')

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token: token || undefined,
})

type Locale = 'en' | 'uk' | 'ru' | 'sq' | 'it'
const LOCALES: Locale[] = ['en', 'uk', 'ru', 'sq', 'it']

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\p{L}\p{N}-]/gu, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'untitled'
  )
}

function isLocalizedObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
}

function asString(v: unknown): string | null {
  return typeof v === 'string' ? v : null
}

function toLocalizedString(value: string): Record<Locale, string> {
  const t = value.trim()
  return {en: t, uk: t, ru: t, sq: t, it: t}
}

function toLocalizedText(value: string): Record<Locale, string> {
  const t = value.trim()
  return {en: t, uk: t, ru: t, sq: t, it: t}
}

function englishFromField(field: unknown): string | null {
  if (typeof field === 'string') return field.trim() || null
  if (isLocalizedObject(field)) {
    const en = asString(field.en)
    return en && en.trim() ? en.trim() : null
  }
  return null
}

function mergeLocalizedString(oldValue: unknown, derived: Record<Locale, string>): Record<Locale, string> {
  if (!isLocalizedObject(oldValue)) return derived
  const out: Record<Locale, string> = {...derived}
  for (const loc of LOCALES) {
    const v = asString(oldValue[loc])
    if (v && v.trim()) out[loc] = v.trim()
  }
  return out
}

type Ref = {_ref: string}
type Category = {_id: string; slug?: string; title?: any; description?: any; order?: number; active?: boolean}
type Author = {_id: string; slug?: string; name?: string; role?: any; active?: boolean}

type PostMeta = {
  _id: string
  slug?: string
  title?: unknown
  subtitle?: unknown
  excerpt?: unknown
  categories?: Ref[]
  authorRef?: string | null
  authorName?: string | null
  authorRole?: string | null
  publishedAt?: string | null
  seo?: unknown
  hasLocalizedTitle: boolean
  hasLocalizedExcerpt: boolean
  hasLocalizedContent: boolean
  hasContent: boolean
  hasSeoEnglish: boolean
}

type PostFull = {
  _id: string
  title?: unknown
  subtitle?: unknown
  excerpt?: unknown
  content?: unknown
  seo?: unknown
}

function portableBlockParagraph(text: string, key: string) {
  return {
    _type: 'block',
    _key: key,
    style: 'normal',
    children: [{_type: 'span', _key: `${key}-s1`, text, marks: []}],
    markDefs: [],
  }
}

function portableBlockHeading(text: string, style: 'h2' | 'h3' | 'h4', key: string) {
  return {
    _type: 'block',
    _key: key,
    style,
    children: [{_type: 'span', _key: `${key}-s1`, text, marks: []}],
    markDefs: [],
  }
}

function portableBlockListItem(text: string, listType: 'bullet' | 'number', key: string) {
  return {
    _type: 'block',
    _key: key,
    style: 'normal',
    list: listType,
    level: 1,
    children: [{_type: 'span', _key: `${key}-s1`, text, marks: []}],
    markDefs: [],
  }
}

function buildSeedContent(opts: {keyPrefix: string; heading: string; relatedIds: string[]}) {
  const k = (s: string) => `${opts.keyPrefix}-${s}`

  const relatedBlock = {
    _type: 'blogRelatedPostsBlock',
    _key: k('related'),
    title: toLocalizedString('Read next'),
    posts: opts.relatedIds.map((id) => ({_type: 'reference', _ref: id})),
  }

  const blocks = [
    portableBlockHeading(opts.heading, 'h2', k('h2')),
    portableBlockParagraph(
      'Test post for frontend rendering.',
      k('p1'),
    ),
    portableBlockParagraph('Includes headings, lists, and custom blocks.', k('p2')),
    portableBlockHeading('Key points', 'h3', k('h3')),
    portableBlockListItem('Simple structure', 'bullet', k('li1')),
    portableBlockListItem('Deterministic seed content', 'bullet', k('li2')),
    portableBlockListItem('Block previews', 'bullet', k('li3')),
    {
      _type: 'blogCallout',
      _key: k('callout'),
      variant: 'tip',
      title: toLocalizedString('Practical advice'),
      content: [portableBlockParagraph('Tip: verify in Studio before publishing.', k('callout-p'))],
    },
    {
      _type: 'blogCtaBlock',
      _key: k('cta'),
      variant: 'primary',
      cta: {href: '/contact', label: toLocalizedString('Contact an advisor')},
    },
    {
      _type: 'blogTable',
      _key: k('table'),
      title: toLocalizedString('Quick comparison'),
      rows: addKeysToArrayItems([
        {cells: ['Item', 'What to check', 'Why it matters']},
        {cells: ['Title', 'Localized headline', 'Clear SEO signals']},
        {cells: ['Excerpt', 'Short summary', 'Good cards + snippets']},
      ]),
      caption: toLocalizedString('Example data for frontend rendering.'),
    },
    {
      _type: 'blogFaqBlock',
      _key: k('faq'),
      title: toLocalizedString('Frequently asked'),
      items: addKeysToArrayItems([
        {
          _type: 'localizedFaqItem',
          question: toLocalizedString('How do I get started?'),
          answer: toLocalizedText('Start by reviewing the basics and confirm requirements with a professional.'),
        },
      ]),
    },
    relatedBlock,
  ]

  return blocks
}

async function main() {
  const MIN_POSTS_FOR_TEST = Number(process.env.BLOG_SEED_MIN_POSTS || 3)
  const MIN_CATEGORIES_FOR_TEST = Number(process.env.BLOG_SEED_MIN_CATEGORIES || 2)
  const MIN_AUTHORS_FOR_TEST = Number(process.env.BLOG_SEED_MIN_AUTHORS || 1)

  const [categories, authors, postsMeta] = await Promise.all([
    client.fetch<Category[]>(
      `*[_type == "blogCategory" && !(_id match "drafts.*")]{_id,"slug":slug.current,title,description,order,active} | order(order asc)`,
    ),
    client.fetch<Author[]>(
      `*[_type == "blogAuthor" && !(_id match "drafts.*")]{_id,"slug":slug.current,name,active,role} | order(name asc)`,
    ),
    client.fetch<PostMeta[]>(
      `*[_type == "blogPost" && !(_id match "drafts.*")]{
        _id,
        "slug": slug.current,
        title, subtitle, excerpt,
        categories[]{_ref},
        "authorRef": author._ref,
        authorName, authorRole,
        publishedAt,
        seo,
        "hasLocalizedTitle": defined(title.en),
        "hasLocalizedExcerpt": defined(excerpt.en),
        "hasLocalizedContent": defined(content.en),
        "hasContent": defined(content),
        "hasSeoEnglish": defined(seo.metaTitle.en) && defined(seo.metaDescription.en)
      }`,
    ),
  ])

  console.log('Existing blog-domain counts:')
  console.log(`- blogCategory: ${categories.length}`)
  console.log(`- blogAuthor:   ${authors.length}`)
  console.log(`- blogPost:     ${postsMeta.length}`)

  const catsBySlug = new Map<string, Category>()
  for (const c of categories) if (c.slug) catsBySlug.set(c.slug, c)

  const authorsBySlug = new Map<string, Author>()
  for (const a of authors) if (a.slug) authorsBySlug.set(a.slug, a)

  const postsNeedingContentFetch = postsMeta
    .filter((p) => p.hasContent && !p.hasLocalizedContent)
    .map((p) => p._id)

  const postsFullById = new Map<string, PostFull>()
  if (postsNeedingContentFetch.length > 0) {
    const full = await client.fetch<PostFull[]>(
      `*[_type == "blogPost" && !(_id match "drafts.*") && _id in $ids]{_id,title,subtitle,excerpt,content,seo}`,
      {ids: postsNeedingContentFetch},
    )
    for (const p of full) postsFullById.set(p._id, p)
  }

  const datasetIsSparse =
    postsMeta.length < MIN_POSTS_FOR_TEST ||
    categories.length < MIN_CATEGORIES_FOR_TEST ||
    authors.length < MIN_AUTHORS_FOR_TEST

  // Fallback baseline author (only created when dataset is sparse)
  let fallbackAuthorRef: string | null = null
  const createdAuthors: Author[] = []
  if (datasetIsSparse && authors.length < MIN_AUTHORS_FOR_TEST) {
    const baselineName = 'Domlivo Team'
    const baselineSlug = slugify(baselineName)
    const existing = authorsBySlug.get(baselineSlug)
    if (existing) {
      fallbackAuthorRef = existing._id
    } else {
      const a: Author = {
        _id: `blogAuthor-${baselineSlug}`,
        slug: baselineSlug,
        name: baselineName,
        active: true,
        role: toLocalizedString('Real Estate Advisors'),
      }
      createdAuthors.push(a)
      authorsBySlug.set(baselineSlug, a)
      fallbackAuthorRef = a._id
    }
  }

  // Fallback baseline categories (only created when dataset is sparse)
  let baselineCategoryRef: string | null = null
  const createdCategories: Category[] = []
  if (datasetIsSparse && categories.length < MIN_CATEGORIES_FOR_TEST) {
    const baseline = [
      {slug: 'guides', order: 1, title: 'Guides', description: 'Buying and investment guides.'},
      {slug: 'market-news', order: 2, title: 'Market news', description: 'Trends and insights from the market.'},
    ]
    for (const c of baseline) {
      if (createdCategories.length >= MIN_CATEGORIES_FOR_TEST - categories.length) break
      if (catsBySlug.has(c.slug)) continue
      const created: Category = {
        _id: `blogCategory-${c.slug}`,
        slug: c.slug,
        title: toLocalizedString(c.title),
        description: toLocalizedText(c.description),
        order: c.order,
        active: true,
      }
      createdCategories.push(created)
      catsBySlug.set(c.slug, created)
    }
  }
  const baselineCats = [
    ...createdCategories,
    ...categories,
  ].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  if (baselineCats.length > 0) baselineCategoryRef = baselineCats[0]._id

  const patches: Array<{docId: string; set: Record<string, unknown>}> = []
  const patchReasons: Record<string, string[]> = {}
  const skipLogs: Array<{docId?: string; reason: string}> = []

  function logSkip(docId: string | undefined, reason: string) {
    skipLogs.push({docId, reason})
  }

  function addPatch(docId: string, set: Record<string, unknown>, reason: string) {
    patches.push({docId, set})
    if (!patchReasons[docId]) patchReasons[docId] = []
    patchReasons[docId].push(reason)
  }

  function ensureLocalizedFieldForPost(
    p: PostMeta,
    full: PostFull | undefined,
  ): {title?: Record<Locale, string>; excerpt?: Record<Locale, string>; content?: any} {
    const set: {title?: Record<Locale, string>; excerpt?: Record<Locale, string>; content?: any} = {}

    if (!p.hasLocalizedTitle && typeof p.title === 'string') {
      const t = p.title.trim()
      if (t) set.title = toLocalizedString(t)
    }
    if (!p.hasLocalizedExcerpt && typeof p.excerpt === 'string') {
      const e = p.excerpt.trim()
      if (e) set.excerpt = toLocalizedText(e)
    }

    if (!p.hasLocalizedContent && p.hasContent) {
      const contentVal = full?.content
      if (Array.isArray(contentVal)) {
        set.content = {
          en: contentVal,
          uk: contentVal,
          ru: contentVal,
          sq: contentVal,
          it: contentVal,
        }
      }
    }

    return set
  }

  function upsertSeoForPost(p: PostMeta): void {
    if (p.hasSeoEnglish) return

    const titleEn = englishFromField(p.title)
    const excerptEn = englishFromField(p.excerpt)
    if (!titleEn || !excerptEn) {
      logSkip(p._id, 'SEO missing and cannot derive English title/excerpt')
      return
    }

    const oldSeo = isLocalizedObject(p.seo) ? (p.seo as Record<string, unknown>) : {}

    const derivedMetaTitle = isLocalizedObject(p.title) ? ((): Record<Locale, string> => {
      const t = p.title as Record<string, unknown>
      const out: Record<Locale, string> = {...toLocalizedString(titleEn)}
      for (const loc of LOCALES) {
        const v = asString(t[loc])
        if (v && v.trim()) out[loc] = v.trim()
      }
      return out
    })() : toLocalizedString(titleEn)

    const derivedMetaDescription = isLocalizedObject(p.excerpt) ? ((): Record<Locale, string> => {
      const e = p.excerpt as Record<string, unknown>
      const out: Record<Locale, string> = {...toLocalizedText(excerptEn)}
      for (const loc of LOCALES) {
        const v = asString(e[loc])
        if (v && v.trim()) out[loc] = v.trim()
      }
      return out
    })() : toLocalizedText(excerptEn)

    const seo = {
      ...oldSeo,
      metaTitle: mergeLocalizedString(oldSeo.metaTitle, derivedMetaTitle),
      metaDescription: mergeLocalizedString(oldSeo.metaDescription, derivedMetaDescription),
      ogTitle: mergeLocalizedString(oldSeo.ogTitle, derivedMetaTitle),
      ogDescription: mergeLocalizedString(oldSeo.ogDescription, derivedMetaDescription),
      noIndex: typeof oldSeo.noIndex === 'boolean' ? oldSeo.noIndex : false,
      noFollow: typeof oldSeo.noFollow === 'boolean' ? oldSeo.noFollow : false,
    }

    addPatch(p._id, {seo}, 'SEO backfill (English meta)')
  }

  function inferCategoryRefByText(text: string): string | null {
    const t = text.toLowerCase()
    for (const c of catsBySlug.values()) {
      if (c.slug && t.includes(c.slug.toLowerCase())) return c._id
    }
    for (const c of catsBySlug.values()) {
      const en = isLocalizedObject(c.title) ? asString((c.title as Record<string, unknown>).en) : null
      if (en && t.includes(en.toLowerCase())) return c._id
    }
    return null
  }

  function backfillAuthorRef(p: PostMeta): void {
    if (p.authorRef && p.authorRef.trim()) return

    const legacyName = (p.authorName || '').trim()
    if (!legacyName) {
      if (fallbackAuthorRef) {
        addPatch(p._id, {author: {_type: 'reference', _ref: fallbackAuthorRef}}, 'author backfill (fallback)')
      } else {
        logSkip(p._id, 'author missing and authorName empty; no fallback author available')
      }
      return
    }

    const slug = slugify(legacyName)
    const existing = authorsBySlug.get(slug)
    if (existing) {
      addPatch(p._id, {author: {_type: 'reference', _ref: existing._id}}, 'author backfill (legacy authorName match)')
      return
    }

    // Create minimal author document
    const created: Author = {
      _id: `blogAuthor-${slug}`,
      slug,
      name: legacyName,
      active: true,
      role: p.authorRole ? toLocalizedString(p.authorRole.trim()) : undefined,
    }
    createdAuthors.push(created)
    authorsBySlug.set(slug, created)
    addPatch(p._id, {author: {_type: 'reference', _ref: created._id}}, 'author backfill (created from legacy authorName)')
  }

  function backfillCategories(p: PostMeta): void {
    const hasAny = Array.isArray(p.categories) && p.categories.length > 0
    if (hasAny) return
    if (!baselineCategoryRef) {
      logSkip(p._id, 'categories missing and no baseline categories available')
      return
    }

    const titleEn = englishFromField(p.title) || ''
    const excerptEn = englishFromField(p.excerpt) || ''
    const inferText = `${titleEn} ${excerptEn}`.trim()
    const inferred = inferCategoryRefByText(inferText)
    const target = inferred || baselineCategoryRef
    addPatch(p._id, {categories: [{_type: 'reference', _ref: target}]}, inferred ? 'categories backfill (inferred)' : 'categories backfill (baseline default)')
  }

  // Collect patches
  for (const p of postsMeta) {
    const full = postsFullById.get(p._id)
    const localizedSet = ensureLocalizedFieldForPost(p, full)

    if (Object.keys(localizedSet).length > 0) {
      const set: Record<string, unknown> = {}
      if (localizedSet.title) set.title = localizedSet.title
      if (localizedSet.excerpt) set.excerpt = localizedSet.excerpt
      if (localizedSet.content) set.content = localizedSet.content
      addPatch(p._id, set, 'field-level localization backfill')
    }

    backfillAuthorRef(p)
    backfillCategories(p)
    upsertSeoForPost(p)
  }

  // Write patches
  const tx = client.transaction()
  for (const c of createdCategories) {
    tx.createOrReplace({
      _id: c._id,
      _type: 'blogCategory',
      title: c.title,
      slug: {current: c.slug},
      description: c.description,
      order: c.order,
      active: true,
    })
  }
  for (const a of createdAuthors) {
    tx.createOrReplace({
      _id: a._id,
      _type: 'blogAuthor',
      name: a.name,
      slug: {current: a.slug},
      active: true,
      ...(a.role ? {role: a.role} : {}),
    })
  }
  for (const patch of patches) {
    tx.patch(patch.docId, (p) => p.set(patch.set))
  }

  if (!isDry && (createdAuthors.length + createdCategories.length + patches.length > 0)) {
    await tx.commit()
  }

  console.log('Backfill summary:')
  console.log(`- patches:          ${patches.length}`)
  console.log(`- authors created: ${createdAuthors.length}`)
  console.log(`- categories created: ${createdCategories.length}`)
  console.log(`- skipped:         ${skipLogs.length}`)

  if (skipLogs.length > 0) {
    console.log('Skip reasons (first 20):')
    for (const s of skipLogs.slice(0, 20)) console.log(`  - ${s.docId || '(unknown)'}: ${s.reason}`)
    if (skipLogs.length > 20) console.log(`  ...and ${skipLogs.length - 20} more`)
  }

  // Seeding decisions (skip entirely in dry mode)
  if (isDry) return

  const [postCountAfter, categoryCountAfter, authorCountAfter] = await Promise.all([
    client.fetch<number>(`count(*[_type=="blogPost" && !(_id match "drafts.*")])`),
    client.fetch<number>(`count(*[_type=="blogCategory" && !(_id match "drafts.*")])`),
    client.fetch<number>(`count(*[_type=="blogAuthor" && !(_id match "drafts.*")])`),
  ])

  const finalSparse =
    postCountAfter < MIN_POSTS_FOR_TEST ||
    categoryCountAfter < MIN_CATEGORIES_FOR_TEST ||
    authorCountAfter < MIN_AUTHORS_FOR_TEST

  if (!finalSparse) {
    console.log('Dataset is already sufficient for frontend testing; seeding skipped.')
    return
  }

  const [seedCategories, seedAuthors] = await Promise.all([
    client.fetch<Category[]>(
      `*[_type=="blogCategory" && !(_id match "drafts.*")]{_id,"slug":slug.current,title,order,active} | order(order asc)`,
    ),
    client.fetch<Author[]>(
      `*[_type=="blogAuthor" && !(_id match "drafts.*")]{_id,"slug":slug.current,name,role,active} | order(name asc)`,
    ),
  ])

  const seedCats = seedCategories.slice(0, Math.max(1, MIN_CATEGORIES_FOR_TEST))
  const seedAuthor = seedAuthors[0]
  if (!seedAuthor || seedCats.length === 0) throw new Error('Unable to seed: missing author/categories')

  const existingSlugs = new Set(postsMeta.map((p) => p.slug).filter((s): s is string => typeof s === 'string' && s.trim()))

  const seedPostDefinitions = [
    {
      slug: 'buying-property-albania-guide',
      title: 'Buying Property in Albania',
      excerpt: 'A practical guide for foreign buyers: process and requirements.',
      categoryIndex: 0,
    },
    {
      slug: 'best-districts-in-tirana',
      title: 'Best Districts in Tirana',
      excerpt: 'Areas with strong demand, connectivity, and investment potential.',
      categoryIndex: 0,
    },
    {
      slug: 'market-trends-2026',
      title: 'Market Trends 2026',
      excerpt: 'Demand patterns, pricing drivers, and rental opportunities.',
      categoryIndex: 1,
    },
  ] as const

  const seedPostIds = seedPostDefinitions.map((d) => `blogPost-${d.slug}`)

  const seedTx = client.transaction()
  let createdSeedPosts = 0

  for (let i = 0; i < seedPostDefinitions.length; i++) {
    const def = seedPostDefinitions[i]
    if (existingSlugs.has(def.slug)) continue

    const relatedIds = seedPostIds.filter((id) => id !== seedPostIds[i]).slice(0, 2)
    const contentBlocksEn = buildSeedContent({
      keyPrefix: `seed-${def.slug}`,
      heading: def.title,
      relatedIds,
    })

    const localizedContent = {
      en: contentBlocksEn,
      uk: contentBlocksEn,
      ru: contentBlocksEn,
      sq: contentBlocksEn,
      it: contentBlocksEn,
    }

    const categoryId = seedCats[def.categoryIndex] ? seedCats[def.categoryIndex]._id : seedCats[0]._id
    seedTx.createOrReplace({
      _id: `blogPost-${def.slug}`,
      _type: 'blogPost',
      title: toLocalizedString(def.title),
      subtitle: undefined,
      slug: {current: def.slug},
      excerpt: toLocalizedText(def.excerpt),
      content: localizedContent,
      publishedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      categories: [{_type: 'reference', _ref: categoryId}],
      author: {_type: 'reference', _ref: seedAuthor._id},
      relatedPosts: relatedIds.map((id) => ({_type: 'reference', _ref: id})),
      seo: {
        metaTitle: toLocalizedString(def.title),
        metaDescription: toLocalizedText(def.excerpt),
        ogTitle: toLocalizedString(def.title),
        ogDescription: toLocalizedText(def.excerpt),
        noIndex: false,
        noFollow: false,
      },
      featured: i === 0,
    })

    createdSeedPosts++
  }

  if (createdSeedPosts > 0) await seedTx.commit()
  console.log('Seeding summary:')
  console.log(`- posts created: ${createdSeedPosts}`)
}

main().catch((err: unknown) => {
  console.error('Seed-blog failed:', err)
  process.exit(1)
})

