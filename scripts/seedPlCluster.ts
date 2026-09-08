/**
 * Seeds the SEO-04 Polish cluster: nine `landingPage` documents scoped to
 * `locales: ['pl']`. The data lives in scripts/lib/plCluster.ts and is gated by
 * scripts/lib/__tests__/plCluster.test.ts (body length, links, FAQ word
 * counts, meta lengths). Prices in the tables come from `zoneMetrics` at
 * render time through zonePriceTableAutoSection — never from this file.
 *
 * createIfNotExists by default, so Studio edits survive a re-run; --force
 * replaces. Dry run prints per-page counts and the create/skip decision.
 *
 * Run:
 *   npm run seed:pl-cluster
 *   npm run seed:pl-cluster -- --execute [--force]
 * Spec: docs/engineering/SPEC-seo04-pl-cluster-2026-09-03.md (workspace)
 */
import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'
import {CLUSTER_TAG, PAGES, type Para, type PlPage} from './lib/plCluster'

loadDotenv({path: path.resolve(process.cwd(), '.env')})
const args = process.argv.slice(2)
const execute = args.includes('--execute')
const force = args.includes('--force')
const client = createClient({
  projectId: (process.env.SANITY_PROJECT_ID || '').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: (process.env.SANITY_API_VERSION || '2024-01-01').trim(),
  token: process.env.SANITY_API_TOKEN?.trim(),
  useCdn: false,
})
const TODAY = new Date().toISOString().slice(0, 10)
const key = (s: string) => s.replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 40)

/** Portable Text with `link` marks: each linked phrase becomes its own span. */
function paraToBlock(p: Para, i: number, slug: string): Record<string, unknown> {
  const markDefs: Array<Record<string, unknown>> = []
  const children: Array<Record<string, unknown>> = []
  let rest = p.text
  let n = 0
  for (const l of p.links ?? []) {
    const at = rest.indexOf(l.phrase)
    if (at < 0) throw new Error(`${slug}: phrase "${l.phrase}" not in paragraph ${i}`)
    const defKey = `${key(slug)}-${i}-l${n}`
    markDefs.push({_key: defKey, _type: 'link', href: l.href})
    if (at > 0) children.push({_key: `${key(slug)}-${i}-s${n}a`, _type: 'span', marks: [], text: rest.slice(0, at)})
    children.push({_key: `${key(slug)}-${i}-s${n}b`, _type: 'span', marks: [defKey], text: l.phrase})
    rest = rest.slice(at + l.phrase.length)
    n += 1
  }
  if (rest) children.push({_key: `${key(slug)}-${i}-tail`, _type: 'span', marks: [], text: rest})
  return {_key: `${key(slug)}-b${i}`, _type: 'block', style: p.style ?? 'normal', markDefs, children}
}

const L = (pl: string, en = pl) => ({_type: 'localizedString', pl, en})
const T = (pl: string, en = pl) => ({_type: 'localizedText', pl, en})

export function buildDoc(p: PlPage): Record<string, unknown> {
  const sections: Array<Record<string, unknown>> = [
    {
      _key: 'hero',
      _type: 'heroSection',
      enabled: true,
      title: L(p.h1),
      subtitle: T(p.lead),
      // Without a shortLine the hero falls back to the theme's "Palm Springs,
      // CA" eyebrow (seen live on the ТЗ-16 hubs too, 2026-09-05).
      shortLine: L('Przewodnik DomLivo dla kupujących z Polski', 'DomLivo guide for Polish buyers'),
    },
    {
      _key: 'body',
      _type: 'seoTextSection',
      enabled: true,
      content: {_type: 'localizedBlockContent', pl: p.body.map((b, i) => paraToBlock(b, i, p.slug))},
    },
  ]
  if (p.priceTable) {
    sections.push({
      _key: 'prices',
      _type: 'zonePriceTableAutoSection',
      enabled: true,
      mode: 'compare',
      title: L(p.priceTable.title),
      subtitle: T(p.priceTable.subtitle),
      zones: p.priceTable.zones.map((id) => ({_key: key(id), _type: 'reference', _ref: id})),
    })
  }
  if (p.carousel) {
    sections.push({
      _key: 'listings',
      _type: 'propertyCarouselSection',
      enabled: true,
      mode: 'auto',
      title: L(p.carousel.title),
      filters: {
        ...(p.carousel.city ? {city: {_type: 'reference', _ref: p.carousel.city}} : {}),
        ...(p.carousel.deal ? {deal: p.carousel.deal} : {}),
      },
    })
  }
  sections.push(
    {
      _key: 'related',
      _type: 'relatedPagesAutoSection',
      enabled: true,
      mode: 'topicGuides',
      title: L('Inne przewodniki dla kupujących z Polski', 'More guides for Polish buyers'),
      topicTags: [CLUSTER_TAG],
      limit: 8,
    },
    {
      _key: 'faq',
      _type: 'faqSection',
      enabled: true,
      imageMode: 'withoutImage',
      title: L('Najczęstsze pytania', 'Frequently asked questions'),
      items: p.faq.map((f, i) => ({_key: `faq-${i}`, _type: 'localizedFaqItem', question: L(f.q), answer: T(f.a)})),
    },
    {
      _key: 'sources',
      _type: 'sourcesSection',
      enabled: true,
      title: L('Źródła i metodologia', 'Sources and methodology'),
      intro: T(
        'Liczby na tej stronie pochodzą z bazy badawczej DomLivo; przy każdym źródle podajemy naszą ocenę pewności.',
        'The figures on this page come from the DomLivo research base; each source carries our confidence rating.',
      ),
      sources: p.sources.map((s, i) => ({
        _key: `src-${i}`,
        _type: 'sourceItem',
        label: `${s.label} (pewność: ${s.confidence})`,
        url: s.url,
        ...(s.publisher ? {publisher: s.publisher} : {}),
      })),
    },
    {
      _key: 'cta',
      _type: 'ctaSection',
      enabled: true,
      title: L('Szukasz mieszkania w Albanii?', 'Looking for a home in Albania?'),
      description: T(
        'Przejrzyj aktualne oferty sprzedaży albo napisz do nas — odpowiadamy po polsku.',
        'Browse current listings or write to us.',
      ),
      cta: {href: '/sale', label: L('Zobacz oferty', 'See listings')},
      secondaryCta: {href: '/contacts', label: L('Skontaktuj się', 'Contact us')},
    },
  )
  return {
    _id: p.id,
    _type: 'landingPage',
    enabled: true,
    pageType: 'custom',
    slug: {_type: 'slug', current: p.slug},
    title: L(p.h1),
    cardDescription: T(p.lead),
    topicTags: p.tags,
    locales: ['pl'],
    contentUpdatedAt: TODAY,
    seo: {
      metaTitle: L(p.metaTitle),
      metaDescription: T(p.metaDescription),
      ogTitle: L(p.metaTitle),
      ogDescription: T(p.metaDescription),
    },
    pageSections: sections,
  }
}

async function main(): Promise<void> {
  const ids = PAGES.map((p) => p.id)
  const existing = new Set<string>(await client.fetch(`*[_id in $ids]._id`, {ids}))
  const refIds = Array.from(
    new Set(PAGES.flatMap((p) => [...(p.priceTable?.zones ?? []), ...(p.carousel?.city ? [p.carousel.city] : [])])),
  )
  const foundRefs = new Set<string>(await client.fetch(`*[_id in $ids]._id`, {ids: refIds}))
  const missingRefs = refIds.filter((id) => !foundRefs.has(id))
  if (missingRefs.length) throw new Error(`referenced zone/city documents do not exist: ${missingRefs.join(', ')}`)

  for (const p of PAGES) {
    buildDoc(p) // throws on a link phrase that is not in its paragraph
    const chars = p.body.filter((b) => b.style !== 'h2').map((b) => b.text).join(' ').length
    const links = p.body.flatMap((b) => b.links ?? []).length
    const state = existing.has(p.id) ? (force ? 'REPLACE' : 'skip (exists)') : 'create'
    console.log(
      `  ${state.padEnd(14)} /pl/guides/${p.slug.padEnd(44)} ${chars} chars, ${links} links, ${p.faq.length} FAQ, ${p.sources.length} sources`,
    )
  }
  if (!execute) {
    console.log('\nDry run. Re-run with --execute (add --force to replace existing documents).')
    return
  }
  for (const p of PAGES) {
    const doc = buildDoc(p) as {_id: string; _type: string}
    if (existing.has(p.id) && !force) continue
    if (force) await client.createOrReplace(doc)
    else await client.createIfNotExists(doc)
    console.log(`  wrote ${p.id}`)
  }
}
main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
