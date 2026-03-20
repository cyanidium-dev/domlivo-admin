import React from 'react'
import {TextInput} from '@sanity/ui'
import {FormField, PatchEvent, set, unset, useFormValue} from 'sanity'
import {PropertyCoordinates, setPropertyCoordinates, subscribePropertyCoordinates} from './coordsBus'

export const CoordinatesLngInput = React.forwardRef(function CoordinatesLngInput(
  props: any,
  ref: React.ForwardedRef<HTMLInputElement>,
) {
  const {type, value, readOnly, placeholder, markers, presence, onFocus, onBlur, onChange} = props
  const lng = typeof value === 'number' ? value : null

  const latFromDocRaw = useFormValue(['coordinatesLat'])
  const latFromDoc = typeof latFromDocRaw === 'number' ? latFromDocRaw : null

  const [coords, setCoords] = React.useState<PropertyCoordinates>(() => ({
    lat: latFromDoc,
    lng,
  }))

  React.useEffect(() => subscribePropertyCoordinates(setCoords), [])

  const inputId = React.useId()

  // Persist coordinates from the shared bus into THIS field only.
  React.useEffect(() => {
    const busLng = coords.lng
    if (busLng === lng) return

    if (busLng == null) {
      onChange(PatchEvent.from(unset()))
      return
    }

    onChange(PatchEvent.from(set(busLng)))
  }, [coords.lng, lng, onChange])

  const handleLngChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const raw = event.currentTarget.value
    if (raw === '') {
      onChange(PatchEvent.from(unset()))
      setPropertyCoordinates({lat: coords.lat ?? null, lng: null})
      return
    }
    const next = Number(raw)
    if (!Number.isFinite(next)) return
    onChange(PatchEvent.from(set(next)))
    setPropertyCoordinates({lat: coords.lat ?? null, lng: next})
  }

  return (
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
        value={lng ?? ''}
        placeholder={placeholder}
        readOnly={readOnly}
        onFocus={onFocus}
        onBlur={onBlur}
        onChange={handleLngChange}
      />
    </FormField>
  )
})

