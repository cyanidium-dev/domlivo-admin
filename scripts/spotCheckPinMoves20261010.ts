/**
 * Describes where pins were and where they went, in words, so a person can
 * judge a coordinate fix without opening a map: Nominatim reverse geocoding
 * (zoom 18, one request a second, cached in
 * ../domlivo-workspace/geo/reverse-spotcheck-cache.json).
 *
 *   npx tsx scripts/spotCheckPinMoves20261010.ts <fix-plan-or-backup.json> [--moves 12] [--left 6] [--rule building]
 */
import fs from 'node:fs'
import path from 'node:path'

const args = process.argv.slice(2)
const file = args[0]
if (!file) {
  console.error('Pass the fix plan/backup JSON.')
  process.exit(1)
}
const opt = (name: string, def: string) => (args.includes(name) ? args[args.indexOf(name) + 1] : def)
const maxMoves = Number(opt('--moves', '12'))
const maxLeft = Number(opt('--left', '6'))
const rule = opt('--rule', '')

const CACHE = path.resolve(process.cwd(), '../domlivo-workspace/geo/reverse-spotcheck-cache.json')
const USER_AGENT = 'domlivo-admin geo spot check (cyanidium1@gmail.com)'
type Answer = {display?: string; category?: string; type?: string; name?: string; road?: string; house?: string; suburb?: string}
const cache: Record<string, Answer> = fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, 'utf8')) : {}
let last = 0

async function reverse(lat: number, lng: number): Promise<Answer> {
  const key = `${lat.toFixed(6)},${lng.toFixed(6)}`
  if (cache[key]) return cache[key]
  const wait = 1100 - (Date.now() - last)
  if (wait > 0) await new Promise((r) => setTimeout(r, wait))
  last = Date.now()
  const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=jsonv2&zoom=18&addressdetails=1`, {
    headers: {'User-Agent': USER_AGENT, 'Accept-Language': 'en'},
  })
  const j = (await res.json()) as {
    display_name?: string
    category?: string
    type?: string
    name?: string
    address?: Record<string, string>
  }
  const a = j.address ?? {}
  cache[key] = {
    display: j.display_name?.split(',').slice(0, 4).join(',').trim(),
    category: j.category,
    type: j.type,
    name: j.name || undefined,
    road: a.road ?? a.pedestrian ?? a.footway,
    house: a.house_number,
    suburb: a.suburb ?? a.neighbourhood ?? a.quarter ?? a.village ?? a.town,
  }
  fs.writeFileSync(CACHE, JSON.stringify(cache, null, 1))
  return cache[key]
}

const fmt = (a: Answer) =>
  `${a.category}/${a.type}${a.name ? ` "${a.name}"` : ''} — ${[a.road, a.house].filter(Boolean).join(' ') || '(no road)'}, ${a.suburb ?? ''}`

async function main() {
  const plan = JSON.parse(fs.readFileSync(file, 'utf8')) as {
    moves: Array<{_id: string; rule: string; from: {lat: number; lng: number}; to: {lat: number; lng: number}; movedM: number; note: string}>
    left: Array<{_id: string; rule: string; lat: number; lng: number; reason: string; visible: boolean}>
  }
  // One example per distinct source coordinate: a stack of 11 pins needs one look.
  const seen = new Set<string>()
  const moves = plan.moves.filter((m) => (!rule || m.rule === rule) && !seen.has(`${m.from.lat},${m.from.lng}`) && seen.add(`${m.from.lat},${m.from.lng}`))
  console.log(`=== moved (${moves.length} distinct source points, showing ${Math.min(maxMoves, moves.length)}) ===`)
  for (const m of moves.slice(0, maxMoves)) {
    const from = await reverse(m.from.lat, m.from.lng)
    const to = await reverse(m.to.lat, m.to.lng)
    console.log(`\n[${m.rule}] ${m._id}  ${m.movedM} m  (${m.note})`)
    console.log(`   from ${m.from.lat},${m.from.lng}: ${fmt(from)}`)
    console.log(`   to   ${m.to.lat},${m.to.lng}: ${fmt(to)}`)
  }
  const seenLeft = new Set<string>()
  const left = plan.left.filter((l) => l.rule === 'building' && !seenLeft.has(`${l.lat},${l.lng}`) && seenLeft.add(`${l.lat},${l.lng}`))
  console.log(`\n=== left alone, exact (${left.length} distinct points, showing ${Math.min(maxLeft, left.length)}) ===`)
  for (const l of left.slice(0, maxLeft)) {
    const at = await reverse(l.lat, l.lng)
    console.log(`\n${l._id}${l.visible ? '' : ' (not on the map)'}  ${l.reason}`)
    console.log(`   at ${l.lat},${l.lng}: ${fmt(at)}`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
