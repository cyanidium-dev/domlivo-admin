import fs from 'node:fs'
import {getSanityClientForScripts} from './lib/sanityEnvClient'
// Building points: Cactus Google Maps pins inside the complex (Tocak: median of 11, 43 m spread; Liburna),
// Google Maps place pages (Dyrrakium Residence, Vala Park, Blue Star), OSM (Desla Tower). Checked 2026-10-09.
const PLACES: Record<string, {lat: number; lng: number; precision: 'exact' | 'approximate'; spread: number}> = {
  liburna: {lat: 41.239941, lng: 19.520265, precision: 'exact', spread: 0},
  tocak: {lat: 41.30975, lng: 19.491479, precision: 'exact', spread: 0},
  dyrrakium: {lat: 41.3212396, lng: 19.4319711, precision: 'exact', spread: 0},
  desla: {lat: 41.30861, lng: 19.4917, precision: 'exact', spread: 0},
  'vala-park': {lat: 41.3289193, lng: 19.4493074, precision: 'approximate', spread: 80},
  'blue-star': {lat: 41.3152793, lng: 19.4506754, precision: 'approximate', spread: 80},
}
function hash(s: string) { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) } return h >>> 0 }
async function main() {
  const c = getSanityClientForScripts()
  const hits: Record<string, Array<[string, string | null, string | null]>> = JSON.parse(fs.readFileSync('../domlivo-workspace/geo/complex-hits.json', 'utf8'))
  let n = 0
  const tx = c.transaction()
  for (const [key, place] of Object.entries(PLACES)) {
    for (const [id, , prec] of hits[key] ?? []) {
      if (prec === 'exact') continue
      const h = hash(id), a = ((h % 3600) / 3600) * 2 * Math.PI, r = Math.sqrt(((h >>> 12) % 1000) / 1000) * place.spread
      const lat = +(place.lat + (r * Math.cos(a)) / 111320).toFixed(6)
      const lng = +(place.lng + (r * Math.sin(a)) / (111320 * Math.cos((place.lat * Math.PI) / 180))).toFixed(6)
      tx.patch(id, (p) => p.set({coordinatesLat: lat, coordinatesLng: lng, locationPrecision: place.precision}))
      n++
      console.log(key.padEnd(10), place.precision.padEnd(11), id)
    }
  }
  await tx.commit()
  console.log('pinned', n)
}
main().catch((e) => { console.error(e); process.exit(1) })
