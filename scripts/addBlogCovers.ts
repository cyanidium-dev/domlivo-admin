/**
 * Cover images for the five investment posts drafted 2026-09-02, which
 * create:blog-post leaves unset by design. Same discipline as
 * replaceStockImagery.ts: named Commons files reviewed by a human, licence read
 * from Commons at run time and refused if imageCredit cannot represent it, one
 * imageCredit per asset, alt text says what the photo shows, a stand-in is
 * marked as one. Writes the DRAFT (drafts.blog-<slug>) only.
 *
 * Run:
 *   npm run add:blog-covers
 *   npm run add:blog-covers -- --execute
 */
import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})
const execute = process.argv.includes('--execute')
const client = createClient({
  projectId: (process.env.SANITY_PROJECT_ID || '').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: (process.env.SANITY_API_VERSION || '2024-01-01').trim(),
  token: process.env.SANITY_API_TOKEN?.trim(),
  useCdn: false,
})

const COMMONS_API = 'https://commons.wikimedia.org/w/api.php'
const UA = 'DomLivo content tooling (https://www.domlivo.com; contact via site)'
const TARGET_WIDTH = 1600
const PACE_MS = 20_000 // Commons 429s rapid sequential downloads (BACKLOG sourcing note)

const LICENCES = [
  {value: 'cc0', needles: ['cc0'], deed: 'https://creativecommons.org/publicdomain/zero/1.0/'},
  {value: 'pdm', needles: ['public domain mark', 'pdm'], deed: 'https://creativecommons.org/publicdomain/mark/1.0/'},
  {value: 'cc-by-sa-4.0', needles: ['cc by-sa 4', 'by-sa 4'], deed: 'https://creativecommons.org/licenses/by-sa/4.0/'},
  {value: 'cc-by-sa-3.0', needles: ['cc by-sa 3', 'by-sa 3'], deed: 'https://creativecommons.org/licenses/by-sa/3.0/'},
  {value: 'cc-by-4.0', needles: ['cc by 4', 'by 4.0'], deed: 'https://creativecommons.org/licenses/by/4.0/'},
  {value: 'cc-by-3.0', needles: ['cc by 3', 'by 3.0'], deed: 'https://creativecommons.org/licenses/by/3.0/'},
]

type Cover = {slug: string; commonsFile: string; alt: string; standInNote?: string}
/** Reviewed by eye 2026-09-03; the reasoning is in SPEC-seo06-aeo-closeout-2026-09-03.md §9. */
const COVERS: Cover[] = [
  {
    slug: 'eu-accession-albania-property-prices',
    commonsFile: 'Tirana Bulevardi Dëshmorët e Kombit.jpg',
    alt: 'The Albanian flag on Bulevardi Dëshmorët e Kombit in central Tirana, cranes behind',
    standInNote:
      'Central Tirana boulevard with the national flag and construction cranes. The article is about EU accession and property prices, which has no photograph of its own.',
  },
  {
    slug: 'where-not-to-buy-albania-2026',
    commonsFile: 'Ksamil beach.jpg',
    alt: 'The beach and islands at Ksamil, southern Albania',
  },
  {
    slug: 'undervalued-areas-albania-2026',
    commonsFile: 'Orikum, Vlorë, Albania 2019 14 – View on Orikum.jpg',
    alt: 'Orikum seen across the plain below the Llogara range, Vlorë',
  },
  {
    slug: 'albania-property-types-investment-risk',
    commonsFile: 'Albania residential houses near Durres.JPG',
    alt: 'Finished houses beside an unfinished brick shell on a hillside near Durrës',
  },
  {
    slug: 'albania-investment-by-budget-and-goal',
    commonsFile: 'Tirana New Houses in city center (WPWTR16).JPG',
    alt: 'Apartment blocks and a corner café in central Tirana',
  },
]

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const stripHtml = (v: string | undefined) => (v || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()

async function resolve(c: Cover) {
  const url =
    `${COMMONS_API}?action=query&format=json&prop=imageinfo&iiprop=url|size|extmetadata` +
    `&titles=${encodeURIComponent('File:' + c.commonsFile)}`
  const res = await fetch(url, {headers: {'User-Agent': UA}})
  if (!res.ok) throw new Error(`Commons metadata ${res.status} for ${c.commonsFile}`)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const page: any = Object.values(((await res.json()) as any)?.query?.pages ?? {})[0]
  const info = page?.imageinfo?.[0]
  if (!info) throw new Error(`No file on Commons: ${c.commonsFile}`)
  const short = String(info.extmetadata?.LicenseShortName?.value || '').toLowerCase()
  const licence = LICENCES.find((l) => l.needles.some((n) => short.includes(n)))
  if (!licence) throw new Error(`${c.commonsFile}: licence "${short}" is not one imageCredit accepts`)
  const licenceUrl: string = info.extmetadata?.LicenseUrl?.value || licence.deed
  await sleep(PACE_MS)
  const fileUrl =
    'https://commons.wikimedia.org/wiki/Special:FilePath/' +
    encodeURIComponent(c.commonsFile.replace(/ /g, '_')) +
    `?width=${TARGET_WIDTH}`
  const fileRes = await fetch(fileUrl, {headers: {'User-Agent': UA}})
  if (!fileRes.ok) throw new Error(`Commons download ${fileRes.status} for ${c.commonsFile}`)
  const bytes = Buffer.from(await fileRes.arrayBuffer())
  if (bytes.byteLength < 30_000 || !String(fileRes.headers.get('content-type')).startsWith('image/')) {
    throw new Error(`${c.commonsFile}: download is not an image (${bytes.byteLength} bytes)`)
  }
  return {
    cover: c,
    licence: licence.value,
    licenceUrl,
    author: stripHtml(info.extmetadata?.Artist?.value) || 'Unknown',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:' + encodeURIComponent(c.commonsFile.replace(/ /g, '_')),
    bytes,
    filename: c.commonsFile.replace(/[^\w.-]+/g, '-').toLowerCase(),
  }
}

async function main(): Promise<void> {
  if (!COVERS.length) throw new Error('COVERS is empty — fill it from the by-eye review first')
  const drafts: Array<{_id: string; slug: string; hasCover: boolean}> = await client.fetch(
    `*[_type=="blogPost" && _id in path("drafts.**") && slug.current in $slugs]{_id, "slug": slug.current, "hasCover": defined(coverImage.asset)}`,
    {slugs: COVERS.map((c) => c.slug)},
  )
  for (const c of COVERS) {
    const d = drafts.find((x) => x.slug === c.slug)
    if (!d) throw new Error(`${c.slug}: no draft found`)
    if (d.hasCover) console.log(`  skip  ${c.slug} — already has a cover`)
  }
  const todo = COVERS.filter((c) => !drafts.find((x) => x.slug === c.slug)?.hasCover)
  const resolved: Array<Awaited<ReturnType<typeof resolve>>> = []
  for (const c of todo) {
    const r = await resolve(c)
    resolved.push(r)
    console.log(
      `  ${c.slug.padEnd(42)} ${r.licence.padEnd(13)} ${Math.round(r.bytes.byteLength / 1024)} KB  ${r.author.slice(0, 30)}  ${c.standInNote ? 'STAND-IN' : ''}`,
    )
  }
  if (!execute) {
    console.log('\nDry run. Re-run with --execute to upload and write the drafts.')
    return
  }
  for (const r of resolved) {
    const asset = await client.assets.upload('image', r.bytes, {
      filename: r.filename,
      description: `Source: ${r.sourceUrl} · Licence: ${r.licence} · Author: ${r.author}.${r.cover.standInNote ? ` STAND-IN: ${r.cover.standInNote}` : ''}`,
    })
    await client.createOrReplace({
      _id: `imageCredit-${asset._id.replace(/^image-/, '').slice(0, 40)}`,
      _type: 'imageCredit',
      image: {_type: 'image', asset: {_type: 'reference', _ref: asset._id}},
      title: r.cover.alt,
      author: r.author,
      licence: r.licence,
      licenceUrl: r.licenceUrl,
      sourceUrl: r.sourceUrl,
      isStandIn: Boolean(r.cover.standInNote),
      ...(r.cover.standInNote ? {standInNote: r.cover.standInNote} : {}),
    } as never)
    const draftId = drafts.find((x) => x.slug === r.cover.slug)!._id
    await client
      .patch(draftId)
      .set({coverImage: {_type: 'image', asset: {_type: 'reference', _ref: asset._id}, alt: r.cover.alt}})
      .commit()
    console.log(`  ✓ ${r.cover.slug} ← ${asset._id}`)
  }
}
main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
