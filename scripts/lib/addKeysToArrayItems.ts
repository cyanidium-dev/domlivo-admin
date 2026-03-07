import crypto from 'crypto'

function genKey(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 12)
}

/**
 * Add _key to object array items that lack it.
 * Leaves primitives and items with existing _key unchanged.
 */
export function addKeysToArrayItems<T>(items: T[]): T[] {
  if (!Array.isArray(items)) return items
  return items.map((item) => {
    if (item === null || typeof item !== 'object' || Array.isArray(item)) return item
    const obj = {...item} as Record<string, unknown>
    if (typeof obj._key !== 'string' || !obj._key) {
      obj._key = genKey()
    }
    for (const key of Object.keys(obj)) {
      if (key === '_key') continue
      const val = obj[key]
      if (Array.isArray(val)) {
        obj[key] = addKeysToArrayItems(val)
      }
    }
    return obj as T
  })
}
