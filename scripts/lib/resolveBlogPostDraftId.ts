import type {SanityClient} from '@sanity/client'

/**
 * Resolves a blogPost slug to its `drafts.<id>` document id.
 *
 * Every batch-3 slug is a rewritten legacy stub whose original `_id` was
 * `blog-<slug>`, not the `blogPost-<slug>` convention batch 1/2 used for
 * freshly-created posts (see loadBlogPost.ts, which already resolves by
 * slug for exactly this reason). Scripts that hardcoded
 * `drafts.blogPost-${slug}` silently reported "draft not found" against
 * every batch-3 post until this was pulled out and reused.
 */
export async function resolveBlogPostDraftId(client: SanityClient, slug: string): Promise<string | null> {
  const id = await client.fetch<string | null>(
    `*[_type=="blogPost" && slug.current==$slug][0]._id`,
    {slug},
  )
  if (!id) return null
  return `drafts.${id.replace(/^drafts\./, '')}`
}
