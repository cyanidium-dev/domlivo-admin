import React from 'react'
import {PatchEvent, set, useFormValue, type StringInputProps} from 'sanity'
import type {PinOrigin} from './coordsBus'
import {busDocId, subscribePropertyCoordinates} from './coordsBus'

/**
 * Input for a location bookkeeping field (locationSource, locationLevel,
 * locationPrecision, locationConfidence) that renders the normal Studio input
 * and, the moment a person sets THIS document's pin (map click or drag, typed
 * numbers, pasted Google Maps link), sets its own value to `valueFor(origin)`.
 *
 * Each field patches only itself, like the coordinate inputs do, so there is
 * no sibling patching. The AI placement scripts skip every listing whose
 * locationSource is 'realtor' or 'manual'.
 */
export function followsHumanPin(valueFor: (origin: PinOrigin) => string) {
  function FollowsHumanPinInput(props: StringInputProps) {
    const {onChange, value, readOnly} = props
    const docId = busDocId(useFormValue(['_id']))
    const valueRef = React.useRef(value)
    valueRef.current = value

    React.useEffect(() => {
      if (readOnly) return undefined
      return subscribePropertyCoordinates(docId, (event) => {
        if (event.lat == null || event.lng == null) return
        const next = valueFor(event.origin)
        if (valueRef.current !== next) onChange(PatchEvent.from(set(next)))
      })
    }, [docId, onChange, readOnly])

    return props.renderDefault(props)
  }
  return FollowsHumanPinInput
}
