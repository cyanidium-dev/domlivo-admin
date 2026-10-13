/**
 * Puts the geo engine's evidence on the listings, 2026-10-13.
 *
 * Precedence, as the owner set it: a realtor's Google Maps point is the truth,
 * then a pin someone placed by hand, then what the tools can prove, and only
 * then a district default.
 *
 *   realtor     googleMapsUrl from the agency (Cactus locationGmapsLink, resolved
 *               in ../domlivo-workspace/cactus/gmaps-cache.json) or set in the Studio
 *   manual      placed by hand in the Studio
 *   complex     a named residential complex found on the map
 *   photoMatch  the listing shows the same photo (or the same view, verified point
 *               by point) as a listing with a trusted pin
 *               (photo engine: ../domlivo-workspace/geo/photo-engine/groups.json)
 *   vision      a map screenshot in the listing's photos: coordinates printed on it,
 *               or its marker georeferenced on the ASIG orthophoto and confirmed by a
 *               second check (../domlivo-workspace/geo/photo-engine/vision/results.json)
 *   text        a street, landmark or complex named in the text
 *               (../domlivo-workspace/geo/geocode-plan-2026-10-11.json)
 *   district    nothing finer than the district
 *
 * Among the tools' proposals for a listing the finest level wins, then the
 * higher confidence, then the source in the order above. Two building-level
 * proposals more than 150 m apart are both kept out: the listing goes to the
 * review list with its next-best proposal.
 *
 * Never touched: listings whose locationSource is 'realtor' or 'manual', in the
 * published document or in a draft. Never downgraded: a building-level pin keeps
 * its place unless the new evidence is also building-level. District-level
 * listings keep the coordinates they have; only source and level are recorded.
 * A place named in the text never moves a pin more than 1 km (review list).
 *
 * Writes coordinatesLat/Lng, locationPrecision (exact only at building level),
 * locationSource, locationLevel, locationConfidence, locationEvidence,
 * locationGroup and, for realtor pins, googleMapsUrl — to the published document
 * and to its draft if one exists, so publishing an old draft does not undo it.
 * A backup of every patched document's previous values goes to
 * ../domlivo-workspace/geo/geo-engine-backup-<ts>.json first. Do not run
 * --execute while someone has listings open in the Studio: an open coordinate
 * input writes its old value back as a draft.
 *
 * Run:
 *   npx tsx scripts/applyGeoEngine20261013.ts               (dry run, the default)
 *   npx tsx scripts/applyGeoEngine20261013.ts --execute
 */
import fs from 'node:fs'
import path from 'node:path'
import {getSanityClientForScripts} from './lib/sanityEnvClient'

const isExecute = process.argv.includes('--execute')
const WORKSPACE = path.resolve(process.cwd(), '../domlivo-workspace')
const GEO = path.join(WORKSPACE, 'geo')
const GROUPS_FILE = path.join(GEO, 'photo-engine', 'groups.json')
const VISION_FILE = path.join(GEO, 'photo-engine', 'vision', 'results.json')
const PLAN_FILE = path.join(GEO, 'geocode-plan-2026-10-11.json')
const CACTUS_SOURCE = path.join(GEO, 'plan', 'cactus-source-2026-10-11.json')
const GMAPS_CACHE = path.join(WORKSPACE, 'cactus', 'gmaps-cache.json')

type Level = 'exact' | 'street' | 'area' | 'district'
type Source = 'realtor' | 'manual' | 'complex' | 'photoMatch' | 'text' | 'vision' | 'district'
type Conf = 'high' | 'medium' | 'low'

type Listing = {
  _id: string
  lat: number | null
  lng: number | null
  precision: 'exact' | 'approximate' | null
  source: Source | null
  level: Level | null
  confidence: Conf | null
  evidence: string | null
  googleMapsUrl: string | null
  group: string | null
}

type Proposal = {
  lat: number
  lng: number
  level: Level
  source: Source
  confidence: Conf
  evidence: string
  group?: string
  googleMapsUrl?: string
  keepCoordinates?: boolean
  /** a place named in the text: can be a mall or a hotel the flat is merely near */
  fromText?: boolean
}

/**
 * A place named in the text moves a pin at most this far. Farther moves mean
 * the text names something the flat is merely near ("10 minutes from
 * Rotondo"), or the partner's district label is wrong: either way a person
 * decides, the listing goes to the review list.
 */
const TEXT_MAX_MOVE_M = 1000
/** two building-level proposals farther apart than this disagree */
const DISAGREE_M = 150

const LEVEL_RANK: Record<Level, number> = {exact: 0, street: 1, area: 2, district: 3}
const CONF_RANK: Record<Conf, number> = {high: 0, medium: 1, low: 2}
const SOURCE_RANK: Record<Source, number> = {realtor: 0, manual: 1, complex: 2, photoMatch: 3, vision: 4, text: 5, district: 6}

function hav(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371000
  const p1 = (aLat * Math.PI) / 180
  const p2 = (bLat * Math.PI) / 180
  const dp = p2 - p1
  const dl = ((bLng - aLng) * Math.PI) / 180
  const h = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

function readJson<T>(file: string): T | null {
  return fs.existsSync(file) ? (JSON.parse(fs.readFileSync(file, 'utf8')) as T) : null
}

function compare(a: Proposal, b: Proposal): number {
  return (
    LEVEL_RANK[a.level] - LEVEL_RANK[b.level] ||
    CONF_RANK[a.confidence] - CONF_RANK[b.confidence] ||
    SOURCE_RANK[a.source] - SOURCE_RANK[b.source]
  )
}

const LOCKED = (s: Source | null | undefined) => s === 'realtor' || s === 'manual'

async function main() {
  const client = getSanityClientForScripts()
  const PROJECTION = `{
    _id,
    "lat": coordinatesLat, "lng": coordinatesLng,
    "precision": locationPrecision,
    "source": locationSource, "level": locationLevel,
    "confidence": locationConfidence, "evidence": locationEvidence,
    googleMapsUrl, "group": locationGroup
  }`
  const listings: Listing[] = await client.fetch(`*[_type == "property" && !(_id in path("drafts.**"))]${PROJECTION}`)
  const drafts: Listing[] = await client.fetch(`*[_type == "property" && _id in path("drafts.**")]${PROJECTION}`)
  const draftOf = new Map(drafts.map((d) => [d._id.replace(/^drafts\./, ''), d]))
  const byId = new Map(listings.map((l) => [l._id, l]))
  console.log(`listings ${listings.length}, drafts ${drafts.length}`)

  const proposals = new Map<string, Proposal[]>()
  const offer = (id: string, p: Proposal) => {
    if (!byId.has(id)) return
    proposals.set(id, [...(proposals.get(id) ?? []), p])
  }

  // 1. realtor pins from the agency's own Google Maps link
  const cactus = readJson<{result: Array<{_id: string; locationGmapsLink?: string | null}>}>(CACTUS_SOURCE)
  const cache = readJson<Record<string, {lat: number; lng: number; precision: string; note?: string}>>(GMAPS_CACHE) ?? {}
  let realtorLinks = 0
  for (const row of cactus?.result ?? []) {
    const link = (row.locationGmapsLink ?? '').trim()
    if (!link) continue
    const id = `property-cactus-${row._id}`
    const hit = cache[link] ?? cache[link.replace(/\?.*$/, '')]
    if (!hit || hit.precision !== 'exact') continue
    realtorLinks++
    offer(id, {
      lat: hit.lat,
      lng: hit.lng,
      level: 'exact',
      source: 'realtor',
      confidence: 'high',
      evidence: `Agency Google Maps link ${link.replace(/\?.*$/, '')}${hit.note ? ` (${hit.note})` : ''}`,
      googleMapsUrl: link.replace(/\?.*$/, ''),
    })
  }

  // 2. photo engine: same building as a listing with a trusted pin, or a group placed by its text
  type Group = {
    group: string
    size: number
    seeds: string[]
    members: Array<{id: string; link?: number}>
    predicted?: {lat: number; lng: number; level: Level; source: string; seedSpreadM?: number; textSpreadM?: number}
    evidence: Array<{a: string; b: string; s: number; kind: string; cls?: string; inliers?: number}>
  }
  const groups = readJson<Group[]>(GROUPS_FILE) ?? []
  const groupOf = new Map<string, string>()
  for (const g of groups) {
    const seedSet = new Set(g.seeds)
    for (const m of g.members) {
      groupOf.set(m.id, g.group)
      const p = g.predicted
      if (!p) continue
      if (p.source === 'photoMatch') {
        if (seedSet.has(m.id)) continue
        const kinds = [...new Set(g.evidence.filter((e) => e.a === m.id || e.b === m.id).map((e) => e.kind))].join(', ')
        offer(m.id, {
          lat: p.lat,
          lng: p.lng,
          level: 'exact',
          source: 'photoMatch',
          confidence: (m.link ?? 0) >= 0.9 && (p.seedSpreadM ?? 0) <= 60 ? 'high' : 'medium',
          evidence: `Photos show the same building as ${g.seeds.length} listing(s) with a trusted pin (${kinds || 'photo match'}; group of ${g.size})`,
          group: g.group,
        })
      } else if ((p.textSpreadM ?? 0) <= 300) {
        offer(m.id, {
          lat: p.lat,
          lng: p.lng,
          level: p.level,
          source: 'text',
          confidence: 'medium',
          evidence: `Same building as ${g.size - 1} other listing(s) by photos; placed by the place named in their texts`,
          group: g.group,
          fromText: true,
        })
      }
    }
  }

  // 3. vision: map screenshots in the photos (printed coordinates, or a georeferenced marker confirmed twice)
  type VisionRow = {listingId: string; found: boolean; lat?: number; lng?: number; uncertaintyM?: number; method?: string; verified?: string; reasoning?: string}
  const vision = readJson<VisionRow[]>(VISION_FILE) ?? []
  let visionUsed = 0
  for (const v of vision) {
    if (!v.found || typeof v.lat !== 'number' || typeof v.lng !== 'number') continue
    if (v.verified !== 'printed' && v.verified !== 'confirmed') continue
    if (v.lat < 39.55 || v.lat > 42.7 || v.lng < 18.9 || v.lng > 21.1) continue
    visionUsed++
    offer(v.listingId, {
      lat: v.lat,
      lng: v.lng,
      level: (v.uncertaintyM ?? 999) <= 60 ? 'exact' : 'area',
      source: 'vision',
      confidence: v.verified === 'printed' ? 'high' : 'medium',
      evidence: `Map screenshot in the listing's photos: ${v.method ?? ''}${v.verified === 'confirmed' ? ' (confirmed by a second check)' : ''}`,
    })
  }

  // 4. text geocoder: complex, street, landmark, district
  type PlanRow = {
    id: string
    proposed?: {lat: number; lng: number; precision: string; radiusM?: number} | null
    match?: {name?: string; source?: string} | string | null
    confidence?: Conf
    evidenceClass?: string
  }
  const plan = readJson<{plan: PlanRow[]}>(PLAN_FILE)?.plan ?? []
  for (const r of plan) {
    const pr = r.proposed
    if (!pr) continue
    const level = (['exact', 'street', 'area', 'district'].includes(pr.precision) ? pr.precision : 'district') as Level
    const conf = r.confidence ?? 'low'
    const what = typeof r.match === 'string' ? r.match : r.match?.name ?? r.evidenceClass ?? ''
    if (level === 'district') {
      offer(r.id, {lat: pr.lat, lng: pr.lng, level, source: 'district', confidence: 'high', evidence: 'Only the district is known', keepCoordinates: true})
    } else if (conf !== 'low' || level === 'area') {
      offer(r.id, {
        lat: pr.lat,
        lng: pr.lng,
        level,
        source: level === 'exact' ? 'complex' : 'text',
        confidence: conf,
        evidence: `${level === 'exact' ? 'Named complex' : level === 'street' ? 'Street' : 'Landmark'} in the text: ${what}`,
        fromText: true,
      })
    }
  }

  // 5. building-level pins placed before this tool, with no recorded source: keep them.
  //    Partner imports (ids "property-<partner>-…") were pinned by the complex scripts;
  //    anything else was created and pinned in the Studio, so it counts as manual.
  for (const l of listings) {
    if (l.precision === 'exact' && !l.source && l.lat != null && l.lng != null) {
      const imported = l._id.startsWith('property-')
      offer(l._id, {
        lat: l.lat,
        lng: l.lng,
        level: 'exact',
        source: imported ? 'complex' : 'manual',
        confidence: 'high',
        evidence: imported ? 'Building pin placed before 2026-10-13 (named complex)' : 'Pin placed in the Studio before 2026-10-13',
        keepCoordinates: true,
      })
    }
  }

  // ---------- decide patches ----------
  type Patch = {id: string; set: Record<string, unknown>; before: Record<string, unknown>; moveM: number | null; p: Proposal; draft: boolean}
  const patches: Patch[] = []
  const skipped = {locked: 0, wouldDowngrade: 0, unchanged: 0, textMoveTooFar: 0, disagree: 0}
  const review: Array<{id: string; why: string; moveM?: number; evidence: string[]}> = []
  for (const [id, offered] of proposals) {
    const l = byId.get(id)!
    const d = draftOf.get(id)
    if (LOCKED(l.source) || LOCKED(d?.source)) {
      skipped.locked++
      continue
    }
    const distanceTo = (q: Proposal) => (l.lat != null && l.lng != null && !q.keepCoordinates ? Math.round(hav(l.lat, l.lng, q.lat, q.lng)) : null)
    const candidates: Proposal[] = []
    for (const q of [...offered].sort(compare)) {
      const far = distanceTo(q)
      if (q.fromText && far != null && far > TEXT_MAX_MOVE_M) {
        skipped.textMoveTooFar++
        review.push({id, why: `text moves the pin ${far} m`, moveM: far, evidence: [q.evidence]})
        continue
      }
      candidates.push(q)
    }
    // building-level evidence that disagrees: take neither, a person decides
    const exact = candidates.filter((q) => q.level === 'exact' && q.source !== 'realtor')
    let pool = candidates
    if (exact.length > 1 && exact.some((a) => exact.some((b) => hav(a.lat, a.lng, b.lat, b.lng) > DISAGREE_M))) {
      skipped.disagree++
      review.push({id, why: 'building-level evidence disagrees', evidence: exact.map((q) => `${q.source} ${q.lat.toFixed(5)},${q.lng.toFixed(5)}: ${q.evidence}`)})
      pool = candidates.filter((q) => !exact.includes(q))
    }
    let p: Proposal | undefined = pool[0]
    if (!p) {
      if (l.lat == null || l.lng == null) continue
      p = {lat: l.lat, lng: l.lng, level: 'district', source: 'district', confidence: 'low', evidence: 'Only the district is known (other evidence went to review)', keepCoordinates: true}
    }
    if (l.precision === 'exact' && p.level !== 'exact' && l.source !== 'district') {
      skipped.wouldDowngrade++
      continue
    }
    const keep = p.keepCoordinates && l.lat != null && l.lng != null
    const lat = keep ? l.lat! : +p.lat.toFixed(6)
    const lng = keep ? l.lng! : +p.lng.toFixed(6)
    const group = p.group ?? groupOf.get(id)
    const set: Record<string, unknown> = {
      coordinatesLat: lat,
      coordinatesLng: lng,
      locationPrecision: p.level === 'exact' ? 'exact' : 'approximate',
      locationSource: p.source,
      locationLevel: p.level,
      locationConfidence: p.confidence,
      locationEvidence: p.evidence,
    }
    if (group) set.locationGroup = group
    if (p.googleMapsUrl) set.googleMapsUrl = p.googleMapsUrl
    const before = {
      coordinatesLat: l.lat,
      coordinatesLng: l.lng,
      locationPrecision: l.precision,
      locationSource: l.source,
      locationLevel: l.level,
      locationConfidence: l.confidence,
      locationEvidence: l.evidence,
      googleMapsUrl: l.googleMapsUrl,
      locationGroup: l.group,
    }
    const moveM = l.lat != null && l.lng != null ? Math.round(hav(l.lat, l.lng, lat, lng)) : null
    const same = moveM === 0 && Object.entries(set).every(([k, v]) => (before as Record<string, unknown>)[k] === v)
    if (same) {
      skipped.unchanged++
      continue
    }
    patches.push({id, set, before, moveM, p, draft: !!d})
  }

  // ---------- report ----------
  const tally: Record<string, number> = {}
  for (const x of patches) {
    const k = `${x.p.source}/${x.p.level}/${x.p.confidence}`
    tally[k] = (tally[k] ?? 0) + 1
  }
  const patched = new Map(patches.map((x) => [x.id, x]))
  const levelsAfter: Record<string, number> = {}
  for (const l of listings) {
    const x = patched.get(l._id)
    const lev = x?.p.level ?? l.level ?? (l.precision === 'exact' ? 'exact' : 'unknown')
    levelsAfter[lev] = (levelsAfter[lev] ?? 0) + 1
  }
  const moves = patches.map((x) => x.moveM).filter((m): m is number => m != null).sort((a, b) => a - b)
  console.log(`realtor links resolved: ${realtorLinks}; photo groups: ${groups.length}; vision points used: ${visionUsed}; text plan rows: ${plan.length}`)
  console.log('patches by source/level/confidence:', tally)
  console.log('skipped:', skipped, `drafts patched too: ${patches.filter((x) => x.draft).length}`)
  console.log('levels after:', levelsAfter)
  if (moves.length)
    console.log(`pin moves: median ${moves[Math.floor(moves.length / 2)]} m, p90 ${moves[Math.floor(moves.length * 0.9)]} m, >500 m: ${moves.filter((m) => m > 500).length}`)
  for (const x of patches.filter((x) => x.p.source === 'photoMatch' || x.p.source === 'vision').slice(0, 20))
    console.log(`  ${x.id.padEnd(52)} move ${String(x.moveM).padStart(5)} m  ${x.p.source}/${x.p.confidence}  ${x.p.evidence.slice(0, 110)}`)

  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  fs.writeFileSync(path.join(GEO, `geo-engine-plan-${stamp}.json`), JSON.stringify(patches, null, 1))
  fs.writeFileSync(path.join(GEO, `geo-engine-review-${stamp}.json`), JSON.stringify(review, null, 1))
  console.log(`review list: ${review.length} → geo-engine-review-${stamp}.json`)
  if (!isExecute) {
    console.log(`\nDry run. ${patches.length} patches planned → geo-engine-plan-${stamp}.json. Re-run with --execute to write.`)
    return
  }
  const backupFile = path.join(GEO, `geo-engine-backup-${stamp}.json`)
  fs.writeFileSync(
    backupFile,
    JSON.stringify(patches.map((x) => ({id: x.id, before: x.before, draftBefore: x.draft ? draftOf.get(x.id) : null})), null, 1),
  )
  console.log(`backup → ${backupFile}`)
  for (let i = 0; i < patches.length; i += 100) {
    const tx = client.transaction()
    for (const x of patches.slice(i, i + 100)) {
      tx.patch(x.id, (p) => p.set(x.set))
      if (x.draft) tx.patch(`drafts.${x.id}`, (p) => p.set(x.set))
    }
    await tx.commit({visibility: 'async'})
    console.log(`…${Math.min(i + 100, patches.length)}/${patches.length}`)
  }
  console.log('done')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
