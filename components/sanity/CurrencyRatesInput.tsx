import React from 'react'
import {Box, Card, Stack, Text} from '@sanity/ui'
import {FormField, useFormValue} from 'sanity'

type CurrencyRateItem = {_key?: string; code?: string; rate?: number; name?: string; symbol?: string}

function formatRelativeTime(iso: string | undefined): string {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return '—'
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return d.toLocaleDateString()
  } catch {
    return '—'
  }
}

export const CurrencyRatesInput = React.forwardRef(function CurrencyRatesInput(
  props: {
    value?: CurrencyRateItem[]
    renderDefault: (props: unknown) => React.ReactNode
    readOnly?: boolean
    type?: {title?: string; description?: string}
    markers?: unknown
    presence?: unknown
  },
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const {value = [], renderDefault, type, markers, presence} = props
  const [expanded, setExpanded] = React.useState(false)

  const lastSynced = useFormValue(['currencyLastSyncedAt']) as string | undefined
  const rates = Array.isArray(value) ? value : []
  const count = rates.length
  const sample = rates.slice(0, 5).map((r) => r?.code).filter(Boolean)

  const inputId = React.useId()

  return (
    <FormField
      __unstable_markers={markers}
      __unstable_presence={presence}
      title={type?.title}
      description={type?.description}
      inputId={inputId}
    >
      <Stack space={3}>
        <Card
          padding={3}
          radius={2}
          tone="transparent"
          border
          ref={ref}
          style={{cursor: 'pointer'}}
          onClick={() => setExpanded((e) => !e)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setExpanded((prev) => !prev)
            }
          }}
        >
          <Stack space={2}>
            <Box flex={1}>
              <Text size={2} weight="medium">
                {count} {count === 1 ? 'currency' : 'currencies'} synced
              </Text>
            </Box>
            <Text size={1} muted>
              Last synced: {formatRelativeTime(lastSynced)}
            </Text>
            {sample.length > 0 && (
              <Text size={1} muted>
                {sample.join(', ')}
                {count > 5 ? ` … +${count - 5} more` : ''}
              </Text>
            )}
            {!expanded && (
              <Text size={1} muted>
                Click to inspect full data
              </Text>
            )}
          </Stack>
        </Card>
        {expanded && (
          <Box marginTop={2}>
            {renderDefault(props)}
          </Box>
        )}
      </Stack>
    </FormField>
  )
})
