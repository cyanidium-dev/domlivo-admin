/**
 * Document action "✨ Parse from text" (property only): paste a free-text
 * listing in any language; the bot deployment's /api/studio-parse returns
 * 5-locale editorial fields, validated facts and resolved references, which
 * are patched onto the draft. Overwrite OFF fills only empty fields.
 * Never touched: agent, gallery, isPublished, lifecycleStatus, slug.
 */
import React, {useState} from 'react'
import {SparklesIcon} from '@sanity/icons'
import {Box, Button, Checkbox, Flex, Stack, Text, TextArea} from '@sanity/ui'
import {useDocumentOperation, type DocumentActionComponent} from 'sanity'
import {decideParseSets} from '../../../lib/studioAi/applyParse'
import {aiConfigured, aiParse} from '../../../lib/studioAi/client'

export const ParseFromTextAction: DocumentActionComponent = (props) => {
  const {patch} = useDocumentOperation(props.id, props.type)
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [overwrite, setOverwrite] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string[] | null>(null)

  if (props.type !== 'property') return null

  const doc = (props.draft ?? props.published ?? {}) as Record<string, unknown>

  const run = async () => {
    setBusy(true)
    setError(null)
    setDone(null)
    try {
      const resp = await aiParse(text)
      const {setOps, skipped} = decideParseSets(doc, resp, overwrite)
      const fieldCount = Object.keys(setOps).length
      if (fieldCount === 0) {
        setDone(['Nothing to write — every parsed field already has a value. Use Overwrite to replace them.'])
        return
      }
      patch.execute([{set: setOps}])
      const lines = [`Filled ${fieldCount} value(s). Review and save.`]
      if (skipped.length) lines.push(`Kept existing: ${skipped.join(', ')}.`)
      if (resp.refs.unmatched.length) lines.push(`Not matched (left empty): ${resp.refs.unmatched.join('; ')}.`)
      lines.push(...resp.validation.warnings.map((w) => `⚠ ${w}`))
      if (resp.parsed.parserNotes) lines.push(resp.parsed.parserNotes)
      setDone(lines)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return {
    label: 'Parse from text',
    icon: SparklesIcon,
    tone: 'primary',
    disabled: !aiConfigured(),
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
      header: 'Parse listing from text',
      content: (
        <Stack space={4} padding={2}>
          <Text size={1}>
            Paste the listing text in any language — description, price, area, rooms, location, map link. Photos are
            not handled here; add them to the gallery as usual.
          </Text>
          <TextArea rows={10} value={text} onChange={(e) => setText(e.currentTarget.value)} placeholder="Shitet apartament 2+1 …" />
          <Flex align="center" gap={2}>
            <Checkbox checked={overwrite} onChange={() => setOverwrite((v) => !v)} />
            <Box>
              <Text size={1}>Overwrite fields that already have values</Text>
            </Box>
          </Flex>
          {error && (
            <Text size={1} style={{color: 'var(--card-critical-fg-color, #c33)'}}>
              {error}
            </Text>
          )}
          {done && (
            <Stack space={2}>
              {done.map((line, i) => (
                <Text key={i} size={1}>
                  {line}
                </Text>
              ))}
            </Stack>
          )}
          <Button text={busy ? 'Parsing…' : 'Parse and fill'} tone="primary" disabled={busy || !text.trim()} onClick={run} />
        </Stack>
      ),
    },
  }
}
