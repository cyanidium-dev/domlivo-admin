/**
 * Upload the reviewed candidates from `tmp/image-replacements/` and attach them
 * to their zones, creating an `imageCredit` document for each.
 *
 * The decision lists below are human reviews of what sourcing found — the
 * 2026-08-16 round is in docs/engineering/IMAGE-REPLACEMENT-MAP-2026-08-16.md §3
 * (workspace repo), the 2026-10-14 round in docs/ZONE-IMAGES-2026-10-14.md.
 * Automated relevance is not trustworthy at this scale: the rejected set included a Shakespeare
 * painting that matched the word "Tale", a CIA map, a US Navy warship and Lake
 * Ohrid standing in for a Tirana neighbourhood of a similar name.
 *
 * Invariants:
 *  - only a `zone`-level photo may be captioned with the zone's name; a
 *    stand-in describes the photograph and is stamped STAND-IN
 *  - nothing is applied without a recorded licence
 *  - CC BY / CC BY-SA carries its deed URL, because that link is the attribution
 *  - hero and gallery are set together, so a replaced zone satisfies the
 *    readiness gate instead of trading one blocker for another
 *
 * Run:
 * - npm run apply:zone-images -- --dry
 * - npm run apply:zone-images -- --execute
 * - npm run apply:zone-images -- --dry --round 2026-08-16   (an older review)
 *
 * The latest round is the default. Rounds marked `onlyEmpty` skip any zone that
 * has acquired a hero image since the review.
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
const isDry = args.includes('--dry')
const isExecute = args.includes('--execute')
if (!isDry && !isExecute) {
  console.error('Use --dry or --execute.')
  process.exit(1)
}

const IN_DIR = path.resolve(process.cwd(), '../domlivo-workspace/tmp/image-replacements')

type Role = 'zone' | 'stand-in'
type Decision = {
  /** Index into the zone's `files` array in the manifest. */
  pick: number
  role: Role
  /** Alt text. For a stand-in this describes the photograph, never the zone. */
  alt: string
  /** For a stand-in: what it actually shows, recorded so it can be replaced. */
  shows?: string
}

/** Reviewed 2026-08-16. Zones absent from this map are deliberately not applied. */
const DECISIONS_2026_08_16: Record<string, Decision> = {
  // --- zone-level: a real photograph of the place ---
  durres: {pick: 0, role: 'zone', alt: 'The Roman amphitheatre in Durrës, Albania'},
  sarande: {pick: 0, role: 'zone', alt: 'Sarandë on the Ionian coast, Albania'},
  shkoder: {pick: 0, role: 'zone', alt: 'Shkodër, Albania'},
  tirana: {pick: 0, role: 'zone', alt: 'The Palace of Culture on Skanderbeg Square, Tirana'},
  vlore: {pick: 0, role: 'zone', alt: 'Vlorë seen from a balcony above the bay, Albania'},
  himare: {pick: 1, role: 'zone', alt: 'Drymades and Palasë beaches, Himarë, Albania'},
  shengjin: {pick: 1, role: 'zone', alt: 'The mole at Shëngjin, Albania'},
  orikum: {pick: 0, role: 'zone', alt: 'The centre of Orikum, Vlorë, Albania'},
  'qender-tirana': {pick: 0, role: 'zone', alt: 'New apartment buildings in central Tirana'},
  // Upgrades: these were stand-ins and may now name themselves.
  'rana-e-hedhur': {pick: 0, role: 'zone', alt: 'Rana e Hedhur, Shëngjin, Albania'},
  shkoze: {pick: 0, role: 'zone', alt: 'The Great Ring roundabout at Shkozë, Tirana'},

  // --- stand-ins: the caption describes the photograph, not the zone ---
  fresku: {pick: 0, role: 'stand-in', alt: 'The Pyramid of Tirana, Albania', shows: 'central Tirana, not Fresku'},
  gjuhadol: {pick: 0, role: 'stand-in', alt: 'Shkodër, Albania', shows: 'Shkodër generally, not the Gjuhadol quarter'},
  'komuna-e-parisit': {pick: 0, role: 'stand-in', alt: 'Sulejman Delvina Street, Tirana', shows: 'a central Tirana street, not Komuna e Parisit'},
  parruce: {pick: 0, role: 'stand-in', alt: 'The Shkodër skyline, Albania', shows: 'Shkodër generally, not the Parrucë quarter'},
  potami: {pick: 0, role: 'stand-in', alt: 'A hillside at Badhër, Himarë, Albania', shows: 'Badhër in the same municipality, not Potami'},
  transballkanike: {pick: 0, role: 'stand-in', alt: 'Vlorë at sunset, Albania', shows: 'Vlorë generally, not the Transballkanike axis'},
}

/**
 * Rejected, with the reason, so a re-run does not quietly reconsider them and
 * so the next person knows these were looked at.
 */
const REJECTED_2026_08_16: Record<string, string> = {
  tale: 'candidate was an 18th-century Shakespeare painting that matched the word "Tale"',
  'liqeni-i-thate': 'candidate was Lake Ohrid — a different Mali i Thatë, 130 km away',
  'porto-romano': 'candidate was a US Navy warship',
  'center-shengjin': 'candidate was a CIA map, not a photograph',
  'astir-unaza-e-re': 'candidate was a museum façade; the zone already carries a Tirana stand-in',
  rrashbull: 'candidate is already the current image',
}

/**
 * Reviewed 2026-10-14: districts that had no hero image at all. The files come
 * from REVIEWED_FILES in sourceZoneImages.ts, so every pick is index 0; each
 * one was opened and checked against its Commons description and coordinates.
 */
const DECISIONS_2026_10_14: Record<string, Decision> = {
  // --- batch 1, Durrës coast: all photographs of the place itself ---
  qerret: {pick: 0, role: 'zone', alt: 'The beach at Qerret with apartment buildings on the first line, Albania'},
  'gjiri-i-lalzit': {pick: 0, role: 'zone', alt: 'Straw umbrellas on the beach of Lalzi Bay (Gjiri i Lalzit), Durrës, Albania'},
  spille: {pick: 0, role: 'zone', alt: 'Spille beach with the coastal hills behind, Albania'},
  currila: {pick: 0, role: 'zone', alt: 'Currila beach below the wooded hill, Durrës, Albania'},
  arapaj: {pick: 0, role: 'zone', alt: 'Ruins of the early Christian basilica of St Michael in Arapaj, with apartment blocks behind, Durrës'},
  kavaje: {pick: 0, role: 'zone', alt: 'Democracy Square in Kavajë with the fountain, the clock tower and the Kubelie Mosque'},
  shkallnur: {pick: 0, role: 'zone', alt: 'Houses on the hillside at Shkallnur, near Durrës, Albania'},

  // --- batch 2, Durrës hinterland ---
  spitalle: {pick: 0, role: 'zone', alt: 'Houses and gardens of Spitallë, looking across the plain north of Durrës'},
  sukth: {pick: 0, role: 'zone', alt: 'The main road through Sukth i Ri, Durrës, Albania'},
  shijak: {pick: 0, role: 'zone', alt: 'The central square of Shijak with the mosque behind, Albania'},
  xhafzotaj: {pick: 0, role: 'zone', alt: 'Xhafzotaj seen across the fields, with the hills behind, Albania'},
  maminas: {pick: 0, role: 'zone', alt: 'The road junction into Maminas, Shijak, Albania'},
  koxhas: {
    pick: 0,
    role: 'stand-in',
    alt: 'Fields beside the Durrës–Tirana motorway near Xhafzotaj, Albania',
    shows: 'the plain at Xhafzotaj, the administrative unit Koxhas belongs to — not Koxhas itself',
  },
}

const REJECTED_2026_10_14: Record<string, string> = {
  // Metric-only price lines (scripts/data/zones.json): not pages, never imaged.
  'golem-1st-line': 'metric-only price line within Golem, not a page — must not carry imagery',
  'lungomare-2nd-line': 'metric-only price line within Lungomare, not a page — must not carry imagery',
  fllake: 'nothing on Commons shows Fllakë or its surroundings; left without an image',
  manez: 'the only photo of Manëz shows election-time party flags, and the other geotagged file is a tent advert; left without an image',
}

/**
 * Each review is a round. Only one round is applied per run, so re-running an
 * old review cannot overwrite images that have since been replaced, and a new
 * review cannot fail on manifest entries that belong to an old one.
 */
const ROUNDS: Record<string, {decisions: Record<string, Decision>; rejected: Record<string, string>; onlyEmpty: boolean}> = {
  '2026-08-16': {decisions: DECISIONS_2026_08_16, rejected: REJECTED_2026_08_16, onlyEmpty: false},
  // This round fills districts that had no image; it must never replace one.
  '2026-10-14': {decisions: DECISIONS_2026_10_14, rejected: REJECTED_2026_10_14, onlyEmpty: true},
}
const roundArg =
  args.find((a) => a.startsWith('--round='))?.split('=')[1] ??
  (args.includes('--round') ? args[args.indexOf('--round') + 1] : '2026-10-14')
const ROUND = ROUNDS[roundArg]
if (!ROUND) {
  console.error(`Unknown round "${roundArg}". Known: ${Object.keys(ROUNDS).join(', ')}`)
  process.exit(1)
}
const DECISIONS = ROUND.decisions
const REJECTED = ROUND.rejected

async function main() {
  const manifestPath = path.join(IN_DIR, 'manifest.json')
  if (!fs.existsSync(manifestPath)) {
    console.error(`No manifest at ${manifestPath}. Run: npm run source:zone-images`)
    process.exit(1)
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  const byslug = new Map<string, any>(manifest.zones.map((z: any) => [z.slug, z]))

  const slugs = Object.keys(DECISIONS)
  const zones: any[] = await client.fetch(
    `*[_type in ["district", "city"] && slug.current in $slugs && !(_id in path("drafts.**"))]{
      _id, _type, "slug": slug.current, "hasHero": defined(heroImage.asset),
      "galleryCount": count(gallery)
    }`,
    {slugs},
  )
  const docBySlug = new Map(zones.map((z) => [z.slug, z]))

  for (const [slug, reason] of Object.entries(REJECTED)) {
    console.log(`reject   ${slug.padEnd(20)} ${reason}`)
  }

  type Plan = {
    slug: string
    docId: string
    file: string
    meta: any
    decision: Decision
  }
  const plan: Plan[] = []
  const problems: string[] = []

  for (const [slug, decision] of Object.entries(DECISIONS)) {
    const entry = byslug.get(slug)
    const doc = docBySlug.get(slug)
    if (!entry) { problems.push(`${slug}: not in the manifest`); continue }
    if (!doc) { problems.push(`${slug}: no zone document`); continue }
    if (ROUND.onlyEmpty && doc.hasHero) {
      // Not a problem to stop on: someone gave it an image since the review.
      console.log(`skip     ${slug.padEnd(20)} already has a hero image — this round only fills empty ones`)
      continue
    }
    if (ROUND.onlyEmpty && (doc.galleryCount ?? 0) > 0) {
      problems.push(`${slug}: has no hero but has a gallery, which this script would overwrite`)
      continue
    }
    const meta = entry.files?.[decision.pick]
    if (!meta) { problems.push(`${slug}: manifest has no file at index ${decision.pick}`); continue }
    if (!meta.licence || !meta.sourceUrl) { problems.push(`${slug}: candidate has no licence or source`); continue }
    if (meta.requiresAttribution && !meta.licenceUrl) {
      problems.push(`${slug}: ${meta.licenceLabel} needs a deed URL — that link is the attribution`)
      continue
    }
    const file = path.join(IN_DIR, slug, meta.file)
    if (!fs.existsSync(file)) { problems.push(`${slug}: file missing on disk (${meta.file})`); continue }
    plan.push({slug, docId: doc._id, file, meta, decision})
  }

  for (const p of plan) {
    console.log(
      `${p.decision.role === 'zone' ? 'apply  ' : 'stand-in'} ${p.slug.padEnd(20)} ` +
        `${String(p.meta.licenceLabel).padEnd(20)} ${p.meta.commonsTitle.slice(0, 46)}`,
    )
  }
  if (problems.length) {
    console.log('\nPROBLEMS:')
    for (const p of problems) console.log(`  ${p}`)
  }

  console.log(`\n${plan.length} zone(s) to update, ${Object.keys(REJECTED).length} rejected, ${problems.length} problem(s).`)
  if (isDry) { console.log('Dry run — nothing written.'); return }
  if (problems.length) { console.error('\nRefusing to write while problems remain.'); process.exit(1) }

  let done = 0
  for (const p of plan) {
    const {meta, decision} = p
    const standInNote =
      decision.role === 'stand-in'
        ? ` STAND-IN: shows ${decision.shows ?? 'a comparable place'}. Replace when a photo of the zone exists.`
        : ''
    const asset = await client.assets.upload('image', fs.readFileSync(p.file), {
      filename: meta.file,
      description:
        `Source: ${meta.sourceUrl} · Licence: ${meta.licenceLabel} · Author: ${meta.author}.` + standInNote,
    })

    await client
      .patch(p.docId)
      .set({
        heroImage: {_type: 'image', asset: {_type: 'reference', _ref: asset._id}, alt: decision.alt},
        gallery: [
          {_key: `${p.slug}-g0`, _type: 'image', asset: {_type: 'reference', _ref: asset._id}, alt: decision.alt},
        ],
      })
      .commit()

    await client.createOrReplace({
      _id: `imageCredit-${asset._id.replace(/^image-/, '').slice(0, 40)}`,
      _type: 'imageCredit',
      image: {_type: 'image', asset: {_type: 'reference', _ref: asset._id}},
      title: decision.alt,
      author: meta.author || 'unknown',
      licence: meta.licence,
      ...(meta.licenceUrl ? {licenceUrl: meta.licenceUrl} : {}),
      sourceUrl: meta.sourceUrl,
      isStandIn: decision.role === 'stand-in',
      ...(decision.role === 'stand-in' ? {standInNote: decision.shows ?? 'Not a photo of the zone.'} : {}),
    } as never)

    done += 1
    console.log(`  ✓ ${p.slug}`)
  }
  console.log(`\nUpdated ${done} zone(s) and wrote ${done} image credit(s).`)
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
