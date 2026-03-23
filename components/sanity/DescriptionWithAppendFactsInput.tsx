/**
 * Description field input with "Append property facts" button.
 * Used for property documents only.
 */

import React from 'react'
import {Box, Button, Stack, Text} from '@sanity/ui'
import {FormField, PatchEvent, set, useFormValue} from 'sanity'
import {useToast} from '@sanity/ui'
import {languages} from '../../lib/languages'

const LOCALE_IDS = languages.map((l) => l.id) as ('en' | 'uk' | 'ru' | 'sq' | 'it')[]

const LABELS: Record<string, {area: string; bedrooms: string; bathrooms: string}> = {
  en: {area: 'Area', bedrooms: 'Bedrooms', bathrooms: 'Bathrooms'},
  uk: {area: 'Площа', bedrooms: 'Спальні', bathrooms: 'Ванні'},
  ru: {area: 'Площадь', bedrooms: 'Спальни', bathrooms: 'Ванные'},
  sq: {area: 'Sipërfaqja', bedrooms: 'Dhoma gjumi', bathrooms: 'Banjo'},
  it: {area: 'Superficie', bedrooms: 'Camere', bathrooms: 'Bagni'},
}

type LocalizedValue = Record<string, string | undefined> | undefined

function getStr(val: unknown): string | undefined {
  if (typeof val === 'string' && val.trim()) return val.trim()
  return undefined
}

function buildFactsBlock(
  area: number | undefined,
  bedrooms: number | undefined,
  bathrooms: number | undefined,
  locale: string,
): string {
  const labels = LABELS[locale] ?? LABELS.en
  const parts: string[] = []
  if (typeof area === 'number' && area >= 0) {
    parts.push(`${labels.area}: ${area} m²`)
  }
  if (typeof bedrooms === 'number' && bedrooms >= 0) {
    parts.push(`${labels.bedrooms}: ${bedrooms}`)
  }
  if (typeof bathrooms === 'number' && bathrooms >= 0) {
    parts.push(`${labels.bathrooms}: ${bathrooms}`)
  }
  return parts.join(' · ')
}

type DescriptionWithAppendFactsInputProps = {
  value?: LocalizedValue
  onChange?: (event: PatchEvent) => void
  renderDefault: (props: unknown) => React.ReactNode
  readOnly?: boolean
  type?: {title?: string; description?: string}
  markers?: unknown
  presence?: unknown
}

export const DescriptionWithAppendFactsInput = React.forwardRef(
  function DescriptionWithAppendFactsInput(
    props: DescriptionWithAppendFactsInputProps,
    ref: React.ForwardedRef<HTMLDivElement>,
  ) {
    const {value = {}, onChange, renderDefault, readOnly, type, markers, presence} = props
    const toast = useToast()

    const area = useFormValue(['area']) as number | undefined
    const bedrooms = useFormValue(['bedrooms']) as number | undefined
    const bathrooms = useFormValue(['bathrooms']) as number | undefined

    const handleAppend = React.useCallback(() => {
      if (!onChange || readOnly) return

      try {
        const description = (value || {}) as LocalizedValue
        const factsBlockEn = buildFactsBlock(area, bedrooms, bathrooms, 'en')
        if (!factsBlockEn) {
          toast.push({
            status: 'info',
            title: 'Nothing to update',
            description: 'No facts to append (area, bedrooms, bathrooms are all empty).',
          })
          return
        }

        const updates: Record<string, string> = {}
        let appendedCount = 0

        for (const locale of LOCALE_IDS) {
          const desc = getStr(description?.[locale])
          if (!desc) continue

          const block = buildFactsBlock(area, bedrooms, bathrooms, locale)
          if (!block || desc.includes(block)) continue

          updates[locale] = `${desc.trim()}\n\n${block}`
          appendedCount++
        }

        if (appendedCount === 0) {
          toast.push({
            status: 'info',
            title: 'Nothing to update',
            description: 'All descriptions already contain the facts block or have no content.',
          })
          return
        }

        const merged = {...description} as Record<string, string>
        for (const [locale, val] of Object.entries(updates)) {
          merged[locale] = val
        }

        onChange(PatchEvent.from(set(merged)))
        toast.push({
          status: 'success',
          title: 'Appended property facts',
          description: `Updated ${appendedCount} locale(s).`,
        })
      } catch (err) {
        toast.push({
          status: 'error',
          title: 'Failed',
          description: err instanceof Error ? err.message : 'Unknown error',
        })
      }
    }, [onChange, readOnly, value, area, bedrooms, bathrooms])

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
          <Box>
            <Button
              mode="ghost"
              tone="primary"
              text="Append property facts"
              onClick={handleAppend}
              disabled={readOnly}
            />
            <Text size={1} muted style={{marginTop: 4, display: 'block'}}>
              Appends area, bedrooms, bathrooms to description for locales with content.
            </Text>
          </Box>
          <Box ref={ref}>{renderDefault(props)}</Box>
        </Stack>
      </FormField>
    )
  },
)
