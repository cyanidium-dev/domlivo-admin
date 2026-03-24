/**
 * SEO field: "Fill info" fills meta title/description from main content (empty cells only),
 * generates OG title/description from structured data, copies first/hero image to OG image.
 * Property and city documents only.
 */

import React from 'react'
import {Box, Button, Stack, Text} from '@sanity/ui'
import {FormField, PatchEvent, set, useClient, useFormValue} from 'sanity'
import {useToast} from '@sanity/ui'
import type {SanityClient} from '@sanity/client'
import {
  LOCALE_IDS,
  type LocaleId,
  generateCityOgDescription,
  generateCityOgTitle,
  generatePropertyOgDescription,
  generatePropertyOgTitle,
  pickLocalized,
  type CityOgContext,
  type PropertyOgContext,
} from '../../lib/sanity/seoOgGeneration'

type LocalizedValue = Record<string, string | undefined> | undefined

function getStr(val: unknown): string | undefined {
  if (typeof val === 'string' && val.trim()) return val.trim()
  return undefined
}

type Ref = {_ref?: string}

async function fetchTitleDocs(
  client: SanityClient,
  refs: Ref[],
): Promise<Map<string, {title?: Record<string, string | undefined>}>> {
  const ids = [...new Set(refs.map((r) => r?._ref).filter(Boolean) as string[])]
  if (ids.length === 0) return new Map()
  const docs = await client.fetch<
    Array<{_id: string; title?: Record<string, string | undefined>}>
  >(`*[_id in $ids]{_id, title}`, {ids})
  return new Map(docs.map((d) => [d._id, d]))
}

type SeoFillInfoInputProps = {
  value?: Record<string, unknown>
  onChange?: (event: PatchEvent) => void
  renderDefault: (props: unknown) => React.ReactNode
  readOnly?: boolean
  type?: {title?: string; description?: string}
  markers?: unknown
  presence?: unknown
  sourceType?: 'property' | 'city'
}

export const SeoFillInfoInput = React.forwardRef(function SeoFillInfoInput(
  props: SeoFillInfoInputProps,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const {value = {}, onChange, renderDefault, readOnly, type, markers, presence, sourceType} = props
  const toast = useToast()
  const client = useClient({apiVersion: '2024-01-01'})
  const [busy, setBusy] = React.useState(false)

  const title = useFormValue(['title']) as LocalizedValue | undefined
  const shortDesc = useFormValue(['shortDescription']) as LocalizedValue | undefined
  const gallery = useFormValue(['gallery']) as unknown[] | undefined
  const heroImage = useFormValue(['heroImage']) as {asset?: {_ref?: string}} | undefined

  const status = useFormValue(['status']) as string | undefined
  const bedrooms = useFormValue(['bedrooms']) as number | undefined
  const bathrooms = useFormValue(['bathrooms']) as number | undefined
  const area = useFormValue(['area']) as number | undefined
  const price = useFormValue(['price']) as number | undefined
  const cityRef = useFormValue(['city']) as Ref | undefined
  const districtRef = useFormValue(['district']) as Ref | undefined
  const typeRef = useFormValue(['type']) as Ref | undefined
  const locationTags = useFormValue(['locationTags']) as Ref[] | undefined

  const description = useFormValue(['description']) as LocalizedValue | undefined
  const heroSubtitle = useFormValue(['heroSubtitle']) as LocalizedValue | undefined
  const heroShortLine = useFormValue(['heroShortLine']) as LocalizedValue | undefined
  const popular = useFormValue(['popular']) as boolean | undefined

  const handleFill = React.useCallback(async () => {
    if (!onChange || readOnly || !sourceType) return
    setBusy(true)
    try {
      const current = (value || {}) as Record<string, unknown>
      const merged: Record<string, unknown> = {...current}
      let changeCount = 0

      const galleryArr = Array.isArray(gallery) ? gallery : []

      for (const locale of LOCALE_IDS) {
        const loc = locale as LocaleId
        const t = getStr(title?.[locale])
        const d = getStr(shortDesc?.[locale])

        const metaTitle = {...((merged.metaTitle as Record<string, unknown>) || {})}
        const metaDescription = {...((merged.metaDescription as Record<string, unknown>) || {})}
        if (t && !getStr(metaTitle[locale] as string)) {
          metaTitle[locale] = t
          merged.metaTitle = metaTitle
          changeCount++
        }
        if (d && !getStr(metaDescription[locale] as string)) {
          metaDescription[locale] = d
          merged.metaDescription = metaDescription
          changeCount++
        }
      }

      if (sourceType === 'property') {
        const tagRefs = Array.isArray(locationTags) ? locationTags : []
        const refList = [cityRef, districtRef, typeRef, ...tagRefs].filter(Boolean) as Ref[]
        const byId = await fetchTitleDocs(client, refList)

        for (const locale of LOCALE_IDS) {
          const loc = locale as LocaleId
          const cityT = cityRef?._ref ? pickLocalized(byId.get(cityRef._ref), loc) : ''
          const districtT = districtRef?._ref ? pickLocalized(byId.get(districtRef._ref), loc) : ''
          const typeT = typeRef?._ref ? pickLocalized(byId.get(typeRef._ref), loc) : ''
          const tagTitles: string[] = []
          for (const tr of tagRefs) {
            if (tr?._ref) {
              const nm = pickLocalized(byId.get(tr._ref), loc)
              if (nm) tagTitles.push(nm)
            }
          }

          const ctx: PropertyOgContext = {
            status: status || 'sale',
            bedrooms,
            bathrooms,
            area,
            price,
            cityTitle: cityT,
            districtTitle: districtT,
            typeTitle: typeT,
            tagTitles,
          }

          const ogTitle = generatePropertyOgTitle(loc, ctx)
          const ogDescription = generatePropertyOgDescription(loc, ctx)

          if (ogTitle) {
            const ogTitleObj = {...((merged.ogTitle as Record<string, unknown>) || {})}
            ogTitleObj[locale] = ogTitle
            merged.ogTitle = ogTitleObj
            changeCount++
          }
          if (ogDescription) {
            const ogDescObj = {...((merged.ogDescription as Record<string, unknown>) || {})}
            ogDescObj[locale] = ogDescription
            merged.ogDescription = ogDescObj
            changeCount++
          }
        }

        if (galleryArr.length > 0) {
          const first = galleryArr[0] as {asset?: {_ref?: string}} | undefined
          const ref = first?.asset?._ref
          if (ref) {
            merged.ogImage = {_type: 'image', asset: {_ref: ref}}
            changeCount++
          }
        }
      } else {
        for (const locale of LOCALE_IDS) {
          const loc = locale as LocaleId
          const cityTitle =
            getStr(title?.[loc]) ||
            getStr(title?.en) ||
            getStr(title?.uk) ||
            getStr(title?.ru) ||
            getStr(title?.sq) ||
            getStr(title?.it) ||
            ''
          const ctx: CityOgContext = {
            cityTitle,
            heroShortLine: getStr(heroShortLine?.[loc]),
            shortDescription: getStr(shortDesc?.[loc]),
            description: getStr(description?.[loc]),
            heroSubtitle: getStr(heroSubtitle?.[loc]),
            popular: Boolean(popular),
          }

          const ogTitle = generateCityOgTitle(loc, ctx)
          const ogDescription = generateCityOgDescription(loc, ctx)

          if (ogTitle) {
            const ogTitleObj = {...((merged.ogTitle as Record<string, unknown>) || {})}
            ogTitleObj[locale] = ogTitle
            merged.ogTitle = ogTitleObj
            changeCount++
          }
          if (ogDescription) {
            const ogDescObj = {...((merged.ogDescription as Record<string, unknown>) || {})}
            ogDescObj[locale] = ogDescription
            merged.ogDescription = ogDescObj
            changeCount++
          }
        }

        if (heroImage?.asset?._ref) {
          merged.ogImage = {_type: 'image', asset: {_ref: heroImage.asset._ref}}
          changeCount++
        } else if (galleryArr.length > 0) {
          const first = galleryArr[0] as {asset?: {_ref?: string}} | undefined
          const ref = first?.asset?._ref
          if (ref) {
            merged.ogImage = {_type: 'image', asset: {_ref: ref}}
            changeCount++
          }
        }
      }

      if (changeCount === 0) {
        toast.push({
          status: 'info',
          title: 'Nothing to update',
          description:
            'Meta fields may already be filled, or there is no data to generate Open Graph text or image.',
        })
        return
      }

      onChange(PatchEvent.from(set(merged)))
      toast.push({
        status: 'success',
        title: 'Filled info',
        description: 'SEO meta (where empty), Open Graph text, and image were updated where possible.',
      })
    } catch (err) {
      toast.push({
        status: 'error',
        title: 'Failed',
        description: err instanceof Error ? err.message : 'Unknown error',
      })
    } finally {
      setBusy(false)
    }
  }, [
    onChange,
    readOnly,
    sourceType,
    value,
    title,
    shortDesc,
    gallery,
    heroImage,
    client,
    status,
    bedrooms,
    bathrooms,
    area,
    price,
    cityRef,
    districtRef,
    typeRef,
    locationTags,
    description,
    heroSubtitle,
    heroShortLine,
    popular,
    toast,
  ])

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
              text="Fill info"
              onClick={() => void handleFill()}
              disabled={readOnly || busy}
            />
            <Text size={1} muted style={{marginTop: 8, display: 'block'}}>
              Fills <strong>SEO title</strong> and <strong>SEO description</strong> from main title and
              short summary only where those SEO fields are still empty.{' '}
              <strong>Open Graph title</strong> and <strong>description</strong> are generated from
              listing/city data (deal type, rooms, location, price, etc.).{' '}
              {sourceType === 'property'
                ? 'The first gallery image is set as the Open Graph image when available.'
                : 'Hero image (or first gallery image) is set as the Open Graph image when available.'}
            </Text>
          </Box>
        )}
        <Box ref={ref}>{renderDefault(props)}</Box>
      </Stack>
    </FormField>
  )
})
