import React from 'react'
import {Box, Card, Checkbox, Stack, TextInput} from '@sanity/ui'
import {FormField, PatchEvent, set, useFormValue} from 'sanity'

type CurrencyRateItem = {_key?: string; code?: string; name?: string; symbol?: string}

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

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  return a.every((v, i) => v === b[i])
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
    const [search, setSearch] = React.useState('')

    const ratesRaw = useFormValue(['currencyRates']) as CurrencyRateItem[] | undefined
    const rates = Array.isArray(ratesRaw) ? ratesRaw : []
    const selected = React.useMemo(() => normalizeCurrencyArray(value), [value])

    const filtered = React.useMemo(() => {
      const s = (search || '').trim().toLowerCase()
      if (!s) return rates
      return rates.filter((r) => {
        const code = (r?.code || '').toLowerCase()
        const name = (r?.name || '').toLowerCase()
        return code.includes(s) || name.includes(s)
      })
    }, [rates, search])

    React.useEffect(() => {
      if (readOnly || !onChange) return
      const raw = Array.isArray(value) ? value : []
      const normalized = normalizeCurrencyArray(raw)
      if (!arraysEqual(normalized, raw)) {
        onChange(PatchEvent.from(set(normalized)))
      }
    }, [value, onChange, readOnly])

    const handleToggle = React.useCallback(
      (code: string) => {
        if (!onChange || readOnly) return
        const trimmed = (code || '').trim()
        if (!trimmed) return
        const isCurrentlySelected = selected.includes(trimmed)
        if (isCurrentlySelected && selected.length <= 1) return // At least one required
        const next = isCurrentlySelected
          ? selected.filter((c: string) => c !== trimmed)
          : normalizeCurrencyArray([...selected, trimmed]).sort()
        onChange(PatchEvent.from(set(next)))
      },
      [onChange, readOnly, selected],
    )

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
              No exchange rates available. Sync rates via cron first, then select display currencies.
            </Card>
          ) : (
            <>
              <TextInput
                id={inputId}
                placeholder="Search by code or name..."
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.currentTarget.value)}
                readOnly={readOnly}
              />
              <Box style={{maxHeight: 240, overflowY: 'auto'}}>
                <Stack space={2}>
                  {filtered.map((r: CurrencyRateItem) => {
                    const code = String(r?.code ?? '').trim()
                    if (!code) return null
                    const name = String(r?.name ?? '').trim()
                    const label = name ? `${code} — ${name}` : code || '?'
                    const isChecked = selected.includes(code)
                    return (
                      <Card
                        key={r?._key ?? code}
                        padding={2}
                        radius={2}
                        style={{cursor: readOnly ? 'default' : 'pointer'}}
                        onClick={() => handleToggle(code)}
                      >
                        <Checkbox
                          checked={isChecked}
                          disabled={readOnly}
                          label={label}
                          onChange={() => handleToggle(code)}
                        />
                      </Card>
                    )
                  })}
                </Stack>
              </Box>
              {selected.length > 0 && (
                <Box style={{fontSize: 12, color: 'var(--card-muted-fg-color)'}}>
                  {selected.length} selected
                </Box>
              )}
            </>
          )}
        </Stack>
      </FormField>
    )
  },
)
