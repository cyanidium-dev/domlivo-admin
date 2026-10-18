/**
 * Marks listings as sold: `lifecycleStatus = "sold"`, `isPublished = true`.
 *
 * A sold listing leaves every list, carousel and sitemap (they filter on
 * `active`), but its own page keeps answering with a "Sold" label and a
 * "find a similar one" form (frontend: publishedPropertyDetailFilter).
 *
 * Usage (SANITY_API_TOKEN from .env, like the other scripts here):
 *   npx tsx scripts/markPropertiesSold.ts [--dry] <slug> [<slug> ...]
 * `--dry` only prints what would change.
 */
import {getSanityClientForScripts} from './lib/sanityEnvClient'

const client = getSanityClientForScripts()

async function main() {
  const args = process.argv.slice(2)
  const dry = args.includes('--dry')
  const slugs = args.filter((a) => a !== '--dry')
  if (slugs.length === 0) {
    console.error('Pass at least one slug.')
    process.exit(1)
  }

  const docs = await client.fetch<
    Array<{_id: string; slug: string; lifecycleStatus?: string; isPublished?: boolean; title?: string}>
  >(
    `*[_type == "property" && !(_id in path("drafts.**")) && slug.current in $slugs]{
      _id, "slug": slug.current, lifecycleStatus, isPublished, "title": title.en
    }`,
    {slugs},
  )

  const found = new Set(docs.map((d) => d.slug))
  for (const s of slugs) if (!found.has(s)) console.warn(`not found: ${s}`)

  for (const d of docs) {
    console.log(
      `${dry ? '[dry] ' : ''}${d.slug}: ${d.lifecycleStatus ?? 'active'}/${d.isPublished ? 'published' : 'unpublished'} -> sold/published  (${d.title ?? ''})`,
    )
    if (dry) continue
    await client.patch(d._id).set({lifecycleStatus: 'sold', isPublished: true}).commit()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
