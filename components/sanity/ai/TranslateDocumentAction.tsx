/**
 * Document action "🌐 Translate": translates every localized field of the
 * draft from a chosen base language into the other locales, via the bot
 * deployment's /api/studio-translate. Overwrite OFF fills empty locales only;
 * ON replaces all non-base locales. The base is picked explicitly so nothing
 * guesses the source when several locales are filled.
 */
import React, {useMemo, useState} from 'react'
import {TranslateIcon} from '@sanity/icons'
import {Box, Button, Checkbox, Flex, Select, Stack, Text} from '@sanity/ui'
import {useDocumentOperation, type DocumentActionComponent} from 'sanity'
import {PROJECT_LOCALE_IDS, type ProjectLocaleId} from '../../../lib/sanity/localizedPaste/projectLocales'
import {discoverLocalized, discoverPortableText, deserializeBlockText} from '../../../lib/studioAi/discoverLocalized'
import {buildTranslateItems, decideTranslationSets, type TranslatedLocales} from '../../../lib/studioAi/applyTranslations'
import {aiConfigured, aiTranslate} from '../../../lib/studioAi/client'

export const TRANSLATE_ACTION_TYPES = new Set(['property', 'city', 'district', 'amenity', 'blogPost'])

/** Only blogPost carries a Portable Text body worth translating. */
const PORTABLE_TEXT_FIELD: Record<string, string> = {blogPost: 'content'}

export const TranslateDocumentAction: DocumentActionComponent = (props) => {
  const {patch} = useDocumentOperation(props.id, props.type)
  const [open, setOpen] = useState(false)
  const [base, setBase] = useState<ProjectLocaleId>('en')
  const [overwrite, setOverwrite] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)

  const doc = (props.draft ?? props.published) as Record<string, unknown> | null
  const discovery = useMemo(() => (doc ? discoverLocalized(doc) : {entries: [], skippedNoKey: 0}), [doc])

  // The article body is Portable Text, which discoverLocalized cannot see —
  // the text lives in children[].text spans, not in localized objects.
  const ptField = PORTABLE_TEXT_FIELD[props.type]
  const pt = useMemo(
    () => (doc && ptField ? discoverPortableText(doc[ptField], ptField, base) : {entries: [], markedBlocks: 0}),
    [doc, ptField, base],
  )

  if (!TRANSLATE_ACTION_TYPES.has(props.type)) return null

  const run = async () => {
    if (!doc) return
    setBusy(true)
    setError(null)
    setDone(null)
    try {
      const {items, skippedNoBase} = buildTranslateItems(discovery.entries, base)
      // Body blocks ride in the same request, keyed by their patch path so the
      // response can be split back apart.
      const bodyItems = pt.entries.map((e) => ({key: e.path, kind: 'text' as const, text: e.text}))
      if (items.length === 0 && bodyItems.length === 0) {
        setError(`No fields have text in ${base.toUpperCase()} — pick the language the document is written in.`)
        return
      }
      const resp = await aiTranslate(base, [...items, ...bodyItems])
      const translated = new Map<string, TranslatedLocales>(resp.items.map((i) => [i.key, i.locales]))
      const {setOps, written} = decideTranslationSets(discovery.entries, translated, {base, overwrite})
      // decideTranslationSets only ever produces strings; a Portable Text body
      // is an array, so the patch payload is widened here rather than there.
      const ops: Record<string, unknown> = {...setOps}
      const notes: string[] = []

      // Rebuild the whole block array per locale: a translated block gets one
      // unmarked span, everything else is returned untouched.
      let bodyWritten = 0
      let lostMarks = 0
      if (ptField && pt.entries.length) {
        const sourceBlocks = ((doc?.[ptField] as Record<string, unknown>)?.[base] ?? []) as unknown[]
        for (const locale of PROJECT_LOCALE_IDS) {
          if (locale === base) continue
          const existing = (doc?.[ptField] as Record<string, unknown>)?.[locale]
          const hasContent = Array.isArray(existing) && existing.length > 0
          if (hasContent && !overwrite) continue
          const rebuilt = new Map<string, {children: unknown[]; lost: number}>()
          for (const e of pt.entries) {
            const value = translated.get(e.path)?.[locale]
            if (typeof value !== 'string' || !value.trim()) continue
            const source = (sourceBlocks as Array<Record<string, unknown>>).find((b) => b?._key === e.key)
            if (!source) continue
            const out = deserializeBlockText(source, value, e.runs)
            rebuilt.set(e.key, {children: out.children, lost: out.lostMarks})
            lostMarks += out.lostMarks
          }
          if (rebuilt.size === 0) continue
          ops[`${ptField}.${locale}`] = (sourceBlocks as Array<Record<string, unknown>>).map((b) => {
            const key = typeof b?._key === 'string' ? b._key : ''
            const next = key ? rebuilt.get(key) : undefined
            // A block with no translation — an image, a CTA, an embed — is
            // returned untouched.
            return next ? {...b, children: next.children} : b
          })
          bodyWritten += 1
        }
      }
      if (lostMarks > 0) {
        notes.push(
          `${lostMarks} formatting run(s) did not come back and render as plain text — the wording is intact.`,
        )
      }
      if (bodyWritten > 0) notes.push(`Article body written for ${bodyWritten} locale(s).`)
      if (skippedNoBase.length) {
        notes.push(`${skippedNoBase.length} field(s) had no ${base.toUpperCase()} text and were skipped.`)
      }
      if (resp.oversized.length) {
        notes.push(`Too long to translate in one request: ${resp.oversized.join(', ')}.`)
      }
      if (written === 0 && bodyWritten === 0) {
        setDone(
          ['Nothing to write — all locales are already filled. Use Overwrite to re-translate.', ...notes].join(' '),
        )
        return
      }
      patch.execute([{set: ops}])
      setDone(
        [
          `Wrote ${written} locale value(s) across ${resp.items.length} field(s).`,
          ...notes,
          'Review and publish when ready.',
        ].join(' '),
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return {
    label: 'Translate',
    icon: TranslateIcon,
    tone: 'primary',
    disabled: !doc || !aiConfigured(),
    title: aiConfigured() ? undefined : 'SANITY_STUDIO_AI_API_URL / _SECRET not configured',
    onHandle: () => setOpen(true),
    dialog: open && {
      type: 'dialog',
      onClose: () => {
        setOpen(false)
        setError(null)
        setDone(null)
        props.onComplete()
      },
      header: 'Translate document',
      content: (
        <Stack space={4} padding={2}>
          <Text size={1}>
            {discovery.entries.length} localized field(s) found
            {discovery.skippedNoKey > 0 ? ` (${discovery.skippedNoKey} inside lists have no key and cannot be patched)` : ''}
            {pt.entries.length > 0 ? `, plus ${pt.entries.length} article body block(s)` : ''}
            {pt.markedBlocks > 0 ? ` (${pt.markedBlocks} carry formatting, which is preserved)` : ''}.
          </Text>
          <Stack space={2}>
            <Text size={1} weight="semibold">
              Base language (the language the content is written in)
            </Text>
            <Select value={base} onChange={(e) => setBase(e.currentTarget.value as ProjectLocaleId)}>
              {PROJECT_LOCALE_IDS.map((l) => (
                <option key={l} value={l}>
                  {l.toUpperCase()}
                </option>
              ))}
            </Select>
          </Stack>
          <Flex align="center" gap={2}>
            <Checkbox checked={overwrite} onChange={() => setOverwrite((v) => !v)} />
            <Box>
              <Text size={1}>Overwrite existing translations (base language is never touched)</Text>
            </Box>
          </Flex>
          {error && (
            <Text size={1} style={{color: 'var(--card-critical-fg-color, #c33)'}}>
              {error}
            </Text>
          )}
          {done && <Text size={1}>{done}</Text>}
          <Button
            text={busy ? 'Translating…' : 'Translate'}
            tone="primary"
            disabled={busy}
            onClick={run}
          />
        </Stack>
      ),
    },
  }
}
