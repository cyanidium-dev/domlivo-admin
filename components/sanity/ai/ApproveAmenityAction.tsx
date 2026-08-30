/**
 * Clears `needsReview` on an amenity the listing intake created.
 *
 * The guard is the point: an amenity is only off the review list once it has
 * every locale filled, so an approved amenity is never a one-language chip in
 * the catalog filters. 🌐 Translate fills the rest in one press; the icon is a
 * separate nudge in the button's tooltip rather than a hard block, since an
 * icon-less amenity is untidy, not wrong.
 */
import {CheckmarkCircleIcon} from '@sanity/icons'
import {useDocumentOperation, type DocumentActionComponent} from 'sanity'
import {PROJECT_LOCALE_IDS} from '../../../lib/sanity/localizedPaste/projectLocales'

export const ApproveAmenityAction: DocumentActionComponent = (props) => {
  const {patch} = useDocumentOperation(props.id, props.type)

  if (props.type !== 'amenity') return null

  const doc = ((props.draft ?? props.published) ?? {}) as {
    needsReview?: boolean
    iconKey?: string
    customIcon?: unknown
    title?: Record<string, string | undefined>
  }

  if (!doc.needsReview) return null

  const missingLocales = PROJECT_LOCALE_IDS.filter((l) => !(doc.title?.[l] ?? '').trim())
  const hasIcon = Boolean(doc.iconKey || doc.customIcon)

  return {
    label: 'Approve',
    icon: CheckmarkCircleIcon,
    tone: 'positive',
    disabled: missingLocales.length > 0,
    title:
      missingLocales.length > 0
        ? `Translate it first — missing ${missingLocales.map((l) => l.toUpperCase()).join(', ')}. Use 🌐 Translate.`
        : hasIcon
          ? 'Clears the review flag — the amenity becomes visible on the site'
          : 'No icon picked yet. Approving anyway is fine; the filter chip will have no icon.',
    onHandle: () => {
      patch.execute([{set: {needsReview: false}}])
      props.onComplete()
    },
  }
}
