/**
 * Which images need replacing, and which can now be replaced.
 *
 * Two questions, one report:
 *
 * 1. **Provenance.** Every image on a zone page must be traceable to a free
 *    licence. Assets carrying no recorded source are legal exposure regardless
 *    of how they look — `CLAUDE.md` forbids paid-stock previews, Google Images
 *    results and competitors' listing photos, and an asset nobody can account
 *    for might be any of them.
 *
 * 2. **Availability.** Until the credits page shipped, only CC0 and public
 *    domain were usable, which left most Albanian zones with no photograph of
 *    themselves. With attribution now possible, this also asks Wikimedia
 *    Commons what exists per zone *including* CC BY and CC BY-SA — so the
 *    replacement work can be planned against what is actually findable rather
 *    than guessed at.
 *
 * Read-only. Run:
 * - npm run audit:image-provenance
 * - npm run audit:image-provenance -- --check-commons   (slower; hits Commons)
 */
import path from 'path'
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

const checkCommons = process.argv.includes('--check-commons')
const UA = 'DomLivo/1.0 (property research; contact via domlivo.com)'
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

type Verdict = 'ok' | 'stand-in' | 'seed-placeholder' | 'unknown-provenance'

/** Filenames that betray a browser save rather than a licensed download. */
const SCRAPE_MARKERS = /\[\d+\]|itinerary|how-to-spend|resized|^0x0|weekend-in/i

function classify(filename: string, description: string): Verdict {
  if (/^seed-/.test(filename)) return 'seed-placeholder'
  const d = description.toLowerCase()
  const licensed = /cc0|public domain|pdm|cc by|cc-by|unsplash|pexels/.test(d)
  if (!licensed) return 'unknown-provenance'
  if (/stand-in/i.test(description)) return 'stand-in'
  return 'ok'
}

/** What Commons has for a zone once attribution licences are allowed. */
async function commonsAvailability(term: string): Promise<{free: number; attribution: number; best?: string}> {
  const api =
    'https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search' +
    `&gsrsearch=${encodeURIComponent(term)}&gsrnamespace=6&gsrlimit=20` +
    '&prop=imageinfo&iiprop=url|extmetadata|size'
  try {
    const res = await fetch(api, {headers: {'User-Agent': UA}})
    if (!res.ok) return {free: 0, attribution: 0}
    const json: any = await res.json()
    const pages = json?.query?.pages ? Object.values(json.query.pages) : []
    let free = 0
    let attribution = 0
    let best: string | undefined
    for (const p of pages as any[]) {
      const info = p?.imageinfo?.[0]
      if (!info || (info.width ?? 0) < 900) continue
      if (!/\.(jpe?g|png)$/i.test(String(p.title))) continue
      const lic = String(info.extmetadata?.LicenseShortName?.value ?? '').toLowerCase()
      if (lic.includes('cc0') || lic.includes('public domain')) free += 1
      else if (lic.includes('cc by') || lic.includes('cc-by')) {
        attribution += 1
        if (!best) best = String(p.title).replace(/^File:/, '')
      }
    }
    return {free, attribution, best}
  } catch {
    return {free: 0, attribution: 0}
  }
}

async function main() {
  const zones: any[] = await client.fetch(`*[_type in ["district", "city"]]{
    _type, "slug": slug.current, isPublished,
    "title": coalesce(title.en, slug.current),
    "cityTitle": select(_type == "district" => coalesce(city->title.en, city->slug.current), null),
    "hero": heroImage.asset->{originalFilename, description},
    "galleryCount": count(coalesce(gallery, []))
  } | order(_type asc, slug asc)`)

  const buckets: Record<Verdict, any[]> = {
    'ok': [], 'stand-in': [], 'seed-placeholder': [], 'unknown-provenance': [],
  }
  const noImage: any[] = []

  for (const z of zones) {
    if (!z.hero?.originalFilename) { noImage.push(z); continue }
    buckets[classify(z.hero.originalFilename, z.hero.description ?? '')].push(z)
  }

  const line = (z: any) =>
    `  ${(z.isPublished === false ? '·' : '●')} ${String(z._type).padEnd(8)} ${String(z.slug).padEnd(20)} ` +
    `gal=${String(z.galleryCount).padEnd(2)} ${String(z.hero?.originalFilename ?? '—').slice(0, 56)}`

  console.log('● published   · unpublished\n')
  console.log(`=== 1. UNKNOWN PROVENANCE — replace first (${buckets['unknown-provenance'].length})`)
  console.log('    No free licence recorded. Cannot be shown to be licensed at all.\n')
  for (const z of buckets['unknown-provenance']) {
    const scraped = SCRAPE_MARKERS.test(z.hero.originalFilename) ? '   <-- looks like a browser save' : ''
    console.log(line(z) + scraped)
  }

  console.log(`\n=== 2. SEED PLACEHOLDERS — replace (${buckets['seed-placeholder'].length})`)
  console.log('    Shipped with the original seed; origin never recorded.\n')
  for (const z of buckets['seed-placeholder']) console.log(line(z))

  console.log(`\n=== 3. STAND-INS — upgrade when a real photo exists (${buckets['stand-in'].length})`)
  console.log('    Free and correctly captioned, but not a photo of the zone.\n')
  for (const z of buckets['stand-in']) console.log(line(z))

  console.log(`\n=== 4. NO IMAGE AT ALL (${noImage.length})`)
  for (const z of noImage) console.log(line(z))

  console.log(`\n=== 5. GOOD (${buckets['ok'].length}) — free licence recorded, shows the zone`)
  for (const z of buckets['ok']) console.log(line(z))

  const needsWork = [
    ...buckets['unknown-provenance'],
    ...buckets['seed-placeholder'],
    ...noImage,
    ...buckets['stand-in'],
  ]
  console.log(
    `\nSUMMARY: ${buckets['ok'].length} good · ${buckets['stand-in'].length} stand-in · ` +
      `${buckets['seed-placeholder'].length} seed · ${buckets['unknown-provenance'].length} unknown · ` +
      `${noImage.length} missing  →  ${needsWork.length} of ${zones.length} zones need image work`,
  )

  if (!checkCommons) {
    console.log('\nPass --check-commons to ask Wikimedia what is available per zone.')
    return
  }

  console.log('\n=== 6. WHAT COMMONS HAS (CC BY now usable via /image-credits)\n')
  console.log('  zone                  free  cc-by  best attribution-licensed candidate')
  let replaceable = 0
  for (const z of needsWork) {
    const term = z._type === 'district' ? `${z.title} ${z.cityTitle ?? ''} Albania` : `${z.title} Albania`
    const {free, attribution, best} = await commonsAvailability(term.trim())
    if (free > 0 || attribution > 0) replaceable += 1
    console.log(
      `  ${String(z.slug).padEnd(20)} ${String(free).padStart(4)}  ${String(attribution).padStart(5)}  ` +
        `${best ? best.slice(0, 52) : '—'}`,
    )
    await sleep(900)
  }
  console.log(`\n${replaceable} of ${needsWork.length} zones have at least one usable Commons candidate.`)
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
