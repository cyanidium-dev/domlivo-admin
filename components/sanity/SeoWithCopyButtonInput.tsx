/**
 * SEO field input with "Copy content to SEO" button.
 * Used for property and city documents.
 */

import React from 'react'
import {Box, Button, Stack, Text} from '@sanity/ui'
import {FormField, PatchEvent, set, useFormValue} from 'sanity'
import {useToast} from '@sanity/ui'
import {languages} from '../../lib/languages'

const LOCALE_IDS = languages.map((l) => l.id) as ('en' | 'uk' | 'ru' | 'sq' | 'it')[]

type LocalizedValue = Record<string, string | undefined> | undefined

function getStr(val: unknown): string | undefined {
  if (typeof val === 'string' && val.trim()) return val.trim()
  return undefined
}

type SeoWithCopyButtonInputProps = {
  value?: Record<string, unknown>
  onChange?: (event: PatchEvent) => void
  renderDefault: (props: unknown) => React.ReactNode
  readOnly?: boolean
  type?: {title?: string; description?: string}
  markers?: unknown
  presence?: unknown
  sourceType?: 'property' | 'city'
}

export const SeoWithCopyButtonInput = React.forwardRef(
  function SeoWithCopyButtonInput(
    props: SeoWithCopyButtonInputProps,
    ref: React.ForwardedRef<HTMLDivElement>,
  ) {
    const {value = {}, onChange, renderDefault, readOnly, type, markers, presence, sourceType} = props
    const toast = useToast()

    const title = useFormValue(['title']) as LocalizedValue | undefined
    const shortDesc = useFormValue(['shortDescription']) as LocalizedValue | undefined
    const gallery = useFormValue(['gallery']) as unknown[] | undefined
    const heroImage = useFormValue(['heroImage']) as {asset?: {_ref?: string}} | undefined

    const handleCopy = React.useCallback(() => {
      if (!onChange || readOnly || !sourceType) return

      try {
        const galleryArr = Array.isArray(gallery) ? gallery : []
        const updates: Record<string, unknown> = {}

        for (const locale of LOCALE_IDS) {
          const t = getStr(title?.[locale])
          const d = getStr(shortDesc?.[locale])
          if (t) {
            updates[`metaTitle.${locale}`] = t
            updates[`ogTitle.${locale}`] = t
          }
          if (d) {
            updates[`metaDescription.${locale}`] = d
            updates[`ogDescription.${locale}`] = d
          }
        }

        if (sourceType === 'property' && galleryArr.length > 0) {
          const first = galleryArr[0] as {asset?: {_ref?: string}} | undefined
          const ref = first?.asset?._ref
          if (ref) {
            updates['ogImage'] = {_type: 'image', asset: {_ref: ref}}
          }
        } else if (sourceType === 'city') {
          if (heroImage?.asset?._ref) {
            updates['ogImage'] = {_type: 'image', asset: {_ref: heroImage.asset._ref}}
          } else if (galleryArr.length > 0) {
            const first = galleryArr[0] as {asset?: {_ref?: string}} | undefined
            const ref = first?.asset?._ref
            if (ref) {
              updates['ogImage'] = {_type: 'image', asset: {_ref: ref}}
            }
          }
        }

        const keys = Object.keys(updates)
        if (keys.length === 0) {
          toast.push({
            status: 'info',
            title: 'Nothing to update',
            description: 'No content to copy into SEO.',
          })
          return
        }

        const current = (value || {}) as Record<string, unknown>
        const merged: Record<string, unknown> = {...current}

        for (const locale of LOCALE_IDS) {
          if (updates[`metaTitle.${locale}`] !== undefined) {
            const metaTitle = {...((merged.metaTitle as Record<string, unknown>) || {})}
            metaTitle[locale] = updates[`metaTitle.${locale}`]
            merged.metaTitle = metaTitle
          }
          if (updates[`metaDescription.${locale}`] !== undefined) {
            const metaDescription = {...((merged.metaDescription as Record<string, unknown>) || {})}
            metaDescription[locale] = updates[`metaDescription.${locale}`]
            merged.metaDescription = metaDescription
          }
          if (updates[`ogTitle.${locale}`] !== undefined) {
            const ogTitle = {...((merged.ogTitle as Record<string, unknown>) || {})}
            ogTitle[locale] = updates[`ogTitle.${locale}`]
            merged.ogTitle = ogTitle
          }
          if (updates[`ogDescription.${locale}`] !== undefined) {
            const ogDescription = {...((merged.ogDescription as Record<string, unknown>) || {})}
            ogDescription[locale] = updates[`ogDescription.${locale}`]
            merged.ogDescription = ogDescription
          }
        }
        if (updates.ogImage !== undefined) {
          merged.ogImage = updates.ogImage
        }

        onChange(PatchEvent.from(set(merged)))
        toast.push({
          status: 'success',
          title: 'Copied content to SEO',
          description: `Updated ${keys.length} field(s).`,
        })
      } catch (err) {
        toast.push({
          status: 'error',
          title: 'Failed',
          description: err instanceof Error ? err.message : 'Unknown error',
        })
      }
    }, [onChange, readOnly, sourceType, title, shortDesc, gallery, heroImage, value])

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
          {sourceType && (
            <Box>
              <Button
                mode="ghost"
                tone="primary"
                text="Copy content to SEO"
                onClick={handleCopy}
                disabled={readOnly}
              />
              <Text size={1} muted style={{marginTop: 4, display: 'block'}}>
                Copies title, short description, and first image into SEO fields.
              </Text>
            </Box>
          )}
          <Box ref={ref}>{renderDefault(props)}</Box>
        </Stack>
      </FormField>
    )
  },
)
