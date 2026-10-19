/**
 * CTR rewrite of 2026-10-19: new titles and descriptions for the pages with the
 * worst click-through in Search Console, one locale at a time, plus the few
 * first-paragraph edits that make the page answer its new title at once.
 *
 * Input: scripts/data/ctr-2026-10-19/ctr.json. Each edit names a document, a
 * locale and the copy. The script sets `seo.metaTitle` and `seo.ogTitle`
 * together (the landing renderer reads ogTitle first, so setting only one has
 * no effect there), the same for the description, and optionally the hero
 * subtitle of a landing or a find/replace inside the spans of a blog body.
 *
 * Checks before writing: title ≤ 60 characters, description 140–160, every
 * `find` occurs exactly once in that locale's body. The previous values go to
 * scripts/data/ctr-2026-10-19/backup-<timestamp>.json.
 *
 * Run:
 *   npx tsx scripts/applyCtrMeta20261019.ts [--execute]
 */
import fs from 'node:fs'
import path from 'node:path'
import {getSanityClientForScripts} from './lib/sanityEnvClient'

type Edit = {
  id: string
  locale: string
  url: string
  /** Only the body edits: a fact fix in a locale whose meta stays as it is. */
  bodyOnly?: boolean
  title?: string
  description?: string
  heroSubtitle?: string
  alsoIds?: string[]
  textReplace?: Array<{find: string; replace: string}>
}

const execute = process.argv.includes('--execute')
const DIR = path.resolve(process.cwd(), 'scripts/data/ctr-2026-10-19')
const all = (JSON.parse(fs.readFileSync(path.join(DIR, 'ctr.json'), 'utf8')) as {edits: Edit[]}).edits
// `--only <locale,...>` re-runs part of the file (the first run already applied the rest).
const onlyArg = process.argv.indexOf('--only')
const only = onlyArg >= 0 ? process.argv[onlyArg + 1].split(',') : null
const bodyOnlyRun = process.argv.includes('--body-only')
const edits = all.filter((e) => (!only || only.includes(e.locale)) && (!bodyOnlyRun || e.bodyOnly))

type Block = {_type: string; _key: string; children?: Array<{_type: string; text?: string}>}

async function main(): Promise<void> {
  const client = getSanityClientForScripts()
  const problems: string[] = []
  const backup: Record<string, unknown> = {}
  const tx = client.transaction()

  for (const e of edits) {
    if (!e.bodyOnly && !e.title) problems.push(`${e.url}: no title`)
    if (e.title && e.title.length > 60) problems.push(`${e.url}: title is ${e.title.length} chars`)
    if (e.description && (e.description.length < 140 || e.description.length > 160)) {
      problems.push(`${e.url}: description is ${e.description.length} chars, wants 140–160`)
    }
    for (const id of [e.id, ...(e.alsoIds ?? [])]) {
      const doc = await client.fetch<Record<string, any> | null>(`*[_id == $id][0]`, {id})
      if (!doc) {
        problems.push(`${e.url}: no document ${id}`)
        continue
      }
      const l = e.locale
      backup[`${id}:${l}`] = {
        metaTitle: doc.seo?.metaTitle?.[l],
        ogTitle: doc.seo?.ogTitle?.[l],
        metaDescription: doc.seo?.metaDescription?.[l],
        ogDescription: doc.seo?.ogDescription?.[l],
      }
      const set: Record<string, unknown> = e.title
        ? {[`seo.metaTitle.${l}`]: e.title, [`seo.ogTitle.${l}`]: e.title}
        : {}
      if (e.description) {
        set[`seo.metaDescription.${l}`] = e.description
        set[`seo.ogDescription.${l}`] = e.description
      }
      for (const k of e.bodyOnly ? [] : ['metaTitle', 'ogTitle', 'metaDescription', 'ogDescription']) {
        if (!doc.seo?.[k]) set[`seo.${k}._type`] = k.endsWith('Title') ? 'localizedString' : 'localizedText'
      }
      if (e.heroSubtitle && id === e.id) {
        const i = (doc.pageSections ?? []).findIndex((s: {_type: string}) => s._type === 'heroSection')
        if (i < 0) problems.push(`${e.url}: no hero section`)
        else {
          const key = doc.pageSections[i]._key
          backup[`${id}:${l}:hero`] = doc.pageSections[i].subtitle?.[l]
          set[`pageSections[_key=="${key}"].subtitle.${l}`] = e.heroSubtitle
        }
      }
      if (e.textReplace?.length && id === e.id) {
        const body: Block[] = doc.content?.[l] ?? []
        backup[`${id}:${l}:content`] = body
        const next = JSON.parse(JSON.stringify(body)) as Block[]
        for (const r of e.textReplace) {
          const hits = next.flatMap((b) => (b.children ?? []).filter((c) => c.text?.includes(r.find)))
          if (hits.length !== 1) {
            problems.push(`${e.url}: "${r.find.slice(0, 40)}…" found ${hits.length} times`)
            continue
          }
          hits[0].text = hits[0].text!.replace(r.find, r.replace)
        }
        set[`content.${l}`] = next
      }
      console.log(`${id} [${l}] ${e.title?.length ?? '-'}/${e.description?.length ?? '-'}  ${e.title ?? '(body only)'}`)
      tx.patch(id, (p) => p.set(set))
    }
  }

  if (problems.length) {
    console.error(`\n${problems.length} problem(s):\n${problems.join('\n')}`)
    process.exit(1)
  }
  if (!execute) {
    console.log('\nDry run. Re-run with --execute.')
    return
  }
  const file = path.join(DIR, `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`)
  fs.writeFileSync(file, JSON.stringify(backup, null, 2))
  const res = await tx.commit()
  console.log(`\nBackup ${path.relative(process.cwd(), file)}; transaction ${res.transactionId}.`)
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
