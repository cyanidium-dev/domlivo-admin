/**
 * Flip `isPublished` on knowledge articles.
 *
 * Import lands everything unpublished on purpose: the text is machine-derived
 * from the research files and wants a read-through before it is public. This is
 * the switch for after that read-through, and the way back if something turns
 * out wrong.
 *
 *   npx tsx scripts/knowledge/setKnowledgePublished.ts --on  UTIL-ELEC-ALB-2026
 *   npx tsx scripts/knowledge/setKnowledgePublished.ts --off UTIL-ELEC-ALB-2026
 *   npx tsx scripts/knowledge/setKnowledgePublished.ts --on  --all
 */
import {getSanityClientForScripts} from '../lib/sanityEnvClient'
import {articleDocId} from './lib'

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const on = args.includes('--on')
  const off = args.includes('--off')
  if (on === off) {
    console.error('Pass exactly one of --on / --off.')
    process.exit(1)
  }
  const all = args.includes('--all')
  const ids = args.filter((a) => !a.startsWith('--'))
  if (!all && ids.length === 0) {
    console.error('Pass document ids, or --all.')
    process.exit(1)
  }

  const client = getSanityClientForScripts()
  const targets: string[] = all
    ? await client.fetch<string[]>(`*[_type == "knowledgeArticle"].documentId`)
    : ids

  const tx = client.transaction()
  for (const documentId of targets) {
    tx.patch(articleDocId(documentId), (p) => p.set({isPublished: on}))
  }
  await tx.commit({visibility: 'async'})
  console.log(`${on ? 'Published' : 'Unpublished'} ${targets.length}: ${targets.join(', ')}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
