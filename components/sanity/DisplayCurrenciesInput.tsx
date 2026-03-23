import React from 'react'
import {
  Autocomplete,
  Box,
  Button,
  Card,
  Flex,
  Popover,
  Stack,
  Text,
} from '@sanity/ui'
import {FormField, PatchEvent, set, useFormValue} from 'sanity'

type CurrencyRateItem = {_key?: string; code?: string; name?: string; symbol?: string}

/** Build a readable label; never returns empty. */
function getOptionLabel(r: CurrencyRateItem): string {
  const code = typeof r?.code === 'string' ? r.code.trim() : ''
  const name = typeof r?.name === 'string' ? r.name.trim() : ''
  if (!code) return '?'
  return name ? `${code} — ${name}` : code
}

/** Normalize to a unique array of non-empty currency codes, preserving order. */
function normalizeCurrencyArray(arr: unknown): string[] {
  if (!Array.isArray(arr)) return []
  const seen = new Set<string>()
  const result: string[] = []
  for (const item of arr) {
    const code = typeof item === 'string' ? item.trim() : ''
    if (!code || seen.has(code)) continue
    seen.add(code)
    result.push(code)
  }
  return result
}

export const DisplayCurrenciesInput = React.forwardRef(
  function DisplayCurrenciesInput(props: {
    value?: string[]
    onChange?: (event: PatchEvent) => void
    readOnly?: boolean
    type?: {title?: string; description?: string}
    markers?: unknown
    presence?: unknown
  }) {
    const {value = [], onChange, readOnly, type, markers, presence} = props
    const [addOpen, setAddOpen] = React.useState(false)

    const ratesRaw = useFormValue(['currencyRates']) as CurrencyRateItem[] | undefined
    const rates = Array.isArray(ratesRaw) ? ratesRaw : []
    const selected = React.useMemo(() => normalizeCurrencyArray(value), [value])

    const availableRates = React.useMemo(
      () => rates.filter((r) => {
        const code = typeof r?.code === 'string' ? r.code.trim() : ''
        return code && !selected.includes(code)
      }),
      [rates, selected],
    )

    const options = React.useMemo(
      () =>
        availableRates.map((r) => {
          const code = typeof r?.code === 'string' ? r.code.trim() : ''
          return {value: code}
        }),
      [availableRates],
    )

    const handleAdd = React.useCallback(
      (code: string) => {
        if (!onChange || readOnly) return
        const trimmed = (code || '').trim()
        if (!trimmed || selected.includes(trimmed)) return
        const next = [...selected, trimmed]
        onChange(PatchEvent.from(set(next)))
        setAddOpen(false)
      },
      [onChange, readOnly, selected],
    )

    const handleRemove = React.useCallback(
      (code: string) => {
        if (!onChange || readOnly) return
        const trimmed = (code || '').trim()
        if (!trimmed || selected.length <= 1) return
        const next = selected.filter((c) => c !== trimmed)
        onChange(PatchEvent.from(set(next)))
      },
      [onChange, readOnly, selected],
    )

    const handleMoveUp = React.useCallback(
      (index: number) => {
        if (!onChange || readOnly || index <= 0) return
        const next = [...selected]
        ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
        onChange(PatchEvent.from(set(next)))
      },
      [onChange, readOnly, selected],
    )

    const handleMoveDown = React.useCallback(
      (index: number) => {
        if (!onChange || readOnly || index >= selected.length - 1) return
        const next = [...selected]
        ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
        onChange(PatchEvent.from(set(next)))
      },
      [onChange, readOnly, selected],
    )

    React.useEffect(() => {
      if (readOnly || !onChange) return
      const raw = Array.isArray(value) ? value : []
      const normalized = normalizeCurrencyArray(raw)
      if (
        normalized.length !== raw.length ||
        normalized.some((c, i) => raw[i] !== c)
      ) {
        onChange(PatchEvent.from(set(normalized)))
      }
    }, [value, onChange, readOnly])

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
          {rates.length === 0 ? (
            <Card padding={3} tone="caution" radius={2}>
              <Text size={1}>
                No exchange rates available. Sync rates via cron first, then select display
                currencies.
              </Text>
            </Card>
          ) : (
            <>
              <Box>
                <Text size={1} weight="medium" muted style={{marginBottom: 8, display: 'block'}}>
                  Order = display order. Drag via ↑↓ or add below.
                </Text>

                {selected.length > 0 && (
                  <Stack space={2} style={{marginBottom: 12}}>
                    {selected.map((code, index) => {
                      const rate = rates.find((r) => String(r?.code ?? '').trim() === code)
                      const label = rate ? getOptionLabel(rate) : code
                      return (
                        <Card
                          key={code}
                          padding={2}
                          radius={2}
                          tone="default"
                          border
                          style={{display: 'flex', alignItems: 'center', gap: 8}}
                        >
                          <Flex gap={1} style={{flexShrink: 0}}>
                            <Button
                              mode="ghost"
                              padding={2}
                              tone="default"
                              disabled={readOnly || index === 0}
                              text="↑"
                              title="Move up"
                              fontSize={1}
                              onClick={() => handleMoveUp(index)}
                            />
                            <Button
                              mode="ghost"
                              padding={2}
                              tone="default"
                              disabled={readOnly || index === selected.length - 1}
                              text="↓"
                              title="Move down"
                              fontSize={1}
                              onClick={() => handleMoveDown(index)}
                            />
                          </Flex>
                          <Text size={1} style={{flex: 1}}>
                            {label}
                          </Text>
                          <Button
                            mode="ghost"
                            padding={2}
                            tone="critical"
                            disabled={readOnly || selected.length <= 1}
                            text="Remove"
                            fontSize={0}
                            onClick={() => handleRemove(code)}
                          />
                        </Card>
                      )
                    })}
                  </Stack>
                )}

                <Popover
                  content={
                    addOpen ? (
                      <Box padding={2} style={{minWidth: 280}}>
                        <Autocomplete
                          id={`${inputId}-add-currency`}
                          options={options}
                          placeholder="Search by code or name..."
                          filterOption={(query, option) => {
                            const q = (query || '').trim().toLowerCase()
                            if (!q) return true
                            const rate = availableRates.find(
                              (r) => String(r?.code ?? '').trim() === option.value,
                            )
                            const label = rate ? getOptionLabel(rate).toLowerCase() : option.value.toLowerCase()
                            return label.includes(q) || option.value.toLowerCase().includes(q)
                          }}
                          renderOption={(option) => {
                            const rate = availableRates.find(
                              (r) => String(r?.code ?? '').trim() === option.value,
                            )
                            const label = rate ? getOptionLabel(rate) : option.value
                            return (
                              <Box padding={2}>
                                <Text size={1}>{label}</Text>
                              </Box>
                            )
                          }}
                          onSelect={(code) => handleAdd(code)}
                        />
                      </Box>
                    ) : null
                  }
                  open={addOpen}
                  placement="bottom-start"
                  portal
                  onClose={() => setAddOpen(false)}
                >
                  <Button
                    mode="ghost"
                    tone="primary"
                    text="Add currency"
                    disabled={readOnly || availableRates.length === 0}
                    onClick={() => setAddOpen(true)}
                  />
                </Popover>

                {availableRates.length === 0 && selected.length > 0 && (
                  <Text size={1} muted style={{marginTop: 8, display: 'block'}}>
                    All available currencies are already selected.
                  </Text>
                )}
              </Box>
            </>
          )}
        </Stack>
      </FormField>
    )
  },
)
