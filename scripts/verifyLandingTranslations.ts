import path from 'path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const REQUIRED_LOCALES = ['en', 'ru', 'uk', 'sq', 'it'] as const
type RequiredLocale = (typeof REQUIRED_LOCALES)[number]

const projectId = (process.env.SANITY_PROJECT_ID || 'g4aqp6ex').trim()
const dataset = (process.env.SANITY_DATASET || 'production').trim()
const apiVersion = (process.env.SANITY_API_VERSION || '2024-01-01').trim()
const token = process.env.SANITY_API_TOKEN?.trim()

if (!token) {
  console.error('Error: SANITY_API_TOKEN required. Add to .env')
  process.exit(1)
}

const client = createClient({projectId, dataset, apiVersion, useCdn: false, token})

type MissingEntry = {
  pageId: string
  pageSlug?: string
  sectionType?: string
  sectionKey?: string
  sectionIndex?: number
  path: string
  missingLocales: RequiredLocale[]
  note?: string
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function looksLikeLocalizedObject(obj: Record<string, unknown>): boolean {
  // Heuristic: if it has at least one required locale key, and all existing required locale keys are scalar/array.
  const hasAnyLocaleKey = REQUIRED_LOCALES.some((l) => Object.prototype.hasOwnProperty.call(obj, l))
  if (!hasAnyLocaleKey) return false
  return true
}

function isEmptyLocalizedValue(v: unknown): boolean {
  if (v === undefined || v === null) return true
  if (typeof v === 'string') return v.trim().length === 0
  if (Array.isArray(v)) return v.length === 0
  // For localizedSeo-like nested objects we don't validate here (this script focuses on visible pageSections content)
  return false
}

function formatSectionCtx(section: any, sectionIndex: number | undefined) {
  const sectionType = section?._type as string | undefined
  const sectionKey = section?._key as string | undefined
  return {sectionType, sectionKey, sectionIndex}
}

function checkLocalizedObject(
  obj: Record<string, unknown>,
  ctx: Omit<MissingEntry, 'missingLocales' | 'path'> & {path: string},
  missing: MissingEntry[],
) {
  const missingLocales = REQUIRED_LOCALES.filter((l) => isEmptyLocalizedValue(obj[l]))
  if (missingLocales.length > 0) {
    missing.push({
      pageId: ctx.pageId,
      pageSlug: ctx.pageSlug,
      sectionType: ctx.sectionType,
      sectionKey: ctx.sectionKey,
      sectionIndex: ctx.sectionIndex,
      path: ctx.path,
      missingLocales,
    })
  }
}

function isOptionalLocalizedPath(pathStr: string): boolean {
  // Some fields are intentionally optional in schema but still localized objects.
  // We only enforce them when they are non-empty; if entirely empty, it's not a failure.
  return (
    pathStr.endsWith('.subtitle') ||
    pathStr.endsWith('.shortLine') ||
    pathStr.endsWith('.seoTextUnderCta') ||
    pathStr.endsWith('.cardTitle') ||
    pathStr.endsWith('.cardDescription')
  )
}

function allLocalesEmpty(obj: Record<string, unknown>): boolean {
  return REQUIRED_LOCALES.every((l) => isEmptyLocalizedValue(obj[l]))
}

function walkValue(
  value: unknown,
  ctx: Omit<MissingEntry, 'missingLocales' | 'path'>,
  curPath: string,
  missing: MissingEntry[],
  section: any | null,
  sectionIndex: number | undefined,
) {
  if (Array.isArray(value)) {
    value.forEach((item, i) => {
      walkValue(item, ctx, `${curPath}[${i}]`, missing, section, sectionIndex)
    })
    return
  }

  if (!isRecord(value)) return

  // If this is a localized object (localizedString/localizedText/localizedBlockContent/etc)
  if (looksLikeLocalizedObject(value)) {
    if (isOptionalLocalizedPath(curPath) && allLocalesEmpty(value)) {
      return
    }
    const sctx = section ? formatSectionCtx(section, sectionIndex) : {}
    checkLocalizedObject(
      value,
      {
        ...ctx,
        ...sctx,
        path: curPath,
      },
      missing,
    )
    // Do not recurse into locale keys further (avoid spamming deep portable text structures).
    return
  }

  // Otherwise, recurse into object fields.
  for (const [k, v] of Object.entries(value)) {
    // Skip Sanity internal refs/asset objects; they are not localized editor text.
    if (k === '_id' || k === '_ref' || k === '_type' || k === '_key') continue
    walkValue(v, ctx, curPath ? `${curPath}.${k}` : k, missing, section, sectionIndex)
  }
}

function verifyLandingPage(doc: any): {missing: MissingEntry[]; summary: string[]} {
  const pageId = doc?._id as string
  const pageSlug = doc?.slug?.current as string | undefined
  const missing: MissingEntry[] = []

  const ctxBase = {pageId, pageSlug}

  const sections = Array.isArray(doc?.pageSections) ? doc.pageSections : []
  sections.forEach((section: any, idx: number) => {
    // Walk entire section object; localized sub-objects will be detected.
    walkValue(section, ctxBase, `pageSections[${idx}]`, missing, section, idx)

    // Extra strict: common CTA label paths should exist when CTA exists.
    if (section?.cta && isRecord(section.cta)) {
      const label = section.cta.label
      if (label && isRecord(label) && looksLikeLocalizedObject(label)) {
        checkLocalizedObject(
          label,
          {
            ...ctxBase,
            ...formatSectionCtx(section, idx),
            path: `pageSections[${idx}].cta.label`,
          },
          missing,
        )
      }
    }

    if (section?.secondaryCta && isRecord(section.secondaryCta)) {
      const label = section.secondaryCta.label
      if (label && isRecord(label) && looksLikeLocalizedObject(label)) {
        checkLocalizedObject(
          label,
          {
            ...ctxBase,
            ...formatSectionCtx(section, idx),
            path: `pageSections[${idx}].secondaryCta.label`,
          },
          missing,
        )
      }
    }

    // Extra strict: for hero search tabs, label override is optional; do not enforce.
  })

  // Also validate landing title (internal/editorial but visible in cards sometimes).
  if (isRecord(doc?.title) && looksLikeLocalizedObject(doc.title)) {
    checkLocalizedObject(doc.title, {...ctxBase, path: 'title'}, missing)
  }

  // Also validate cardTitle/cardDescription if present (optional fields; only validate if object exists).
  if (isRecord(doc?.cardTitle) && looksLikeLocalizedObject(doc.cardTitle)) {
    checkLocalizedObject(doc.cardTitle, {...ctxBase, path: 'cardTitle'}, missing)
  }
  if (isRecord(doc?.cardDescription) && looksLikeLocalizedObject(doc.cardDescription)) {
    checkLocalizedObject(doc.cardDescription, {...ctxBase, path: 'cardDescription'}, missing)
  }

  const summary: string[] = []
  summary.push(`- id: ${pageId}`)
  summary.push(`- slug: ${pageSlug || '—'}`)
  summary.push(`- sections: ${sections.length}`)
  summary.push(`- missing entries: ${missing.length}`)
  return {missing, summary}
}

function printReport(results: Array<{doc: any; missing: MissingEntry[]; summary: string[]}>) {
  console.log(`Project: ${projectId}`)
  console.log(`Dataset: ${dataset}`)
  console.log(`Required locales: ${REQUIRED_LOCALES.join(', ')}`)
  console.log('')

  let totalMissing = 0
  for (const r of results) {
    console.log('---')
    console.log('Landing page')
    r.summary.forEach((line) => console.log(line))
    console.log('')
    if (r.missing.length === 0) {
      console.log('PASS ✅')
    } else {
      console.log('FAIL ❌')
      r.missing.forEach((m) => {
        const sectionPart =
          m.sectionType || m.sectionKey || typeof m.sectionIndex === 'number'
            ? ` | section: ${m.sectionType || '—'} #${m.sectionIndex ?? '—'} ${m.sectionKey ? `(${m.sectionKey})` : ''}`
            : ''
        console.log(
          `- ${m.pageId}${m.pageSlug ? ` (${m.pageSlug})` : ''}${sectionPart}\n  path: ${m.path}\n  missing: ${m.missingLocales.join(
            ', ',
          )}`,
        )
      })
    }
    console.log('')
    totalMissing += r.missing.length
  }

  console.log('---')
  console.log(`Total missing entries: ${totalMissing}`)
  if (totalMissing > 0) {
    process.exitCode = 1
  }
}

async function run() {
  const ids = ['landing-tirana', 'landing-durres']
  const query = `*[_type=="landingPage" && _id in $ids]{
    _id,
    slug,
    title,
    cardTitle,
    cardDescription,
    pageSections
  } | order(_id asc)`

  const docs = await client.fetch<any[]>(query, {ids})
  const foundIds = new Set(docs.map((d) => d?._id).filter(Boolean))
  const missingDocs = ids.filter((id) => !foundIds.has(id))
  if (missingDocs.length > 0) {
    console.error(`Missing landing docs: ${missingDocs.join(', ')}`)
    process.exit(1)
  }

  const results = docs.map((doc) => ({doc, ...verifyLandingPage(doc)}))
  printReport(results)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})

