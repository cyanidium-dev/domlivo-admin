/**
 * Parser/validator for scripts/data/typeCityPairs.json (ТЗ-17).
 * Structural mirror of comparisonRegistry.parseComparisons: throws on the
 * first problem, naming the offending path. Existence of the referenced
 * propertyType/city documents is validated against the dataset by the
 * generator at run time — this file checks shape only.
 */

const SLUG_RE = /^[a-z0-9-]+$/

export type TypeCityPair = {type: string; city: string}

export function parseTypeCityPairs(raw: unknown): TypeCityPair[] {
  const root = raw as {pairs?: unknown}
  if (!root || !Array.isArray(root.pairs)) {
    throw new Error('typeCityPairs: "pairs" must be an array')
  }
  const seen = new Set<string>()
  return root.pairs.map((entry, i) => {
    const e = entry as {type?: unknown; city?: unknown}
    const path = `typeCityPairs.pairs[${i}]`
    if (typeof e?.type !== 'string' || !SLUG_RE.test(e.type)) {
      throw new Error(`${path}.type: expected a lowercase slug, got ${JSON.stringify(e?.type)}`)
    }
    if (typeof e?.city !== 'string' || !SLUG_RE.test(e.city)) {
      throw new Error(`${path}.city: expected a lowercase slug, got ${JSON.stringify(e?.city)}`)
    }
    const key = `${e.type}|${e.city}`
    if (seen.has(key)) {
      throw new Error(`${path}: duplicate pair ${key}`)
    }
    seen.add(key)
    return {type: e.type, city: e.city}
  })
}
