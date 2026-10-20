/**
 * Audit the property listings for content defects that only show up when you
 * read the locales side by side.
 *
 * The page crawler in the frontend (`npm run content-qa`) reads rendered HTML
 * one page at a time, so it cannot see that a listing calls itself 2+1 in
 * English and 1+1 in Russian — each page is internally consistent. These rules
 * read the documents instead and compare the locales against each other and
 * against the structured fields.
 *
 * Reports only. Nothing here writes: several of the findings have two possible
 * fixes (the title is wrong, or the field is), and picking one is a judgement
 * about a real flat.
 *
 * Run:
 * - npm run audit:property-content
 * - npm run audit:property-content -- --json reports/property-content.json
 */
import fs from 'node:fs'
import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const projectId = (process.env.SANITY_PROJECT_ID || '').trim()
const token = process.env.SANITY_API_TOKEN?.trim()
if (!token || !projectId) {
  console.error('Error: SANITY_PROJECT_ID and SANITY_API_TOKEN required.')
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: '2024-01-01',
  useCdn: false,
  token,
})

const args = process.argv.slice(2)
const jsonOut = args.includes('--json') ? args[args.indexOf('--json') + 1] : ''

const LOCALES = ['en', 'ru', 'uk', 'sq', 'it', 'pl'] as const
type Locale = (typeof LOCALES)[number]
type Localized = Partial<Record<Locale, string>> | null | undefined

type Property = {
  _id: string
  slug?: string
  propertyCode?: string
  isPublished?: boolean
  title?: Localized
  shortDescription?: Localized
  description?: Localized
  price?: number
  area?: number
  bedrooms?: number
  rooms?: number
  city?: string
  agency?: string
  district?: string
  firstPhoto?: string
  duplicateOf?: string
}

type Finding = {
  rule: string
  severity: 'critical' | 'warning'
  slug: string
  locale: string
  message: string
  quote?: string
}

/**
 * `2+1` — Albanian notation: bedrooms + living rooms, so rooms = the sum.
 *
 * The trailing guard rejects a decimal ("1+1,5") but must still allow the
 * comma that separates items in a list: "Apartamente 1+1, 2+1 dhe Duplexe" is
 * two typologies, and reading only the second one turned a correctly written
 * multi-unit listing into six findings.
 */
const TYPOLOGY = /(?<![\d.,])([1-6])\s*\+\s*([1-3])(?!\d|[.,]\d)/
/** `2-комнатная` / `2-кімнатна` — the Slavic convention counts every room. */
const ROOM_COUNT = /([1-6])[\s-]*(?:комнат|кімнат)/i
const CYRILLIC = /[а-яёіїєґ]/i
const UKRAINIAN_ONLY = /[іїєґ]/i
const RUSSIAN_ONLY = /[ыэъё]/i
/** English phrases that mean the field was never translated. */
const ENGLISH_GIVEAWAY = /\b(for sale|for rent|apartment|bedrooms?|property|area|price|sea view)\b/i
/** The shape the DatoCMS import generated instead of a description. */
const GENERATED_BLURB = /(Price|Цена|Ціна|Çmimi|Prezzo|Cena)\s*:\s*[€\d]/i
/**
 * The city named twice: a Cyrillic form and then the raw Latin slug, as in
 * "во Влере в Vlore". Requiring Cyrillic immediately to the left keeps
 * ordinary English prose — "in a front-line building in Shengjin" — out of it.
 */
const CITY_TWICE =
  /[а-яёіїєґ]\s+(?:в|во)\s+(Vlore|Durres|Sarande|Tirana|Shengjin|Shkoder|Himare|Kavaje)\b/i

function text(field: Localized, locale: Locale): string {
  const value = field?.[locale]
  return typeof value === 'string' ? value.trim() : ''
}

function audit(rows: Property[]): Finding[] {
  const out: Finding[] = []
  const add = (f: Finding) => out.push(f)

  for (const p of rows) {
    const slug = p.slug || p._id

    // --- PC-01/02: what the titles claim, against each other and the fields ---
    // A development selling several unit types at once — "Garsoniere,
    // Apartamente 1+1, 2+1 dhe Duplexe" — names more than one typology in a
    // single title on purpose. There is no one bedroom count to check it
    // against, so the typology rules skip it rather than report six findings
    // about a listing that is written correctly.
    const multiUnit = LOCALES.some((locale) => {
      const t = text(p.title, locale)
      if (!t) return false
      const all = new Set([...t.matchAll(new RegExp(TYPOLOGY, 'g'))].map((m) => `${m[1]}+${m[2]}`))
      return all.size > 1
    })

    const claimed = new Map<Locale, string>()
    for (const locale of multiUnit ? [] : LOCALES) {
      const t = text(p.title, locale)
      if (!t) continue
      const typology = TYPOLOGY.exec(t)
      if (typology) claimed.set(locale, `${typology[1]}+${typology[2]}`)
      else {
        const roomCount = ROOM_COUNT.exec(t)
        if (roomCount) claimed.set(locale, `${roomCount[1]} rooms`)
      }
    }
    const typologies = new Set([...claimed.values()].filter((v) => v.includes('+')))
    if (typologies.size > 1) {
      add({
        rule: 'PC-01',
        severity: 'critical',
        slug,
        locale: [...claimed.keys()].join(','),
        message: `locales disagree on the typology: ${[...typologies].sort().join(' vs ')}`,
        quote: [...claimed].map(([l, v]) => `${l}=${v}`).join(' '),
      })
    }
    for (const [locale, value] of claimed) {
      if (!value.includes('+')) {
        const stated = Number(value[0])
        if (typeof p.rooms === 'number' && stated !== p.rooms) {
          add({
            rule: 'PC-02',
            severity: 'warning',
            slug,
            locale,
            message: `title counts ${stated} rooms, the record says ${p.rooms}. The Slavic form counts every room, so a ${p.rooms}-room flat is "${p.rooms}-комнатная".`,
          })
        }
        continue
      }
      const [beds, living] = value.split('+').map(Number)
      // Where `rooms` is missing and `bedrooms` equals the sum, it is the room
      // total sitting in the wrong field — not a wrong title. Reported once,
      // as PC-03, rather than as a contradiction per locale.
      const bedroomsHoldsTheTotal =
        p.rooms == null && typeof p.bedrooms === 'number' && p.bedrooms === beds + living
      if (bedroomsHoldsTheTotal) continue
      if (typeof p.bedrooms === 'number' && beds !== p.bedrooms && typologies.size === 1) {
        add({
          rule: 'PC-02',
          severity: 'warning',
          slug,
          locale,
          message: `every title says ${value} (= ${beds} bedrooms) but bedrooms = ${p.bedrooms}`,
        })
      }
      if (typeof p.rooms === 'number' && beds + living !== p.rooms) {
        add({
          rule: 'PC-02',
          severity: 'warning',
          slug,
          locale,
          message: `title says ${value} (= ${beds + living} rooms) but rooms = ${p.rooms}`,
        })
      }
    }

    // --- PC-03: bedrooms holding the room total ---
    const anyTypology = [...claimed.values()].find((v) => v.includes('+'))
    if (!multiUnit && anyTypology && p.rooms == null && typeof p.bedrooms === 'number') {
      const [beds, living] = anyTypology.split('+').map(Number)
      if (p.bedrooms === beds + living && living > 0) {
        add({
          rule: 'PC-03',
          severity: 'critical',
          slug,
          locale: '*',
          message: `bedrooms = ${p.bedrooms} is the room total, not the bedroom count: the title says ${anyTypology}. Should be bedrooms = ${beds}, rooms = ${beds + living}. The bedroom filter counts this flat wrong.`,
        })
      }
    }

    // --- PC-04: Russian sitting in the Ukrainian field ---
    for (const field of ['title', 'shortDescription', 'description'] as const) {
      const uk = text(p[field], 'uk')
      if (uk && CYRILLIC.test(uk) && !UKRAINIAN_ONLY.test(uk) && RUSSIAN_ONLY.test(uk)) {
        add({
          rule: 'PC-04',
          severity: 'critical',
          slug,
          locale: 'uk',
          message: `${field} is Russian, not Ukrainian`,
          quote: uk.slice(0, 90),
        })
      }
    }

    // --- PC-05: untranslated English in a non-English field ---
    for (const locale of ['ru', 'uk', 'sq', 'it', 'pl'] as const) {
      for (const field of ['title', 'shortDescription'] as const) {
        const value = text(p[field], locale)
        if (!value) continue
        const looksEnglish = ENGLISH_GIVEAWAY.test(value) && !CYRILLIC.test(value)
        if (looksEnglish) {
          add({
            rule: 'PC-05',
            severity: 'critical',
            slug,
            locale,
            message: `${field} was never translated out of English`,
            quote: value.slice(0, 90),
          })
        }
      }
    }

    // --- PC-06: the generated blurb standing in for a description ---
    for (const locale of LOCALES) {
      const value = text(p.shortDescription, locale)
      if (value && GENERATED_BLURB.test(value)) {
        add({
          rule: 'PC-06',
          severity: 'warning',
          slug,
          locale,
          message: 'shortDescription is the import\'s generated blurb, not a description',
          quote: value.slice(0, 90),
        })
      }
    }

    // --- PC-07: the city named twice, once translated and once raw ---
    for (const locale of LOCALES) {
      const value = text(p.shortDescription, locale)
      if (value && CITY_TWICE.test(value)) {
        add({
          rule: 'PC-07',
          severity: 'warning',
          slug,
          locale,
          message: 'the city is named twice — a translated form and the raw slug',
          quote: value.slice(0, 90),
        })
      }
    }

    // --- PC-08: a locale missing altogether ---
    for (const locale of LOCALES) {
      if (!text(p.title, locale)) {
        add({
          rule: 'PC-08',
          severity: p.isPublished ? 'warning' : 'warning',
          slug,
          locale,
          message: 'no title in this locale',
        })
      }
    }
  }

  return out
}

/**
 * PC-09/PC-10: the same text, or the same flat, twice (AI-text audit of
 * 2026-10-20, reports/domlivo-ai-text-audit-2026-10-20.md). Run after every
 * partner batch: a complex sold unit by unit arrives with one description for
 * all its flats, and Google folds near-identical pages together.
 *
 * Text is compared per agency on the English description by 6-word shingles
 * (Jaccard). PC-10 fires when the first photo is the same asset and the area
 * is the same, or every fact matches (price, area, bedrooms, district) and the
 * text is 90 % the same: probably one flat listed twice. A shared photo of the
 * building alone, or two identical units with their own photos, is not enough.
 * A PC-10 copy is hidden with `duplicateOf` (see hideDuplicateListings20261020.ts).
 */
const NEAR_DUPLICATE_JACCARD = 0.8

function shingles(s: string): Set<string> {
  const words = s.toLowerCase().match(/[\p{L}\p{N}'’]+/gu) ?? []
  const out = new Set<string>()
  for (let i = 0; i + 6 <= words.length; i++) out.add(words.slice(i, i + 6).join(' '))
  return out
}

function crossListingFindings(rows: Property[]): Finding[] {
  const out: Finding[] = []
  const live = rows.filter(
    (r) => !r._id.startsWith('drafts.') && r.isPublished && !r.duplicateOf && text(r.description, 'en').length >= 200,
  )
  const byAgency = new Map<string, Array<{p: Property; g: Set<string>}>>()
  for (const p of live) {
    const key = p.agency || '?'
    if (!byAgency.has(key)) byAgency.set(key, [])
    byAgency.get(key)!.push({p, g: shingles(text(p.description, 'en'))})
  }
  for (const list of byAgency.values()) {
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i]
        const b = list[j]
        let inter = 0
        for (const x of a.g) if (b.g.has(x)) inter++
        const jac = inter / (a.g.size + b.g.size - inter || 1)
        const sameFacts =
          a.p.price === b.p.price && a.p.area === b.p.area && a.p.bedrooms === b.p.bedrooms && a.p.district === b.p.district
        const samePhoto = Boolean(a.p.firstPhoto && a.p.firstPhoto === b.p.firstPhoto)
        const sa = a.p.slug || a.p._id
        const sb = b.p.slug || b.p._id
        if (jac >= 0.5 && ((samePhoto && a.p.area === b.p.area) || (sameFacts && jac >= 0.9))) {
          out.push({
            rule: 'PC-10',
            severity: 'critical',
            slug: sa,
            locale: 'all',
            message: `probably the same flat as ${sb} (text ${Math.round(jac * 100)}%${sameFacts ? ', same price/area/bedrooms/district' : ''}${samePhoto ? ', same first photo' : ''})`,
          })
        } else if (jac >= NEAR_DUPLICATE_JACCARD) {
          out.push({
            rule: 'PC-09',
            severity: 'warning',
            slug: sa,
            locale: 'en',
            message: `description ${Math.round(jac * 100)}% the same as ${sb}: ask the partner what differs (floor, view, layout)`,
          })
        }
      }
    }
  }
  return out
}

const RULE_NAMES: Record<string, string> = {
  'PC-01': 'Locales contradict each other on the typology',
  'PC-02': 'Title disagrees with the structured fields',
  'PC-03': 'bedrooms holds the room total',
  'PC-04': 'Russian text in the Ukrainian field',
  'PC-05': 'Untranslated English',
  'PC-06': 'Generated blurb instead of a description',
  'PC-07': 'City named twice',
  'PC-08': 'Locale missing',
  'PC-09': 'Description nearly identical to another listing of the same agency',
  'PC-10': 'Probably the same flat listed twice',
}

async function main() {
  const rows: Property[] = await client.fetch(
    `*[_type == "property"]{
      _id, "slug": slug.current, propertyCode, isPublished,
      title, shortDescription, description,
      price, area, bedrooms, rooms, "city": city->slug.current,
      "agency": coalesce(agent->agency->name, agent->name), "district": district->slug.current,
      "firstPhoto": gallery[0].asset._ref, "duplicateOf": duplicateOf._ref
    } | order(_id asc)`,
  )
  const findings = [...audit(rows), ...crossListingFindings(rows)]
  const published = new Set(rows.filter((r) => r.isPublished).map((r) => r.slug || r._id))

  const byRule = new Map<string, Finding[]>()
  for (const f of findings) {
    if (!byRule.has(f.rule)) byRule.set(f.rule, [])
    byRule.get(f.rule)!.push(f)
  }

  const affected = new Set(findings.map((f) => f.slug))
  console.log(`${rows.length} properties, ${published.size} published.`)
  console.log(`${findings.length} findings across ${affected.size} properties.\n`)

  for (const rule of [...byRule.keys()].sort()) {
    const list = byRule.get(rule)!
    const slugs = new Set(list.map((f) => f.slug))
    const live = [...slugs].filter((s) => published.has(s)).length
    console.log(
      `${rule}  ${RULE_NAMES[rule]} — ${list.length} finding(s) on ${slugs.size} propert${slugs.size === 1 ? 'y' : 'ies'} (${live} published)`,
    )
    for (const f of list.slice(0, 4)) {
      console.log(`      ${f.locale.padEnd(6)} ${f.slug.slice(0, 44).padEnd(46)} ${f.message}`)
      if (f.quote) console.log(`             “${f.quote}”`)
    }
    if (list.length > 4) console.log(`      … and ${list.length - 4} more`)
    console.log('')
  }

  if (jsonOut) {
    fs.mkdirSync(path.dirname(jsonOut), {recursive: true})
    fs.writeFileSync(jsonOut, JSON.stringify({generatedAt: new Date().toISOString(), rows: rows.length, findings}, null, 1))
    console.log(`Wrote ${jsonOut}`)
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
