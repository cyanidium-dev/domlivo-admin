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

function classifyLicence(short: string, url: string): Licence | null {
  const s = `${short} ${url}`.toLowerCase()
  if (s.includes('cc0')) return {value: 'cc0', label: 'CC0 1.0', url: 'https://creativecommons.org/publicdomain/zero/1.0/', requiresAttribution: false}
  if (s.includes('public domain mark') || s.includes('pdm')) return {value: 'pdm', label: 'Public Domain Mark 1.0', url: 'https://creativecommons.org/publicdomain/mark/1.0/', requiresAttribution: false}
  if (s.includes('public domain') || /(^|\W)pd-/.test(s)) return {value: 'pd', label: 'Public domain', requiresAttribution: false}
  if (s.includes('by-sa 4') || s.includes('by-sa4')) return {value: 'cc-by-sa-4.0', label: 'CC BY-SA 4.0', url: 'https://creativecommons.org/licenses/by-sa/4.0/', requiresAttribution: true}
  if (s.includes('by-sa 3') || s.includes('by-sa3') || s.includes('by-sa')) return {value: 'cc-by-sa-3.0', label: 'CC BY-SA 3.0', url: 'https://creativecommons.org/licenses/by-sa/3.0/', requiresAttribution: true}
  if (s.includes('cc by 4') || s.includes('cc-by 4') || s.includes('by/4')) return {value: 'cc-by-4.0', label: 'CC BY 4.0', url: 'https://creativecommons.org/licenses/by/4.0/', requiresAttribution: true}
  if (s.includes('cc by') || s.includes('cc-by')) return {value: 'cc-by-3.0', label: 'CC BY 3.0', url: 'https://creativecommons.org/licenses/by/3.0/', requiresAttribution: true}
  return null
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

async function commons(term: string): Promise<Candidate[]> {
  const api =
    'https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search' +
    `&gsrsearch=${encodeURIComponent(term)}&gsrnamespace=6&gsrlimit=30` +
    '&prop=imageinfo&iiprop=url|extmetadata|size&iiurlwidth=1800'
  try {
    const res = await fetch(api, {headers: {'User-Agent': UA}})
    if (!res.ok) return []
    const json: any = await res.json()
    const pages = json?.query?.pages ? Object.values(json.query.pages) : []
    const out: Candidate[] = []
    for (const p of pages as any[]) {
      const info = p?.imageinfo?.[0]
      if (!info) continue
      const meta = info.extmetadata ?? {}
      const licence = classifyLicence(
        String(meta.LicenseShortName?.value ?? ''),
        String(meta.LicenseUrl?.value ?? ''),
      )
      if (!licence) continue
      const title = String(p.title).replace(/^File:/, '')
      if ((info.width ?? 0) < 1000) continue
      if (!/\.(jpe?g|png)$/i.test(title)) continue
      if (BAD_TITLE.test(title) || HISTORICAL.test(title)) continue
      const w = info.thumbwidth ?? info.width
      const h = info.thumbheight ?? info.height
      if (!usableShape(w, h)) continue
      out.push({
        title,
        url: info.thumburl ?? info.url,
        descUrl: info.descriptionurl,
        licence,
        author: String(meta.Artist?.value ?? '').replace(/<[^>]*>/g, '').trim() || 'unknown',
        width: w,
        height: h,
      })
    }
    // CC0 first where quality is equal: fewer obligations, and it survives a
    // future in which the credits page is ever removed.
    return out.sort((a, b) => Number(a.licence.requiresAttribution) - Number(b.licence.requiresAttribution))
  } catch {
    return []
  }
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

    for (const q of zoneQueries) {
      const hits = (await commons(q)).filter((c) => !conflicts(c.title, parent) && !usedFiles.has(c.title))
      if (hits.length) { picks = hits.slice(0, 2); break }
      await sleep(700)
    }
    if (!picks.length) {
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
        `${level}-level, ${files.length} file(s)${attribution ? ', needs attribution' : ''}` +
        `${files[0] ? `  → ${files[0].subject.slice(0, 44)}` : ''}`,
    )

    manifest.push({
      slug: z.slug,
      type: z._type,
      priority: z.priority,
      isPublished: z.isPublished !== false,
      title: z.title,
      parent,
      level,
      // A city-level photo is a stand-in for a district; a zone-level one is not.
      isStandIn: level === 'city' && z._type === 'district',
      files,
    })
  }

  const manifestPath = path.join(OUT_DIR, 'manifest.json')
  fs.writeFileSync(manifestPath, JSON.stringify({generated: 'source:zone-images', zones: manifest}, null, 2) + '\n')
  console.log(`\n${found}/${targets.length} zones have candidates. Manifest: ${manifestPath}`)
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
