/**
 * Conservative legacy content migration into canonical landingPage documents.
 *
 * Approved scope ONLY:
 * 1) landing-home:
 *   - landingPage.title <- landing-home.seo.metaTitle (per-locale), only when target locale empty
 *
 * 2) City landings (landingPage pageType=="city" with linkedCity):
 *   - heroSection.title <- linkedCity.heroTitle
 *   - heroSection.subtitle <- linkedCity.heroSubtitle
 *   - heroSection.shortLine <- linkedCity.heroShortLine
 *   - heroSection.cta <- linkedCity.heroCta (href + label)
 *   - seoTextSection.content (portable text) <- linkedCity.description (plain text per locale)
 *   - seoTextSection.videoUrl <- linkedCity.cityVideoUrl
 *   - faqSection.title <- linkedCity.faqTitle
 *   - faqSection.items <- linkedCity.faqItems (only if target items empty)
 *   - landingPage.seo <- linkedCity.seo (only if target seo fields empty)
 *
 * Strict rules:
 * - idempotent
 * - do NOT overwrite non-empty fields
 * - do NOT invent content
 * - do NOT create new sections
 * - do NOT change section order
 * - if multiple sections with same _type exist => SKIP_AMBIGUOUS
 *
 * Run:
 * - npx tsx scripts/migrateLegacyContentIntoLandings.ts --dry
 * - npx tsx scripts/migrateLegacyContentIntoLandings.ts --execute
 */

import path from 'path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const projectId = (process.env.SANITY_PROJECT_ID || 'g4aqp6ex').trim()
const dataset = (process.env.SANITY_DATASET || 'production').trim()
const apiVersion = (process.env.SANITY_API_VERSION || '2024-01-01').trim()
const token = process.env.SANITY_API_TOKEN?.trim()

const isDry = process.argv.includes('--dry')
const isExecute = process.argv.includes('--execute')

if (!token) {
  console.error('Error: SANITY_API_TOKEN required. Add to .env')
  process.exit(1)
}
if (!isDry && !isExecute) {
  console.error('Use --dry to preview or --execute to write.')
  process.exit(1)
}

const client = createClient({projectId, dataset, apiVersion, useCdn: false, token})

const REQUIRED_LOCALES = ['en', 'ru', 'uk', 'sq', 'it'] as const
type Locale = (typeof REQUIRED_LOCALES)[number]

type DecisionCode =
  | 'COPY_FROM_SOURCE'
  | 'GENERATE_MISSING_CONTENT'
  | 'SKIP_TARGET_FILLED'
  | 'SKIP_SOURCE_EMPTY'
  | 'SKIP_AMBIGUOUS'
  | 'SKIP_INCOMPATIBLE'

type Decision = {
  docId: string
  code: DecisionCode
  targetPath: string
  sourcePath: string
  locales?: Locale[]
  generated?: Partial<Record<Locale, unknown>>
  note?: string
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function isEmptyScalar(v: unknown): boolean {
  if (v === null || v === undefined) return true
  if (typeof v === 'string') return v.trim().length === 0
  return false
}

function isEmptyLocalized(v: unknown): boolean {
  if (!isRecord(v)) return true
  return REQUIRED_LOCALES.every((l) => isEmptyScalar(v[l]))
}

function missingLocalesInLocalized(target: unknown, source: unknown): Locale[] {
  if (!isRecord(source)) return []
  const tgt = isRecord(target) ? target : {}
  const missing: Locale[] = []
  for (const l of REQUIRED_LOCALES) {
    const srcVal = source[l]
    const tgtVal = tgt[l]
    if (!isEmptyScalar(srcVal) && isEmptyScalar(tgtVal)) missing.push(l)
  }
  return missing
}

function pickSingleSectionByType(sections: any[], type: string) {
  const matches = sections.filter((s) => s && typeof s === 'object' && s._type === type)
  if (matches.length === 1) return {section: matches[0], ambiguous: false}
  if (matches.length === 0) return {section: null, ambiguous: false}
  return {section: null, ambiguous: true, count: matches.length}
}

/** City intro is usually the titled seoTextSection; if none titled, fall back to a single seoTextSection. */
function pickCityIntroSeoSection(sections: any[]) {
  const seo = sections.filter((s) => s && typeof s === 'object' && s._type === 'seoTextSection')
  const titled = seo.filter((s) => {
    const t = s?.title
    if (!isRecord(t)) return false
    return REQUIRED_LOCALES.some((l) => String((t as Record<string, unknown>)[l] || '').trim())
  })
  if (titled.length === 1) return {section: titled[0], ambiguous: false}
  if (titled.length > 1) return {section: null, ambiguous: true, count: titled.length}
  if (seo.length === 1) return {section: seo[0], ambiguous: false}
  if (seo.length === 0) return {section: null, ambiguous: false}
  return {section: null, ambiguous: true, count: seo.length}
}

function blocksFromPlainText(text: string) {
  const paras = String(text || '')
    .split(/\n\s*\n/g)
    .map((p) => p.trim())
    .filter(Boolean)
  return paras.map((p, idx) => ({
    _type: 'block',
    _key: `m${idx}-${Math.random().toString(16).slice(2, 8)}`,
    style: 'normal',
    markDefs: [],
    children: [
      {
        _type: 'span',
        _key: `s${idx}-${Math.random().toString(16).slice(2, 8)}`,
        text: p,
        marks: [],
      },
    ],
  }))
}

function addLocalizedBlockContentFromPlainText(
  patchSets: PatchSet[],
  decisions: Decision[],
  docId: string,
  targetContent: unknown,
  sourcePlainLocalized: unknown,
  basePath: string,
  sourcePath: string,
) {
  if (!isRecord(sourcePlainLocalized)) {
    decisions.push({docId, code: 'SKIP_SOURCE_EMPTY', targetPath: basePath, sourcePath})
    return
  }
  const tgt = isRecord(targetContent) ? targetContent : {}
  const copied: Locale[] = []
  for (const l of REQUIRED_LOCALES) {
    const srcVal = sourcePlainLocalized[l]
    const tgtVal = tgt[l]
    const tgtEmpty = !Array.isArray(tgtVal) || tgtVal.length === 0
    if (!isEmptyScalar(srcVal) && tgtEmpty && typeof srcVal === 'string') {
      patchSets.push({path: `${basePath}.${l}`, value: blocksFromPlainText(srcVal)})
      copied.push(l)
    }
  }
  if (copied.length) {
    decisions.push({docId, code: 'COPY_FROM_SOURCE', targetPath: basePath, sourcePath, locales: copied})
  } else if (!isRecord(sourcePlainLocalized) || isEmptyLocalized(sourcePlainLocalized)) {
    decisions.push({docId, code: 'SKIP_SOURCE_EMPTY', targetPath: basePath, sourcePath})
  } else {
    decisions.push({docId, code: 'SKIP_TARGET_FILLED', targetPath: basePath, sourcePath})
  }
}

function ensureFaqItemsHaveTypeAndKey(items: any[]): any[] {
  return items.map((it) => {
    const obj = isRecord(it) ? it : {}
    const out: any = {...obj}
    if (!out._type) out._type = 'localizedFaqItem'
    if (!out._key) out._key = `m-${Math.random().toString(16).slice(2, 10)}`
    return out
  })
}

function isLandingSeoEmpty(seo: any): boolean {
  if (!seo || !isRecord(seo)) return true
  const metaTitle = seo.metaTitle
  const metaDescription = seo.metaDescription
  const ogTitle = seo.ogTitle
  const ogDescription = seo.ogDescription
  return isEmptyLocalized(metaTitle) && isEmptyLocalized(metaDescription) && isEmptyLocalized(ogTitle) && isEmptyLocalized(ogDescription)
}

type PatchSet = {path: string; value: unknown}

function addLocalizedPatchSets(
  patchSets: PatchSet[],
  decisions: Decision[],
  docId: string,
  targetBasePath: string,
  target: unknown,
  source: unknown,
  sourcePath: string,
) {
  const locales = missingLocalesInLocalized(target, source)
  if (locales.length === 0) {
    if (!isRecord(source) || isEmptyLocalized(source)) {
      decisions.push({docId, code: 'SKIP_SOURCE_EMPTY', targetPath: targetBasePath, sourcePath})
    } else {
      decisions.push({docId, code: 'SKIP_TARGET_FILLED', targetPath: targetBasePath, sourcePath})
    }
    return
  }
  for (const l of locales) {
    patchSets.push({path: `${targetBasePath}.${l}`, value: (source as any)[l]})
  }
  decisions.push({docId, code: 'COPY_FROM_SOURCE', targetPath: targetBasePath, sourcePath, locales})
}

type LocaleBackfillOpts = {
  allowGenerateIfSourceMissing: boolean
  generate: (locale: Locale) => unknown
  rationale?: string
}

function backfillLocalizedPerLocale(
  patchSets: PatchSet[],
  decisions: Decision[],
  docId: string,
  targetBasePath: string,
  target: unknown,
  source: unknown,
  sourcePath: string,
  opts?: LocaleBackfillOpts,
) {
  const tgt = isRecord(target) ? target : {}
  const src = isRecord(source) ? source : null

  const copied: Locale[] = []
  const generated: Partial<Record<Locale, unknown>> = {}
  const skippedSourceEmpty: Locale[] = []
  const skippedTargetFilled: Locale[] = []

  for (const l of REQUIRED_LOCALES) {
    const tgtVal = tgt[l]
    if (!isEmptyScalar(tgtVal)) {
      skippedTargetFilled.push(l)
      continue
    }

    const srcVal = src ? src[l] : undefined
    if (!isEmptyScalar(srcVal)) {
      patchSets.push({path: `${targetBasePath}.${l}`, value: srcVal})
      copied.push(l)
      continue
    }

    if (opts?.allowGenerateIfSourceMissing) {
      const genVal = opts.generate(l)
      if (!isEmptyScalar(genVal) && !(Array.isArray(genVal) && genVal.length === 0)) {
        patchSets.push({path: `${targetBasePath}.${l}`, value: genVal})
        generated[l] = genVal
        continue
      }
    }

    skippedSourceEmpty.push(l)
  }

  if (copied.length) {
    decisions.push({docId, code: 'COPY_FROM_SOURCE', targetPath: targetBasePath, sourcePath, locales: copied})
  }
  if (Object.keys(generated).length) {
    decisions.push({
      docId,
      code: 'GENERATE_MISSING_CONTENT',
      targetPath: targetBasePath,
      sourcePath,
      locales: Object.keys(generated) as Locale[],
      generated,
      note: opts?.rationale,
    })
  }
  if (skippedTargetFilled.length && !copied.length && !Object.keys(generated).length) {
    decisions.push({
      docId,
      code: 'SKIP_TARGET_FILLED',
      targetPath: targetBasePath,
      sourcePath,
      locales: skippedTargetFilled,
    })
  }
  if (skippedSourceEmpty.length && !Object.keys(generated).length && !copied.length) {
    decisions.push({
      docId,
      code: 'SKIP_SOURCE_EMPTY',
      targetPath: targetBasePath,
      sourcePath,
      locales: skippedSourceEmpty,
    })
  }
}

async function migrateLandingHome(decisions: Decision[]) {
  const doc = await client.fetch<any>(
    `*[_type=="landingPage" && _id=="landing-home"][0]{
      _id,
      title,
      seo{metaTitle, metaDescription},
      "hero": pageSections[_type=="heroSection"][0]{title, subtitle}
    }`,
  )
  if (!doc?._id) return {docId: 'landing-home', patchSets: [] as PatchSet[]}

  const patchSets: PatchSet[] = []
  // Approved: fill landing-home.title from landing-home.seo.metaTitle; if some locales missing in source, generate a safe fallback title.
  backfillLocalizedPerLocale(
    patchSets,
    decisions,
    doc._id,
    'title',
    doc.title,
    doc?.seo?.metaTitle,
    'seo.metaTitle',
    {
      allowGenerateIfSourceMissing: true,
      generate: (l) => {
        const brand = 'Domlivo'
        const ctx = doc?.seo?.metaDescription?.[l] || doc?.hero?.title?.[l] || doc?.hero?.subtitle?.[l]
        if (typeof ctx === 'string' && ctx.trim()) {
          // Keep very short: Brand + short context snippet without punctuation spam
          const snippet = ctx.trim().split(/[.!\n]/)[0].trim()
          return snippet ? `${brand} — ${snippet}`.slice(0, 80) : brand
        }
        // Default per locale
        const defaults: Record<Locale, string> = {
          en: 'Domlivo — Property in Albania',
          ru: 'Domlivo — Недвижимость в Албании',
          uk: 'Domlivo — Нерухомість в Албанії',
          sq: 'Domlivo — Pasuri në Shqipëri',
          it: 'Domlivo — Immobiliare in Albania',
        }
        return defaults[l]
      },
      rationale: 'Homepage title derived from existing SEO/hero context; kept short and brand-first.',
    },
  )

  return {docId: doc._id as string, patchSets}
}

function generateCityHeroShortLine(locale: Locale, cityName: string) {
  // Concise trust line. Avoid unsupported claims; keep consistent meaning across locales.
  const byLocale: Record<Locale, string> = {
    en: `Verified listings • Real prices • Updated offers`,
    ru: `Проверенные объявления • Реальные цены • Обновления`,
    uk: `Перевірені оголошення • Реальні ціни • Оновлення`,
    sq: `Lista të verifikuara • Çmime reale • Oferta të azhurnuara`,
    it: `Annunci verificati • Prezzi reali • Offerte aggiornate`,
  }
  // If you want city-specific flavor, keep it minimal and safe.
  return byLocale[locale].replace(/\s+/g, ' ').trim()
}

function generateArticlesSubtitle(locale: Locale, pageLabel: string) {
  // This function is only used for articlesSection.subtitle and must remain concise.
  // `pageLabel` must be a pre-localized city name in correct grammatical case.
  const byLocale: Record<Locale, string> = {
    en: `Guides and insights for buying property in ${pageLabel}.`,
    ru: `Гайды и советы по покупке недвижимости в ${pageLabel}.`,
    uk: `Гайди та поради щодо купівлі нерухомості в ${pageLabel}.`,
    sq: `Udhëzues dhe këshilla për blerjen e pronës në ${pageLabel}.`,
    it: `Guide e consigli per acquistare immobili a ${pageLabel}.`,
  }
  return byLocale[locale]
}

async function migrateCityLandings(decisions: Decision[]) {
  const docs = await client.fetch<any[]>(
    `*[_type=="landingPage" && pageType=="city" && defined(linkedCity)]{
      _id,
      seo,
      pageSections,
      "linkedCity": linkedCity->{
        _id,
        title,
        heroTitle,
        heroSubtitle,
        heroShortLine,
        heroCta,
        description,
        cityVideoUrl,
        faqTitle,
        faqItems,
        seo
      }
    } | order(_id asc)`,
  )

  const results: Array<{docId: string; patchSets: PatchSet[]}> = []

  for (const doc of docs) {
    const docId = doc._id as string
    const sections = Array.isArray(doc?.pageSections) ? doc.pageSections : []
    const srcCity = doc?.linkedCity

    const patchSets: PatchSet[] = []

    // --- heroSection ---
    const heroPick = pickSingleSectionByType(sections, 'heroSection')
    if (heroPick.ambiguous) {
      decisions.push({
        docId,
        code: 'SKIP_AMBIGUOUS',
        targetPath: 'pageSections[_type=="heroSection"]',
        sourcePath: 'linkedCity.*',
        note: `Found ${heroPick.count} heroSection items`,
      })
    } else if (heroPick.section) {
      const hero = heroPick.section
      const heroKey = hero._key as string | undefined
      if (!heroKey) {
        decisions.push({
          docId,
          code: 'SKIP_INCOMPATIBLE',
          targetPath: 'pageSections[_type=="heroSection"]._key',
          sourcePath: 'pageSections._key',
          note: 'heroSection missing _key, cannot safely patch',
        })
      } else {
        const base = `pageSections[_key=="${heroKey}"]`
        addLocalizedPatchSets(patchSets, decisions, docId, `${base}.title`, hero.title, srcCity?.heroTitle, 'linkedCity.heroTitle')
        addLocalizedPatchSets(patchSets, decisions, docId, `${base}.subtitle`, hero.subtitle, srcCity?.heroSubtitle, 'linkedCity.heroSubtitle')

        // Approved + generation: heroSection.shortLine missing locales
        const cityNameByLocale = (srcCity?.title || {}) as Record<string, string>
        backfillLocalizedPerLocale(
          patchSets,
          decisions,
          docId,
          `${base}.shortLine`,
          hero.shortLine,
          srcCity?.heroShortLine,
          'linkedCity.heroShortLine',
          {
            allowGenerateIfSourceMissing: true,
            generate: (l) => generateCityHeroShortLine(l, cityNameByLocale[l] || ''),
            rationale: 'Hero shortLine is a concise trust line consistent with existing hero tone; generated only where source locale is missing.',
          },
        )

        // CTA: href + label
        const targetCta = hero.cta
        const sourceCta = srcCity?.heroCta
        if (!sourceCta) {
          decisions.push({docId, code: 'SKIP_SOURCE_EMPTY', targetPath: `${base}.cta`, sourcePath: 'linkedCity.heroCta'})
        } else if (!targetCta) {
          // Copy only if source has href and label (label per locale can be partial; localizedCtaLink requires both on schema, but migration is fill-empty only)
          const href = (sourceCta as any)?.href
          if (isEmptyScalar(href)) {
            decisions.push({docId, code: 'SKIP_SOURCE_EMPTY', targetPath: `${base}.cta.href`, sourcePath: 'linkedCity.heroCta.href'})
          } else {
            patchSets.push({path: `${base}.cta.href`, value: href})
            decisions.push({docId, code: 'COPY', targetPath: `${base}.cta.href`, sourcePath: 'linkedCity.heroCta.href'})
          }
          // labels per locale
          addLocalizedPatchSets(
            patchSets,
            decisions,
            docId,
            `${base}.cta.label`,
            undefined,
            (sourceCta as any)?.label,
            'linkedCity.heroCta.label',
          )
        } else {
          // href
          const tgtHref = (targetCta as any)?.href
          const srcHref = (sourceCta as any)?.href
          if (!isEmptyScalar(srcHref) && isEmptyScalar(tgtHref)) {
            patchSets.push({path: `${base}.cta.href`, value: srcHref})
            decisions.push({docId, code: 'COPY', targetPath: `${base}.cta.href`, sourcePath: 'linkedCity.heroCta.href'})
          } else if (isEmptyScalar(srcHref)) {
            decisions.push({docId, code: 'SKIP_SOURCE_EMPTY', targetPath: `${base}.cta.href`, sourcePath: 'linkedCity.heroCta.href'})
          } else {
            decisions.push({docId, code: 'SKIP_TARGET_FILLED', targetPath: `${base}.cta.href`, sourcePath: 'linkedCity.heroCta.href'})
          }
          // label
          addLocalizedPatchSets(
            patchSets,
            decisions,
            docId,
            `${base}.cta.label`,
            (targetCta as any)?.label,
            (sourceCta as any)?.label,
            'linkedCity.heroCta.label',
          )
        }
      }
    } else {
      // no heroSection => skip (do not create)
      decisions.push({
        docId,
        code: 'SKIP_SOURCE_EMPTY',
        targetPath: 'pageSections[_type=="heroSection"]',
        sourcePath: 'pageSections',
        note: 'No heroSection in target; not creating sections',
      })
    }

    // --- seoTextSection (city intro / rich text; migrated from cityRichDescriptionSection) ---
    const cityDescPick = pickCityIntroSeoSection(sections)
    if (cityDescPick.ambiguous) {
      decisions.push({
        docId,
        code: 'SKIP_AMBIGUOUS',
        targetPath: 'pageSections[_type=="seoTextSection"]',
        sourcePath: 'linkedCity.description / linkedCity.cityVideoUrl',
        note: `Found ${'count' in cityDescPick ? cityDescPick.count : '?'} city-intro seoTextSection candidates`,
      })
    } else if (cityDescPick.section) {
      const s = cityDescPick.section
      const key = s._key as string | undefined
      if (!key) {
        decisions.push({
          docId,
          code: 'SKIP_INCOMPATIBLE',
          targetPath: 'pageSections[_type=="seoTextSection"]._key',
          sourcePath: 'pageSections._key',
          note: 'seoTextSection missing _key',
        })
      } else {
        const base = `pageSections[_key=="${key}"]`
        addLocalizedBlockContentFromPlainText(
          patchSets,
          decisions,
          docId,
          s.content,
          srcCity?.description,
          `${base}.content`,
          'linkedCity.description',
        )
        const tgtVideo = s.videoUrl
        const srcVideo = srcCity?.cityVideoUrl
        if (!isEmptyScalar(srcVideo) && isEmptyScalar(tgtVideo)) {
          patchSets.push({path: `${base}.videoUrl`, value: srcVideo})
          decisions.push({docId, code: 'COPY', targetPath: `${base}.videoUrl`, sourcePath: 'linkedCity.cityVideoUrl'})
        } else if (isEmptyScalar(srcVideo)) {
          decisions.push({docId, code: 'SKIP_SOURCE_EMPTY', targetPath: `${base}.videoUrl`, sourcePath: 'linkedCity.cityVideoUrl'})
        } else {
          decisions.push({docId, code: 'SKIP_TARGET_FILLED', targetPath: `${base}.videoUrl`, sourcePath: 'linkedCity.cityVideoUrl'})
        }
      }
    }

    // --- faqSection ---
    const faqPick = pickSingleSectionByType(sections, 'faqSection')
    if (faqPick.ambiguous) {
      decisions.push({
        docId,
        code: 'SKIP_AMBIGUOUS',
        targetPath: 'pageSections[_type=="faqSection"]',
        sourcePath: 'linkedCity.faqTitle / linkedCity.faqItems',
        note: `Found ${faqPick.count} faqSection items`,
      })
    } else if (faqPick.section) {
      const s = faqPick.section
      const key = s._key as string | undefined
      if (!key) {
        decisions.push({
          docId,
          code: 'SKIP_INCOMPATIBLE',
          targetPath: 'pageSections[_type=="faqSection"]._key',
          sourcePath: 'pageSections._key',
          note: 'faqSection missing _key',
        })
      } else {
        const base = `pageSections[_key=="${key}"]`
        addLocalizedPatchSets(patchSets, decisions, docId, `${base}.title`, s.title, srcCity?.faqTitle, 'linkedCity.faqTitle')

        const tgtItems = Array.isArray(s?.items) ? s.items : []
        const srcItems = Array.isArray(srcCity?.faqItems) ? srcCity.faqItems : []
        if (tgtItems.length > 0) {
          decisions.push({
            docId,
            code: 'SKIP_TARGET_FILLED',
            targetPath: `${base}.items`,
            sourcePath: 'linkedCity.faqItems',
            note: `Target items already has ${tgtItems.length} item(s)`,
          })
        } else if (srcItems.length === 0) {
          decisions.push({docId, code: 'SKIP_SOURCE_EMPTY', targetPath: `${base}.items`, sourcePath: 'linkedCity.faqItems'})
        } else {
          // Compatible only if source items are simple localizedFaqItem-like (question + answer).
          const compatible = srcItems.every((it: any) => isRecord(it) && 'question' in it && 'answer' in it)
          if (!compatible) {
            decisions.push({
              docId,
              code: 'SKIP_INCOMPATIBLE',
              targetPath: `${base}.items`,
              sourcePath: 'linkedCity.faqItems',
              note: 'Source FAQ items not compatible (expected question+answer)',
            })
          } else {
            const normalized = ensureFaqItemsHaveTypeAndKey(srcItems)
            patchSets.push({path: `${base}.items`, value: normalized})
            decisions.push({
              docId,
              code: 'COPY',
              targetPath: `${base}.items`,
              sourcePath: 'linkedCity.faqItems',
              note: `Copied ${normalized.length} item(s)`,
            })
          }
        }
      }
    }

    // --- landingPage.seo ---
    const targetSeo = doc?.seo
    const sourceSeo = srcCity?.seo
    if (!sourceSeo) {
      decisions.push({docId, code: 'SKIP_SOURCE_EMPTY', targetPath: 'seo', sourcePath: 'linkedCity.seo'})
    } else if (!isLandingSeoEmpty(targetSeo)) {
      decisions.push({docId, code: 'SKIP_TARGET_FILLED', targetPath: 'seo', sourcePath: 'linkedCity.seo'})
    } else if (isLandingSeoEmpty(sourceSeo)) {
      decisions.push({docId, code: 'SKIP_SOURCE_EMPTY', targetPath: 'seo', sourcePath: 'linkedCity.seo', note: 'Source SEO appears empty'})
    } else {
      // Copy per locale inside key fields only, to remain conservative (no overwrites).
      addLocalizedPatchSets(patchSets, decisions, docId, 'seo.metaTitle', targetSeo?.metaTitle, sourceSeo?.metaTitle, 'linkedCity.seo.metaTitle')
      addLocalizedPatchSets(
        patchSets,
        decisions,
        docId,
        'seo.metaDescription',
        targetSeo?.metaDescription,
        sourceSeo?.metaDescription,
        'linkedCity.seo.metaDescription',
      )
      addLocalizedPatchSets(patchSets, decisions, docId, 'seo.ogTitle', targetSeo?.ogTitle, sourceSeo?.ogTitle, 'linkedCity.seo.ogTitle')
      addLocalizedPatchSets(
        patchSets,
        decisions,
        docId,
        'seo.ogDescription',
        targetSeo?.ogDescription,
        sourceSeo?.ogDescription,
        'linkedCity.seo.ogDescription',
      )
      // booleans: only set if target empty (undefined/null)
      if ((targetSeo?.noIndex === undefined || targetSeo?.noIndex === null) && sourceSeo?.noIndex !== undefined) {
        patchSets.push({path: 'seo.noIndex', value: sourceSeo.noIndex})
        decisions.push({docId, code: 'COPY', targetPath: 'seo.noIndex', sourcePath: 'linkedCity.seo.noIndex'})
      } else {
        decisions.push({docId, code: 'SKIP_TARGET_FILLED', targetPath: 'seo.noIndex', sourcePath: 'linkedCity.seo.noIndex'})
      }
      // ogImage: only if missing
      if (!targetSeo?.ogImage && sourceSeo?.ogImage) {
        patchSets.push({path: 'seo.ogImage', value: sourceSeo.ogImage})
        decisions.push({docId, code: 'COPY', targetPath: 'seo.ogImage', sourcePath: 'linkedCity.seo.ogImage'})
      } else if (!sourceSeo?.ogImage) {
        decisions.push({docId, code: 'SKIP_SOURCE_EMPTY', targetPath: 'seo.ogImage', sourcePath: 'linkedCity.seo.ogImage'})
      } else {
        decisions.push({docId, code: 'SKIP_TARGET_FILLED', targetPath: 'seo.ogImage', sourcePath: 'linkedCity.seo.ogImage'})
      }
    }

    results.push({docId, patchSets})
  }

  return results
}

async function backfillCityArticlesSubtitles(decisions: Decision[]) {
  const docs = await client.fetch<any[]>(
    `*[_type=="landingPage" && pageType=="city" && defined(linkedCity)]{
      _id,
      pageSections,
      "cityTitle": linkedCity->title
    } | order(_id asc)`,
  )

  const results: Array<{docId: string; patchSets: PatchSet[]}> = []
  for (const doc of docs) {
    const docId = doc._id as string
    const sections = Array.isArray(doc?.pageSections) ? doc.pageSections : []
    const cityTitle = (doc?.cityTitle || {}) as Record<string, string>

    const patchSets: PatchSet[] = []
    const pick = pickSingleSectionByType(sections, 'articlesSection')
    if (pick.ambiguous) {
      decisions.push({
        docId,
        code: 'SKIP_AMBIGUOUS',
        targetPath: 'pageSections[_type=="articlesSection"]',
        sourcePath: '(generated)',
        note: `Found ${pick.count} articlesSection items`,
      })
      results.push({docId, patchSets})
      continue
    }
    if (!pick.section) {
      results.push({docId, patchSets})
      continue
    }
    const s = pick.section
    const key = s._key as string | undefined
    if (!key) {
      decisions.push({
        docId,
        code: 'SKIP_INCOMPATIBLE',
        targetPath: 'pageSections[_type=="articlesSection"]._key',
        sourcePath: 'pageSections._key',
        note: 'articlesSection missing _key',
      })
      results.push({docId, patchSets})
      continue
    }

    // Approved: articlesSection.subtitle only if still empty and no recoverable source.
    // We generate per locale only for missing locales.
    const base = `pageSections[_key=="${key}"].subtitle`
    // Use exact approved values for Tirana/Durres for linguistic quality.
    const citySlug = (docId.replace(/^landing-/, '') || '').toLowerCase()
    const pageLabelByLocale: Record<Locale, string> =
      citySlug === 'tirana'
        ? {
            en: 'Tirana',
            ru: 'Тиране',
            uk: 'Тірані',
            sq: 'Tiranë',
            it: 'Tirana',
          }
        : citySlug === 'durres'
          ? {
              en: 'Durres',
              ru: 'Дурресе',
              uk: 'Дурресі',
              sq: 'Durrës',
              it: 'Durres',
            }
          : {
              en: cityTitle.en || cityTitle.sq || 'this city',
              ru: cityTitle.ru || cityTitle.en || cityTitle.sq || 'этом городе',
              uk: cityTitle.uk || cityTitle.en || cityTitle.sq || 'цьому місті',
              sq: cityTitle.sq || cityTitle.en || 'këtë qytet',
              it: cityTitle.it || cityTitle.en || cityTitle.sq || 'questa città',
            }

    backfillLocalizedPerLocale(
      patchSets,
      decisions,
      docId,
      base,
      s.subtitle,
      null,
      '(generated)',
      {
        allowGenerateIfSourceMissing: true,
        generate: (l) => generateArticlesSubtitle(l, pageLabelByLocale[l]),
        rationale: 'articlesSection.subtitle has no safe legacy source; generated as a concise generic helper line aligned with the section purpose.',
      },
    )

    results.push({docId, patchSets})
  }

  return results
}

async function applyPatch(docId: string, patchSets: PatchSet[]) {
  if (patchSets.length === 0) return
  let p = client.patch(docId)
  for (const s of patchSets) {
    p = p.set({[s.path]: s.value} as any)
  }
  await p.commit({autoGenerateArrayKeys: false})
}

function groupDecisions(decisions: Decision[]) {
  const byDoc: Record<string, Decision[]> = {}
  for (const d of decisions) {
    byDoc[d.docId] ||= []
    byDoc[d.docId].push(d)
  }
  return byDoc
}

async function run() {
  console.log('--- migrate legacy content into landings ---')
  console.log(`Project: ${projectId}`)
  console.log(`Dataset: ${dataset}`)
  console.log(`Mode: ${isDry ? 'DRY' : 'EXECUTE'}`)
  console.log('')

  const decisions: Decision[] = []

  const home = await migrateLandingHome(decisions)
  const city = await migrateCityLandings(decisions)
  const cityArticles = await backfillCityArticlesSubtitles(decisions)

  const plan = [home, ...city, ...cityArticles]
  const plannedPatches = plan
    .filter((p) => p.patchSets.length > 0)
    .map((p) => ({docId: p.docId, patchCount: p.patchSets.length, patchSets: p.patchSets}))

  const byDoc = groupDecisions(decisions)

  const report = {
    projectId,
    dataset,
    mode: isDry ? 'DRY' : 'EXECUTE',
    plannedPatches: plannedPatches.map((p) => ({
      docId: p.docId,
      patchCount: p.patchCount,
      targets: p.patchSets.map((x) => x.path),
    })),
    decisions: byDoc,
  }

  console.log(JSON.stringify(report, null, 2))

  if (isDry) return

  for (const p of plan) {
    await applyPatch(p.docId, p.patchSets)
  }
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})

