/**
 * The three ways a reviewer resolves an amenity suggestion. Nothing here is
 * automatic: each is a person pressing a button, which is the whole point of
 * the queue (SPEC-amenity-queue-and-slug-collisions-2026-08-22.md §2.2).
 *
 * - Map to existing → appends the wording to that amenity's aliases, so the
 *   intake resolves it from the next listing on.
 * - Create amenity → makes an amenity DRAFT. A draft, not a published
 *   document, because an amenity with one of five locales and no icon must not
 *   appear in the catalog filters; publishing stays the editor's act after
 *   running 🌐 Translate and picking an icon.
 * - Reject → takes it off the open list without pretending it was handled.
 */
import {useState} from 'react'
import {AddIcon, CloseIcon, LinkIcon} from '@sanity/icons'
import {useClient, useDocumentOperation, type DocumentActionComponent} from 'sanity'
import {slugify} from '../../../lib/studioAi/slug'

const API_VERSION = '2024-01-01'

type Suggestion = {
  _id: string
  name?: string
  status?: string
  mapTo?: {_ref?: string}
}

const readDoc = (props: {draft?: unknown; published?: unknown}): Suggestion =>
  ((props.draft ?? props.published) ?? {}) as Suggestion

export const MapAmenitySuggestionAction: DocumentActionComponent = (props) => {
  const client = useClient({apiVersion: API_VERSION})
  const {patch} = useDocumentOperation(props.id, props.type)
  const [busy, setBusy] = useState(false)
  const doc = readDoc(props)

  if (props.type !== 'amenitySuggestion') return null

  const target = doc.mapTo?._ref
  const name = (doc.name ?? '').trim()
  const ready = Boolean(target && name) && doc.status !== 'mapped'

  return {
    label: busy ? 'Mapping…' : 'Apply mapping',
    icon: LinkIcon,
    tone: 'primary',
    disabled: !ready || busy,
    title: !target
      ? 'Pick an amenity in "Map to existing amenity" first'
      : !name
        ? 'This suggestion has no name'
        : undefined,
    onHandle: async () => {
      setBusy(true)
      try {
        // setIfMissing + insert keeps an existing alias list intact; the
        // amenity's own validation refuses duplicates and 1–2 character noise.
        await client
          .patch(target!)
          .setIfMissing({aliases: []})
          .insert('after', 'aliases[-1]', [name])
          .commit()
        patch.execute([{set: {status: 'mapped'}}])
      } finally {
        setBusy(false)
        props.onComplete()
      }
    },
  }
}

export const CreateAmenityFromSuggestionAction: DocumentActionComponent = (props) => {
  const client = useClient({apiVersion: API_VERSION})
  const {patch} = useDocumentOperation(props.id, props.type)
  const [busy, setBusy] = useState(false)
  const doc = readDoc(props)

  if (props.type !== 'amenitySuggestion') return null

  const name = (doc.name ?? '').trim()
  const ready = Boolean(name) && doc.status !== 'created'

  return {
    label: busy ? 'Creating…' : 'Create amenity',
    icon: AddIcon,
    disabled: !ready || busy,
    title: doc.status === 'created' ? 'An amenity was already created from this suggestion' : undefined,
    onHandle: async () => {
      setBusy(true)
      try {
        const base = slugify(name)
        const id = `amenity-${base}`
        await client.createIfNotExists({
          _id: `drafts.${id}`,
          _type: 'amenity',
          title: {_type: 'localizedString', en: name},
          slug: {_type: 'slug', current: base},
          active: true,
        })
        patch.execute([
          {set: {status: 'created', createdAmenity: {_type: 'reference', _ref: id, _weak: true}}},
        ])
      } finally {
        setBusy(false)
        props.onComplete()
      }
    },
  }
}

export const RejectAmenitySuggestionAction: DocumentActionComponent = (props) => {
  const {patch} = useDocumentOperation(props.id, props.type)
  const doc = readDoc(props)

  if (props.type !== 'amenitySuggestion') return null

  return {
    label: 'Reject',
    icon: CloseIcon,
    tone: 'critical',
    disabled: doc.status === 'rejected',
    onHandle: () => {
      patch.execute([{set: {status: 'rejected'}}])
      props.onComplete()
    },
  }
}

export const AMENITY_SUGGESTION_ACTIONS = [
  MapAmenitySuggestionAction,
  CreateAmenityFromSuggestionAction,
  RejectAmenitySuggestionAction,
]
