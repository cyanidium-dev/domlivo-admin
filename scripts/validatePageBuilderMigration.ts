/**
 * Post-migration validation: landingPage.pageSections — no cityRichDescriptionSection,
 * seoTextSection content shape sanity.
 * Run: npx tsx scripts/validatePageBuilderMigration.ts
 */
import path from 'path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const REQUIRED_LOCALES = ['en', 'ru', 'uk', 'sq', 'it'] as const

function isValidBlock(b: unknown): boolean {
  if (!b || typeof b !== 'object') return false
  const o = b as Record<string, unknown>
  if (o._type !== 'block') return false
  if (!Array.isArray(o.children)) return false
  return true
}

async function main() {
  const token = process.env.SANITY_API_TOKEN?.trim()
  if (!token) {
    console.error(JSON.stringify({ok: false, error: 'SANITY_API_TOKEN missing — cannot query dataset'}))
    process.exit(2)
  }

  const client = createClient({
    projectId: (process.env.SANITY_PROJECT_ID || 'g4aqp6ex').trim(),
    dataset: (process.env.SANITY_DATASET || 'production').trim(),
    apiVersion: (process.env.SANITY_API_VERSION || '2024-01-01').trim(),
    useCdn: false,
    token,
  })

  const legacyHits = await client.fetch<Array<{_id: string}>>(
    `*[_type == "landingPage" && count(pageSections[_type == "cityRichDescriptionSection"]) > 0]{_id}`,
  )

  const docs = await client.fetch<
    {_id: string; pageSections?: Record<string, unknown>[]}[]
  >(`*[_type == "landingPage" && defined(pageSections)]{_id, pageSections}`)

  const issues: string[] = []
  const seoSamples: {_id: string; _key?: string; note?: string}[] = []

  for (const d of docs) {
    const secs = Array.isArray(d.pageSections) ? d.pageSections : []
    for (let i = 0; i < secs.length; i++) {
      const s = secs[i] as Record<string, unknown>
      if (s._type === 'cityRichDescriptionSection') {
        issues.push(`${d._id} pageSections[${i}] still cityRichDescriptionSection`)
      }
      if (s._type === 'seoTextSection') {
        const content = s.content as Record<string, unknown> | undefined
        if (!content || typeof content !== 'object') {
          issues.push(`${d._id} seoTextSection[${i}] missing content object`)
          continue
        }
        for (const loc of REQUIRED_LOCALES) {
          const arr = content[loc]
          if (!Array.isArray(arr)) {
            issues.push(`${d._id} seoTextSection content.${loc} not array`)
            continue
          }
          for (const block of arr) {
            if (!isValidBlock(block)) {
              issues.push(`${d._id} seoTextSection content.${loc} invalid block`)
            }
          }
          const onlyNbsp =
            arr.length === 1 &&
            isValidBlock(arr[0]) &&
            String((arr[0] as {children?: {text?: string}[]}).children?.[0]?.text || '') === '\u00a0'
          if (onlyNbsp) {
            seoSamples.push({_id: d._id, _key: String(s._key || ''), note: 'NBSP-only fallback'})
          }
        }
      }
    }
  }

  const result = {
    ok: legacyHits.length === 0 && issues.length === 0,
    landingPageCount: docs.length,
    legacyCityRichSectionDocIds: legacyHits.map((h) => h._id),
    structureIssues: issues,
    nbspFallbackSections: seoSamples,
  }

  console.log(JSON.stringify(result, null, 2))
  if (legacyHits.length || issues.length) process.exit(1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
