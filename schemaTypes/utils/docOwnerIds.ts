/** Draft/published ID variants for the same document (Sanity validation / GROQ exclusion). */
export function docOwnerIds(document?: {_id?: string}): string[] {
  const id = document?._id
  if (!id) return []
  if (id.startsWith('drafts.')) {
    const pub = id.replace(/^drafts\./, '')
    return Array.from(new Set([id, pub, `drafts.${pub}`]))
  }
  return Array.from(new Set([id, `drafts.${id}`]))
}
