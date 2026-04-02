import React from 'react'
import {useClient, useFormValue} from 'sanity'
import {Card, Stack, Text} from '@sanity/ui'
import type {SanityClient} from '@sanity/client'
import {checkPromotionCapForDocument} from '../../schemaTypes/utils/propertyPromotionCapValidation'

type PropertyAgentWarningInputProps = {
  renderDefault: (props: unknown) => React.ReactNode
  readOnly?: boolean
  value?: unknown
}

export function PropertyAgentPromotionUnpromoteWarningInput(props: PropertyAgentWarningInputProps) {
  const {renderDefault} = props
  const client = useClient({apiVersion: '2024-01-01'}) as SanityClient

  const docId = useFormValue(['_id']) as string | undefined
  const promoted = useFormValue(['promoted']) as boolean | undefined
  const promotionType = useFormValue(['promotionType']) as string | undefined
  const agentRef = useFormValue(['agent', '_ref']) as string | undefined

  const requestIdRef = React.useRef(0)
  const [warning, setWarning] = React.useState<string>('')

  React.useEffect(() => {
    const shouldCheck = Boolean(promoted && promotionType && agentRef)

    if (!shouldCheck || promotionType === 'sale') {
      setWarning('')
      return
    }

    const reqId = ++requestIdRef.current
    let cancelled = false

    async function run() {
      try {
        const res = await checkPromotionCapForDocument(client, {
          _id: docId,
          promoted: Boolean(promoted),
          promotionType,
          agent: agentRef ? {_ref: agentRef} : undefined,
        })

        if (cancelled || reqId !== requestIdRef.current) return

        if (res.ok) {
          setWarning('')
          return
        }

        // Soft warning only: no blocking, no auto-unpromote here (publish guard still enforces).
        setWarning(
          `This change will exceed the ${res.label} promotion limit for agent "${res.agentName}". This property will be automatically unpromoted on publish.`,
        )
      } catch {
        // On errors, keep UX non-blocking.
        if (!cancelled) setWarning('')
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [client, docId, promoted, promotionType, agentRef])

  const defaultNode = renderDefault(props)

  return (
    <Stack space={2}>
      {defaultNode}
      {warning ? (
        <Card padding={2} radius={2} tone="caution" border>
          <Text size={1} style={{lineHeight: 1.35}}>
            {warning}
          </Text>
        </Card>
      ) : null}
    </Stack>
  )
}

