/**
 * Read-only gate before publishing the drafted district FAQ sections:
 *  1. every faqSection item (question + answer) and the section title carry
 *     all six locales;
 *  2. the draft equals its published copy everywhere except the FAQ block —
 *     so publishing the draft cannot silently revert an edit made to the
 *     published document after the draft was cut.
 * Exit 1 on any problem. Run: npx tsx scripts/verifyFaqDrafts.ts
 */
import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'
import {PROJECT_LOCALE_IDS} from '../lib/sanity/localizedPaste/projectLocales'

loadDotenv({path: path.resolve(process.cwd(), '.env')})
const client = createClient({
  projectId: (process.env.SANITY_PROJECT_ID || '').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: (process.env.SANITY_API_VERSION || '2024-01-01').trim(),
  token: process.env.SANITY_API_TOKEN?.trim(),
  useCdn: false,
})

type Doc = Record<string, unknown> & {_id: string; pageSections?: Array<Record<string, unknown>>}
const strip = (d: Doc) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const {_id, _rev, _updatedAt, _createdAt, pageSections, ...rest} = d
  return {...rest, pageSections: (pageSections || []).filter((s) => s._type !== 'faqSection')}
}
const missingLocales = (v: Record<string, unknown> | undefined) =>
  PROJECT_LOCALE_IDS.filter((l) => !String((v as Record<string, string> | undefined)?.[l] || '').trim())

async function main(): Promise<void> {
  const drafts: Doc[] = await client.fetch(
    `*[_type=="landingPage" && pageType=="district" && _id in path("drafts.**") && count(pageSections[_type=="faqSection"])>0]`,
  )
  const problems: string[] = []
  for (const draft of drafts) {
    const publishedId = draft._id.replace(/^drafts\./, '')
    const published = (await client.getDocument(publishedId)) as Doc | null
    if (!published) {
      problems.push(`${draft._id}: no published copy`)
      continue
    }
    const faq = (draft.pageSections || []).find((s) => s._type === 'faqSection') as Record<string, unknown>
    const ml = missingLocales(faq.title as Record<string, unknown>)
    if (ml.length) problems.push(`${publishedId}: faq title missing ${ml.join(',')}`)
    for (const item of (faq.items as Array<Record<string, unknown>>) || []) {
      const q = missingLocales(item.question as Record<string, unknown>)
      const a = missingLocales(item.answer as Record<string, unknown>)
      if (q.length || a.length) {
        problems.push(
          `${publishedId}/${item._key}: question missing ${q.join(',') || '-'}, answer missing ${a.join(',') || '-'}`,
        )
      }
    }
    if (JSON.stringify(strip(draft)) !== JSON.stringify(strip(published))) {
      problems.push(`${publishedId}: draft differs from published outside the FAQ block`)
    }
  }
  console.log(`${drafts.length} drafted FAQ landings checked`)
  if (problems.length) {
    console.error(`\n${problems.length} problem(s):\n  - ${problems.join('\n  - ')}`)
    process.exit(1)
  }
  console.log('all six locales present, drafts equal published outside the FAQ block')
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
