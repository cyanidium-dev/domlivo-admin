import React from 'react'
import {Card, Flex, Spinner, Stack, Text, TextInput} from '@sanity/ui'
import {PatchEvent, set, unset, useFormValue, type StringInputProps} from 'sanity'
import {insideAlbania, isPointLocation, isShortMapsLink, parseMapsLink, type ParsedLocation} from '../../../lib/geo/parseMapsLink'
import {busDocId, setPropertyCoordinates} from './coordsBus'

/**
 * "Google Maps link from the realtor". Paste a link (or "lat, lng") and, when
 * it names a point, that point becomes the pin and the pin is marked as the
 * realtor's (locationSource 'realtor', exact): the AI placement never moves it.
 *
 * The link is read when it is pasted, on Enter and when the field loses focus,
 * never on each keystroke, so half-typed numbers never place a pin. A link that
 * only gives the centre of the realtor's screen (`@lat,lng`, `ll=`) or a point
 * outside Albania is refused: the realtor's pin must be a point they chose.
 *
 * Short links (maps.app.goo.gl) are followed by the site's
 * /api/geo/resolve-maps-link, since the browser cannot read Google's
 * redirects. A link to a named place without coordinates is reported as such:
 * then open it, drop a pin on the building and copy that link, or click the map.
 */
function siteBase(): string {
  // Not SANITY_STUDIO_PREVIEW_URL: that one points at a local dev server in
  // development. The apex domain 308s to www without CORS headers.
  const env = (process.env.SANITY_STUDIO_SITE_URL ?? '').trim()
  return env ? env.replace(/\/+$/, '') : 'https://www.domlivo.com'
}

type Status =
  | {kind: 'idle'}
  | {kind: 'resolving'}
  | {kind: 'ok'; lat: number; lng: number; via: string}
  | {kind: 'none'; message: string}

const NOT_A_POINT =
  'This link only shows the area the realtor was looking at, not a point. In Google Maps, long-press the building to drop a pin and share that link — or click the building on the map below.'

export function GoogleMapsLinkInput(props: StringInputProps) {
  const {value, onChange, readOnly, elementProps} = props
  const docId = busDocId(useFormValue(['_id']))
  const [text, setText] = React.useState(value ?? '')
  const [status, setStatus] = React.useState<Status>({kind: 'idle'})
  const lastHandled = React.useRef<string | null>(null)
  const request = React.useRef(0)

  React.useEffect(() => {
    setText(value ?? '')
  }, [value])

  const place = React.useCallback(
    (p: ParsedLocation | null, fallbackMessage: string) => {
      if (!isPointLocation(p)) {
        setStatus({kind: 'none', message: p ? NOT_A_POINT : fallbackMessage})
        return
      }
      if (!insideAlbania(p.lat, p.lng)) {
        setStatus({kind: 'none', message: `${p.lat.toFixed(5)}, ${p.lng.toFixed(5)} is outside Albania — check the link (latitude and longitude swapped?). The pin was not moved.`})
        return
      }
      setPropertyCoordinates(docId, {lat: p.lat, lng: p.lng}, 'gmaps')
      setStatus({kind: 'ok', lat: p.lat, lng: p.lng, via: p.via})
    },
    [docId],
  )

  const apply = React.useCallback(
    (raw: string) => {
      const link = raw.trim()
      if (!link || link === lastHandled.current) return
      lastHandled.current = link
      const id = ++request.current
      if (!isShortMapsLink(link)) {
        place(parseMapsLink(link), 'No coordinates in this text. Paste a Google Maps link with a dropped pin, or "41.3123, 19.4512", or click the map.')
        return
      }
      setStatus({kind: 'resolving'})
      fetch(`${siteBase()}/api/geo/resolve-maps-link?url=${encodeURIComponent(link)}`)
        .then((r) => r.json())
        .then((j: {lat?: number; lng?: number; via?: ParsedLocation['via']; error?: string}) => {
          // a later paste or another document wins over a slow answer
          if (id !== request.current) return
          const p = typeof j.lat === 'number' && typeof j.lng === 'number' ? {lat: j.lat, lng: j.lng, via: j.via ?? 'pin'} : null
          place(
            p,
            j.error ??
              'This link names a place but carries no coordinates. Open it, long-press the building to drop a pin, share that link, or click the map.',
          )
        })
        .catch(() => {
          if (id === request.current) setStatus({kind: 'none', message: 'Could not follow the short link. Paste the full link or click the map.'})
        })
    },
    [place],
  )

  // a new document in the same pane: forget the previous one's pending answer
  React.useEffect(() => {
    request.current++
    lastHandled.current = null
    setStatus({kind: 'idle'})
  }, [docId])

  const save = (next: string) => {
    onChange(PatchEvent.from(next.trim() ? set(next.trim()) : unset()))
  }

  return (
    <Stack space={2}>
      <TextInput
        {...elementProps}
        value={text}
        readOnly={readOnly}
        placeholder="https://maps.app.goo.gl/…  or  41.3123, 19.4512"
        onChange={(event) => {
          setText(event.currentTarget.value)
          if (!event.currentTarget.value.trim()) setStatus({kind: 'idle'})
        }}
        onPaste={(event) => {
          const pasted = event.clipboardData.getData('text')
          if (!pasted) return
          event.preventDefault()
          setText(pasted)
          save(pasted)
          apply(pasted)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            save(text)
            apply(text)
          }
        }}
        onBlur={(event) => {
          elementProps.onBlur?.(event)
          save(text)
          apply(text)
        }}
      />
      {status.kind === 'resolving' ? (
        <Flex align="center" gap={2}>
          <Spinner muted />
          <Text size={1} muted>
            Following the short link…
          </Text>
        </Flex>
      ) : null}
      {status.kind === 'ok' ? (
        <Card padding={2} radius={2} tone="positive">
          <Text size={1}>
            Pin placed from the link: {status.lat.toFixed(6)}, {status.lng.toFixed(6)} ({status.via}). Marked as the realtor&apos;s location; automatic placement will not move it.
          </Text>
        </Card>
      ) : null}
      {status.kind === 'none' ? (
        <Card padding={2} radius={2} tone="caution">
          <Text size={1}>{status.message}</Text>
        </Card>
      ) : null}
    </Stack>
  )
}
