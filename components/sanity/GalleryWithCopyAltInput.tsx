/**
 * Gallery field input with "Copy alt to label" button.
 * Used for property, city, district.
 */

import React from 'react'
import {Box, Button, Stack, Text} from '@sanity/ui'
import {FormField, PatchEvent, set, useFormValue} from 'sanity'
import {useToast} from '@sanity/ui'

type GalleryItem = {_key?: string; alt?: string; label?: string; asset?: {_ref?: string}}

function hasAlt(item: GalleryItem): boolean {
  const v = item?.alt
  return typeof v === 'string' && v.trim().length > 0
}

function needsLabel(item: GalleryItem): boolean {
  const v = item?.label
  return v === undefined || (typeof v === 'string' && v.trim().length === 0)
}

type GalleryWithCopyAltInputProps = {
  value?: GalleryItem[]
  onChange?: (event: PatchEvent) => void
  renderDefault: (props: unknown) => React.ReactNode
  readOnly?: boolean
  type?: {title?: string; description?: string}
  markers?: unknown
  presence?: unknown
}

export const GalleryWithCopyAltInput = React.forwardRef(
  function GalleryWithCopyAltInput(
    props: GalleryWithCopyAltInputProps,
    ref: React.ForwardedRef<HTMLDivElement>,
  ) {
    const {value = [], onChange, renderDefault, readOnly, type, markers, presence} = props
    const toast = useToast()

    const gallery = Array.isArray(value) ? value : []

    const handleCopy = React.useCallback(() => {
      if (!onChange || readOnly) return

      try {
        const toUpdate: {index: number; label: string}[] = []
        for (let i = 0; i < gallery.length; i++) {
          const item = gallery[i] as GalleryItem | undefined
          if (hasAlt(item) && needsLabel(item)) {
            toUpdate.push({index: i, label: (item!.alt ?? '').trim()})
          }
        }

        if (toUpdate.length === 0) {
          toast.push({
            status: 'info',
            title: 'Nothing to update',
            description: 'No gallery items have alt text with empty label.',
          })
          return
        }

        const next = gallery.map((item, i) => {
          const update = toUpdate.find((u) => u.index === i)
          if (update) {
            return {...item, label: update.label}
          }
          return item
        }) as GalleryItem[]

        onChange(PatchEvent.from(set(next)))
        toast.push({
          status: 'success',
          title: 'Copied alt to label',
          description: `Updated ${toUpdate.length} gallery item(s).`,
        })
      } catch (err) {
        toast.push({
          status: 'error',
          title: 'Failed',
          description: err instanceof Error ? err.message : 'Unknown error',
        })
      }
    }, [onChange, readOnly, gallery])

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
          {gallery.length > 0 && (
            <Box>
              <Button
                mode="ghost"
                tone="primary"
                text="Copy alt to label"
                onClick={handleCopy}
                disabled={readOnly}
              />
              <Text size={1} muted style={{marginTop: 4, display: 'block'}}>
                Copies alt text to label for items where label is empty.
              </Text>
            </Box>
          )}
          <Box ref={ref}>{renderDefault(props)}</Box>
        </Stack>
      </FormField>
    )
  },
)
