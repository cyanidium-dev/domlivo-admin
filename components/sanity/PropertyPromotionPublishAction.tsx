import {useCallback} from 'react'
import {
  type DocumentActionComponent,
  type DocumentActionDescription,
  type DocumentActionProps,
  useClient,
  useDocumentOperation,
  useValidationStatus,
} from 'sanity'
import {useToast} from '@sanity/ui'
import {checkPromotionCapForDocument} from '../../schemaTypes/utils/propertyPromotionCapValidation'

type PropertyDoc = {
  _id?: string
  promoted?: boolean
  promotionType?: string
  agent?: {_ref?: string}
}

function hasNonPromotionBlockingError(validation: {level?: string;message?: string}[]): boolean {
  return validation.some((item) => {
    if (item.level !== 'error') return false
    const message = String(item.message || '')
    const isPromotionMessage =
      message.includes('promotion') ||
      message.includes('Premium') ||
      message.includes('Top') ||
      message.includes('agent')
    return !isPromotionMessage
  })
}

export function withPropertyPromotionPublishGuard(
  originalAction: DocumentActionComponent,
): DocumentActionComponent {
  return function PropertyPromotionPublishAction(props: DocumentActionProps): DocumentActionDescription | null {
    const original = originalAction(props)
    const toast = useToast()
    const client = useClient({apiVersion: '2024-01-01'})
    const {publish, patch} = useDocumentOperation(props.id, props.type)
    const {validation = []} = useValidationStatus(props.id, props.type)

    if (!original) return null

    const onHandle = useCallback(async () => {
      if (hasNonPromotionBlockingError(validation)) {
        toast.push({
          status: 'error',
          title: 'Publish blocked',
          description:
            'Resolve non-promotion validation errors first. Promotion caps are handled automatically during publish.',
        })
        props.onComplete()
        return
      }

      const workingDoc = (props.draft ?? props.published ?? null) as PropertyDoc | null
      if (!workingDoc) {
        original.onHandle?.()
        return
      }

      try {
        const capCheck = await checkPromotionCapForDocument(client, workingDoc)
        if (!capCheck.ok) {
          // Auto-unpromote for consistency. We intentionally keep `discountPercent` as-is:
          // it's only relevant when promotionType === 'sale' (Sale is unlimited and promotion caps are not enforced for it).
          patch.execute([
            {set: {promoted: false}},
            {unset: ['promotionType', 'featuredOrder']},
          ])

          toast.push({
            status: 'warning',
            title: 'Property auto-unpromoted',
            description: capCheck.autoUnpromoteMessage,
          })
        } else if (workingDoc.promoted && workingDoc.promotionType === 'sale') {
          toast.push({
            status: 'info',
            title: 'Sale promotion',
            description: 'Sale promotions are unlimited and are not affected by caps.',
          })
        }
      } catch (error) {
        toast.push({
          status: 'error',
          title: 'Promotion guard check failed',
          description: 'Could not verify promotion caps before publish. Please try again.',
        })
        props.onComplete()
        return
      }

      publish.execute()
      props.onComplete()
    }, [
      validation,
      toast,
      props,
      original,
      client,
      patch,
      publish,
    ])

    return {
      ...original,
      onHandle,
    }
  }
}
