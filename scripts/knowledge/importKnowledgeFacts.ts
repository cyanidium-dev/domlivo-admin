/**
 * data/facts.json (research repo) → `knowledgeFact` documents.
 *
 * The research files store a fact as prose fields ("value: 70 lek/m³ water
 * supply, household, Durrës & Shijak"). This importer keeps that verbatim in
 * `valueText` — it is what makes a citation checkable — and additionally
 * extracts the machine-usable parts: a number, a range, the original currency,
 * the season, the city, the sources. Anything it cannot parse is reported
 * rather than guessed, and the fact still lands with its text intact.
 *
 * Dry run:  npm run knowledge:facts
 * Apply:    npm run knowledge:facts:apply
 */
import {getSanityClientForScripts} from '../lib/sanityEnvClient'
import {
  categoryFor,
  citySlugFor,
  factDocId,
  factFamily,
  firstNumber,
  firstQuantity,
  leadingNumber,
  hasFlag,
  isoDate,
  knowledgeDir,
  logTable,
  metricFrom,
  normalizeConfidence,
  normalizeDataKind,
  normalizePropertyType,
  normalizeSeason,
  parseOriginal,
  rangeBounds,
  readJson,
  sourceDocId,
  SOURCE_ID_RE,
} from './lib'

type RawFact = {
  data_id: string
  title?: string
  value?: string
  unit?: string
  original?: string
  normalized_eur?: string
  geography?: string
  period?: string
  season?: string
  data_kind?: string
  source_id?: string
  confidence?: string
  raw_quote?: string
  notes?: string
  accessed_at?: string
  raw_file?: string
}

/** Albanian terms worth carrying into searchText so an sq question matches. */
const SQ_TERMS: Array<[RegExp, string]> = [
  [/electricity|kwh/i, 'energji elektrike tarifa çmimi'],
  [/water|sewer/i, 'ujë ujësjellës tarifa kanalizime'],
  [/waste|cleaning tax/i, 'taksa e pastrimit mbeturina'],
  [/internet|fibre|fiber/i, 'internet fibër paketa'],
  [/rent/i, 'qira apartament qera'],
  [/price|per m2|per m²/i, 'çmimi për metër katror apartament'],
  [/tax/i, 'tatimi taksa'],
  [/air ?condition|btu|\bac\b/i, 'kondicioner ngrohje ftohje'],
  [/boiler|water heater/i, 'bojler ujë i ngrohtë'],
  [/heating/i, 'ngrohje dimër'],
  [/renovation/i, 'rinovim rikonstruksion'],
  [/furnish|furniture/i, 'mobilim mobilje'],
  [/airbnb|short.?term|occupancy|adr/i, 'qira afatshkurtër turistë netë'],
  [/building fee|administration/i, 'administrimi i pallatit tarifa'],
]

/**
 * The unit that belongs to the value we actually store.
 *
 * Research files record the unit of the *original* figure ("ALL per kWh") while
 * also giving a normalised EUR value. Storing 0.092 next to "ALL per kWh" reads
 * as 0.092 lek — wrong by two orders of magnitude, and exactly the kind of unit
 * error the data audit exists to catch. When the value we keep is the EUR one,
 * the unit has to be the EUR one too; the lek figure survives in
 * `originalValue` / `originalCurrency`.
 */
function unitFor(row: RawFact, usedEur: boolean): string {
  const raw = (row.unit || '').trim()
  if (!usedEur) return raw.slice(0, 40) || 'text'

  // Prefer a unit stated in the normalised field itself ("0.092 EUR/kWh").
  const fromNormalised = String(row.normalized_eur || '').match(
    /EUR\s*(?:\/|per\s+)\s*([A-Za-z0-9²³]+)/i,
  )
  if (fromNormalised) return `EUR/${fromNormalised[1]}`.slice(0, 40)

  // Otherwise swap the currency token in the original unit.
  const swapped = raw
    .replace(/\b(ALL|LEK|lek[ëe]?)\b/gi, 'EUR')
    .replace(/\s*,?\s*(excluding|including|incl\.?|excl\.?)\b.*$/i, '')
    .trim()
  if (/EUR/i.test(swapped)) return swapped.slice(0, 40)
  return (swapped ? `EUR (${swapped})` : 'EUR').slice(0, 40)
}

function searchTextFor(fact: RawFact, category: string, metric: string): string {
  const base = [
    fact.data_id,
    metric,
    category,
    fact.geography,
    fact.unit,
    fact.title,
    fact.period,
  ]
    .filter(Boolean)
    .join(' ')
  const sq = SQ_TERMS.filter(([re]) => re.test(base)).map(([, terms]) => terms)
  return [base, ...sq].join(' ').slice(0, 1200)
}

async function main(): Promise<void> {
  const apply = hasFlag('--apply')
  const rows = readJson<RawFact[]>('data/facts.json')
  console.log(`Knowledge facts from ${knowledgeDir()}`)
  console.log(`${rows.length} fact blocks${apply ? '' : ' (dry run — pass --apply to write)'}\n`)

  const client = getSanityClientForScripts()

  // City references, resolved once. A fact about Golem points at Durrës; the
  // free-text geography keeps the precise place.
  const cities = await client.fetch<Array<{_id: string; slug: string}>>(
    `*[_type == "city" && defined(slug.current)]{_id, "slug": slug.current}`,
  )
  const cityIdBySlug = new Map(cities.map((c) => [c.slug, c._id]))

  const knownSources = new Set(
    await client.fetch<string[]>(`*[_type == "knowledgeSource"].sourceId`),
  )

  const stats = {
    numeric: 0,
    ranged: 0,
    textOnly: 0,
    withCity: 0,
    missingSource: 0,
    unknownSource: 0,
  }
  const byCategory: Record<string, number> = {}
  const byConfidence: Record<string, number> = {}
  const problems: string[] = []

  const tx = client.transaction()
  let written = 0

  for (const row of rows) {
    const dataId = String(row.data_id || '').trim()
    if (!dataId) continue

    const category = categoryFor(dataId)
    byCategory[category] = (byCategory[category] || 0) + 1

    const confidence = normalizeConfidence(row.confidence)
    byConfidence[confidence] = (byConfidence[confidence] || 0) + 1

    const valueText = [row.value, row.notes].filter(Boolean).join('\n\n').slice(0, 2000)
    const eur = firstNumber(row.normalized_eur)
    const range = rangeBounds(row.normalized_eur) || rangeBounds(row.value)
    const original = parseOriginal(row.original || row.value)

    // `value` is the normalised EUR figure when the research file computed one,
    // otherwise the number the fact opens with (a percentage, a count, a kWh
    // figure). Never a number found further inside the prose — see
    // `leadingNumber`.
    const value = eur ?? leadingNumber(row.value) ?? firstQuantity(row.value)
    const usedEur = eur !== null
    if (value === null) stats.textOnly += 1
    else if (range) stats.ranged += 1
    else stats.numeric += 1

    const candidates = String(row.source_id || '').match(SOURCE_ID_RE) || []
    // A reference to a document that does not exist fails the whole
    // transaction, so an id we cannot resolve is reported and dropped rather
    // than written: one unparsable citation must not cost 368 good facts.
    const unknown = knownSources.size > 0 ? candidates.filter((id) => !knownSources.has(id)) : []
    const sourceIds = knownSources.size > 0 ? candidates.filter((id) => knownSources.has(id)) : candidates
    if (unknown.length) {
      stats.unknownSource += 1
      problems.push(`${dataId}: dropped unknown source id — ${unknown.join(', ')}`)
    }
    if (sourceIds.length === 0) {
      stats.missingSource += 1
      problems.push(`${dataId}: no usable source id`)
    }

    const citySlug = citySlugFor(row.geography, row.title, dataId)
    const cityId = citySlug ? cityIdBySlug.get(citySlug) : undefined
    if (cityId) stats.withCity += 1

    const title = (row.title || '').replace(/^—\s*/, '').trim()
    const metric = metricFrom(title || row.value || '', dataId)

    const doc = {
      _id: factDocId(dataId),
      _type: 'knowledgeFact' as const,
      dataId,
      factFamily: factFamily(dataId),
      version: 1,
      isCurrent: true,
      category,
      metric,
      title: title.slice(0, 300) || undefined,
      dataKind: normalizeDataKind(row.data_kind, dataId),
      value: value ?? undefined,
      valueLow: range ? range[0] : undefined,
      valueHigh: range ? range[1] : undefined,
      unit: unitFor(row, usedEur),
      valueText: valueText || undefined,
      originalValue: original.value ?? undefined,
      originalCurrency: original.currency ?? undefined,
      geography: (row.geography || '').slice(0, 200) || undefined,
      city: cityId ? {_type: 'reference' as const, _ref: cityId} : undefined,
      propertyType: normalizePropertyType(`${row.title} ${row.value}`),
      season: normalizeSeason(row.season),
      period: (row.period || '').slice(0, 60) || 'undated',
      source: sourceIds[0] ? {_type: 'reference' as const, _ref: sourceDocId(sourceIds[0])} : undefined,
      secondarySources: sourceIds.slice(1).map((id, index) => ({
        _type: 'reference' as const,
        _ref: sourceDocId(id),
        _key: `src${index}`,
      })),
      confidence,
      methodology:
        confidence === 'ESTIMATE' || confidence === 'FORECAST'
          ? (row.notes || 'Derived in the research file; see rawFile.').slice(0, 1000)
          : undefined,
      rawQuote: (row.raw_quote || '').slice(0, 600) || undefined,
      accessedAt: isoDate(row.accessed_at) || '2026-09-09',
      lastVerifiedAt: isoDate(row.accessed_at) || '2026-09-09',
      searchText: searchTextFor(row, category, metric),
      rawFile: row.raw_file,
    }

    tx.createIfNotExists(doc)
    // Everything the research file owns is re-set; `article`/`sectionKey`/
    // `tableId`/`rowId` are left to the article importer, and editor-set
    // `supersedes`/`validUntil` survive.
    //
    // Fields that are now empty are unset rather than skipped. Setting only the
    // defined ones leaves yesterday's value in place: when a parser fix decided
    // a fact has no number after all, the wrong number it used to carry stayed
    // in the document — and in every answer built on it.
    const {_id, _type, ...fields} = doc
    const present = Object.entries(fields).filter(([, v]) => v !== undefined)
    const absent = Object.entries(fields)
      .filter(([, v]) => v === undefined)
      .map(([key]) => key)
    tx.patch(_id, (p) => {
      const patched = p.set(Object.fromEntries(present) as Record<string, unknown>)
      return absent.length > 0 ? patched.unset(absent) : patched
    })
    written += 1
  }

  console.log('By category:')
  logTable(
    Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => [k, v]),
  )
  console.log('\nBy confidence:')
  logTable(Object.entries(byConfidence).map(([k, v]) => [k, v]))
  console.log('\nParsing:')
  logTable([
    ['single number', stats.numeric],
    ['range', stats.ranged],
    ['text only (no figure)', stats.textOnly],
    ['linked to a catalog city', stats.withCity],
    ['no source id', stats.missingSource],
    ['source missing in Sanity', stats.unknownSource],
  ])
  if (problems.length) {
    console.log(`\nFirst problems (${problems.length} total):`)
    problems.slice(0, 15).forEach((p) => console.log(`  ${p}`))
  }

  if (!apply) {
    console.log(`\nDry run. Would write ${written} knowledgeFact documents.`)
    return
  }
  await tx.commit({visibility: 'async'})
  console.log(`\nWrote ${written} knowledgeFact documents.`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
