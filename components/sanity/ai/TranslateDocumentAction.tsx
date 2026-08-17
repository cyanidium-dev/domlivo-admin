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
import {discoverLocalized} from '../../../lib/studioAi/discoverLocalized'
import {buildTranslateItems, decideTranslationSets, type TranslatedLocales} from '../../../lib/studioAi/applyTranslations'
import {aiConfigured, aiTranslate} from '../../../lib/studioAi/client'

export const TRANSLATE_ACTION_TYPES = new Set(['property', 'city', 'district'])

export const TranslateDocumentAction: DocumentActionComponent = (props) => {
  const {patch} = useDocumentOperation(props.id, props.type)
  const [open, setOpen] = useState(false)
  const [base, setBase] = useState<ProjectLocaleId>('en')
  const [overwrite, setOverwrite] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)

  const doc = (props.draft ?? props.published) as Record<string, unknown> | null
  const discovery = useMemo(() => (doc ? discoverLocalized(doc) : {entries: [], skippedInArrays: 0}), [doc])

  if (!TRANSLATE_ACTION_TYPES.has(props.type)) return null

  const run = async () => {
    if (!doc) return
    setBusy(true)
    setError(null)
    setDone(null)
    try {
      const {items, skippedNoBase} = buildTranslateItems(discovery.entries, base)
      if (items.length === 0) {
        setError(`No fields have text in ${base.toUpperCase()} — pick the language the document is written in.`)
        return
      }
      const resp = await aiTranslate(base, items)
      const translated = new Map<string, TranslatedLocales>(resp.items.map((i) => [i.key, i.locales]))
      const {setOps, written} = decideTranslationSets(discovery.entries, translated, {base, overwrite})
      if (written === 0) {
        setDone('Nothing to write — all locales are already filled. Use Overwrite to re-translate.')
        return
      }
      patch.execute([{set: setOps}])
      const skippedNote = skippedNoBase.length ? ` ${skippedNoBase.length} field(s) had no ${base.toUpperCase()} text and were skipped.` : ''
      setDone(`Wrote ${written} locale value(s) across ${resp.items.length} field(s).${skippedNote} Review and publish when ready.`)
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
            {discovery.skippedInArrays > 0 ? ` (${discovery.skippedInArrays} inside lists are not supported yet)` : ''}.
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
