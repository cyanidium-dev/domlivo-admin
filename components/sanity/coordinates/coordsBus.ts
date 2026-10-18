export type PropertyCoordinates = {lat: number | null; lng: number | null}

/**
 * Who moved the pin. Every call comes from a person in the Studio: a click or
 * drag on the map, typed numbers ('human'), or a pasted Google Maps link
 * ('gmaps'). The location source/level/precision fields listen for this and
 * mark the pin as the realtor's or a manual one, which the AI placement never
 * overwrites.
 */
export type PinOrigin = 'human' | 'gmaps'
export type PropertyCoordinatesEvent = PropertyCoordinates & {origin: PinOrigin; docId: string}

const GLOBAL_KEY = '__domlivo_property_coords__'
const EVENT_NAME = 'domlivo:property-coordinates'

/**
 * Events are scoped to one document: with two listings open side by side (a
 * duplicate opened next to its original), a click on one map must not move or
 * re-label the other. Drafts and the published document share the bare id.
 */
export function busDocId(id: unknown): string {
  return typeof id === 'string' ? id.replace(/^drafts\./, '').replace(/^versions\.[^.]+\./, '') : ''
}

function readGlobal(docId: string): PropertyCoordinates {
  if (typeof window === 'undefined') return {lat: null, lng: null}
  const raw = ((window as any)[GLOBAL_KEY] ?? {})[docId] as PropertyCoordinates | undefined
  if (!raw) return {lat: null, lng: null}
  return {
    lat: typeof raw.lat === 'number' ? raw.lat : null,
    lng: typeof raw.lng === 'number' ? raw.lng : null,
  }
}

export function getPropertyCoordinates(docId: string): PropertyCoordinates {
  return readGlobal(docId)
}

export function setPropertyCoordinates(docId: string, next: Partial<PropertyCoordinates>, origin: PinOrigin = 'human'): void {
  if (typeof window === 'undefined' || !docId) return
  const current = readGlobal(docId)
  const merged: PropertyCoordinates = {
    lat: next.lat === null ? null : typeof next.lat === 'number' ? next.lat : current.lat,
    lng: next.lng === null ? null : typeof next.lng === 'number' ? next.lng : current.lng,
  }
  ;(window as any)[GLOBAL_KEY] = {...((window as any)[GLOBAL_KEY] ?? {}), [docId]: merged}

  window.dispatchEvent(new CustomEvent<PropertyCoordinatesEvent>(EVENT_NAME, {detail: {...merged, origin, docId}}))
}

export function subscribePropertyCoordinates(docId: string, listener: (coords: PropertyCoordinatesEvent) => void): () => void {
  if (typeof window === 'undefined' || !docId) {
    return () => {
      /* nothing was subscribed */
    }
  }

  const onEvent = (event: Event) => {
    const e = event as CustomEvent<PropertyCoordinatesEvent>
    if (e.detail?.docId === docId) listener(e.detail)
  }
  window.addEventListener(EVENT_NAME, onEvent)

  return () => window.removeEventListener(EVENT_NAME, onEvent)
}
