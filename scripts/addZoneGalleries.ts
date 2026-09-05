/**
 * Gallery photos for the 15 published zones that had none (sweep 2026-09-05,
 * F10 — a published zone without a gallery is a defect by the root CLAUDE.md
 * rule). Same discipline as replaceStockImagery.ts / addBlogCovers.ts: named
 * Commons files reviewed by eye, licence read from Commons at run time and
 * refused if `imageCredit` cannot represent it, one credit per asset, alt says
 * what the photo shows, a stand-in is stamped STAND-IN. Heroes are untouched;
 * items are appended to `gallery` (created when absent). Re-running skips a
 * zone whose gallery already has photos.
 *
 * Run:
 *   npm run add:zone-galleries
 *   npm run add:zone-galleries -- --execute
 */
import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})
const execute = process.argv.includes('--execute')
const client = createClient({
  projectId: (process.env.SANITY_PROJECT_ID || '').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: '2024-06-01',
  token: process.env.SANITY_API_TOKEN?.trim(),
  useCdn: false,
})

const COMMONS_API = 'https://commons.wikimedia.org/w/api.php'
const UA = 'DomLivo content tooling (https://www.domlivo.com; contact via site)'
const TARGET_WIDTH = 1600
const PACE_MS = 20_000 // Commons 429s rapid sequential downloads

const LICENCES = [
  {value: 'cc0', needles: ['cc0'], deed: 'https://creativecommons.org/publicdomain/zero/1.0/'},
  {value: 'pdm', needles: ['public domain mark', 'public domain', 'pdm'], deed: 'https://creativecommons.org/publicdomain/mark/1.0/'},
  {value: 'cc-by-sa-4.0', needles: ['cc by-sa 4', 'by-sa 4'], deed: 'https://creativecommons.org/licenses/by-sa/4.0/'},
  {value: 'cc-by-sa-3.0', needles: ['cc by-sa 3', 'by-sa 3'], deed: 'https://creativecommons.org/licenses/by-sa/3.0/'},
  {value: 'cc-by-4.0', needles: ['cc by 4', 'by 4.0'], deed: 'https://creativecommons.org/licenses/by/4.0/'},
  {value: 'cc-by-3.0', needles: ['cc by 3', 'by 3.0'], deed: 'https://creativecommons.org/licenses/by/3.0/'},
]

type Photo = {commonsFile: string; alt: string; standInNote?: string}
type Zone = {id: string; photos: Photo[]}

/** Reviewed by eye 2026-09-05 (24 candidates viewed; SWEEP-2026-09-05.md F10 run record). */
const ZONES: Zone[] = [
  {
    id: 'district-21-dhjetori',
    photos: [
      {
        commonsFile: 'Zogu i zi (OSCAL19 trip).jpg',
        alt: 'Fountains on the Zogu i Zi roundabout, Tirana',
        standInNote: 'Zogu i Zi roundabout, the next junction west of 21 Dhjetori; no free photo of the 21 Dhjetori intersection itself was found',
      },
    ],
  },
  {
    id: 'district-ali-demi',
    photos: [
      {
        commonsFile: 'Rruga e Shkodres Tirana.jpg',
        alt: 'Shops and brick apartment blocks on Rruga e Shkodrës, Tirana',
        standInNote: 'Rruga e Shkodrës, an older residential street of the same type; no free photo taken inside Ali Demi was found',
      },
    ],
  },
  {
    id: 'district-astir-unaza-e-re',
    photos: [
      {commonsFile: 'Astir Unaza e Madhe.jpg', alt: 'The Unaza e Madhe ring road underpass at Astir, with apartment blocks behind'},
      {commonsFile: 'Unaza e Madhe Construction Astir.jpg', alt: 'Ring-road construction and traffic at Astir, Tirana'},
    ],
  },
  {
    id: 'district-bulevardi-i-ri',
    photos: [{commonsFile: 'Old locomotive on Bulevardi i ri in Tirana, 2025 1.jpg', alt: 'The restored steam locomotive on Bulevardi i Ri, Tirana, with new towers behind'}],
  },
  {
    id: 'district-don-bosko',
    photos: [{commonsFile: 'Caritas Shqiptar (Albania) Headquarters in Tirana 2022.jpg', alt: 'The Caritas Albania headquarters on Rruga Don Bosko, Tirana'}],
  },
  {
    id: 'district-golem-durres',
    photos: [
      {commonsFile: 'Promenade in Golem beach, Albania.jpg', alt: 'The palm-lined promenade along Golem beach'},
      {commonsFile: 'Golem beach in Albania.jpg', alt: 'Golem beach looking north toward Durrës'},
    ],
  },
  {
    id: 'district-kamez',
    photos: [{commonsFile: 'Kamëz, Albania 01 - Town Center.jpg', alt: 'The fountain and horse statues in Kamëz town centre'}],
  },
  {
    id: 'district-kashar',
    photos: [{commonsFile: 'ALBtelecom Headquarters - Kashar, Tiranë, Albania.jpg', alt: 'The ALBtelecom headquarters in Kashar'}],
  },
  {
    id: 'district-kombinat',
    photos: [
      {commonsFile: 'Kombinati Tekstileve photo1.jpg', alt: 'The derelict textile plant that gave Kombinat its name'},
      {commonsFile: 'Kombinati Tekstileve photo6.jpg', alt: 'Brick hall of the former textile plant, Kombinat'},
      {commonsFile: 'Monument Plaza Garibaldi Kombinat Tirana.jpg', alt: 'The old monument plinth on Plaza Garibaldi, Kombinat, in front of the municipal unit'},
    ],
  },
  {
    id: 'district-liqeni-artificial',
    photos: [{commonsFile: 'Tirana Park on the Artificial Lake.jpg', alt: 'Sunset over the Artificial Lake in the Grand Park, Tirana'}],
  },
  {
    id: 'district-myslym-shyri',
    photos: [
      {
        commonsFile: 'Rruga e Kavajës Tirana (1).jpg',
        alt: 'Rruga e Kavajës, Tirana, with the Dine Hoxha mosque minaret',
        standInNote: 'Rruga e Kavajës, the shopping street on the edge of Myslym Shyri; no free photo from inside the district was found',
      },
    ],
  },
  {
    id: 'district-paskuqan',
    photos: [{commonsFile: 'Liqeni i Paskuqanit (Paskuqan Lake) – Urban Lake and Park in Northern Tirana.jpg', alt: 'Paskuqan Lake with the Dajti mountains behind'}],
  },
  {
    id: 'district-plepa-durres',
    photos: [{commonsFile: 'SH85 and Plepa flyover.jpg', alt: 'The Plepa flyover on the SH85, where the Durrës and Kavajë roads meet'}],
  },
  {
    id: 'district-shengjin-center',
    photos: [
      {commonsFile: 'Shengjin Beach.jpg', alt: 'Shëngjin beach with the hotels along the front'},
      {commonsFile: 'Bunkers at the seaside in Shengjin, Albania.jpg', alt: 'Old bunkers on the beach at Shëngjin'},
    ],
  },
  {
    id: 'district-shkembi-durres',
    photos: [
      {commonsFile: 'Shkëmbi i Kavajës, Albania 2017 01.jpg', alt: 'Bathers at Shkëmbi i Kavajës beach below the rock'},
      {commonsFile: 'Highway at Shkëmbi i kavajës (OSCAL19 trip).jpg', alt: 'The coastal highway passing the rock at Shkëmbi i Kavajës'},
    ],
  },
]

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const stripHtml = (v: string | undefined) => (v || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
const key = (s: string) => s.replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 48)

async function resolve(p: Photo) {
  const url =
    `${COMMONS_API}?action=query&format=json&prop=imageinfo&iiprop=url|size|extmetadata` +
    `&titles=${encodeURIComponent('File:' + p.commonsFile)}`
  const res = await fetch(url, {headers: {'User-Agent': UA}})
  if (!res.ok) throw new Error(`Commons metadata ${res.status} for ${p.commonsFile}`)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const page: any = Object.values(((await res.json()) as any)?.query?.pages ?? {})[0]
  const info = page?.imageinfo?.[0]
  if (!info) throw new Error(`No file on Commons: ${p.commonsFile}`)
  const short = String(info.extmetadata?.LicenseShortName?.value || '').toLowerCase()
  const licence = LICENCES.find((l) => l.needles.some((n) => short.includes(n)))
  if (!licence) throw new Error(`${p.commonsFile}: licence "${short}" is not one imageCredit accepts`)
  const licenceUrl: string = info.extmetadata?.LicenseUrl?.value || licence.deed
  await sleep(PACE_MS)
  const fileUrl =
    'https://commons.wikimedia.org/wiki/Special:FilePath/' +
    encodeURIComponent(p.commonsFile.replace(/ /g, '_')) +
    `?width=${TARGET_WIDTH}`
  const fileRes = await fetch(fileUrl, {headers: {'User-Agent': UA}})
  if (!fileRes.ok) throw new Error(`Commons download ${fileRes.status} for ${p.commonsFile}`)
  const bytes = Buffer.from(await fileRes.arrayBuffer())
  if (bytes.byteLength < 30_000 || !String(fileRes.headers.get('content-type')).startsWith('image/')) {
    throw new Error(`${p.commonsFile}: download is not an image (${bytes.byteLength} bytes)`)
  }
  return {
    photo: p,
    licence: licence.value,
    licenceUrl,
    author: stripHtml(info.extmetadata?.Artist?.value) || 'Unknown',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:' + encodeURIComponent(p.commonsFile.replace(/ /g, '_')),
    bytes,
    filename: p.commonsFile.replace(/[^\w.-]+/g, '-').toLowerCase(),
  }
}

async function main(): Promise<void> {
  const ids = ZONES.map((z) => z.id)
  const live: Array<{_id: string; slug: string; n: number}> = await client.fetch(
    `*[_id in $ids]{_id, "slug": slug.current, "n": count(gallery[defined(asset)])}`,
    {ids},
  )
  const todo = ZONES.filter((z) => {
    const l = live.find((x) => x._id === z.id)
    if (!l) throw new Error(`${z.id} not found`)
    if (l.n > 0) console.log(`  skip  ${l.slug} — gallery already has ${l.n} photo(s)`)
    return l.n === 0
  })
  console.log(`\n${todo.length} zone(s), ${todo.reduce((n, z) => n + z.photos.length, 0)} photo(s) to resolve (paced ${PACE_MS / 1000}s each)\n`)
  for (const z of todo) {
    const slug = live.find((x) => x._id === z.id)!.slug
    const items: Array<Record<string, unknown>> = []
    for (const p of z.photos) {
      const r = await resolve(p)
      console.log(`  ${slug.padEnd(20)} ${r.licence.padEnd(13)} ${Math.round(r.bytes.byteLength / 1024)} KB  ${r.author.slice(0, 28).padEnd(28)} ${p.standInNote ? 'STAND-IN' : ''}`)
      if (!execute) continue
      const asset = await client.assets.upload('image', r.bytes, {
        filename: r.filename,
        description: `Source: ${r.sourceUrl} · Licence: ${r.licence} · Author: ${r.author}.${p.standInNote ? ` STAND-IN: ${p.standInNote}` : ''}`,
      })
      await client.createOrReplace({
        _id: `imageCredit-${asset._id.replace(/^image-/, '').slice(0, 40)}`,
        _type: 'imageCredit',
        image: {_type: 'image', asset: {_type: 'reference', _ref: asset._id}},
        title: p.alt,
        author: r.author,
        licence: r.licence,
        licenceUrl: r.licenceUrl,
        sourceUrl: r.sourceUrl,
        isStandIn: Boolean(p.standInNote),
        ...(p.standInNote ? {standInNote: p.standInNote} : {}),
      } as never)
      items.push({_key: `${key(slug)}-g${items.length}`, _type: 'image', asset: {_type: 'reference', _ref: asset._id}, alt: p.alt})
    }
    if (execute && items.length) {
      await client.patch(z.id).setIfMissing({gallery: []}).append('gallery', items).commit()
      console.log(`  ✓ ${slug}: ${items.length} gallery photo(s) written`)
    }
  }
  if (!execute) console.log('\nDry run. Re-run with --execute to upload and write.')
}
main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
