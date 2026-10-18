/**
 * data/sources.json (research repo) → `knowledgeSource` documents.
 *
 * Idempotent: the document id is derived from `sourceId`, so a re-run patches
 * what changed and leaves editor-added fields (notes, archived copy, verified
 * date) alone — only the fields the research file owns are overwritten.
 *
 * Dry run:  npm run knowledge:sources
 * Apply:    npm run knowledge:sources:apply
 */
import {getSanityClientForScripts} from '../lib/sanityEnvClient'
import {
  hasFlag,
  isoDate,
  knowledgeDir,
  logTable,
  readJson,
  sourceDocId,
} from './lib'

type RawSource = {
  source_id: string
  name: string
  url?: string
  published?: string
  source_type?: string
  confidence?: string
  gives?: string
  accessed_at?: string
  raw_file?: string
}

const TYPE_RANK: Record<string, number> = {
  official_government: 1,
  official_utility: 2,
  official_statistics: 3,
  research_institution: 4,
  market_analytics: 5,
  established_media: 6,
  marketplace: 7,
  agency: 8,
  forum_social: 9,
}

/**
 * The research files write source types in prose ("official (regulator)",
 * "media citing INSTAT", "analytics"). Map to the controlled list, keeping the
 * lowest-trust reading when a line mentions two — "media citing INSTAT" is
 * media, not statistics, because the number passed through an editor.
 */
function sourceType(raw: string | undefined): string {
  const text = String(raw || '').toLowerCase()
  if (/forum|reddit|facebook|social/.test(text)) return 'forum_social'
  if (/marketplace|listing|classified|portal|retailer/.test(text)) return 'marketplace'
  if (/agency|developer/.test(text)) return 'agency'
  if (/media|news|press/.test(text)) return 'established_media'
  if (/analytics|research \(|advisory|audit firm|accounting|tax advisory/.test(text)) return 'market_analytics'
  if (/imf|world bank|ebrd|oecd|research institution|research$/.test(text)) return 'research_institution'
  if (/statistic|instat/.test(text)) return 'official_statistics'
  if (/regulator|utility|provider|ere|erru|akep/.test(text)) return 'official_utility'
  if (/official|government|law|vkm|ministry/.test(text)) return 'official_government'
  if (/research/.test(text)) return 'research_institution'
  if (/estimate/.test(text)) return 'forum_social'
  return 'established_media'
}

function confidence(raw: string | undefined): string {
  const text = String(raw || '').toUpperCase()
  if (text.includes('LOW')) return 'LOW'
  if (text.includes('MEDIUM')) return 'MEDIUM'
  if (text.includes('HIGH')) return 'HIGH'
  return 'MEDIUM'
}

async function main(): Promise<void> {
  const apply = hasFlag('--apply')
  const rows = readJson<RawSource[]>('data/sources.json')
  console.log(`Knowledge sources from ${knowledgeDir()}`)
  console.log(`${rows.length} source rows${apply ? '' : ' (dry run — pass --apply to write)'}\n`)

  const client = getSanityClientForScripts()
  const byType: Record<string, number> = {}
  const skipped: string[] = []
  let written = 0

  const tx = client.transaction()
  for (const row of rows) {
    const id = String(row.source_id || '').trim()
    if (!id) {
      skipped.push('(missing source_id)')
      continue
    }
    const type = sourceType(row.source_type)
    byType[type] = (byType[type] || 0) + 1

    const doc = {
      _id: sourceDocId(id),
      _type: 'knowledgeSource' as const,
      sourceId: id,
      name: String(row.name || id).slice(0, 300),
      url: row.url && /^https?:\/\//i.test(row.url) ? row.url : undefined,
      sourceType: type,
      priorityRank: TYPE_RANK[type],
      publishedAt: isoDate(row.published),
      accessedAt: isoDate(row.accessed_at) || '2026-09-09',
      defaultConfidence: confidence(row.confidence),
      description: row.gives ? String(row.gives).slice(0, 500) : undefined,
    }

    // createIfNotExists + patch, so re-imports never clobber editor fields
    // (notes, archivedUrl, lastVerifiedAt) that the research file does not own.
    tx.createIfNotExists(doc)
    tx.patch(doc._id, (p) =>
      p.set({
        sourceId: doc.sourceId,
        name: doc.name,
        sourceType: doc.sourceType,
        priorityRank: doc.priorityRank,
        defaultConfidence: doc.defaultConfidence,
        ...(doc.url ? {url: doc.url} : {}),
        ...(doc.publishedAt ? {publishedAt: doc.publishedAt} : {}),
        ...(doc.accessedAt ? {accessedAt: doc.accessedAt} : {}),
        ...(doc.description ? {description: doc.description} : {}),
      }),
    )
    written += 1
  }

  console.log('By source type:')
  logTable(
    Object.entries(byType)
      .sort((a, b) => (TYPE_RANK[a[0]] || 9) - (TYPE_RANK[b[0]] || 9))
      .map(([type, count]) => [type, count]),
  )
  if (skipped.length) console.log(`\nSkipped ${skipped.length}: ${skipped.slice(0, 5).join(', ')}`)

  if (!apply) {
    console.log(`\nDry run. Would write ${written} knowledgeSource documents.`)
    return
  }
  await tx.commit({visibility: 'async'})
  console.log(`\nWrote ${written} knowledgeSource documents.`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
