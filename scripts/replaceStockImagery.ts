/**
 * Replace the theme's stock imagery with photographs of Albania.
 *
 * What was wrong: the homepage opened on a rendered villa in a desert, the
 * "penthouse" property type was a photograph of vegetables, "land" was a VW
 * van, "studio" was a desert at night, both marketing blocks were generic
 * architecture stock, and the Vlorë city landing carried a picture of the
 * Roman amphitheatre in Durrës. None of it showed Albania, and none of it had
 * a recorded provenance.
 *
 * Same discipline as `applyZoneImages.ts`, which this follows:
 *  - every replacement is a named Commons file, reviewed by a human, listed below
 *  - the licence is read from Commons at run time, never assumed; anything
 *    outside the set the `imageCredit` schema allows is refused, not relabelled
 *  - CC BY / CC BY-SA carries its deed URL, because that link is the attribution
 *  - one `imageCredit` per asset, so `/image-credits` can publish it
 *  - re-running is safe: Sanity deduplicates uploads by content hash, so the
 *    second run resolves the same asset ids and writes the same references
 *
 * Run:
 * - npm run replace:stock-imagery -- --dry
 * - npm run replace:stock-imagery -- --execute
 */
import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const projectId = (process.env.SANITY_PROJECT_ID || '').trim()
const token = process.env.SANITY_API_TOKEN?.trim()
if (!token || !projectId) {
  console.error('Error: SANITY_PROJECT_ID and SANITY_API_TOKEN required.')
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: '2024-01-01',
  useCdn: false,
  token,
})

const args = process.argv.slice(2)
const isDry = args.includes('--dry')
const isExecute = args.includes('--execute')
if (!isDry && !isExecute) {
  console.error('Use --dry or --execute.')
  process.exit(1)
}

const UA = 'DomLivoImageBot/1.0 (https://domlivo.com; hello@domlivo.com)'
const COMMONS_API = 'https://commons.wikimedia.org/w/api.php'
/** Wikimedia rate-limits hard, and being throttled mid-run leaves a half-applied dataset. */
const PACE_MS = 1200
/** Heroes render full-bleed; below this the upscale shows. */
const TARGET_WIDTH = 2400

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** The licence values `imageCredit` accepts. Anything else is refused. */
const LICENCES: Array<{value: string; needles: string[]; deed: string}> = [
  {value: 'cc0', needles: ['cc0'], deed: 'https://creativecommons.org/publicdomain/zero/1.0/'},
  {value: 'pdm', needles: ['public domain mark', 'pdm'], deed: 'https://creativecommons.org/publicdomain/mark/1.0/'},
  {value: 'cc-by-sa-4.0', needles: ['cc by-sa 4', 'by-sa 4'], deed: 'https://creativecommons.org/licenses/by-sa/4.0/'},
  {value: 'cc-by-sa-3.0', needles: ['cc by-sa 3', 'by-sa 3'], deed: 'https://creativecommons.org/licenses/by-sa/3.0/'},
  {value: 'cc-by-4.0', needles: ['cc by 4', 'by 4.0'], deed: 'https://creativecommons.org/licenses/by/4.0/'},
  {value: 'cc-by-3.0', needles: ['cc by 3', 'by 3.0'], deed: 'https://creativecommons.org/licenses/by/3.0/'},
  {value: 'pd', needles: ['public domain', 'pd-'], deed: 'https://en.wikipedia.org/wiki/Public_domain'},
]

/**
 * The photographs, reviewed 2026-08-31 against ~450 Commons candidates.
 * `alt` describes the photograph; where it does not show the thing it
 * illustrates it is marked a stand-in and says what it actually shows.
 */
type Photo = {commonsFile: string; alt: string; standInNote?: string}

const PHOTOS = {
  himareTown: {
    commonsFile: 'Himara 2021.jpg',
    alt: 'Himarë on the Ionian coast of Albania, seen over the beach and the seafront',
  },
  tiranaAbove: {commonsFile: 'Tirana from Above 2016.jpg', alt: 'Tirana seen from above'},
  tiranaSunset: {commonsFile: 'Tirana-Sunset (WPWTR16).JPG', alt: 'Sunset over the Tirana skyline'},
  tiranaNewHouses: {
    commonsFile: 'Tirana New Houses in city center (WPWTR16).JPG',
    alt: 'New apartment buildings in central Tirana',
  },
  tiranaLakeView: {commonsFile: 'Lake View Residences Tirana Zoo.jpg', alt: 'Lake View Residences, Tirana'},
  tiranaLinza: {commonsFile: 'Linza skyline.JPG', alt: 'Residential Tirana seen from Linza'},
  tiranaBookBuilding: {
    commonsFile: 'Book Building 2024.jpg',
    alt: 'The Book Building and the towers on Skanderbeg Square, Tirana',
  },
  tiranaShopStreet: {
    commonsFile: 'Intersport shop, Tirana, Albania.jpg',
    alt: 'Ground-floor retail in a Tirana commercial building',
  },
  durresBeach: {commonsFile: 'Plazhi i Durrësit 04.jpg', alt: 'The beach and seafront at Durrës, Albania'},
  durresHouses: {
    commonsFile: 'Albania residential houses near Durres.JPG',
    alt: 'Residential houses on the coast near Durrës',
  },
  vloreCove: {
    commonsFile: 'Beach near Uji i Ftohtë, Vlorë, Albania.jpg',
    alt: 'The cove at Uji i Ftohtë, Vlorë',
  },
  sarandaBay: {commonsFile: 'Saranda bay and town.jpg', alt: 'The bay and town of Sarandë, Albania'},
  sarandeApartments: {
    commonsFile: 'Sarandë - View from Bluemoon Suites towards Corfu.jpg',
    alt: 'Apartment buildings above the bay at Sarandë, looking towards Corfu',
  },
  shkoderCity: {commonsFile: 'Shkodra Studenti St. panorama.jpg', alt: 'Panorama of Shkodër, Albania'},
  shengjinAerial: {commonsFile: 'Shëngjin 2020 aerial view.jpg', alt: 'Shëngjin seen from the air'},
  dhermiBeach: {commonsFile: 'Dhërmi - Beach.JPG', alt: 'The beach at Dhërmi, Himarë'},
  ksamilBay: {commonsFile: 'Ksamil, Albania (by Pudelek).JPG', alt: 'The bay and islands at Ksamil, Albania'},
  ksamilBeach: {commonsFile: 'Ksamil beach.jpg', alt: 'The beach at Ksamil, southern Albania'},
  piqerasHillside: {
    commonsFile: 'Albania – Piqeras.jpg',
    alt: 'Houses among the olive groves above the sea at Piqeras, southern Albania',
  },
  vunoVillage: {commonsFile: 'Vuno 2012 (12).jpg', alt: 'A house above the sea at Vuno, Himarë'},
  llogaraHills: {
    commonsFile: 'Llogara park Albania 2018 2.jpg',
    alt: 'Hillsides above the coast at Llogara, Albania',
  },
} satisfies Record<string, Photo>

type PhotoKey = keyof typeof PHOTOS

/** One thing to change, and which photograph replaces what is there now. */
type Target =
  | {kind: 'documentImage'; label: string; docId: string; field: 'image' | 'heroImage'; photo: PhotoKey}
  | {kind: 'sectionBackground'; label: string; docId: string; sectionKey: string; photo: PhotoKey}
  | {
      kind: 'sectionImage'
      label: string
      docId: string
      sectionKey: string
      imageKey: string
      photo: PhotoKey
      /** The `alt` the editors wrote for the slot; it is a caption, not a description of the picture. */
      keepAlt?: string
    }

const TARGETS: Target[] = [
  // --- homepage hero: the desert villa ---
  {
    kind: 'sectionBackground',
    label: 'homepage hero',
    docId: 'landing-home',
    sectionKey: '39bc3ee20fb4',
    photo: 'himareTown',
  },

  // --- property-type cards: vegetables, a VW van, a desert, flat illustrations ---
  {kind: 'documentImage', label: 'type: apartment', docId: 'propertyType-apartment', field: 'image', photo: 'tiranaLakeView'},
  {kind: 'documentImage', label: 'type: studio', docId: 'propertyType-studio', field: 'image', photo: 'tiranaLinza'},
  {kind: 'documentImage', label: 'type: penthouse', docId: 'propertyType-penthouse', field: 'image', photo: 'sarandeApartments'},
  {kind: 'documentImage', label: 'type: house', docId: 'propertyType-house', field: 'image', photo: 'durresHouses'},
  {kind: 'documentImage', label: 'type: villa', docId: 'propertyType-villa', field: 'image', photo: 'vunoVillage'},
  {kind: 'documentImage', label: 'type: land', docId: 'propertyType-land', field: 'image', photo: 'llogaraHills'},
  {kind: 'documentImage', label: 'type: office', docId: 'propertyType-office', field: 'image', photo: 'tiranaBookBuilding'},
  {kind: 'documentImage', label: 'type: commercial', docId: 'propertyType-commercial', field: 'image', photo: 'tiranaShopStreet'},
  {
    kind: 'documentImage',
    label: 'type: short-term-rent',
    docId: '2cdfa130-09eb-470d-907f-bdb0ee6ed284',
    field: 'image',
    photo: 'ksamilBeach',
  },

  // --- homepage marketing blocks: generic architecture stock ---
  {
    kind: 'sectionImage',
    label: 'home marketing: Investment Apartments',
    docId: 'landing-home',
    sectionKey: '381af8cb9d85',
    imageKey: '4fe588118d4e',
    photo: 'tiranaNewHouses',
    keepAlt: 'Investment Apartments',
  },
  {
    kind: 'sectionImage',
    label: 'home marketing: Sea View Villas',
    docId: 'landing-home',
    sectionKey: '381af8cb9d85',
    imageKey: 'ccc3cf249d01',
    photo: 'piqerasHillside',
    keepAlt: 'Sea View Villas',
  },
  {
    kind: 'sectionImage',
    label: 'home marketing: Why choose Domlivo',
    docId: 'landing-home',
    sectionKey: 'dac912dafb83',
    imageKey: '951200f98d2c',
    photo: 'tiranaSunset',
  },

  // --- city cards and city landing heroes ---
  {kind: 'documentImage', label: 'city: durres', docId: 'city-durres', field: 'heroImage', photo: 'durresBeach'},
  {kind: 'documentImage', label: 'city: tirana', docId: 'city-tirana', field: 'heroImage', photo: 'tiranaAbove'},
  {kind: 'documentImage', label: 'city: vlore', docId: 'city-vlore', field: 'heroImage', photo: 'vloreCove'},
  {kind: 'documentImage', label: 'city: sarande', docId: 'city-sarande', field: 'heroImage', photo: 'sarandaBay'},
  {kind: 'documentImage', label: 'city: shkoder', docId: 'city-shkoder', field: 'heroImage', photo: 'shkoderCity'},
  {kind: 'documentImage', label: 'city: shengjin', docId: 'city-shengjin', field: 'heroImage', photo: 'shengjinAerial'},
  {kind: 'documentImage', label: 'city: himare', docId: 'city-himare', field: 'heroImage', photo: 'dhermiBeach'},

  // --- landing heroes that showed the wrong place ---
  {
    kind: 'sectionBackground',
    label: 'landing hero: vlore (was a Durrës photo)',
    docId: 'landing-vlore',
    sectionKey: 'hero',
    photo: 'vloreCove',
  },
  {
    kind: 'sectionBackground',
    label: 'landing hero: short-term-rent (was a Durrës photo)',
    docId: 'a3fd5741-516b-4e83-836b-44508900e8b8',
    sectionKey: 'd29a78bad0af',
    photo: 'ksamilBay',
  },
  {
    kind: 'sectionBackground',
    label: 'landing hero: long-term-rent (was stock)',
    docId: 'c07cfb6a-fc33-4163-b434-0aaffa1b1c7d',
    sectionKey: 'd29a78bad0af',
    photo: 'tiranaLakeView',
  },
]

/**
 * Left alone on purpose, so a re-read of this file does not quietly reconsider
 * them.
 */
const LEFT_ALONE: Record<string, string> = {
  'home marketing: platform for agents':
    'its image is the owner\'s own collage (15BC91A9…jpeg), not theme stock',
  'landing hero: sale': 'same owner collage as the agents block',
  'landing hero: cities': 'a photograph of the port of Durrës — of Albania, and not misleading',
  'comparison landing heroes': 'the Tirana Palace of Culture photo is accurate for country comparisons',
}

type Resolved = {
  photo: Photo
  licence: string
  licenceUrl: string
  author: string
  sourceUrl: string
  bytes: Buffer
  filename: string
}

function classify(shortName: string | undefined): {value: string; deed: string} | null {
  const s = (shortName || '').toLowerCase()
  for (const l of LICENCES) if (l.needles.some((n) => s.includes(n))) return {value: l.value, deed: l.deed}
  return null
}

function stripHtml(v: string | undefined): string {
  return (v || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
}

async function resolve(photo: Photo): Promise<Resolved> {
  const url =
    `${COMMONS_API}?action=query&format=json&prop=imageinfo&iiprop=url|size|extmetadata` +
    `&titles=${encodeURIComponent('File:' + photo.commonsFile)}`
  const res = await fetch(url, {headers: {'User-Agent': UA}})
  if (!res.ok) throw new Error(`Commons metadata ${res.status} for ${photo.commonsFile}`)
  const json = (await res.json()) as any
  const page: any = Object.values(json?.query?.pages ?? {})[0]
  const info = page?.imageinfo?.[0]
  if (!info) throw new Error(`No file on Commons: ${photo.commonsFile}`)

  const meta = info.extmetadata ?? {}
  const licence = classify(meta.LicenseShortName?.value)
  if (!licence) {
    throw new Error(
      `${photo.commonsFile}: licence "${meta.LicenseShortName?.value}" is not one the imageCredit schema accepts`,
    )
  }
  const licenceUrl: string = meta.LicenseUrl?.value || licence.deed
  if (licence.value.startsWith('cc-by') && !licenceUrl) {
    throw new Error(`${photo.commonsFile}: an attribution licence must carry its deed URL`)
  }

  await sleep(PACE_MS)
  const fileUrl =
    'https://commons.wikimedia.org/wiki/Special:FilePath/' +
    encodeURIComponent(photo.commonsFile.replace(/ /g, '_')) +
    `?width=${TARGET_WIDTH}`
  const fileRes = await fetch(fileUrl, {headers: {'User-Agent': UA}})
  if (!fileRes.ok) throw new Error(`Commons download ${fileRes.status} for ${photo.commonsFile}`)
  const bytes = Buffer.from(await fileRes.arrayBuffer())
  if (bytes.byteLength < 30_000) throw new Error(`${photo.commonsFile}: download looks truncated`)
  await sleep(PACE_MS)

  return {
    photo,
    licence: licence.value,
    licenceUrl,
    author: stripHtml(meta.Artist?.value) || 'Unknown',
    sourceUrl:
      'https://commons.wikimedia.org/wiki/File:' + encodeURIComponent(photo.commonsFile.replace(/ /g, '_')),
    bytes,
    filename: photo.commonsFile.replace(/[^\w.-]+/g, '-').toLowerCase(),
  }
}

function imageValue(assetId: string, alt: string) {
  return {_type: 'image', asset: {_type: 'reference', _ref: assetId}, alt}
}

async function main() {
  for (const [what, why] of Object.entries(LEFT_ALONE)) {
    console.log(`skip     ${what.padEnd(44)} ${why}`)
  }
  console.log('')

  const usedKeys = Array.from(new Set(TARGETS.map((t) => t.photo))) as PhotoKey[]

  // What is there now, so the dry run shows a real before/after rather than a
  // list of intentions.
  const docIds = Array.from(new Set(TARGETS.map((t) => t.docId)))
  const current = await client.fetch<
    Array<{_id: string; image?: string; heroImage?: string; sections?: Array<{_key: string; bg?: string; images?: Array<{_key: string; f?: string}>}>}>
  >(
    `*[_id in $ids]{
      _id,
      "image": image.asset->originalFilename,
      "heroImage": heroImage.asset->originalFilename,
      "sections": pageSections[]{_key, "bg": backgroundImage.asset->originalFilename, "images": images[]{_key, "f": asset->originalFilename}}
    }`,
    {ids: docIds},
  )
  const byId = new Map(current.map((d) => [d._id, d]))

  const missing = docIds.filter((id) => !byId.has(id))
  if (missing.length) {
    console.error('These documents do not exist:', missing.join(', '))
    process.exit(1)
  }

  function before(target: Target): string {
    const doc = byId.get(target.docId)
    if (!doc) return '?'
    if (target.kind === 'documentImage') return (target.field === 'image' ? doc.image : doc.heroImage) || '— none —'
    const section = doc.sections?.find((s) => s._key === target.sectionKey)
    if (!section) return '— section not found —'
    if (target.kind === 'sectionBackground') return section.bg || '— none —'
    return section.images?.find((i) => i._key === target.imageKey)?.f || '— none —'
  }

  const brokenSections = TARGETS.filter(
    (t) => t.kind !== 'documentImage' && before(t).startsWith('— section'),
  )
  if (brokenSections.length) {
    console.error('Section keys no longer present:')
    for (const t of brokenSections) console.error(`  ${t.label} (${t.docId} / ${t.sectionKey})`)
    process.exit(1)
  }

  console.log(`Resolving ${usedKeys.length} photographs on Wikimedia Commons…\n`)
  const resolved = new Map<PhotoKey, Resolved>()
  for (const key of usedKeys) {
    const r = await resolve(PHOTOS[key])
    resolved.set(key, r)
    console.log(
      `  ${key.padEnd(20)} ${r.licence.padEnd(13)} ${(Math.round(r.bytes.byteLength / 1024) + ' KB').padStart(8)}  ${r.author.slice(0, 30)}`,
    )
  }

  console.log('\nPlan:')
  for (const t of TARGETS) {
    const r = resolved.get(t.photo)!
    console.log(`  ${t.label.padEnd(44)} ${before(t).slice(0, 42).padEnd(44)} -> ${r.photo.commonsFile}`)
  }
  console.log(`\n${TARGETS.length} image(s) across ${docIds.length} document(s).`)

  if (isDry) {
    console.log('Dry run — nothing written.')
    return
  }

  // Upload once per photograph: several targets share one, and Sanity would
  // deduplicate anyway, but this keeps the credit-per-asset rule obvious.
  const assetIdByPhoto = new Map<PhotoKey, string>()
  for (const key of usedKeys) {
    const r = resolved.get(key)!
    const asset = await client.assets.upload('image', r.bytes, {
      filename: r.filename,
      description: `Source: ${r.sourceUrl} · Licence: ${r.licence} · Author: ${r.author}.`,
    })
    assetIdByPhoto.set(key, asset._id)

    await client.createOrReplace({
      _id: `imageCredit-${asset._id.replace(/^image-/, '').slice(0, 40)}`,
      _type: 'imageCredit',
      image: {_type: 'image', asset: {_type: 'reference', _ref: asset._id}},
      title: r.photo.alt,
      author: r.author,
      licence: r.licence,
      licenceUrl: r.licenceUrl,
      sourceUrl: r.sourceUrl,
      isStandIn: Boolean(r.photo.standInNote),
      ...(r.photo.standInNote ? {standInNote: r.photo.standInNote} : {}),
    } as never)
    console.log(`  uploaded ${key} -> ${asset._id}`)
  }

  // One patch per document, so a document is never left half-updated.
  const patches = new Map<string, Record<string, unknown>>()
  for (const t of TARGETS) {
    const assetId = assetIdByPhoto.get(t.photo)!
    const alt = t.kind === 'sectionImage' && t.keepAlt ? t.keepAlt : PHOTOS[t.photo].alt
    const set = patches.get(t.docId) ?? {}
    if (t.kind === 'documentImage') {
      set[t.field] = imageValue(assetId, alt)
    } else if (t.kind === 'sectionBackground') {
      set[`pageSections[_key=="${t.sectionKey}"].backgroundImage`] = imageValue(assetId, alt)
    } else {
      set[`pageSections[_key=="${t.sectionKey}"].images[_key=="${t.imageKey}"].asset`] = {
        _type: 'reference',
        _ref: assetId,
      }
      set[`pageSections[_key=="${t.sectionKey}"].images[_key=="${t.imageKey}"].alt`] = alt
    }
    patches.set(t.docId, set)
  }

  for (const [docId, set] of patches) {
    await client.patch(docId).set(set).commit()
    console.log(`  ✓ ${docId}`)
  }

  console.log(`\nReplaced ${TARGETS.length} image(s) and wrote ${usedKeys.length} image credit(s).`)
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
