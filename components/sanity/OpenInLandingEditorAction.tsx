import {LaunchIcon} from '@sanity/icons'
import type {DocumentActionComponent, DocumentActionDescription, DocumentActionProps} from 'sanity'

/**
 * Studio document action: "Open in landing editor".
 *
 * Appears on `landingPage` documents and opens the Next.js visual editor at
 * `/editor/landing/<id>` in a new tab. The base URL is read from
 * `SANITY_STUDIO_PREVIEW_URL` (Vite convention — Sanity Studio only exposes
 * env vars with this prefix). Falls back to `https://domlivo.com` when unset.
 */
function resolvePreviewBase(): string {
  const env = (process.env.SANITY_STUDIO_PREVIEW_URL ?? '').trim()
  if (env) return env.replace(/\/+$/, '')
  return 'https://domlivo.com'
}

export const OpenInLandingEditorAction: DocumentActionComponent = (
  props: DocumentActionProps,
): DocumentActionDescription | null => {
  if (props.type !== 'landingPage') return null

  const docId = props.draft?._id ?? props.published?._id ?? props.id
  const cleanId = docId.replace(/^drafts\./, '')

  return {
    label: 'Open in landing editor',
    icon: LaunchIcon,
    onHandle: () => {
      const base = resolvePreviewBase()
      const url = `${base}/editor/landing/${encodeURIComponent(cleanId)}`
      if (typeof window !== 'undefined') {
        window.open(url, '_blank', 'noopener,noreferrer')
      }
      // Signals Sanity to not keep the "pending" state around.
      props.onComplete?.()
    },
    // Available on all landing pages — no special guard.
    disabled: !cleanId,
    tone: 'primary',
  }
}
