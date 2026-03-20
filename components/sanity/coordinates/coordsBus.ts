export type PropertyCoordinates = {lat: number | null; lng: number | null}

const GLOBAL_KEY = '__domlivo_property_coords__'
const EVENT_NAME = 'domlivo:property-coordinates'

function readGlobal(): PropertyCoordinates {
  if (typeof window === 'undefined') return {lat: null, lng: null}
  const raw = (window as any)[GLOBAL_KEY] as PropertyCoordinates | undefined
  if (!raw) return {lat: null, lng: null}
  return {
    lat: typeof raw.lat === 'number' ? raw.lat : null,
    lng: typeof raw.lng === 'number' ? raw.lng : null,
  }
}

export function getPropertyCoordinates(): PropertyCoordinates {
  return readGlobal()
}

export function setPropertyCoordinates(next: Partial<PropertyCoordinates>): void {
  if (typeof window === 'undefined') return
  const current = readGlobal()
  const merged: PropertyCoordinates = {
    lat: next.lat === null ? null : typeof next.lat === 'number' ? next.lat : current.lat,
    lng: next.lng === null ? null : typeof next.lng === 'number' ? next.lng : current.lng,
  }
  ;(window as any)[GLOBAL_KEY] = merged

  window.dispatchEvent(new CustomEvent(EVENT_NAME, {detail: merged}))
}

export function subscribePropertyCoordinates(listener: (coords: PropertyCoordinates) => void): () => void {
  if (typeof window === 'undefined') return () => {}

  const onEvent = (event: Event) => {
    const e = event as CustomEvent<PropertyCoordinates>
    listener(e.detail)
  }
  window.addEventListener(EVENT_NAME, onEvent)

  return () => window.removeEventListener(EVENT_NAME, onEvent)
}

