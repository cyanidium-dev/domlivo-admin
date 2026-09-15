/**
 * Domlivo CMS — read distance to the sea, first line and sea view out of
 * listing copy into structured fields.
 *
 * Why: the "near the sea" listing pages need a number to filter on, and the
 * listings already state it in prose ("70 m from the beach", "в 200 м от
 * моря", "shtatëdhjetë metra nga deti") — in 93 of 358 Durrës listings by a
 * first count — while only 18 carry the sea-view amenity and none has a
 * distance field. This script copies what the text says; it never estimates.
 *
 * Rules:
 * - Reads title, shortDescription and description in all six locales.
 * - `seaDistanceMeters`: the smallest distance stated next to sea/beach words,
 *   digits or spelled-out numbers, 5–3,000 m. Written only when the field is
 *   empty, so a value an editor set is never overwritten.
 * - `beachfront`: only explicit first-line wording (first line, vijë e parë,
 *   первая линия, перша лінія, prima linea, pierwsza linia). Written only when
 *   the field is unset.
 * - `sea-view` amenity: added when the text says sea view and does not negate
 *   it; existing amenities are kept.
 * - Dry run unless `--execute`; every change is printed with the phrase that
 *   produced it. Full documents are backed up before writing; writes use
 *   ifRevisionID. Published documents only (drafts are skipped and reported).
 *
 * Run:
 *   npx tsx scripts/enrichSeaData.ts            # dry run, all published properties
 *   npx tsx scripts/enrichSeaData.ts --execute
 */
import fs from 'node:fs'
import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const execute = process.argv.includes('--execute')
const token = process.env.SANITY_API_TOKEN?.trim()
if (!token) {
  console.error('SANITY_API_TOKEN required in .env')
  process.exit(1)
}
const client = createClient({
  projectId: (process.env.SANITY_PROJECT_ID || 'g4aqp6ex').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: (process.env.SANITY_API_VERSION || '2024-01-01').trim(),
  token,
  useCdn: false,
})

const WORD_NUMBERS: Record<string, number> = {
  // en
  'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50, 'sixty': 60, 'seventy': 70, 'eighty': 80, 'ninety': 90,
  'a hundred': 100, 'one hundred': 100, 'hundred': 100, 'one hundred and fifty': 150, 'a hundred and fifty': 150,
  'two hundred': 200, 'two hundred and fifty': 250, 'three hundred': 300, 'three hundred and fifty': 350,
  'four hundred': 400, 'five hundred': 500, 'six hundred': 600, 'seven hundred': 700, 'eight hundred': 800,
  // sq
  'njëzet': 20, 'tridhjetë': 30, 'dyzet': 40, 'pesëdhjetë': 50, 'gjashtëdhjetë': 60, 'shtatëdhjetë': 70,
  'tetëdhjetë': 80, 'nëntëdhjetë': 90, 'njëqind': 100, 'njëqind e pesëdhjetë': 150, 'dyqind': 200,
  'dyqind e pesëdhjetë': 250, 'treqind': 300, 'treqind e pesëdhjetë': 350, 'katërqind': 400, 'pesëqind': 500,
  // ru (nominative and genitive/prepositional)
  'двадцать': 20, 'двадцати': 20, 'тридцать': 30, 'тридцати': 30, 'сорок': 40, 'сорока': 40,
  'пятьдесят': 50, 'пятидесяти': 50, 'шестьдесят': 60, 'шестидесяти': 60, 'семьдесят': 70, 'семидесяти': 70,
  'восемьдесят': 80, 'восьмидесяти': 80, 'девяносто': 90, 'сто': 100, 'ста': 100, 'двести': 200, 'двухсот': 200,
  'триста': 300, 'трёхсот': 300, 'трехсот': 300, 'четыреста': 400, 'четырёхсот': 400, 'пятьсот': 500, 'пятисот': 500,
  // uk
  'пʼятдесят': 50, "п'ятдесят": 50, 'пʼятдесяти': 50, 'сімдесят': 70, 'сімдесяти': 70, 'сотні': 100,
  'двісті': 200, 'двохсот': 200, 'чотириста': 400, 'чотирьохсот': 400, 'триста ': 300, 'трьохсот': 300, 'пʼятсот': 500, 'пʼятисот': 500,
  // it
  'cinquanta': 50, 'settanta': 70, 'cento': 100, 'duecento': 200, 'trecento': 300, 'cinquecento': 500,
  // pl
  'pięćdziesiąt': 50, 'pięćdziesięciu': 50, 'siedemdziesiąt': 70, 'siedemdziesięciu': 70, 'sto ': 100, 'stu': 100,
  'dwieście': 200, 'dwustu': 200, 'trzysta': 300, 'trzystu': 300, 'pięćset': 500, 'pięciuset': 500,
}
const WORD_ALT = Object.keys(WORD_NUMBERS)
  .map((w) => w.trim())
  .sort((a, b) => b.length - a.length)
  .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  .join('|')
// The lookbehind stops a spelled number matching the tail of a longer one:
// Ukrainian "чотириста" (400) must not read as "ста" (100).
const NUM = `(?<![\\p{L}\\d])(\\d{1,4}(?:[.,]\\d{3})?|${WORD_ALT})`
const SEA = {
  en: '(?:the\\s+)?(?:sea|beach|seafront|shore|coast)',
  sq: '(?:deti|detit|plazhi|plazhit|bregdeti)',
  ru: '(?:моря|пляжа|берега|набережной)',
  uk: '(?:моря|пляжу|берега)',
  it: '(?:mare|spiaggia)',
  pl: '(?:morza|plaży)',
}
const DISTANCE_PATTERNS: RegExp[] = [
  new RegExp(`${NUM}\\s?(?:m|metres|meters|metre|meter)\\b[^.\\n]{0,15}?\\b(?:from|to|away from)\\s+${SEA.en}`, 'giu'),
  new RegExp(`${SEA.en.replace('(?:the\\s+)?', '')}\\s+(?:is\\s+)?(?:only\\s+|just\\s+|about\\s+)?${NUM}\\s?(?:m|metres|meters)\\b(?:\\s+away)?`, 'giu'),
  new RegExp(`${NUM}\\s?(?:m|metra|metër|metro)\\s+(?:larg\\s+)?(?:nga|deri te|deri në)\\s+${SEA.sq}`, 'giu'),
  new RegExp(`${SEA.sq}\\s+(?:është\\s+|ndodhet\\s+)?(?:vetëm\\s+|rreth\\s+)?${NUM}\\s?(?:m|metra)\\b`, 'giu'),
  new RegExp(`${NUM}\\s?(?:м|метр\\p{L}*)\\s+(?:от|до)\\s+${SEA.ru}`, 'giu'),
  new RegExp(`до\\s+${SEA.ru.replace('(?:', '(?:')}\\s*(?:—|-|–)?\\s*(?:всего\\s+|около\\s+)?${NUM}\\s?(?:м|метр\\p{L}*)`, 'giu'),
  new RegExp(`${NUM}\\s?(?:м|метр\\p{L}*)\\s+(?:від|до)\\s+${SEA.uk}`, 'giu'),
  new RegExp(`до\\s+${SEA.uk}\\s*(?:—|-|–)?\\s*(?:всього\\s+|близько\\s+)?${NUM}\\s?(?:м|метр\\p{L}*)`, 'giu'),
  new RegExp(`${NUM}\\s?(?:m|metri)\\s+(?:dal|dalla)\\s+${SEA.it}`, 'giu'),
  new RegExp(`${NUM}\\s?(?:m|metrów|metry|metra)\\s+(?:od|do)\\s+${SEA.pl}`, 'giu'),
]
const FIRST_LINE = /\b(?:first line|1st line|front line)\b|vij[aeë]n?\s+e\s+par[eë]|перв(?:ая|ой|ую)\s+лини|перш(?:а|ій|у)\s+лін|prima linea|pierwsz(?:a|ej|ą)\s+lini/iu
/**
 * Context that makes a first-line phrase mean something else: a distance from
 * the first line ("100 м от первой линии"), its noise, a road's first line.
 * "beachfront" is left out on purpose — the copy uses it for the whole coast.
 */
// \b is ASCII-only in JS regexes, so word starts are spelled as start-or-space.
const FIRST_LINE_NOT_BEFORE = /(?:^|\s)(?:от|from(?: the)?|від|nga|dal(?:la)?)\s*$/iu
const FIRST_LINE_NOT_AFTER = /^\p{L}*\s*(?:дорог|road|street|rrug|вулиц|улиц)/iu
const SEA_VIEW = /\bsea[\s-]views?\b|views? (?:of|over) the sea|overlooking the sea|pamje\s+(?:nga\s+|ndaj\s+)?det|вид(?:ом)?\s+на\s+море|вид(?:ом)?\s+на\s+море|vista mare|widok(?:iem)?\s+na\s+morze/iu
const SEA_VIEW_NEGATED = /\bno sea view|without (?:a )?sea view|pa pamje|без вида на море|без виду на море|senza vista mare|bez widoku na morze/iu

type Row = {
  _id: string
  _rev: string
  slug?: string
  city?: string
  seaDistanceMeters?: number
  beachfront?: boolean
  amenityIds: string[]
  texts: string[]
}

function toNumber(raw: string): number | null {
  const lower = raw.toLowerCase().trim()
  if (WORD_NUMBERS[lower] !== undefined) return WORD_NUMBERS[lower]
  const digits = Number(lower.replace(/[.,](?=\d{3}\b)/g, ''))
  return Number.isFinite(digits) ? digits : null
}

function readDistance(texts: string[]): {meters: number; phrase: string} | null {
  let best: {meters: number; phrase: string} | null = null
  for (const text of texts) {
    for (const re of DISTANCE_PATTERNS) {
      re.lastIndex = 0
      for (const m of text.matchAll(re)) {
        // "109 m², 3 km from the sea": an area or a kilometre figure caught
        // between the number and the sea word is not a distance in metres.
        if (/\bm[²2]|\bkm\b|\bкм\b/iu.test(m[0])) continue
        const meters = toNumber(m[1])
        if (meters === null || meters < 5 || meters > 3000) continue
        if (!best || meters < best.meters) best = {meters, phrase: m[0]}
      }
    }
  }
  return best
}

async function main(): Promise<void> {
  const seaViewId = await client.fetch<string | null>(`*[_type == "amenity" && slug.current == "sea-view"][0]._id`)
  if (!seaViewId) throw new Error('sea-view amenity not found')

  const rows = await client.fetch<Row[]>(`*[_type == "property" && !(_id in path("drafts.**")) && isPublished == true]{
    _id, _rev, "slug": slug.current, "city": city->slug.current, seaDistanceMeters, beachfront,
    "amenityIds": coalesce(amenitiesRefs[]._ref, []),
    "texts": [
      title.en, title.sq, title.ru, title.uk, title.it, title.pl,
      shortDescription.en, shortDescription.sq, shortDescription.ru, shortDescription.uk, shortDescription.it, shortDescription.pl,
      description.en, description.sq, description.ru, description.uk, description.it, description.pl
    ]
  }`)
  const drafts = await client.fetch<number>(`count(*[_type == "property" && _id in path("drafts.**")])`)

  type Plan = {row: Row; set: Record<string, unknown>; addSeaView: boolean; notes: string[]}
  const plans: Plan[] = []
  const stats = {distance: 0, beachfront: 0, seaView: 0, keptDistance: 0}
  for (const row of rows) {
    const texts = (row.texts ?? []).filter((t): t is string => typeof t === 'string' && t.length > 0)
    const set: Record<string, unknown> = {}
    const notes: string[] = []
    const distance = readDistance(texts)
    if (distance) {
      if (typeof row.seaDistanceMeters === 'number') stats.keptDistance++
      else {
        set.seaDistanceMeters = distance.meters
        notes.push(`distance ${distance.meters} m ← "${distance.phrase.trim()}"`)
        stats.distance++
      }
    }
    const firstLine = texts
      .map((t) => {
        const m = FIRST_LINE.exec(t)
        if (!m) return null
        const before = t.slice(Math.max(0, m.index - 25), m.index)
        const after = t.slice(m.index + m[0].length, m.index + m[0].length + 15)
        if (FIRST_LINE_NOT_BEFORE.test(before) || /шум|гамір|noise|zhurm/iu.test(before) || FIRST_LINE_NOT_AFTER.test(after)) {
          return null
        }
        return t.slice(Math.max(0, m.index - 35), m.index + m[0].length + 25).replace(/\s+/g, ' ')
      })
      .find(Boolean)
    if (firstLine && typeof row.beachfront !== 'boolean') {
      set.beachfront = true
      notes.push(`first line ← "${firstLine}"`)
      stats.beachfront++
    }
    const seaView = texts.map((t) => (SEA_VIEW_NEGATED.test(t) ? null : SEA_VIEW.exec(t)?.[0])).find(Boolean)
    const addSeaView = Boolean(seaView) && !row.amenityIds.includes(seaViewId)
    if (addSeaView) {
      notes.push(`sea view ← "${seaView}"`)
      stats.seaView++
    }
    if (Object.keys(set).length > 0 || addSeaView) plans.push({row, set, addSeaView, notes})
  }

  for (const p of plans) console.log(`${p.row.city ?? '-'} ${p.row.slug}\n  ${p.notes.join('\n  ')}`)
  console.log(
    `\n${rows.length} published properties scanned (${drafts} drafts skipped). ` +
      `To write: distance ${stats.distance}, first line ${stats.beachfront}, sea-view amenity ${stats.seaView}. ` +
      `Existing distances kept: ${stats.keptDistance}.`,
  )
  if (!execute) {
    console.log('Dry run. Re-run with --execute to write.')
    return
  }
  if (plans.length === 0) return

  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupDir = path.resolve(process.cwd(), 'scripts/data/backups', `enrichSeaData-${stamp}`)
  fs.mkdirSync(backupDir, {recursive: true})
  const full = await client.fetch<Array<{_id: string}>>(`*[_id in $ids]`, {ids: plans.map((p) => p.row._id)})
  for (const doc of full) fs.writeFileSync(path.join(backupDir, `${doc._id}.json`), JSON.stringify(doc, null, 2))

  for (let i = 0; i < plans.length; i += 50) {
    const tx = client.transaction()
    for (const p of plans.slice(i, i + 50)) {
      tx.patch(p.row._id, (patch) => {
        let next = patch.ifRevisionId(p.row._rev)
        if (Object.keys(p.set).length > 0) next = next.set(p.set)
        if (p.addSeaView) {
          next = next
            .setIfMissing({amenitiesRefs: []})
            .append('amenitiesRefs', [{_type: 'reference', _ref: seaViewId, _key: `seaview${p.row._id.slice(-6)}`}])
        }
        return next
      })
    }
    const res = await tx.commit()
    console.log(`batch ${i / 50 + 1}: ${res.transactionId}`)
  }
  console.log(`Backups: ${backupDir}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
