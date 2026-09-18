/**
 * Fill `localizedSlug` on every property that lacks one (see
 * scripts/lib/propertyUrlSlug.ts for the format and why).
 *
 * Existing values are never touched, so the script is safe to re-run after an
 * import or after listings are added in Studio: only the new ones get URLs.
 * Drafts are skipped; a draft gets its slugs when it is published and the
 * script runs again.
 *
 * Run:
 * - npx tsx scripts/generatePropertyUrlSlugs.ts            (dry run: prints the plan)
 * - npx tsx scripts/generatePropertyUrlSlugs.ts --execute  (writes; backup first)
 */
import fs from 'fs'
import path from 'path'
import {getSanityClientForScripts} from './lib/sanityEnvClient'
import {assignUrlSlugs, URL_SLUG_LOCALES, type UrlSlugInput} from './lib/propertyUrlSlug'

type Row = {
  _id: string
  _createdAt: string
  slug?: string
  localizedSlug?: Record<string, string>
  typeSlug?: string
  typeTitle?: Record<string, string>
  cityTitle?: Record<string, string>
  districtTitle?: Record<string, string>
  bedrooms?: number
  rooms?: number
  area?: number
  plotArea?: number
}

export async function generatePropertyUrlSlugs({execute}: {execute: boolean}) {
  const client = getSanityClientForScripts()
  const rows: Row[] = await client.fetch(`*[_type == "property" && !(_id in path("drafts.**"))]
    | order(_createdAt asc) {
      _id, _createdAt,
      "slug": slug.current,
      localizedSlug,
      "typeSlug": type->slug.current,
      "typeTitle": type->title,
      "cityTitle": city->title,
      "districtTitle": district->title,
      bedrooms, rooms, area, plotArea
    }`)

  const complete = (r: Row) => URL_SLUG_LOCALES.every((l) => r.localizedSlug?.[l])
  const reserved: Array<[string, string]> = rows
    .filter((r) => r.slug)
    .map((r) => [r.slug as string, r._id])

  const assigned = assignUrlSlugs(
    rows.map((r) => ({
      id: r._id,
      existing: r.localizedSlug,
      input: {
        typeSlug: r.typeSlug,
        typeTitle: r.typeTitle,
        cityTitle: r.cityTitle,
        districtTitle: r.districtTitle,
        bedrooms: r.bedrooms,
        rooms: r.rooms,
        area: r.area,
        plotArea: r.plotArea,
      } satisfies UrlSlugInput,
    })),
    reserved,
  )

  const todo = rows.filter((r) => !complete(r))
  console.log(`${rows.length} properties, ${todo.length} without a full set of URLs`)
  for (const r of todo.slice(0, 15)) {
    const s = assigned.get(r._id)!
    console.log(`  ${r.slug}\n    en ${s.en}\n    ru ${s.ru}\n    it ${s.it}`)
  }
  if (!execute || todo.length === 0) {
    if (!execute) console.log('\nDry run. Pass --execute to write.')
    return {rows, assigned, todo}
  }

  const backupDir = path.resolve(process.cwd(), '..', 'domlivo-workspace', 'backups')
  fs.mkdirSync(backupDir, {recursive: true})
  const backupFile = path.join(backupDir, `property-slugs-${new Date().toISOString().replace(/[:.]/g, '-')}.json`)
  fs.writeFileSync(backupFile, JSON.stringify(todo.map((r) => ({_id: r._id, slug: r.slug, localizedSlug: r.localizedSlug ?? null})), null, 2))
  console.log(`Backup: ${backupFile}`)

  const tx = client.transaction()
  for (const r of todo) tx.patch(r._id, (p) => p.set({localizedSlug: assigned.get(r._id)}))
  const res = await tx.commit()
  console.log(`Patched ${todo.length} properties, transaction ${res.transactionId}`)
  return {rows, assigned, todo}
}

const isMain = process.argv[1] && path.resolve(process.argv[1]).includes('generatePropertyUrlSlugs')
if (isMain) {
  generatePropertyUrlSlugs({execute: process.argv.includes('--execute')}).catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
