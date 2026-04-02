import React from 'react'
import {Card, Stack, Text} from '@sanity/ui'
import {useClient} from 'sanity'

type BannerImageBigInputProps = {
  value?: {asset?: {_ref?: string}}
  renderDefault: (props: unknown) => React.ReactNode
}

type AssetInfo = {
  url?: string
  metadata?: {dimensions?: {width?: number; height?: number}}
}

export function BannerImageBigInput(props: BannerImageBigInputProps) {
  const {value, renderDefault} = props
  const client = useClient({apiVersion: '2024-01-01'})
  const assetRef = value?.asset?._ref

  const [assetUrl, setAssetUrl] = React.useState<string>('')
  const [ratio, setRatio] = React.useState<number | null>(null)

  React.useEffect(() => {
    let cancelled = false

    async function loadAssetInfo() {
      if (!assetRef) {
        setAssetUrl('')
        setRatio(null)
        return
      }

      try {
        const asset = await client.fetch<AssetInfo | null>(
          `*[_type == "sanity.imageAsset" && _id == $id][0]{url, metadata{dimensions{width, height}}}`,
          {id: assetRef},
        )
        if (cancelled) return

        setAssetUrl(asset?.url || '')
        const w = asset?.metadata?.dimensions?.width
        const h = asset?.metadata?.dimensions?.height
        if (typeof w === 'number' && typeof h === 'number' && h > 0) {
          setRatio(w / h)
        } else {
          setRatio(null)
        }
      } catch {
        if (cancelled) return
        setAssetUrl('')
        setRatio(null)
      }
    }

    void loadAssetInfo()
    return () => {
      cancelled = true
    }
  }, [client, assetRef])

  const showRatioWarning = ratio != null && (ratio < 2.5 || ratio > 5)

  return (
    <Stack space={3}>
      {renderDefault(props)}

      <Card padding={3} radius={2} tone="transparent" border style={{marginTop: 4}}>
        <Stack space={2}>
          <Text size={1} muted>
            Banner preview (~4:1). Top and bottom may be cropped.
          </Text>

          <Card
            radius={2}
            border
            tone="transparent"
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '4 / 1',
              overflow: 'hidden',
              borderStyle: 'dashed',
            }}
          >
            {assetUrl ? (
              <img
                src={assetUrl}
                alt="Banner ratio preview"
                style={{width: '100%', height: '100%', objectFit: 'cover', display: 'block'}}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6b7280',
                  fontSize: 12,
                }}
              >
                Upload an image to preview ~4:1 cropping
              </div>
            )}
          </Card>

          {showRatioWarning && (
            <Text size={1} tone="caution">
              {'\u26A0'} Image may crop poorly. Recommended wide format (~4:1).
            </Text>
          )}
        </Stack>
      </Card>
    </Stack>
  )
}

