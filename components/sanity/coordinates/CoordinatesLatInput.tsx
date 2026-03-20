import React from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import {TextInput} from '@sanity/ui'
import {FormField, PatchEvent, set, unset, useFormValue} from 'sanity'
import type {PropertyCoordinates} from './coordsBus'
import {setPropertyCoordinates, subscribePropertyCoordinates} from './coordsBus'

const DEFAULT_CENTER: [number, number] = [19.8187, 41.3275] // fallback (approx. Tirana)

// Approximate city centers for UI fallback centering.
// Used ONLY for map center when coordinates are missing.
const CITY_CENTERS: Record<string, {lat: number; lng: number}> = {
  tirana: {lat: 41.3275, lng: 19.8187},
  durres: {lat: 41.3233, lng: 19.4522},
  vlore: {lat: 40.4685, lng: 19.4903},
  sarande: {lat: 39.8723, lng: 20.0087},
  shkoder: {lat: 42.0687, lng: 19.5123},
  himare: {lat: 40.1064, lng: 19.8093},
}

function usePropertyCoordinatesState(initial: PropertyCoordinates): PropertyCoordinates {
  const [coords, setCoords] = React.useState<PropertyCoordinates>(() => initial)

  React.useEffect(() => {
    return subscribePropertyCoordinates(setCoords)
  }, [])

  return coords
}

function createPinElement() {
  const el = document.createElement('div')
  el.style.width = '22px'
  el.style.height = '22px'
  el.style.background = '#1971c2'
  el.style.border = '2px solid white'
  el.style.borderRadius = '50% 50% 50% 0'
  el.style.transform = 'rotate(-45deg)'
  el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.25)'
  el.style.position = 'relative'
  el.style.top = '2px'
  return el
}

// Custom input for `coordinatesLat` that also controls `coordinatesLng` via patches.
export const CoordinatesLatInput = React.forwardRef(function CoordinatesLatInput(
  props: any,
  ref: React.ForwardedRef<HTMLInputElement>,
) {
  const {
    type,
    value,
    readOnly,
    placeholder,
    markers,
    presence,
    onFocus,
    onBlur,
    onChange,
  } = props

  const lat = typeof value === 'number' ? value : null

  // Read sibling and parent document values (works regardless of sibling input mount timing).
  const lngFromDocRaw = useFormValue(['coordinatesLng'])
  const lngFromDoc = typeof lngFromDocRaw === 'number' ? lngFromDocRaw : null

  const cityRef = useFormValue(['city', '_ref'])
  const citySlug = typeof cityRef === 'string' && cityRef.startsWith('city-') ? cityRef.slice('city-'.length) : null
  const cityCenter = citySlug ? CITY_CENTERS[citySlug] ?? null : null

  const coords = usePropertyCoordinatesState({lat, lng: lngFromDoc})

  const effectiveLat = coords.lat
  const effectiveLng = coords.lng

  const inputId = React.useId()

  const mapContainerRef = React.useRef<HTMLDivElement | null>(null)
  const mapRef = React.useRef<maplibregl.Map | null>(null)
  const markerRef = React.useRef<maplibregl.Marker | null>(null)

  // Local coords start from stored values; subsequent updates come from coordsBus events.

  const applyCoordinates = React.useCallback(
    (nextLat: number, nextLng: number) => {
      if (!Number.isFinite(nextLat) || !Number.isFinite(nextLng)) return

      // Update map/UI immediately.
      setPropertyCoordinates({lat: nextLat, lng: nextLng})
      markerRef.current?.setLngLat([nextLng, nextLat])
    },
    [],
  )

  // Initialize map once.
  React.useEffect(() => {
    if (typeof window === 'undefined') return
    if (!mapContainerRef.current) return
    if (mapRef.current) return

    const initialCenter: [number, number] =
      effectiveLat != null && effectiveLng != null
        ? [effectiveLng, effectiveLat]
        : cityCenter
          ? [cityCenter.lng, cityCenter.lat]
          : DEFAULT_CENTER

    const style: maplibregl.StyleSpecification = {
      version: 8,
      sources: {
        osm: {
          type: 'raster',
          tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '&copy; OpenStreetMap contributors',
        },
      },
      layers: [
        {
          id: 'osm',
          type: 'raster',
          source: 'osm',
        },
      ],
    }

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style,
      center: initialCenter,
      zoom: 13,
      attributionControl: false,
      scrollZoom: false,
      dragPan: true,
      touchZoomRotate: true,
    })

    mapRef.current = map

    const onMapClick = (e: maplibregl.MapMouseEvent) => {
      const ll = e.lngLat
      applyCoordinates(ll.lat, ll.lng)
    }

    map.on('click', onMapClick)

    return () => {
      map.off('click', onMapClick)
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
    // Intentionally only once: map init should not re-create on every coordinate change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // If coordinates are missing but city is known, center map on the city.
  // Priority: saved coords (handled in marker effect) -> city center -> DEFAULT_CENTER.
  React.useEffect(() => {
    if (!mapRef.current) return
    if (effectiveLat != null || effectiveLng != null) return
    if (!cityCenter) return

    mapRef.current.jumpTo({center: [cityCenter.lng, cityCenter.lat]})
  }, [effectiveLat, effectiveLng, cityCenter?.lat, cityCenter?.lng])

  // Update marker position and creation when coordinates become available.
  React.useEffect(() => {
    if (!mapRef.current) return
    const map = mapRef.current

    // If coordinates become incomplete, remove the marker (no stale UI).
    if (effectiveLat == null || effectiveLng == null) {
      markerRef.current?.remove()
      markerRef.current = null
      return
    }

    // Recenter map immediately when we have valid coords.
    map.jumpTo({center: [effectiveLng, effectiveLat] as [number, number]})

    if (!markerRef.current) {
      const pin = createPinElement()
      markerRef.current = new maplibregl.Marker({element: pin, draggable: true})
        .setLngLat([effectiveLng, effectiveLat])
        .addTo(mapRef.current)

      markerRef.current.on('dragend', () => {
        const ll = markerRef.current?.getLngLat()
        if (!ll) return
        applyCoordinates(ll.lat, ll.lng)
      })
    } else {
      markerRef.current.setLngLat([effectiveLng, effectiveLat])
    }
  }, [effectiveLat, effectiveLng, applyCoordinates])

  // Persist coordinates from the shared bus into THIS field only.
  // This avoids "sibling field patching" issues when updating both lat/lng.
  React.useEffect(() => {
    if (!('onChange' in props)) return
    const busLat = coords.lat
    if (busLat === lat) return

    if (busLat == null) {
      onChange(PatchEvent.from(unset()))
      return
    }

    onChange(PatchEvent.from(set(busLat)))
  }, [coords.lat, lat, onChange])

  const missing = effectiveLat == null || effectiveLng == null
  const zeroZero = effectiveLat === 0 && effectiveLng === 0

  const handleLatChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const raw = event.currentTarget.value
    if (raw === '') {
      onChange(PatchEvent.from(unset()))
      setPropertyCoordinates({lat: null, lng: effectiveLng ?? null})
      return
    }
    const next = Number(raw)
    if (!Number.isFinite(next)) return
    onChange(PatchEvent.from(set(next)))
    setPropertyCoordinates({lat: next, lng: effectiveLng ?? null})
  }

  return (
    <div>
      <div style={{position: 'relative', marginTop: 8}}>
        <div style={{fontSize: 12, color: '#444', marginBottom: 6}}>
          Координаты (Lat/Lng)
        </div>

        <div
          ref={mapContainerRef}
          style={{
            height: 170,
            borderRadius: 8,
            border: '1px solid var(--card-border-color, #e6e6e6)',
            overflow: 'hidden',
            background: '#f5f5f5',
          }}
        />

        {missing ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 12,
              background: 'rgba(245,245,245,0.85)',
              textAlign: 'center',
              fontSize: 12,
              color: '#444',
              // Allow click-to-set on the map even when the warning overlay is visible.
              pointerEvents: 'none',
            }}
          >
            Координаты не заданы. Нажмите по карте, чтобы установить точку.
          </div>
        ) : null}

        <div style={{marginTop: 8}}>
          {missing ? (
            <div style={{color: '#9c5300', fontSize: 12}}>
              Предупреждение: заполните и `Latitude`, и `Longitude`.
            </div>
          ) : null}
          {zeroZero ? (
            <div style={{color: '#b42318', fontSize: 12, fontWeight: 600}}>
              Предупреждение: `0,0` выглядит подозрительно для реальной локации.
            </div>
          ) : null}
        </div>
      </div>

      <FormField
        __unstable_markers={markers}
        __unstable_presence={presence}
        title={type?.title}
        description={type?.description}
        inputId={inputId}
      >
        <TextInput
          id={inputId}
          type="number"
          step="any"
          ref={ref as any}
          value={lat ?? ''}
          placeholder={placeholder}
          readOnly={readOnly}
          onFocus={onFocus}
          onBlur={onBlur}
          onChange={handleLatChange}
        />
      </FormField>
    </div>
  )
})

