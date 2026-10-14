/**
 * Find replacement photographs for every zone whose current image is a seed
 * placeholder, a stand-in, of unknown provenance, or missing — and download the
 * candidates to disk for review before anything touches the dataset.
 *
 * CC BY and CC BY-SA are now usable, because /image-credits publishes the
 * attribution those licences require. That is the whole reason this pass can
 * succeed where the CC0-only attempts could not: Commons has good photography
 * of Albania, and almost none of it is CC0.
 *
 * What it will not do:
 *  - use anything that is not a free licence (no paid stock, no unmarked files)
 *  - caption a stand-in as if it showed the zone
 *  - write to Sanity. It writes files and a manifest; `applyZoneImages.ts`
 *    is what commits them, after a human has looked.
 *
 * Run:
 * - npm run source:zone-images                     (all zones needing work)
 * - npm run source:zone-images -- --only qerret,vuno
 * - npm run source:zone-images -- --priority unknown
 *
 * Zones listed in REVIEWED_FILES download exactly those files instead of
 * searching. Each run merges into the manifest, so batches accumulate.
 */
import fs from 'node:fs'
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
const onlyArg = args.find((a) => a.startsWith('--only='))?.split('=')[1] ??
  (args.includes('--only') ? args[args.indexOf('--only') + 1] : '')
const priorityArg = args.find((a) => a.startsWith('--priority='))?.split('=')[1] ??
  (args.includes('--priority') ? args[args.indexOf('--priority') + 1] : '')

// The workspace repo, not the CMS repo's sibling: `cms/` is a symlink, so
// process.cwd() here is C:\GitHub23\domlivo-admin rather than the workspace.
const OUT_DIR = path.resolve(process.cwd(), '../domlivo-workspace/tmp/image-replacements')
const UA = 'DomLivo/1.0 (property research; contact via domlivo.com)'
const PACE_MS = 3500
const MIN_BYTES = 30_000

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

type Priority = 'unknown' | 'seed' | 'missing' | 'stand-in'

/** Categories a photo must not fall into, whatever its licence. */
const BAD_TITLE =
  /(^|\W)(sts|iss)[-\s]?\d|satellite|orbit|admiralty|chart|\bmap\b|bombardment|painting|engraving|coat of arms|\bflag\b|\blogo\b|\bseal\b|diagram|poster|stamp|banknote|blueprint|portrait|\bbust\b|postcard|protest|funeral|cemeter|graffiti|\bicon\b|fresco|mosaic detail|manuscript|document|scan|screenshot|monument|statue|memorial|stadium|warship|uss |navy/i
const HISTORICAL = /\b(1[6-9]\d{2}|19[0-8]\d)\b/

/** Other Albanian places, so a same-named village elsewhere is not a zone match. */
const OTHER_PLACES = ['elbasan', 'korce', 'korçë', 'berat', 'fier', 'gjirokast', 'kukes', 'kukës', 'pogradec', 'peshkopi', 'lushnj', 'permet', 'përmet', 'librazhd', 'burrel', 'tepelen']

function usableShape(w: number, h: number): boolean {
  if (!w || !h) return false
  const r = w / h
  return r >= 0.75 && r <= 2.2
}

type Licence = {value: string; label: string; url?: string; requiresAttribution: boolean}

/**
 * Map a Commons licence to one the `imageCredit` schema can record.
 *
 * Versions are matched exactly. An earlier version of this function filed every
 * BY-SA that was not 4.0 as 3.0, which would have credited a BY-SA 2.0 Flickr
 * import under the wrong deed. The schema and the credits page only know the
 * 3.0 and 4.0 deeds, so 1.0/2.0/2.5 are refused rather than mislabelled. A
 * ported deed (e.g. "CC BY 3.0 pl") keeps the deed URL Commons gives for it.
 */
function classifyLicence(short: string, url: string): Licence | null {
  const s = short.toLowerCase().trim()
  const u = url.toLowerCase()
  if (s.includes('cc0') || u.includes('publicdomain/zero')) return {value: 'cc0', label: 'CC0 1.0', url: 'https://creativecommons.org/publicdomain/zero/1.0/', requiresAttribution: false}
  if (s.includes('public domain mark') || s === 'pdm' || u.includes('publicdomain/mark')) return {value: 'pdm', label: 'Public Domain Mark 1.0', url: 'https://creativecommons.org/publicdomain/mark/1.0/', requiresAttribution: false}
  if (s === 'public domain' || /^pd\b/.test(s)) return {value: 'pd', label: 'Public domain', requiresAttribution: false}
  const m = /^cc[-\s]by(-sa)?[-\s](\d\.\d)\b/.exec(s)
  if (!m) return null
  const sa = Boolean(m[1])
  const version = m[2]
  if (version !== '3.0' && version !== '4.0') return null
  const deed = /^https?:\/\/creativecommons\.org\/licenses\//.test(u)
    ? url.trim()
    : `https://creativecommons.org/licenses/${sa ? 'by-sa' : 'by'}/${version}/`
  return {
    value: `cc-by${sa ? '-sa' : ''}-${version}`,
    label: `CC BY${sa ? '-SA' : ''} ${version}`,
    url: deed,
    requiresAttribution: true,
  }
}

type Candidate = {
  title: string
  url: string
  descUrl: string
  licence: Licence
  author: string
  width: number
  height: number
}

// 1920 is one of Wikimedia's standard thumbnail steps; arbitrary widths are
// rendered on demand and rate-limited much harder.
const IMAGEINFO = '&prop=imageinfo&iiprop=url|extmetadata|size|user&iiurlwidth=1920'

/**
 * Photographer as Commons names them. Some uploaders put a paragraph of usage
 * terms in the Artist field; when that happens the uploader account is the
 * honest short form.
 */
function authorOf(meta: any, user: string | undefined): string {
  const artist = String(meta.Artist?.value ?? '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
  if (artist && artist.length <= 80) return artist
  return user ? `${user} (Wikimedia Commons)` : 'unknown'
}

function toCandidates(pages: any[], opts: {reviewed: boolean}): Candidate[] {
  const out: Candidate[] = []
  for (const p of pages) {
    const info = p?.imageinfo?.[0]
    if (!info) continue
    const meta = info.extmetadata ?? {}
    const licence = classifyLicence(
      String(meta.LicenseShortName?.value ?? ''),
      String(meta.LicenseUrl?.value ?? ''),
    )
    const title = String(p.title).replace(/^File:/, '')
    if (!licence) {
      if (opts.reviewed) console.log(`     ! ${title}: licence "${meta.LicenseShortName?.value ?? ''}" is not one the credits can record`)
      continue
    }
    if ((info.width ?? 0) < 1000) continue
    if (!/\.(jpe?g|png)$/i.test(title)) continue
    // A reviewed file was chosen by a person who looked at it, so the title
    // heuristics (which exist to keep maps and paintings out of a blind
    // search) do not apply to it.
    if (!opts.reviewed && (BAD_TITLE.test(title) || HISTORICAL.test(title))) continue
    const w = info.thumbwidth ?? info.width
    const h = info.thumbheight ?? info.height
    if (!usableShape(w, h)) continue
    out.push({
      title,
      url: info.thumburl ?? info.url,
      descUrl: info.descriptionurl,
      licence,
      author: authorOf(meta, info.user),
      width: w,
      height: h,
    })
  }
  return out
}

async function commons(term: string): Promise<Candidate[]> {
  const api =
    'https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search' +
    `&gsrsearch=${encodeURIComponent(term)}&gsrnamespace=6&gsrlimit=30` + IMAGEINFO
  try {
    const res = await fetch(api, {headers: {'User-Agent': UA}})
    if (!res.ok) return []
    const json: any = await res.json()
    const pages = json?.query?.pages ? Object.values(json.query.pages) : []
    const out = toCandidates(pages as any[], {reviewed: false})
    // CC0 first where quality is equal: fewer obligations, and it survives a
    // future in which the credits page is ever removed.
    return out.sort((a, b) => Number(a.licence.requiresAttribution) - Number(b.licence.requiresAttribution))
  } catch {
    return []
  }
}

/** Exact Commons files, in the order given (the manifest index is the order). */
async function commonsFiles(titles: string[]): Promise<Candidate[]> {
  const api =
    'https://commons.wikimedia.org/w/api.php?action=query&format=json' +
    `&titles=${encodeURIComponent(titles.map((t) => `File:${t}`).join('|'))}` + IMAGEINFO
  const res = await fetch(api, {headers: {'User-Agent': UA}})
  if (!res.ok) throw new Error(`Commons API ${res.status}`)
  const json: any = await res.json()
  const pages: any[] = json?.query?.pages ? Object.values(json.query.pages) : []
  const norm = (s: string) => s.replace(/^File:/, '').replace(/_/g, ' ')
  const out: Candidate[] = []
  for (const t of titles) {
    const page = pages.find((p) => norm(String(p.title)) === norm(t))
    if (!page?.imageinfo) { console.log(`     ! ${t}: not found on Commons`); continue }
    out.push(...toCandidates([page], {reviewed: true}))
  }
  return out
}

/**
 * Files a person has looked at and judged to show the zone (or, for a
 * stand-in, to be honest about what it shows). When a zone is listed here the
 * search is skipped: on 2026-10-14 a blind search for "Manëz" returned forty
 * photos of concerts in a Polish riding hall, "Koxhas" 1928 Minneapolis petrol
 * stations, and "Kodra e Diellit" a ski lift in Kosovo.
 *
 * Which file becomes the image, and in what role, is decided in
 * applyZoneImages.ts — this list only says what to download.
 */
const REVIEWED_FILES: Record<string, string[]> = {
  // 2026-10-14, batch 1 — Durrës coast
  qerret: ['Qerret Plazh.jpg'],
  'gjiri-i-lalzit': ['GJIRI I LALZIT - panoramio.jpg'],
  spille: ['Spille Beach2.JPG'],
  currila: ['Currila Beach 2.jpg'],
  arapaj: ['Arapaj Basilica 2016-07-12 02.jpg'],
  kavaje: ['Kavajë, Albania – Main Square 2017 02.jpg'],
  shkallnur: ['Albania residential houses near Durres.JPG'],
  // batch 2 — Durrës hinterland
  spitalle: ['Spitalle l.15 - panoramio.jpg'],
  sukth: ['Sukth i Ri Main Road - Mapillary (3131407893840738) (cropped).jpg'],
  shijak: ['Shijak central square (OSCAL19 trip).jpg'],
  xhafzotaj: ['Xhafzotaj, město.jpg'],
  maminas: ['Maminas, odbočka.jpg'],
  // Stand-in: nothing on Commons shows Koxhas; this is the plain by the
  // motorway at Xhafzotaj, the administrative unit Koxhas belongs to.
  koxhas: ['Xhafzotaj, louka u dálnice.jpg'],
  // batch 3 — Vlorë, Himarë and Sarandë coast
  qeparo: ['Qeparo beach.jpg'],
  vuno: ['Vuno, Himarë, Albania 2015 01.jpg'],
  palasa: ['Palasa Beach from Llogara Pass.jpg'],
  'skele-vlore': ['Vlora Port & Skela.jpg'],
  'zona-e-portit': ['Hafen von sarande - 2.jpg'],
  'rruga-butrinti': ['Sarandë, mořské pobřeží.jpg'],
  'gjiri-i-hartes': ['15.7.2023 Gjiri i Hartes.jpg'],
  akernia: ['Laguna e Nartës - Vlorë (5).jpg'],
  // batch 4 — Tirana
  kinostudio: ['Unaza e madhe Kinostudio.jpg'],
  'kodra-e-diellit': ['Selitë Mosque Tirana 02.jpg'],
  // Stand-in: the Grand Park lake and southern Tirana; the neighbourhood is
  // not identified in any Commons file.
  'liqeni-i-thate': ['Tirana from South.jpg'],
  rinas: ['Rinas village aerial view.jpg'],
  'rruga-e-elbasanit': ['Tirana Lake (October 2016).jpg'],
  sauk: ['Sauk nga Lapidari 2015.jpg'],
  yzberisht: ['Yzberish Tirana 2022 aerial view 02.jpg'],
}

function conflicts(title: string, parent: string): boolean {
  const t = title.toLowerCase()
  const p = parent.toLowerCase()
  return OTHER_PLACES.some((x) => t.includes(x) && !p.includes(x))
}

function slugifyFile(s: string): string {
  return s.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60).toLowerCase()
}

function prettify(s: string): string {
  return s.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim()
}

async function download(url: string): Promise<Buffer | null> {
  const res = await fetch(url, {headers: {'User-Agent': UA}})
  if (!res.ok) return null
  if (!(res.headers.get('content-type') ?? '').startsWith('image/')) return null
  const buf = Buffer.from(await res.arrayBuffer())
  return buf.length < MIN_BYTES ? null : buf
}

async function main() {
  const zones: any[] = await client.fetch(`*[_type in ["district", "city"]]{
    _type, "slug": slug.current, isPublished,
    "title": coalesce(title.en, slug.current),
    "titleSq": title.sq,
    "cityTitle": select(_type == "district" => coalesce(city->title.en, city->slug.current), null),
    "heroFile": heroImage.asset->originalFilename,
    "heroDesc": heroImage.asset->description
  } | order(_type asc, slug asc)`)

  function priorityOf(z: any): Priority | null {
    if (!z.heroFile) return 'missing'
    if (/^seed-/.test(z.heroFile)) return 'seed'
    const d = String(z.heroDesc ?? '').toLowerCase()
    if (!/cc0|public domain|pdm|cc by|cc-by|unsplash|pexels/.test(d)) return 'unknown'
    if (/stand-in/i.test(String(z.heroDesc ?? ''))) return 'stand-in'
    return null
  }

  // Price-line zones are not pages and must never acquire imagery.
  const registry = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'scripts/data/zones.json'), 'utf8'))
  const metricOnly = new Set<string>()
  for (const country of Object.values<any>(registry.countries)) {
    for (const city of Object.values<any>(country.cities)) {
      for (const d of city.districts ?? []) if (d.role === 'metric-only') metricOnly.add(d.slug)
    }
  }

  const only = onlyArg ? new Set(onlyArg.split(',').map((s) => s.trim())) : null
  let targets = zones
    .map((z) => ({...z, priority: priorityOf(z)}))
    .filter((z) => z.priority !== null && !metricOnly.has(z.slug))
  if (only) targets = targets.filter((z) => only.has(z.slug))
  if (priorityArg) targets = targets.filter((z) => z.priority === priorityArg)

  console.log(`${targets.length} zone(s) to source for.\nOutput: ${OUT_DIR}\n`)
  fs.mkdirSync(OUT_DIR, {recursive: true})

  const manifest: any[] = []
  const usedFiles = new Set<string>()
  let found = 0

  for (const z of targets) {
    const parent = z._type === 'district' ? String(z.cityTitle ?? '') : String(z.title)
    // Zone name first, in English and Albanian, then the parent city.
    const zoneQueries = [
      z._type === 'district' ? `${z.title} ${parent}` : `${z.title} Albania`,
      z.titleSq && z.titleSq !== z.title ? `${z.titleSq} ${parent}` : '',
      z._type === 'district' ? `${z.title} Albania` : '',
    ].filter(Boolean)
    const cityQueries = z._type === 'district' ? [`${parent} Albania`, parent] : [`${z.title} city`]

    let picks: Candidate[] = []
    let level: 'zone' | 'city' = 'zone'
    const reviewed = REVIEWED_FILES[z.slug]

    if (reviewed) {
      // Role (own photo or stand-in) is the apply script's decision; `level`
      // here only records that the files were chosen by hand.
      picks = await commonsFiles(reviewed)
      await sleep(700)
    }
    for (const q of reviewed ? [] : zoneQueries) {
      const hits = (await commons(q)).filter((c) => !conflicts(c.title, parent) && !usedFiles.has(c.title))
      if (hits.length) { picks = hits.slice(0, 2); break }
      await sleep(700)
    }
    if (!picks.length && !reviewed) {
      for (const q of cityQueries) {
        const hits = (await commons(q)).filter((c) => !usedFiles.has(c.title))
        if (hits.length) { picks = hits.slice(0, 2); level = 'city'; break }
        await sleep(700)
      }
    }

    if (!picks.length) {
      console.log(`  —  ${String(z.slug).padEnd(20)} [${z.priority}]  nothing found`)
      manifest.push({slug: z.slug, type: z._type, priority: z.priority, level: null, files: []})
      continue
    }

    const dir = path.join(OUT_DIR, z.slug)
    fs.mkdirSync(dir, {recursive: true})
    const files: any[] = []

    for (const [i, c] of picks.entries()) {
      await sleep(PACE_MS)
      const buf = await download(c.url)
      if (!buf) continue
      const ext = /\.png$/i.test(c.title) ? 'png' : 'jpg'
      const filename = `${String(i)}-${slugifyFile(c.title)}.${ext}`
      fs.writeFileSync(path.join(dir, filename), buf)
      usedFiles.add(c.title)
      files.push({
        file: filename,
        bytes: buf.length,
        commonsTitle: c.title,
        subject: prettify(c.title),
        author: c.author,
        licence: c.licence.value,
        licenceLabel: c.licence.label,
        licenceUrl: c.licence.url ?? null,
        requiresAttribution: c.licence.requiresAttribution,
        sourceUrl: c.descUrl,
        width: c.width,
        height: c.height,
      })
    }

    if (files.length) found += 1
    const attribution = files.some((f) => f.requiresAttribution)
    console.log(
      `  ${files.length ? '✓' : '—'}  ${String(z.slug).padEnd(20)} [${String(z.priority).padEnd(9)}] ` +
        `${reviewed ? 'reviewed' : `${level}-level`}, ${files.length} file(s)${attribution ? ', needs attribution' : ''}` +
        `${files[0] ? `  → ${files[0].subject.slice(0, 44)}` : ''}`,
    )

    manifest.push({
      slug: z.slug,
      type: z._type,
      priority: z.priority,
      isPublished: z.isPublished !== false,
      title: z.title,
      parent,
      level: reviewed ? 'reviewed' : level,
      // A city-level photo is a stand-in for a district; a zone-level one is not.
      // Reviewed files get their role from the apply script's decision list.
      isStandIn: !reviewed && level === 'city' && z._type === 'district',
      files,
    })
  }

  // Merge into the existing manifest rather than replacing it, so sourcing in
  // batches (`--only a,b,c`) does not drop the zones an earlier batch found.
  const manifestPath = path.join(OUT_DIR, 'manifest.json')
  const previous: any[] = fs.existsSync(manifestPath)
    ? (JSON.parse(fs.readFileSync(manifestPath, 'utf8')).zones ?? [])
    : []
  const fresh = new Set(manifest.map((z) => z.slug))
  const merged = [...previous.filter((z) => !fresh.has(z.slug)), ...manifest]
  fs.writeFileSync(manifestPath, JSON.stringify({generated: 'source:zone-images', zones: merged}, null, 2) + '\n')
  console.log(`\n${found}/${targets.length} zones have candidates. Manifest: ${manifestPath}`)
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
