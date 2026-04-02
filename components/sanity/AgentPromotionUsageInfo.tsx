import React from 'react'
import {useClient, useFormValue} from 'sanity'
import {Card, Stack, Text} from '@sanity/ui'
import type {SanityClient} from '@sanity/client'
import {getAgentPromotionUsageInfoForAgentId} from '../../schemaTypes/utils/propertyPromotionCapValidation'

type AgentPromotionUsageInputProps = {
  renderDefault: (props: unknown) => React.ReactNode
  readOnly?: boolean
  value?: unknown
}

function baseId(id: string): string {
  return id.replace(/^drafts\./, '')
}

export function AgentPromotionUsageInfo(props: AgentPromotionUsageInputProps) {
  const {renderDefault} = props
  const client = useClient({apiVersion: '2024-01-01'}) as SanityClient

  const agentDocId = useFormValue(['_id']) as string | undefined
  const agentRef = agentDocId ? baseId(agentDocId) : undefined

  const [busy, setBusy] = React.useState(false)
  const [message, setMessage] = React.useState<string>('')
  const [premium, setPremium] = React.useState<{used: number; cap: number; capSourceLabel: string} | null>(null)
  const [top, setTop] = React.useState<{used: number; cap: number; capSourceLabel: string} | null>(null)

  const requestIdRef = React.useRef(0)
  const busyTimerRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    if (!agentRef) {
      setBusy(false)
      setPremium(null)
      setTop(null)
      setMessage('No agent selected.')
      return
    }

    const reqId = ++requestIdRef.current

    if (busyTimerRef.current) {
      window.clearTimeout(busyTimerRef.current)
      busyTimerRef.current = null
    }

    // Avoid flicker: only show "Checking..." when request is noticeably slow.
    setBusy(false)
    busyTimerRef.current = window.setTimeout(() => {
      if (reqId === requestIdRef.current) setBusy(true)
    }, 180)

    let cancelled = false

    async function run() {
      try {
        const res = await getAgentPromotionUsageInfoForAgentId(client, agentRef)
        if (cancelled || reqId !== requestIdRef.current) return

        if (!res.ok) {
          setPremium(null)
          setTop(null)
          setMessage(res.message)
          return
        }

        setMessage('')
        setPremium({used: res.premium.used, cap: res.premium.cap, capSourceLabel: res.premium.capSourceLabel})
        setTop({used: res.top.used, cap: res.top.cap, capSourceLabel: res.top.capSourceLabel})
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
  }, [client, agentRef])

  const defaultNode = renderDefault(props)

  return (
    <Stack space={2}>
      {defaultNode}
      {busy ? (
        <Card padding={2} radius={2} tone="transparent" border>
          <Text size={1}>Checking promotion usage...</Text>
        </Card>
      ) : message ? (
        <Card padding={2} radius={2} tone="transparent" border>
          <Text size={1}>{message}</Text>
        </Card>
      ) : premium && top ? (
        <Stack space={2}>
          <Card padding={2} radius={2} tone="transparent" border>
            <Text size={1} style={{lineHeight: 1.4}}>
              Premium: {premium.used} / {premium.cap} used ({premium.capSourceLabel})
            </Text>
          </Card>
          <Card padding={2} radius={2} tone="transparent" border>
            <Text size={1} style={{lineHeight: 1.4}}>
              Top: {top.used} / {top.cap} used ({top.capSourceLabel})
            </Text>
          </Card>
        </Stack>
      ) : null}
    </Stack>
  )
}

