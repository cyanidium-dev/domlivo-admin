import React from 'react'
import {useClient, useFormValue} from 'sanity'
import {Card, Stack, Text} from '@sanity/ui'
import type {SanityClient} from '@sanity/client'
import {getPromotionSlotsInfoForDocument} from '../../schemaTypes/utils/propertyPromotionCapValidation'

type PromotionTypeInputProps = {
  renderDefault: (props: unknown) => React.ReactNode
  readOnly?: boolean
  value?: unknown
}

export function PropertyPromotionSlotsInfoInput(props: PromotionTypeInputProps) {
  const {renderDefault} = props
  const client = useClient({apiVersion: '2024-01-01'}) as SanityClient

  const promoted = useFormValue(['promoted']) as boolean | undefined
  const promotionType = useFormValue(['promotionType']) as string | undefined
  const agentRef = useFormValue(['agent', '_ref']) as string | undefined
  const docId = useFormValue(['_id']) as string | undefined

  const [busy, setBusy] = React.useState(false)
  const [message, setMessage] = React.useState<string>('')

  const requestIdRef = React.useRef(0)
  const busyTimerRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    if (!promoted || !promotionType) {
      setBusy(false)
      setMessage('')
      return
    }

    const reqId = ++requestIdRef.current

    if (busyTimerRef.current) {
      window.clearTimeout(busyTimerRef.current)
      busyTimerRef.current = null
    }

    // Avoid flicker: only show "Checking..." if it takes longer than 150-200ms.
    setBusy(false)
    busyTimerRef.current = window.setTimeout(() => {
      if (reqId === requestIdRef.current) setBusy(true)
    }, 180)

    let cancelled = false

    async function run() {
      try {
        const res = await getPromotionSlotsInfoForDocument(client, {
          _id: docId,
          promoted,
          promotionType,
          agent: agentRef ? {_ref: agentRef} : undefined,
        })
        if (cancelled || reqId !== requestIdRef.current) return
        setMessage(res.message)
      } finally {
        if (cancelled || reqId !== requestIdRef.current) return
        if (busyTimerRef.current) {
          window.clearTimeout(busyTimerRef.current)
          busyTimerRef.current = null
        }
        setBusy(false)
      }
    }

    void run()

    return () => {
      cancelled = true
      if (busyTimerRef.current) {
        window.clearTimeout(busyTimerRef.current)
        busyTimerRef.current = null
      }
    }
  }, [client, promoted, promotionType, agentRef, docId])

  const defaultNode = renderDefault(props)

  return (
    <Stack space={2}>
      {defaultNode}
      {promoted && message ? (
        <Card padding={2} radius={2} tone="transparent" border>
          <Text size={1} style={{lineHeight: 1.35}}>
            {busy ? 'Checking promotion slots...' : message}
          </Text>
        </Card>
      ) : null}
    </Stack>
  )
}

