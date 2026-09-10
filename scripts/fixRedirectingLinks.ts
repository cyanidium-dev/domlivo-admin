/**
 * Rewrite CMS links that point at a URL the app immediately redirects away from.
 *
 * The Ahrefs crawl of 2026-09-10 counted 393 internal links landing on a 307.
 * Two shapes account for all of them, and both are leftovers from routing
 * changes the content never caught up with:
 *
 *   /albania/{city}/{deal}?district={d}  →  /albania/{city}/{d}/{deal}
 *       The district became a path segment of its own (SEO-12); the query form
 *       still resolves, by redirecting. 348 links, mostly in the comparison
 *       guides.
 *
 *   /catalog?city={city}                 →  /albania/{city}
 *       The city listing has had its own path for longer still. 12 links, on
 *       the Durrës and Tirana city landings.
 *
 * `/catalog?investment=…` is deliberately untouched: it answers 200 and has no
 * path form to move to.
 *
 * The rewrite walks the whole document rather than named fields, because these
 * hrefs live in portable-text `markDefs`, section CTAs and card items alike,
 * and the next routing change will put them somewhere else again.
 *
 * Run:
 * - npm run fix:redirecting-links -- --dry
 * - npm run fix:redirecting-links -- --execute
 */

import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const projectId = (process.env.SANITY_PROJECT_ID || '').trim()
const dataset = (process.env.SANITY_DATASET || 'production').trim()
const token = process.env.SANITY_API_TOKEN?.trim()

const args = process.argv.slice(2)
const isDry = args.includes('--dry')
const isExecute = args.includes('--execute')

if (!token || !projectId) {
  console.error('Error: SANITY_PROJECT_ID and SANITY_API_TOKEN required. Add them to .env')
  process.exit(1)
}
if (!isDry && !isExecute) {
  console.error('Use --dry to preview or --execute to write.')
  process.exit(1)
}

const client = createClient({projectId, dataset, apiVersion: '2024-01-01', useCdn: false, token})

import {rewriteRedirectingHref} from './lib/rewriteRedirectingHref'

const SCANNED_TYPES = ['landingPage', 'homePage', 'blogPost', 'siteSettings', 'catalogSeoPage']

/** Rewrite every string in a document tree; returns the new tree and a count. */
function rewriteTree(node: unknown, hits: string[]): unknown {
  if (typeof node === 'string') {
    const next = rewriteRedirectingHref(node)
    if (next) {
      hits.push(`${node} → ${next}`)
      return next
    }
    return node
  }
  if (Array.isArray(node)) return node.map((n) => rewriteTree(n, hits))
  if (node && typeof node === 'object') {
    const out: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
      out[key] = rewriteTree(value, hits)
    }
    return out
  }
  return node
}

async function run() {
  console.log(`\n=== fix:redirecting-links (${isDry ? 'DRY RUN' : 'EXECUTE'}) ===\n`)

  const ids = await client.fetch<string[]>(`*[_type in $types]._id`, {types: SCANNED_TYPES})
  let docsChanged = 0
  let linksChanged = 0
  const seen = new Map<string, number>()

  for (let i = 0; i < ids.length; i += 40) {
    const docs = await client.fetch<Array<Record<string, unknown>>>(`*[_id in $ids]`, {
      ids: ids.slice(i, i + 40),
    })
    for (const doc of docs) {
      const hits: string[] = []
      const next = rewriteTree(doc, hits) as Record<string, unknown>
      if (hits.length === 0) continue

      docsChanged += 1
      linksChanged += hits.length
      for (const h of hits) seen.set(h, (seen.get(h) ?? 0) + 1)
      console.log(`  ${doc._id as string}: ${hits.length} link(s)`)

      if (isExecute) {
        // The whole document is replaced: these hrefs sit at arbitrary depths
        // inside portable text, and a patch path per occurrence would be far
        // more fragile than a create-or-replace of a tree we just derived from
        // the current one.
        await client.createOrReplace(next as never)
      }
    }
  }

  console.log(`\nDistinct rewrites:`)
  for (const [rewrite, n] of [...seen.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20)) {
    console.log(`   ${n}x  ${rewrite}`)
  }
  console.log(`\nDone: ${linksChanged} link(s) in ${docsChanged} document(s).`)
  if (isDry) console.log('Nothing was written — rerun with --execute.\n')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
