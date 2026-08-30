/**
 * Document action "✨ Parse from text" (property only): paste a free-text
 * listing in any language; the bot deployment's /api/studio-parse returns
 * 5-locale editorial fields, validated facts and resolved references, which
 * are patched onto the draft. Overwrite OFF fills only empty fields.
 * Never touched: agent, gallery, isPublished, lifecycleStatus, and an existing
 * slug — a missing one is minted from the English title and made unique here,
 * since `slug` is required and the draft cannot be published without it.
 */
import React, {useState} from 'react'
import {SparklesIcon} from '@sanity/icons'
import {Box, Button, Checkbox, Flex, Stack, Text, TextArea} from '@sanity/ui'
import {useClient, useDocumentOperation, type DocumentActionComponent} from 'sanity'
import {applySetOps, decideParseSets, missingForPublish} from '../../../lib/studioAi/applyParse'
import {pickFreeSlug} from '../../../lib/studioAi/slug'
import {planNewAmenities} from '../../../lib/studioAi/createAmenities'
import {planLocationRequests} from '../../../lib/studioAi/locationRequests'
import {aiConfigured, aiParse} from '../../../lib/studioAi/client'

export const ParseFromTextAction: DocumentActionComponent = (props) => {
  const {patch} = useDocumentOperation(props.id, props.type)
  const client = useClient({apiVersion: '2024-01-01'})
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [overwrite, setOverwrite] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string[] | null>(null)

  if (props.type !== 'property') return null

  const doc = (props.draft ?? props.published ?? {}) as Record<string, unknown>

  /**
   * An amenity the catalogue lacks is created on sight, flagged for review, and
   * attached to this listing straight away — nothing waits for a reviewer, and
   * nothing flagged reaches the site. A failed write must not fail the parse,
   * so this reports rather than throws.
   */
  const createMissingAmenities = async (
    unmatched: string[],
  ): Promise<{ids: string[]; stillUnmatched: string[]; lines: string[]}> => {
    const {docs, stillUnmatched} = planNewAmenities(unmatched)
    if (docs.length === 0) return {ids: [], stillUnmatched, lines: []}
    try {
      let tx = client.transaction()
      for (const doc of docs) tx = tx.createIfNotExists(doc)
      await tx.commit()
      return {
        ids: docs.map((d) => d._id),
        stillUnmatched,
        lines: [
          `Added as new amenities, hidden on the site until reviewed: ${docs.map((d) => d.title.en).join(', ')}.`,
        ],
      }
    } catch (e) {
      return {
        ids: [],
        stillUnmatched: unmatched,
        lines: [`Could not add the new amenities: ${e instanceof Error ? e.message : String(e)}`],
      }
    }
  }

  /**
   * A city or district cannot be stubbed the way an amenity can — a zone
   * carries a country reference, a public route and a readiness gate. So the
   * field stays empty, staff get a request with the listings that asked for it,
   * and the editor is told plainly what to do.
   */
  const requestMissingLocations = async (unmatched: string[], listingTitle: string): Promise<string[]> => {
    const plans = planLocationRequests(unmatched)
    if (plans.length === 0) return []
    const named = plans.map((p) => `${p.kind} “${p.name}”`).join(', ')
    const advice = `Sorry, ${named} is not in the catalogue. Check the draft — if it is a typo, fix it here and pick the right one; otherwise ask staff to add the location. The listing cannot be published until it is set.`
    try {
      const now = new Date().toISOString()
      let tx = client.transaction()
      for (const plan of plans) {
        tx = tx
          .createIfNotExists({
            _id: plan.id,
            _type: 'locationRequest',
            kind: plan.kind,
            name: plan.name,
            normalized: plan.key,
            count: 0,
            status: 'new',
            source: 'studio',
            firstSeen: now,
            lastSeen: now,
            // Only the first listing is kept: the count carries frequency, and
            // appending on every hit would grow the array without bound.
            examples: [listingTitle],
          })
          .patch(plan.id, (p) => p.inc({count: 1}).set({lastSeen: now}))
      }
      await tx.commit()
      return [advice, 'Staff have been notified — see Location requests.']
    } catch (e) {
      return [advice, `Could not record the request: ${e instanceof Error ? e.message : String(e)}`]
    }
  }

  const run = async () => {
    setBusy(true)
    setError(null)
    setDone(null)
    try {
      const resp = await aiParse(text)
      // Create-then-attach, so the listing carries the amenity from the first
      // parse instead of waiting for the catalogue to catch up.
      const added = await createMissingAmenities(resp.refs.unmatched)
      resp.refs.amenityIds = [...resp.refs.amenityIds, ...added.ids]
      resp.refs.unmatched = added.stillUnmatched
      const {setOps, skipped} = decideParseSets(doc, resp, overwrite)
      const fieldCount = Object.keys(setOps).length
      if (fieldCount === 0) {
        setDone(['Nothing to write — every parsed field already has a value. Use Overwrite to replace them.'])
        return
      }
      // A minted slug has to be unique before it is written. The endpoints stay
      // compute-only, so the lookup runs here, under the editor's own session.
      const minted = setOps.slug as {current?: string} | undefined
      if (minted?.current) {
        const taken: string[] = await client.fetch(
          `*[_type == "property" && defined(slug.current) && (slug.current == $base || slug.current match $pattern)].slug.current`,
          {base: minted.current, pattern: `${minted.current}-*`},
        )
        setOps.slug = {_type: 'slug', current: pickFreeSlug(minted.current, taken)}
      }
      patch.execute([{set: setOps}])
      const stillNeeded = missingForPublish(applySetOps(doc, setOps))
      const lines = [`Filled ${fieldCount} value(s). Review and save.`]
      if (stillNeeded.length) lines.push(`Still needed before publishing: ${stillNeeded.join(', ')}.`)
      if (skipped.length) lines.push(`Kept existing: ${skipped.join(', ')}.`)
      if (resp.refs.unmatched.length) lines.push(`Not matched (left empty): ${resp.refs.unmatched.join('; ')}.`)
      if (resp.refs.looseAmenities?.length) {
        lines.push(
          `Matched by similarity — please check: ${resp.refs.looseAmenities.map((l) => l.name).join(', ')}.`,
        )
      }
      lines.push(...added.lines)
      lines.push(...(await requestMissingLocations(resp.refs.unmatched, resp.parsed.editorial.title.en)))
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
