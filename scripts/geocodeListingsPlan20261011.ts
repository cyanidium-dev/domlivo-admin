/**
 * Real map locations instead of scattered approximate pins — analytics and a
 * geocoding plan, 2026-10-11.
 *
 * The owner: "suddenly 5 flats stand on one spot on the beach where there are
 * no buildings; every listing needs a real geotag, not something stuck in to
 * look realistic". 708 of 809 pins are `approximate`: placePartnerListingCoordinates.ts
 * scattered them around a district/landmark anchor (geo-anchors.json), on land
 * but not on a building. This script works out, per listing, what the data can
 * honestly support and proposes a point and a precision for it:
 *
 *   exact    — a named residential complex/building found in OpenStreetMap, or
 *              in the Google Maps links of sibling listings of the same complex
 *              (Cactus); every unit of the complex shares the one point;
 *   street   — a named street found in OSM inside the listing's district; the
 *              pin goes on a building along that street (deterministic per
 *              listing / per identical text);
 *   area     — a named landmark (hotel, hospital, school, mall, square) or a
 *              partner neighbourhood label ("Plazh Iliria") found in OSM; the
 *              pin goes on a building within ~250 m and carries a radius the
 *              map should draw instead of a building highlight;
 *   district — nothing finer than the district: no individual pin, the map
 *              shows a district bubble ("Plazh · 42 ≈") anchored at the
 *              centroid of the district's buildings.
 *
 * Evidence comes from the partner's own text first (get.al title/label/
 * description, findall address/title/description, Cactus source titles and
 * descriptions), then from our localized title/description/address. A match
 * found only in our rewritten text is marked `evidenceFrom: 'site'` and gets a
 * lower confidence, since an editorial pass may have added a landmark.
 *
 * A geocoded place is accepted only when it lies inside the listing's district
 * box (anchors of that district, padded) — or, without a district, the city
 * box — and is unique there (all candidates within 250 m of each other, or one
 * street). Ambiguous names are rejected and listed.
 *
 * Network: OpenStreetMap Overpass (one query every 2 s) and Nominatim (one a
 * second, User-Agent naming domlivo-admin), both cached in
 * ../domlivo-workspace/geo/geocode-cache.json; building footprints, beach,
 * park and road geometry from the OpenFreeMap z14 tiles the site's map draws
 * (scripts/lib/geoTiles.ts, disk-cached).
 *
 * Outputs (../domlivo-workspace/geo/):
 *   geocode-plan-2026-10-11.json      per listing: current point, evidence, proposal
 *   district-bubbles-2026-10-11.json  district → {lat, lng, count}
 *   geocode-plan-2026-10-11.md        summary tables
 *
 * Run:
 *   npx tsx scripts/geocodeListingsPlan20261011.ts                 (dry run, the default)
 *   npx tsx scripts/geocodeListingsPlan20261011.ts --cache-only    (no network beyond tiles already cached)
 *   npx tsx scripts/geocodeListingsPlan20261011.ts --execute       (writes; backup first — owner decision)
 *
 * --execute writes, for exact/street/area proposals with confidence ≥ medium:
 * coordinatesLat/Lng, locationPrecision ('exact' only for exact, else
 * 'approximate'), plus `locationLevel` ('exact'|'street'|'area'|'district')
 * and `locationEvidence` (string) — two fields the property schema does not
 * declare yet. District-only listings get the district bubble point and
 * locationLevel 'district'. Nothing else is touched; a backup of every patched
 * document's previous values goes to ../domlivo-workspace/geo/geocode-backup-<ts>.json.
 */
import fs from 'node:fs'
import path from 'node:path'
import {VectorTile} from '@mapbox/vector-tile'
import Pbf from 'pbf'
import {getSanityClientForScripts} from './lib/sanityEnvClient'
import {
  buildingAt,
  buildingsNear,
  centroid,
  distanceM,
  hash,
  nearestInteriorPoint,
  polygonContains,
  tileBytes,
  tileOf,
  waterAt,
  type Polygon,
} from './lib/geoTiles'

const args = process.argv.slice(2)
const isExecute = args.includes('--execute')
const cacheOnly = args.includes('--cache-only')
const STAMP = '2026-10-11'

const WORKSPACE = path.resolve(process.cwd(), '../domlivo-workspace')
const GEO = path.join(WORKSPACE, 'geo')
const CACHE_FILE = path.join(GEO, 'geocode-cache.json')
const PLAN_FILE = path.join(GEO, `geocode-plan-${STAMP}.json`)
const BUBBLES_FILE = path.join(GEO, `district-bubbles-${STAMP}.json`)
const SUMMARY_FILE = path.join(GEO, `geocode-plan-${STAMP}.md`)
const CACTUS_SOURCE = path.join(GEO, 'plan', 'cactus-source-2026-10-11.json')
const REVERSE_CACHE = path.join(GEO, 'reverse-cache.json')
const USER_AGENT = 'domlivo-admin geocode plan (cyanidium1@gmail.com)'
const OVERPASS = 'https://overpass-api.de/api/interpreter'

const anchorFile = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'scripts/data/geo-anchors.json'), 'utf8')) as {
  anchors: Array<{key: string; district?: string; lat: number; lng: number; radius: number; source: string; match: string[]}>
  districtCentroids: Record<string, {lat: number; lng: number; radius: number}>
  cityCentroids: Record<string, {lat: number; lng: number; radius: number}>
}

/* ====================================================================== */
/* boxes                                                                  */
/* ====================================================================== */

type Box = {s: number; w: number; n: number; e: number}
const M = 111_320

function boxAround(lat: number, lng: number, r: number): Box {
  const dLat = r / M
  const dLng = r / (M * Math.cos((lat * Math.PI) / 180))
  return {s: lat - dLat, n: lat + dLat, w: lng - dLng, e: lng + dLng}
}
function union(a: Box, b: Box): Box {
  return {s: Math.min(a.s, b.s), w: Math.min(a.w, b.w), n: Math.max(a.n, b.n), e: Math.max(a.e, b.e)}
}
function inBox(b: Box, lat: number, lng: number) {
  return lat >= b.s && lat <= b.n && lng >= b.w && lng <= b.e
}
const bboxStr = (b: Box) => `${b.s.toFixed(5)},${b.w.toFixed(5)},${b.n.toFixed(5)},${b.e.toFixed(5)}`

/** Whole municipality boxes: a name is searched here, then filtered by the listing's district box. */
const CITY_BOX: Record<string, Box> = {
  durres: {s: 41.05, w: 19.38, n: 41.62, e: 19.72},
  tirana: {s: 41.24, w: 19.65, n: 41.46, e: 19.98},
  vlore: {s: 40.25, w: 19.38, n: 40.56, e: 19.62},
  sarande: {s: 39.7, w: 19.95, n: 39.95, e: 20.12},
  shengjin: {s: 41.65, w: 19.55, n: 41.9, e: 19.7},
  himare: {s: 39.95, w: 19.6, n: 40.2, e: 19.95},
  shkoder: {s: 41.8, w: 19.35, n: 42.15, e: 19.6},
}
const CITY_NAME: Record<string, string> = {
  durres: 'Durrës', tirana: 'Tiranë', vlore: 'Vlorë', sarande: 'Sarandë', shengjin: 'Shëngjin', himare: 'Himarë', shkoder: 'Shkodër',
}

/** A district's box: its centroid and every anchor of the district, each padded by max(radius, 700 m) + 400 m. */
function districtBox(d: string): Box | null {
  const c = anchorFile.districtCentroids[d]
  const pts = anchorFile.anchors.filter((a) => a.district === d)
  if (!c && !pts.length) return null
  let box: Box | null = c ? boxAround(c.lat, c.lng, Math.max(c.radius, 700) + 400) : null
  for (const a of pts) {
    const b = boxAround(a.lat, a.lng, Math.max(a.radius, 700) + 400)
    box = box ? union(box, b) : b
  }
  return box
}

/* ====================================================================== */
/* text                                                                   */
/* ====================================================================== */

function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/ë/g, 'e')
    .replace(/ç/g, 'c')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ё/g, 'е')
    .replace(/[“”«»"’']/g, ' ')
    .replace(/\s+/g, ' ')
}

/* ====================================================================== */
/* gazetteer — every named place the listing texts mention (mined 2026-10-11) */
/* ====================================================================== */

type Kind = 'complex' | 'street' | 'quarter' | 'landmark' | 'neighbourhood'
type Gaz = {
  key: string
  kind: Kind
  /** On normalized text (lower case, ë→e, ç→c, accents off). */
  re: RegExp
  /** Overpass name regex (case-insensitive); empty = not searchable in OSM. */
  osm?: string
  /** Nominatim free-text query (", <City>" appended). */
  q?: string
  city?: string
  /** geo-anchors.json key whose point (Google Maps / OSM, checked by hand) may stand in when OSM has nothing. */
  anchor?: string
  /** For landmarks: the listing is near it, not in it — never pin onto the landmark's own building. */
  excludeOwnBuilding?: boolean
  /** Required OSM tags (on the k=v string), e.g. hospitals only. */
  need?: RegExp
}

const GAZ: Gaz[] = [
  // ---------- (a) named residential complexes / buildings ----------
  {key: 'tocak', kind: 'complex', re: /\b(tocak|toqak|toqac|tocac|точак|тоцак)\b/, osm: 'To[cçq]a[kc]', q: 'Tocak'},
  {key: 'rotondo', kind: 'complex', re: /\b(rotond[oa]|ротонд[оа])\b/, osm: '^Rotond', q: 'Rotondo'},
  {key: 'liburna', kind: 'complex', re: /\b(liburn[ae]?s?|либурн[аы]?)\b/, osm: 'Liburna', q: 'Liburna Residence', anchor: 'liburna-golem'},
  {key: 'desla', kind: 'complex', re: /\bdesla\b|десла/, osm: 'Desla', q: 'Desla Tower', anchor: 'desla-tower'},
  {key: 'dyrrakium-residence', kind: 'complex', re: /\bdyrrakium\b/, osm: 'Dyrrakium', q: 'Dyrrakium Residence'},
  {key: 'sunsea', kind: 'complex', re: /\bsun ?sea\b/, osm: 'Sun ?Sea', q: 'Sunsea'},
  {key: 'gioia', kind: 'complex', re: /\bgioia\b/, osm: 'Gioia', q: 'Gioia Residence'},
  {key: 'vjena', kind: 'complex', re: /\bvjena\b/, osm: 'Vjena', q: 'Vjena'},
  {key: 'palm-paradise', kind: 'complex', re: /\bpalm paradise\b/, osm: 'Palm Paradise', q: 'Palm Paradise'},
  {key: 'adriatic-garden', kind: 'complex', re: /\badriatic garden\b/, osm: 'Adriatic Garden', q: 'Adriatic Garden'},
  {key: 'alb-adriatik', kind: 'complex', re: /\balb[- ]?adriatik\b/, osm: 'Alb.?Adriatik', q: 'Alb Adriatik', anchor: 'alb-adriatik'},
  {key: 'loredis', kind: 'complex', re: /\bloredis\b/, osm: 'Loredis', q: 'Loredis', anchor: 'loredis-qerret'},
  {key: 'oriental', kind: 'complex', re: /\borien?tal (tennis )?(residence|rezidenca)|rezidenca orien?tal|\borien?tal\b/, osm: 'Oriental', q: 'Oriental Residence', anchor: 'oriental-golem'},
  {key: 'erdiar', kind: 'complex', re: /\berdiar\b/, osm: 'Erdiar', q: 'Erdiar', anchor: 'erdiar-qerret'},
  {key: 'illuminari', kind: 'complex', re: /\billuminari\b/, osm: 'Illuminari', q: 'Illuminari'},
  {key: 'orchidea', kind: 'complex', re: /\borchidea\b/, osm: 'Orchidea', q: 'Orchidea'},
  {key: 'tiktaalik', kind: 'complex', re: /\btiktaalik\b/, osm: 'Tiktaalik', q: 'Tiktaalik'},
  {key: 'luminor', kind: 'complex', re: /\bluminor\b/, osm: 'Luminor', q: 'Luminor'},
  {key: 'merville', kind: 'complex', re: /\bmerville\b/, osm: 'Merville', q: 'Merville'},
  {key: 'lura', kind: 'complex', re: /\blura\b/, osm: '^Lura', q: 'Lura', anchor: 'lura-lalzit'},
  {key: 'kodra-e-diellit', kind: 'complex', re: /\bkodra e diellit\b/, osm: 'Kodra e Diellit', q: 'Kodra e Diellit', anchor: 'kodra-e-diellit'},
  {key: 'next-to-sea', kind: 'complex', re: /\bnext ?to ?sea\b/, osm: 'Next ?To ?Sea', q: 'NextToSea Golem', anchor: 'nexttosea-golem'},

  // ---------- (b) streets and numbered quarters ----------
  {key: 'rr-sulejman-pitarka', kind: 'street', re: /\bsulejman pitarka\b/, osm: 'Sulejman Pitarka'},
  {key: 'rr-aleksander-goga', kind: 'street', re: /\baleksand[e]?r goga\b/, osm: 'Aleksand[eë]r Goga'},
  {key: 'rr-shengjergj', kind: 'street', re: /\bshengjergj\b/, osm: 'Sh[eë]ngjergj'},
  {key: 'rr-universitetit', kind: 'street', re: /\brruge?s? (se |e )?universitetit\b|\buniversity road\b/, osm: 'Universitet'},
  {key: 'rr-taulantia', kind: 'street', re: /\btaulantia\b/, osm: 'Taulantia'},
  {key: 'rr-pavaresia', kind: 'street', re: /\b(rruga )?pavaresi(a|se)\b/, osm: 'Pavar[eë]si'},
  {key: 'rr-fshatrave-turistike', kind: 'street', re: /\bfshatrave turistike\b/, osm: 'Fshatrave Turistike'},
  {key: 'bul-dyrrah', kind: 'street', re: /\bbulevardi dyrrah\b/, osm: 'Dyrrah'},
  {key: 'bul-epidamn', kind: 'street', re: /\bepidamn\b/, osm: 'Epidamn'},
  ...Array.from({length: 18}, (_, i) => i + 1).map(
    (n): Gaz => ({key: `lagjja-${n}`, kind: 'quarter', city: 'durres', re: new RegExp(`\\blagj(j)?(a|ia|en|es) (nr\\.? ?)?${n}\\b(?![.,]\\d)`), osm: `^Lagj(j)?(a|ia)( nr\\.?)? ?${n}$`}),
  ),
  {key: 'lagjja-merhorve', kind: 'quarter', re: /\bmerhorve\b/, osm: 'Merhor'},
  {key: 'muradie', kind: 'quarter', re: /\bmuradie\b/, osm: 'Muradie', q: 'Muradie'},

  // ---------- (c) landmarks ----------
  {key: 'spitali', kind: 'landmark', city: 'durres', re: /\bspital(i|it)\b|\bhospital\b|больниц|лікарн/, osm: 'Spital', need: /amenity=hospital|healthcare=hospital/, q: 'Spitali Rajonal Durrës', anchor: 'spitali', excludeOwnBuilding: true},
  {key: 'universiteti', kind: 'landmark', city: 'durres', re: /\buniversitet(i|it)\b|aleksander moisiu|\buniversity\b|университет|університет/, osm: 'Aleksand[eë]r Moisiu', q: 'Universiteti Aleksandër Moisiu', excludeOwnBuilding: true},
  {key: 'stadiumi', kind: 'landmark', city: 'durres', re: /\bstadium(i|it)?\b|niko dovana|стадион/, osm: 'Niko Dovana', q: 'Stadiumi Niko Dovana', anchor: 'stadiumi', excludeOwnBuilding: true},
  {key: 'porti', kind: 'landmark', city: 'durres', re: /\bport(i|it)\b|\bseaport\b|near (the )?port\b|морск(ой|ого) порт/, osm: '^Porti (i )?Durr', q: 'Porti i Durrësit', excludeOwnBuilding: true},
  {key: 'ura-dajlanit', kind: 'landmark', city: 'durres', re: /\b(dajlan|djalan|dailan)/, osm: 'Dajlan', q: 'Ura e Dajlanit'},
  {key: 'posta-plazh', kind: 'landmark', city: 'durres', re: /\b(tek|te|prane|near the) post(a|es|e|\b|office)|\bpost office\b/, osm: '^Posta', q: 'Posta Shqiptare Plazh', anchor: 'tek-posta-plazh', excludeOwnBuilding: true},
  {key: 'rrota-e-kuqe', kind: 'landmark', city: 'durres', re: /\brrot(a|es) (e|se) kuqe\b|\bred wheel\b/, osm: 'Rrota e Kuqe', q: 'Rrota e Kuqe', anchor: 'rrota-e-kuqe'},
  {key: 'kryqi-i-kuq', kind: 'landmark', city: 'durres', re: /\bkryq(i|it) (i|te) kuq\b/, osm: 'Kryqi i Kuq', anchor: 'kryqi-i-kuq', excludeOwnBuilding: true},
  {key: 'sheshi-pranvera', kind: 'landmark', city: 'durres', re: /\bsheshi(t)? pranvera\b|\bpranvera square\b/, osm: 'Pranvera', anchor: 'sheshi-pranvera'},
  {key: 'pallati-sportit', kind: 'landmark', city: 'durres', re: /\bpallat(i|it) (i|te) sport|\bsports palace\b/, osm: 'Pallati i Sport', q: 'Pallati i Sportit Ramazan Njala', anchor: 'pallati-i-sportit', excludeOwnBuilding: true},
  {key: 'stacioni', kind: 'landmark', city: 'durres', re: /\bstacion(i|it) (i|te) (trenit|autobus)|\bbus station\b|\btrain station\b/, osm: 'Stacion', need: /railway=station|amenity=bus_station|public_transport=station/, anchor: 'stacioni-i-trenit', excludeOwnBuilding: true},
  {key: 'shkolla-bajram-curri', kind: 'landmark', city: 'durres', re: /\bbajram curri\b/, osm: 'Bajram Curri', q: 'Shkolla Bajram Curri', excludeOwnBuilding: true},
  {key: 'shkolla-hajdar-dushi', kind: 'landmark', city: 'durres', re: /\bhajdar dushi\b/, osm: 'Hajdar Dushi', q: 'Shkolla Hajdar Dushi', excludeOwnBuilding: true},
  {key: 'shkolla-qemal-mici', kind: 'landmark', city: 'durres', re: /\bqemal mici\b/, osm: 'Qemal Mici', q: 'Shkolla Qemal Mici', excludeOwnBuilding: true},
  {key: 'aquapark', kind: 'landmark', city: 'durres', re: /\baqua ?park\b|\bwater park\b|parkut ujor|аквапарк/, osm: 'Aqua ?park|Aquapark', q: 'Aqua Park Durrës', excludeOwnBuilding: true},
  {key: 'akuariumi', kind: 'landmark', city: 'durres', re: /\b(aquarium|akuarium)/, osm: 'Akuarium|Aquarium', q: 'Akuariumi Durrës', excludeOwnBuilding: true},
  {key: 'blue-star', kind: 'landmark', city: 'durres', re: /\bblue star\b/, osm: '^Blue Star', q: 'Blue Star Durrës', anchor: 'blue-star', excludeOwnBuilding: true},
  {key: 'teg', kind: 'landmark', city: 'tirana', re: /\bteg\b|tirana east gate/, osm: 'Tirana East Gate|^TEG$', q: 'Tirana East Gate', anchor: 'teg', excludeOwnBuilding: true},
  {key: 'spar', kind: 'landmark', re: /\bspar\b/, osm: '^Spar$', excludeOwnBuilding: true},
  {key: 'markata', kind: 'landmark', city: 'durres', re: /\bmarkat(a|es)\b/, osm: 'Markat', excludeOwnBuilding: true},
  {key: 'tregu-fruta', kind: 'landmark', city: 'durres', re: /\btreg(u|ut) (i |e )?fruta|fruta perime/, osm: 'Tregu', anchor: 'tregu-fruta-perime', excludeOwnBuilding: true},
  {key: 'tregu-industrial', kind: 'landmark', city: 'durres', re: /\btregu industrial\b/, anchor: 'tregu-industrial'},
  {key: 'drejtoria-policise', kind: 'landmark', city: 'durres', re: /\bdrejtori(a|se) e policise\b|\bpolice directorate\b/, osm: 'Drejtoria .*Polic', anchor: 'drejtoria-e-policise', excludeOwnBuilding: true},
  {key: 'ish-rajoni-policise', kind: 'landmark', city: 'durres', re: /\bish[- ]rajon/, anchor: 'ish-rajoni-i-policise'},
  {key: 'ujesjelles', kind: 'landmark', city: 'durres', re: /\bujesjelles/, osm: 'Uj[eë]sjell[eë]s', anchor: 'ujesjelles-kanalizime', excludeOwnBuilding: true},
  {key: 'cezma-e-ferres', kind: 'landmark', city: 'durres', re: /\bcezma\b/, osm: '[CÇ]ezma', anchor: 'cezma-e-ferres'},
  {key: 'muzeu-deshmoreve', kind: 'landmark', city: 'durres', re: /\bdeshmoreve\b/, osm: 'D[eë]shmor[eë]ve', anchor: 'muzeu-i-deshmoreve', excludeOwnBuilding: true},
  {key: 'ish-urt', kind: 'landmark', city: 'durres', re: /\bish[- ]urt\b/, anchor: 'ish-urt'},
  {key: 'gjykata', kind: 'landmark', city: 'durres', re: /\bgjykat/, osm: 'Gjykata', anchor: 'gjykata', excludeOwnBuilding: true},
  {key: 'amfiteatri', kind: 'landmark', city: 'durres', re: /\bamfiteat|\bamphitheat|амфитеатр/, osm: 'Amfiteat', q: 'Amfiteatri i Durrësit', excludeOwnBuilding: true},
  {key: 'kulla-veneciane', kind: 'landmark', city: 'durres', re: /\bvenetian tower\b|kulla veneciane/, osm: 'Kulla Venedikase|Venetian Tower|Kulla Veneciane', q: 'Kulla Venedikase Durrës'},
  {key: 'galaktik', kind: 'landmark', city: 'durres', re: /\bgalaktik\b/, osm: 'Galaktik', anchor: 'galaktik', excludeOwnBuilding: true},
  {key: 'vlora-marina', kind: 'landmark', city: 'vlore', re: /\bvlora marina\b/, osm: 'Vlora Marina', q: 'Vlora Marina', excludeOwnBuilding: true},
  // hotels, cafés, shops the partner names as "near X" / "opposite X"
  {key: 'hotel-florida', kind: 'landmark', re: /\bflorida\b/, osm: 'Florida', q: 'Hotel Florida', excludeOwnBuilding: true},
  {key: 'hotel-wilson', kind: 'landmark', re: /\bwilson\b/, osm: 'Wilson', need: /tourism=|building=hotel/, q: 'Hotel Wilson', excludeOwnBuilding: true},
  {key: 'pelikan', kind: 'landmark', re: /\bpelic?kan\b|\bpelican\b/, osm: '^Pelikan$|^Pelican$', q: 'Pelikan', excludeOwnBuilding: true},
  {key: 'hotel-iliada', kind: 'landmark', re: /\biliada\b/, osm: 'Iliada', q: 'Hotel Iliada', excludeOwnBuilding: true},
  {key: 'hotel-koral', kind: 'landmark', re: /\bkoral\b/, osm: 'Koral', q: 'Hotel Koral', excludeOwnBuilding: true},
  {key: 'hotel-antalya', kind: 'landmark', re: /\bantalya\b/, osm: '^Antalya', q: 'Hotel Antalya', anchor: 'antalya-plazh', excludeOwnBuilding: true},
  {key: 'hotel-kamelia', kind: 'landmark', re: /\bkamelia\b/, osm: 'Kamelia', q: 'Kamelia', excludeOwnBuilding: true},
  {key: 'hotel-flower', kind: 'landmark', re: /\bhotel(it)? flower\b|\bflower hotel\b/, osm: 'Hotel Flower|Flower Hotel', q: 'Hotel Flower', excludeOwnBuilding: true},
  {key: 'hotel-miki', kind: 'landmark', re: /\bmiki\b/, osm: '^(Hotel )?Miki', q: 'Hotel Miki', excludeOwnBuilding: true},
  {key: 'hotel-president', kind: 'landmark', re: /\bpresident hotel\b|\bhotel(it)? president\b/, osm: 'President', q: 'Hotel President', excludeOwnBuilding: true},
  {key: 'hotel-miami', kind: 'landmark', re: /\bmaimi\b|\bmiami\b/, osm: 'Miami|Maimi', q: 'Hotel Miami', excludeOwnBuilding: true},
  {key: 'hotel-horizont', kind: 'landmark', re: /\bhotel(it)? horizont\b|\bhorizont hotel\b/, osm: 'Hotel Horizont|Horizont Hotel', q: 'Hotel Horizont', excludeOwnBuilding: true},
  {key: 'hotel-bonita', kind: 'landmark', re: /\bbonita\b/, osm: 'Bonita', q: 'Bonita Luxury Hotel', excludeOwnBuilding: true},
  {key: 'hotel-martiness', kind: 'landmark', re: /\bmartiness\b/, osm: 'Martiness', q: 'Hotel Martiness', excludeOwnBuilding: true},
  {key: 'villa-one', kind: 'landmark', re: /\bvilla one\b/, osm: 'Villa One', q: 'Villa One', excludeOwnBuilding: true},
  {key: 'vila-doka', kind: 'landmark', re: /\b(vila|villa) doka\b|\bdoka\b/, osm: 'Doka', q: 'Doka', excludeOwnBuilding: true},
  {key: 'melia', kind: 'landmark', re: /\bmelia\b/, osm: 'Meli[aá]', q: 'Meliá Durrës', excludeOwnBuilding: true},
  {key: 'murrizi', kind: 'neighbourhood', re: /\bmurrizi\b/, osm: '^Murrizi', q: 'Murrizi', anchor: 'murrizi-qerret'},

  // ---------- (c') neighbourhood labels finer than the district ----------
  {key: 'plazh-iliria', kind: 'neighbourhood', city: 'durres', re: /\b(plazh(i)? )?iliria\b|илирия|illyria beach/, osm: '^(Plazh(i)? )?Iliria$', anchor: 'plazh-iliria'},
  {key: 'plazh-hekurudha', kind: 'neighbourhood', city: 'durres', re: /\bhekurudh/, anchor: 'plazh-hekurudha'},
  {key: 'sektori-rinia', kind: 'neighbourhood', city: 'durres', re: /\bsektori (i )?rini/, osm: '^Rinia$', anchor: 'sektori-rinia'},
  {key: 'ish-keneta', kind: 'neighbourhood', city: 'durres', re: /\bkenet(a|e|es)\b/, osm: 'K[eë]net', anchor: 'ish-keneta'},
  {key: 'vollga', kind: 'neighbourhood', city: 'durres', re: /\bv(o)?ollga\b|\bvolga\b|волга/, osm: 'Vollga', anchor: 'vollga'},
  {key: 'kodra-e-kuajve', kind: 'neighbourhood', city: 'durres', re: /\bkodra e kuajve\b/, osm: 'Kodra e Kuajve', anchor: 'shkembi-kavajes'},
  {key: 'tilaj', kind: 'neighbourhood', city: 'durres', re: /\btilaj\b/, osm: '^Tilaj', anchor: 'tilaj-golem'},
  {key: 'rreth-greth', kind: 'neighbourhood', city: 'durres', re: /\brreth[- ]?greth\b|\bgreth\b/, osm: 'Greth', anchor: 'rreth-greth'},
  {key: 'vile-bashtove', kind: 'neighbourhood', city: 'durres', re: /\bbashtove\b/, osm: 'Bashtov', anchor: 'vile-bashtove'},
  {key: 'kepi-i-rodonit', kind: 'neighbourhood', city: 'durres', re: /\brodonit\b/, osm: 'Rodon', anchor: 'kepi-i-rodonit'},
  {key: 'nish-tulla', kind: 'neighbourhood', city: 'durres', re: /\bnish ?tulla\b/, anchor: 'nish-tulla'},
  {key: 'lagjia-e-re', kind: 'neighbourhood', re: /\blagj(j)?(a|ia|en) e re\b/},
  {key: 'zero-zero', kind: 'neighbourhood', city: 'sarande', re: /\bzero zero\b/, osm: 'Zero Zero'},
  {key: 'hyrja-durresit', kind: 'neighbourhood', city: 'durres', re: /\bhyrj(a|e) (e |te )?durresit\b/, anchor: 'hyrja-e-durresit'},
]

/** Words that end up next to "Residence/Complex/Rruga" but are not names. */
const STOP = new Set(
  'the a an this new modern small residential luxury private gated large big our in at on near of with and or durres durrës golem plazh qerret tirana vlore sarande e i te të kryesore kryesor dytesore dytësore bregdetare plazhit shkembi shkëmbi qytetit asfaltuar is me ne në nr një nje die der das neubau residence rezidenca complex kompleks kompleksi tower kulla pallati është eshte only vetëm vetem swimming security layout planimetria shitet apartament квартира'.split(' '),
)

/** Named complex / street mentions the gazetteer does not cover — counted, not geocoded. */
function genericMentions(raw: string): {complex: string[]; street: string[]} {
  const complex = new Set<string>()
  const street = new Set<string>()
  for (const m of raw.matchAll(/\b([A-ZÇË][\p{L}-]{2,}(?: [A-ZÇË][\p{L}-]{2,})?) (Residence|Rezidenca|Complex|Tower|Resort)\b/gu)) {
    if (!STOP.has(m[1].toLowerCase()) && !m[1].split(' ').some((w) => STOP.has(w.toLowerCase()))) complex.add(m[1])
  }
  for (const m of raw.matchAll(/\b(?:Rezidenca|Kompleksi|Residence|Complex|ЖК|комплекс)\s+["“«]?([A-ZÇËА-Я][\p{L}-]{2,}(?: [A-ZÇË][\p{L}-]{2,})?)/gu)) {
    if (!STOP.has(m[1].toLowerCase()) && !m[1].split(' ').some((w) => STOP.has(w.toLowerCase()))) complex.add(m[1])
  }
  for (const m of raw.matchAll(/\b(?:Rruga|Rr\.|Rrugës|Bulevardi|Blv\.?|Lagjja|Lagja|Lagjia)\s+(?:e\s+|nr\.?\s*)?["“]?([A-ZÇË0-9][\p{L}0-9-]*(?: [A-ZÇË][\p{L}-]+){0,2})/gu)) {
    const w = m[1].split(' ')[0].toLowerCase()
    if (!STOP.has(w)) street.add(m[0].replace(/\s+/g, ' '))
  }
  return {complex: [...complex], street: [...street]}
}

/* ====================================================================== */
/* network: Overpass + Nominatim with a shared disk cache                 */
/* ====================================================================== */

let cache: Record<string, unknown> = fs.existsSync(CACHE_FILE) ? JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')) : {}
let dirty = 0
function saveCache() {
  if (!dirty) return
  fs.mkdirSync(GEO, {recursive: true})
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache))
  dirty = 0
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
let lastOverpass = 0
let lastNominatim = 0
let networkCalls = 0

type OsmEl = {type: string; id: number; lat?: number; lon?: number; center?: {lat: number; lon: number}; tags?: Record<string, string>; geometry?: Array<{lat: number; lon: number}>}

async function overpass(query: string): Promise<OsmEl[] | null> {
  const key = `ovp:${query}`
  if (key in cache) return cache[key] as OsmEl[]
  if (cacheOnly) return null
  for (let attempt = 0; attempt < 5; attempt++) {
    const wait = 2000 - (Date.now() - lastOverpass)
    if (wait > 0) await sleep(wait)
    lastOverpass = Date.now()
    networkCalls++
    try {
      const res = await fetch(OVERPASS, {
        method: 'POST',
        headers: {'User-Agent': USER_AGENT, 'Content-Type': 'application/x-www-form-urlencoded'},
        body: `data=${encodeURIComponent(query)}`,
      })
      if (res.status === 429 || res.status === 504 || res.status === 503) {
        await sleep(10_000 * (attempt + 1))
        continue
      }
      if (!res.ok) throw new Error(`overpass HTTP ${res.status}`)
      const json = (await res.json()) as {elements: OsmEl[]}
      cache[key] = json.elements
      dirty++
      if (dirty > 10) saveCache()
      return json.elements
    } catch (err) {
      if (attempt === 4) throw err
      await sleep(5000 * (attempt + 1))
    }
  }
  return null
}

type NomHit = {lat: string; lon: string; display_name: string; category?: string; type?: string; osm_type?: string; osm_id?: number; name?: string}

async function nominatim(url: string): Promise<unknown> {
  const key = `nom:${url}`
  if (key in cache) return cache[key]
  if (cacheOnly) return null
  const wait = 1100 - (Date.now() - lastNominatim)
  if (wait > 0) await sleep(wait)
  lastNominatim = Date.now()
  networkCalls++
  const res = await fetch(url, {headers: {'User-Agent': USER_AGENT, 'Accept-Language': 'sq,en'}})
  if (!res.ok) throw new Error(`nominatim HTTP ${res.status}`)
  const json = await res.json()
  cache[key] = json
  dirty++
  if (dirty > 10) saveCache()
  return json
}

async function nominatimSearch(q: string, box: Box): Promise<NomHit[]> {
  const vb = `${box.w.toFixed(4)},${box.n.toFixed(4)},${box.e.toFixed(4)},${box.s.toFixed(4)}`
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=jsonv2&limit=10&countrycodes=al&viewbox=${vb}&bounded=1`
  return ((await nominatim(url)) as NomHit[] | null) ?? []
}

async function nominatimReverse(lat: number, lng: number): Promise<string> {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat.toFixed(6)}&lon=${lng.toFixed(6)}&format=jsonv2&zoom=18`
  const j = (await nominatim(url)) as {display_name?: string} | null
  return j?.display_name ?? ''
}

/* ====================================================================== */
/* tile layers beyond geoTiles: beach sand, parks, roads                  */
/* ====================================================================== */

type Surface = {sand: Polygon[]; green: Polygon[]; roads: number[][][]}
const surfaceCache = new Map<string, Surface>()

async function surfaceTile(x: number, y: number): Promise<Surface> {
  const key = `${x}/${y}`
  const hit = surfaceCache.get(key)
  if (hit) return hit
  const out: Surface = {sand: [], green: [], roads: []}
  const bytes = await tileBytes(x, y, 14)
  if (bytes) {
    const vt = new VectorTile(new Pbf(bytes))
    const polys = (layer: string, keep: (p: Record<string, unknown>) => boolean, into: Polygon[]) => {
      const l = vt.layers[layer]
      if (!l) return
      for (let i = 0; i < l.length; i++) {
        const f = l.feature(i)
        if (!keep(f.properties)) continue
        const g = f.toGeoJSON(x, y, 14).geometry
        if (g.type === 'Polygon') into.push(g.coordinates)
        else if (g.type === 'MultiPolygon') into.push(...g.coordinates)
      }
    }
    polys('landcover', (p) => p.class === 'sand' || p.subclass === 'beach', out.sand)
    polys('landcover', (p) => ['grass', 'wood', 'farmland', 'wetland'].includes(String(p.class)), out.green)
    polys('park', () => true, out.green)
    polys('landuse', (p) => ['park', 'pitch', 'playground', 'cemetery', 'grass'].includes(String(p.class)), out.green)
    const t = vt.layers.transportation
    if (t) {
      for (let i = 0; i < t.length; i++) {
        const f = t.feature(i)
        if (!['motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'minor', 'service'].includes(String(f.properties.class))) continue
        const g = f.toGeoJSON(x, y, 14).geometry
        if (g.type === 'LineString') out.roads.push(g.coordinates)
        else if (g.type === 'MultiLineString') out.roads.push(...g.coordinates)
      }
    }
  }
  surfaceCache.set(key, out)
  return out
}

function distToLineM(line: number[][], lat: number, lng: number): number {
  const k = Math.cos((lat * Math.PI) / 180)
  let best = Infinity
  for (let i = 1; i < line.length; i++) {
    const ax = (line[i - 1][0] - lng) * M * k, ay = (line[i - 1][1] - lat) * M
    const bx = (line[i][0] - lng) * M * k, by = (line[i][1] - lat) * M
    const dx = bx - ax, dy = by - ay
    const l2 = dx * dx + dy * dy
    const t = l2 ? Math.max(0, Math.min(1, (-ax * dx - ay * dy) / l2)) : 0
    best = Math.min(best, Math.hypot(ax + t * dx, ay + t * dy))
  }
  return best
}

/** What an off-building pin actually sits on. */
async function surfaceAt(lat: number, lng: number): Promise<string> {
  if (await waterAt(lat, lng)) return 'water'
  const {x, y} = tileOf(lat, lng)
  const s = await surfaceTile(x, y)
  if (s.sand.some((p) => polygonContains(p, lng, lat))) return 'beach/sand'
  if (s.roads.some((l) => distToLineM(l, lat, lng) <= 6)) return 'road'
  if (s.green.some((p) => polygonContains(p, lng, lat))) return 'park/green/field'
  return 'yard/open ground'
}

/* ====================================================================== */
/* buildings                                                              */
/* ====================================================================== */

function polyAreaM2(poly: Polygon): number {
  const ring = poly[0]
  if (!ring?.length) return 0
  const lat0 = ring[0][1]
  const k = Math.cos((lat0 * Math.PI) / 180)
  let a = 0
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    a += (ring[j][0] * k * M) * (ring[i][1] * M) - (ring[i][0] * k * M) * (ring[j][1] * M)
  }
  return Math.abs(a / 2)
}

type Bldg = {poly: Polygon; c: {lat: number; lng: number}; area: number; distance: number}

/** Footprints within r of a point that could be homes (50–2500 m²), nearest first, de-duplicated across tile seams. */
async function homesNear(lat: number, lng: number, r: number): Promise<Bldg[]> {
  const seen = new Set<string>()
  const out: Bldg[] = []
  for (const b of await buildingsNear(lat, lng, r)) {
    const area = polyAreaM2(b.poly)
    if (area < 50 || area > 2500) continue
    const c = centroid(b.poly)
    const k = `${c.lat.toFixed(4)},${c.lng.toFixed(4)}`
    if (seen.has(k)) continue
    seen.add(k)
    out.push({poly: b.poly, c, area, distance: b.distance})
  }
  return out
}

/** A point the map will highlight as that building: its centroid if inside, else the nearest interior point. */
function pointIn(b: Bldg): {lat: number; lng: number} {
  if (polygonContains(b.poly, b.c.lng, b.c.lat)) return {lat: +b.c.lat.toFixed(6), lng: +b.c.lng.toFixed(6)}
  const p = nearestInteriorPoint(b.poly, b.c.lat, b.c.lng, 1)
  return p ? {lat: p.lat, lng: p.lng} : {lat: +b.c.lat.toFixed(6), lng: +b.c.lng.toFixed(6)}
}

/* ====================================================================== */
/* data                                                                   */
/* ====================================================================== */

type Loc = Record<string, string | undefined>
type Row = {
  _id: string
  slug?: string
  isPublished?: boolean
  lat: number
  lng: number
  precision?: string
  city?: string
  district?: string
  address?: Loc
  title?: Loc
  description?: Loc
  agent?: string
}

function sourceOf(id: string): string {
  const m = id.match(/^property-(cactus|getal|findall|tg)-/)
  return m ? m[1] : 'own'
}

function loadPartnerText(): Map<string, string> {
  const out = new Map<string, string>()
  const getal = path.join(WORKSPACE, 'getal', 'getal-listings.json')
  if (fs.existsSync(getal)) {
    for (const r of JSON.parse(fs.readFileSync(getal, 'utf8')) as Array<Record<string, string>>) {
      out.set(`property-getal-${r.id}`, [r.districtLabel, r.title, r.descriptionText].filter(Boolean).join('\n'))
    }
  }
  for (const f of ['findall-sale.json', 'findall-rent.json']) {
    const p = path.join(WORKSPACE, 'findall', f)
    if (!fs.existsSync(p)) continue
    for (const r of JSON.parse(fs.readFileSync(p, 'utf8')) as Array<Record<string, string>>) {
      out.set(`property-findall-${r.id}`, [r.address, r.title, r.descriptionText].filter(Boolean).join('\n'))
    }
  }
  if (fs.existsSync(CACTUS_SOURCE)) {
    const j = JSON.parse(fs.readFileSync(CACTUS_SOURCE, 'utf8')) as {result: Array<Record<string, string>>}
    for (const r of j.result) {
      out.set(`property-cactus-${r._id}`, [r.titleEnglish, r.titleRussian, r.descriptionEnglish, r.descriptionRussian].filter(Boolean).join('\n'))
    }
  }
  return out
}

async function ensureCactusSource() {
  if (fs.existsSync(CACTUS_SOURCE) || cacheOnly) return
  const url = `https://e3a1f8cg.apicdn.sanity.io/v2024-01-08/data/query/production?query=${encodeURIComponent('*[_type=="property"]{_id,titleEnglish,titleRussian,descriptionEnglish,descriptionRussian,locationGmapsLink}')}`
  const res = await fetch(url, {headers: {'User-Agent': USER_AGENT}})
  fs.mkdirSync(path.dirname(CACTUS_SOURCE), {recursive: true})
  fs.writeFileSync(CACTUS_SOURCE, await res.text())
}

const LOCALES = ['en', 'sq', 'ru', 'uk', 'it', 'pl', 'de']
function siteText(r: Row): string {
  return [r.address?.sq, r.address?.en, ...LOCALES.map((l) => r.title?.[l]), ...LOCALES.map((l) => r.description?.[l])].filter(Boolean).join('\n')
}

/* ====================================================================== */
/* geocoding a gazetteer entry                                            */
/* ====================================================================== */

type Cand = {lat: number; lng: number; name: string; tags: string; osm: string; polygon: boolean; via: string}

const KIND_OK: Record<Kind, (t: Record<string, string>) => boolean> = {
  complex: (t) => !t.highway && !t.public_transport && !t.railway && !t.amenity?.match(/^(cafe|bar|restaurant|fast_food)$/) && !t.shop?.match(/^(convenience|supermarket|bakery|pastry|confectionery)$/),
  street: (t) => !!t.highway,
  quarter: (t) => !!(t.place || t.boundary || t.landuse === 'residential'),
  landmark: (t) => !t.highway || t.highway === 'bus_stop',
  neighbourhood: (t) => !!(t.place || t.landuse || t.boundary || t.natural === 'beach' || t.leisure),
}

const placeCache = new Map<string, {cands: Cand[]; lines: Array<{name: string; pts: Array<{lat: number; lng: number}>}>}>()

async function osmCandidates(g: Gaz, city: string): Promise<{cands: Cand[]; lines: Array<{name: string; pts: Array<{lat: number; lng: number}>}>}> {
  const key = `${g.key}@${city}`
  const hit = placeCache.get(key)
  if (hit) return hit
  const box = CITY_BOX[city]
  const cands: Cand[] = []
  const lines: Array<{name: string; pts: Array<{lat: number; lng: number}>}> = []
  if (box && g.osm) {
    const linear = g.kind === 'street'
    const q = linear
      ? `[out:json][timeout:60];way["highway"]["name"~"${g.osm}",i](${bboxStr(box)});out geom tags;`
      : `[out:json][timeout:60];nwr["name"~"${g.osm}",i](${bboxStr(box)});out center tags;`
    const els = (await overpass(q)) ?? []
    for (const e of els) {
      const t = e.tags ?? {}
      if (!KIND_OK[g.kind](t)) continue
      if (g.need && !g.need.test(Object.entries(t).map(([k, v]) => `${k}=${v}`).join(','))) continue
      if (linear && e.geometry) {
        lines.push({name: t.name ?? '', pts: e.geometry.map((p) => ({lat: p.lat, lng: p.lon}))})
        continue
      }
      const c = e.center ?? (e.lat != null ? {lat: e.lat, lon: e.lon!} : null)
      if (!c) continue
      const tagStr = Object.entries(t).filter(([k]) => /^(building|landuse|tourism|amenity|shop|leisure|place|natural|highway|healthcare|office)$/.test(k)).map(([k, v]) => `${k}=${v}`).join(',')
      cands.push({lat: c.lat, lng: c.lon, name: t.name ?? '', tags: tagStr, osm: `${e.type}/${e.id}`, polygon: e.type !== 'node', via: 'overpass'})
    }
  }
  if (box && g.q && g.kind !== 'street') {
    for (const h of await nominatimSearch(`${g.q}, ${CITY_NAME[city] ?? city}`, box)) {
      const lat = Number(h.lat), lng = Number(h.lon)
      if (cands.some((c) => distanceM(c, {lat, lng}) < 30)) continue
      const tags = `${h.category}=${h.type}`
      if (g.kind === 'complex' && /^(highway|railway|public_transport)=/.test(tags)) continue
      if (h.category === 'highway' && g.kind !== 'landmark') continue
      // Nominatim answers a name it does not know with the nearest matching word (a street, a town); keep only hits whose name carries the query's first word.
      const first = norm(g.q.split(' ').find((w) => !/^(hotel|shkolla|rezidenca|residence)$/i.test(w)) ?? g.q)
      if (!norm(h.name || h.display_name.split(',')[0]).includes(first.slice(0, 5))) continue
      cands.push({lat, lng, name: h.display_name.split(',')[0], tags, osm: `${h.osm_type}/${h.osm_id}`, polygon: h.osm_type !== 'node', via: 'nominatim'})
    }
  }
  const out = {cands, lines}
  placeCache.set(key, out)
  return out
}

type Match = {
  key: string
  kind: Kind
  point: {lat: number; lng: number}
  radiusM: number
  precision: 'exact' | 'street' | 'area'
  source: string
  matchedName: string
  osm?: string
  confidence: 'high' | 'medium' | 'low'
  note?: string
}
type Reject = {key: string; reason: string}

function spread(pts: Array<{lat: number; lng: number}>): number {
  let s = 0
  for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) s = Math.max(s, distanceM(pts[i], pts[j]))
  return s
}

const anchorByKey = new Map(anchorFile.anchors.map((a) => [a.key, a]))

/** Exact sibling pins per complex key: Cactus Google Maps links of listings naming the same complex. */
const siblings = new Map<string, Array<{id: string; lat: number; lng: number}>>()

type Base =
  | Reject
  | {tmpl: Omit<Match, 'point' | 'note'>; fixed?: {lat: number; lng: number}; note?: string; pool?: Bldg[]; at?: {lat: number; lng: number}}
const baseCache = new Map<string, Base>()

/** Resolve a named place once per (place, city, district box); listings then pick from the result. */
async function resolve(g: Gaz, row: Row, dbox: Box | null, seed: string): Promise<Match | Reject> {
  const city = g.city ?? row.city ?? 'durres'
  if (g.city && row.city && g.city !== row.city) return {key: g.key, reason: `named place belongs to ${g.city}, listing is in ${row.city}`}
  const box = dbox ?? CITY_BOX[city]
  if (!box) return {key: g.key, reason: 'no district/city box'}
  const memo = `${g.key}|${city}|${bboxStr(box)}`
  let base = baseCache.get(memo)
  if (!base) {
    base = await resolveBase(g, city, box)
    baseCache.set(memo, base)
  }
  if ('reason' in base) return base
  if (base.fixed) return {...base.tmpl, point: base.fixed, note: base.note}
  const pool = base.pool!
  const pick = pool[hash(seed) % pool.length]
  const note = base.at ? `building ${Math.round(distanceM(base.at, pick.c))} m from the place, one of ${pool.length} nearest` : `one of ${pool.length} buildings along the street`
  return {...base.tmpl, point: pointIn(pick), note}
}

async function resolveBase(g: Gaz, city: string, box: Box): Promise<Base> {
  const within = (p: {lat: number; lng: number}) => inBox(box, p.lat, p.lng)

  /* ---- streets ---- */
  if (g.kind === 'street') {
    const {lines} = await osmCandidates(g, city)
    const inside = lines.filter((l) => l.pts.some(within))
    if (!inside.length) return {key: g.key, reason: lines.length ? `street found in OSM but outside the listing's district (${lines.length} way(s))` : 'street not in OSM'}
    const names = new Set(inside.map((l) => norm(l.name)))
    const pts = inside.flatMap((l) => l.pts.filter(within))
    if (names.size > 1 || spread(pts) > 4000) return {key: g.key, reason: `ambiguous street: ${[...names].join(' / ')}`}
    // buildings along the street: sample every ~25 m
    const homes = new Map<string, Bldg>()
    for (const l of inside) {
      for (let i = 0; i < l.pts.length; i++) {
        const a = l.pts[i]
        const b = l.pts[i + 1] ?? a
        const steps = Math.max(1, Math.ceil(distanceM(a, b) / 25))
        for (let s = 0; s < steps; s++) {
          const p = {lat: a.lat + ((b.lat - a.lat) * s) / steps, lng: a.lng + ((b.lng - a.lng) * s) / steps}
          if (!within(p)) continue
          for (const h of await homesNear(p.lat, p.lng, 30)) homes.set(`${h.c.lat.toFixed(5)},${h.c.lng.toFixed(5)}`, h)
        }
      }
    }
    const list = [...homes.values()].sort((a, b) => a.c.lat - b.c.lat || a.c.lng - b.c.lng)
    if (!list.length) return {key: g.key, reason: 'street has no building footprints along it in OSM'}
    return {tmpl: {key: g.key, kind: g.kind, radiusM: Math.round(spread(pts) / 2), precision: 'street', source: 'osm street geometry + building along it', matchedName: inside[0].name, confidence: 'medium'}, pool: list}
  }

  /* ---- point places ---- */
  const {cands} = await osmCandidates(g, city)
  let inside = cands.filter(within)
  let source = ''
  let confidence: Match['confidence'] = 'medium'
  let chosen: Cand | null = null

  if (g.kind === 'complex') {
    const sib = (siblings.get(g.key) ?? []).filter(within)
    const named = inside.filter((c) => c.polygon && /building|landuse|tourism=apartment/.test(c.tags))
    if (named.length && spread(named) <= 250) {
      chosen = named[0]
      source = `osm ${named[0].osm} (${named[0].tags})`
      confidence = 'high'
    } else if (sib.length >= 2 && spread(sib) <= 120) {
      const med = {lat: median(sib.map((s) => s.lat)), lng: median(sib.map((s) => s.lng))}
      chosen = {...med, name: g.key, tags: '', osm: '', polygon: false, via: 'siblings'}
      source = `${sib.length} sibling listings with Google Maps pins (Cactus), ${Math.round(spread(sib))} m spread`
      confidence = 'high'
    } else if (inside.length && spread(inside) <= 250) {
      chosen = inside.find((c) => c.polygon) ?? inside[0]
      source = `${chosen.via} ${chosen.osm} (${chosen.tags})`
      confidence = 'medium'
    } else if (sib.length === 1) {
      chosen = {...sib[0], name: g.key, tags: '', osm: '', polygon: false, via: 'siblings'}
      source = 'one sibling listing with a Google Maps pin (Cactus)'
      confidence = 'medium'
    } else if (inside.length) {
      return {key: g.key, reason: `ambiguous: ${inside.length} OSM candidates ${Math.round(spread(inside))} m apart`}
    }
  } else {
    if (g.kind === 'quarter' || g.kind === 'neighbourhood') inside = inside.filter((c) => /place=|landuse=residential|boundary=/.test(c.tags))
    if (inside.length && spread(inside) <= (g.kind === 'landmark' ? 300 : 600)) {
      chosen = inside.find((c) => c.polygon && /building|amenity|tourism|leisure|place|healthcare/.test(c.tags)) ?? inside[0]
      source = `${chosen.via} ${chosen.osm} (${chosen.tags})`
      confidence = 'medium'
    } else if (inside.length) {
      return {key: g.key, reason: `ambiguous: ${inside.length} OSM candidates ${Math.round(spread(inside))} m apart`}
    }
  }

  if (!chosen && g.anchor) {
    const a = anchorByKey.get(g.anchor)
    if (a && within(a)) {
      chosen = {lat: a.lat, lng: a.lng, name: a.key, tags: '', osm: '', polygon: false, via: 'anchor'}
      source = /^(Google Maps place|OSM)/.test(a.source) ? `geo-anchors.json ${a.key} (${a.source.slice(0, 60)})` : `geo-anchors.json ${a.key} (hand-placed: ${a.source.slice(0, 50)})`
      confidence = 'low'
    }
  }
  if (!chosen) return {key: g.key, reason: cands.length ? `found in OSM only outside the listing's district (${cands.length})` : 'not in OSM'}

  const at = {lat: chosen.lat, lng: chosen.lng}

  if (g.kind === 'complex') {
    // The complex itself: snap into its footprint when one is there (≤ 15 m), else keep the point (new builds OSM has not traced).
    const own = await buildingAt(at.lat, at.lng)
    let point = {lat: +at.lat.toFixed(6), lng: +at.lng.toFixed(6)}
    let note = own ? 'on the complex footprint' : ''
    if (!own) {
      const near = (await homesNear(at.lat, at.lng, 15))[0] ?? (await buildingsNear(at.lat, at.lng, 15)).map((b) => ({poly: b.poly, c: centroid(b.poly), area: polyAreaM2(b.poly), distance: b.distance}))[0]
      if (near) {
        point = pointIn(near)
        note = `snapped ${Math.round(near.distance)} m into the nearest footprint`
      } else note = 'no OSM footprint within 15 m (new build?) — point kept'
    }
    const precision = confidence === 'low' ? 'area' : 'exact'
    return {tmpl: {key: g.key, kind: g.kind, radiusM: precision === 'exact' ? 0 : (anchorByKey.get(g.anchor ?? '')?.radius ?? 250), precision, source, matchedName: chosen.name, osm: chosen.osm, confidence}, fixed: point, note}
  }

  // landmark / neighbourhood / quarter: a home within ~250 m (neighbourhood: the anchor's radius, ≤ 400 m)
  const radius = g.kind === 'landmark' ? 250 : Math.min(400, anchorByKey.get(g.anchor ?? '')?.radius ?? 400)
  let homes = (await homesNear(at.lat, at.lng, radius)).filter((h) => within(h.c))
  if (g.excludeOwnBuilding) homes = homes.filter((h) => !polygonContains(h.poly, at.lng, at.lat) && h.distance > 0)
  if (!homes.length) return {key: g.key, reason: `no building footprints within ${radius} m of ${chosen.name}`}
  return {
    tmpl: {key: g.key, kind: g.kind, radiusM: radius, precision: 'area', source, matchedName: chosen.name, osm: chosen.osm, confidence: g.kind === 'neighbourhood' || g.kind === 'quarter' ? 'low' : confidence},
    pool: homes.slice(0, 20),
    at,
  }
}

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b)
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2
}

/* ====================================================================== */
/* main                                                                   */
/* ====================================================================== */

type Ev = {key: string; kind: Kind; from: 'partner' | 'site'}
const CLASS_OF: Record<Kind, 'a-complex' | 'b-street' | 'c-landmark'> = {complex: 'a-complex', street: 'b-street', quarter: 'b-street', landmark: 'c-landmark', neighbourhood: 'c-landmark'}
const KIND_RANK: Record<Kind, number> = {complex: 0, street: 1, quarter: 2, landmark: 3, neighbourhood: 4}

async function main() {
  await ensureCactusSource()
  const client = getSanityClientForScripts()
  const all = await client.fetch<Row[]>(`*[_type == "property" && !(_id in path("drafts.**")) && defined(coordinatesLat)]{
    _id, "slug": slug.current, isPublished, "lat": coordinatesLat, "lng": coordinatesLng, "precision": locationPrecision,
    "city": city->slug.current, "district": district->slug.current, address, title, description, "agent": agent->slug.current
  } | order(_id asc)`)
  const partner = loadPartnerText()
  console.log(`${all.length} listings with coordinates; partner source text for ${partner.size}.`)

  /* ---------- evidence for every listing (exact ones too, for siblings) ---------- */
  const evidence = new Map<string, {hits: Ev[]; generic: {complex: string[]; street: string[]}; textKey: string}>()
  for (const r of all) {
    const p = partner.get(r._id) ?? ''
    const s = siteText(r)
    const pn = norm(p)
    const sn = norm(s)
    const hits: Ev[] = []
    for (const g of GAZ) {
      if (pn && g.re.test(pn)) hits.push({key: g.key, kind: g.kind, from: 'partner'})
      else if (g.re.test(sn)) hits.push({key: g.key, kind: g.kind, from: 'site'})
    }
    hits.sort((a, b) => KIND_RANK[a.kind] - KIND_RANK[b.kind] || (a.from === 'partner' ? -1 : 1) - (b.from === 'partner' ? -1 : 1))
    const generic = genericMentions(p || s)
    // identical listing text: same building, several units (partner text if any, else English description)
    const basis = norm(p || r.description?.en || r.description?.sq || '').replace(/[^\p{L}\p{N} ]/gu, '').replace(/\b\d+([.,]\d+)?\b/g, '#').slice(0, 400)
    evidence.set(r._id, {hits, generic, textKey: basis.length > 80 ? String(hash(basis)) : ''})
  }

  // sibling exact pins per complex
  for (const r of all) {
    if (r.precision !== 'exact') continue
    for (const h of evidence.get(r._id)!.hits) if (h.kind === 'complex') {
      if (!siblings.has(h.key)) siblings.set(h.key, [])
      siblings.get(h.key)!.push({id: r._id, lat: r.lat, lng: r.lng})
    }
  }

  const rows = all.filter((r) => r.precision !== 'exact')
  // text-duplicate groups (computed over approximate listings)
  const textGroups = new Map<string, string[]>()
  for (const r of rows) {
    const k = evidence.get(r._id)!.textKey
    if (!k) continue
    if (!textGroups.has(k)) textGroups.set(k, [])
    textGroups.get(k)!.push(r._id)
  }

  /* ---------- resolve ---------- */
  type PlanRow = {
    id: string
    source: string
    city: string | null
    district: string | null
    published: boolean
    current: {lat: number; lng: number; precision: string; onBuilding: boolean; surface: string | null}
    evidenceClass: 'a-complex' | 'b-street' | 'c-landmark' | 'd-district' | 'e-none'
    evidence: Ev[]
    genericMentions: {complex: string[]; street: string[]}
    sameTextGroup: number
    proposed: {lat: number; lng: number; precision: 'exact' | 'street' | 'area' | 'district'; radiusM: number}
    match: {key: string; source: string; name: string; osm?: string; note?: string; display?: string} | null
    confidence: 'high' | 'medium' | 'low'
    rejected: Reject[]
  }
  const plan: PlanRow[] = []
  const boxes = new Map<string, Box | null>()
  let i = 0
  for (const r of rows) {
    i++
    const ev = evidence.get(r._id)!
    const dkey = r.district ?? ''
    if (!boxes.has(dkey)) boxes.set(dkey, r.district ? districtBox(r.district) : null)
    const dbox = boxes.get(dkey)!
    const group = textGroups.get(ev.textKey)
    const seed = group && group.length > 1 ? `text:${ev.textKey}` : r._id
    const rejected: Reject[] = []
    let match: Match | null = null
    for (const h of ev.hits) {
      const g = GAZ.find((x) => x.key === h.key)!
      const res = await resolve(g, r, dbox, seed)
      if ('reason' in res) {
        rejected.push(res)
        continue
      }
      match = res
      if (h.from === 'site' && match.confidence !== 'low') match.confidence = match.confidence === 'high' ? 'medium' : 'low'
      break
    }
    const onBuilding = (await buildingsNear(r.lat, r.lng, 25)).length > 0
    const surface = onBuilding ? null : await surfaceAt(r.lat, r.lng)
    const cls: PlanRow['evidenceClass'] = ev.hits.length ? CLASS_OF[ev.hits[0].kind] : ev.generic.complex.length ? 'a-complex' : ev.generic.street.length ? 'b-street' : r.district ? 'd-district' : 'e-none'
    plan.push({
      id: r._id,
      source: sourceOf(r._id),
      city: r.city ?? null,
      district: r.district ?? null,
      published: !!r.isPublished,
      current: {lat: r.lat, lng: r.lng, precision: r.precision ?? '', onBuilding, surface},
      evidenceClass: cls,
      evidence: ev.hits,
      genericMentions: ev.generic,
      sameTextGroup: group?.length ?? 1,
      proposed: match
        ? {...match.point, precision: match.precision, radiusM: match.radiusM}
        : {lat: NaN, lng: NaN, precision: 'district', radiusM: 0},
      match: match ? {key: match.key, source: match.source, name: match.matchedName, osm: match.osm, note: match.note} : null,
      confidence: match ? match.confidence : 'high',
      rejected,
    })
    if (i % 50 === 0) {
      saveCache()
      console.log(`  …${i}/${rows.length} (network calls ${networkCalls})`)
    }
  }
  saveCache()

  /* ---------- district bubbles ---------- */
  const bubbles: Record<string, {lat: number; lng: number; count: number; buildings: number; method: string}> = {}
  const districtOnly = plan.filter((p) => p.proposed.precision === 'district')
  const byDistrict = new Map<string, PlanRow[]>()
  for (const p of districtOnly) {
    const k = p.district ? p.district : `city:${p.city ?? 'unknown'}`
    if (!byDistrict.has(k)) byDistrict.set(k, [])
    byDistrict.get(k)!.push(p)
  }
  for (const [k, list] of byDistrict) {
    const circles: Array<{lat: number; lng: number; radius: number}> = []
    if (k.startsWith('city:')) {
      const c = anchorFile.cityCentroids[k.slice(5)]
      if (c) circles.push({...c, radius: Math.max(c.radius, 600)})
    } else {
      const c = anchorFile.districtCentroids[k]
      if (c) circles.push({...c, radius: Math.min(Math.max(c.radius, 400), 900)})
      for (const a of anchorFile.anchors.filter((x) => x.district === k)) circles.push({lat: a.lat, lng: a.lng, radius: Math.min(a.radius, 900)})
    }
    if (!circles.length) {
      const pts = list.map((p) => p.current)
      bubbles[k] = {lat: median(pts.map((p) => p.lat)), lng: median(pts.map((p) => p.lng)), count: list.length, buildings: 0, method: 'median of current pins (no anchors)'}
      continue
    }
    const homes = new Map<string, Bldg>()
    for (const c of circles) for (const h of await homesNear(c.lat, c.lng, c.radius)) homes.set(`${h.c.lat.toFixed(5)},${h.c.lng.toFixed(5)}`, h)
    const hs = [...homes.values()]
    if (!hs.length) {
      bubbles[k] = {lat: circles[0].lat, lng: circles[0].lng, count: list.length, buildings: 0, method: 'district centroid (no OSM footprints)'}
      continue
    }
    const A = hs.reduce((s, h) => s + h.area, 0)
    const cen = {lat: hs.reduce((s, h) => s + h.c.lat * h.area, 0) / A, lng: hs.reduce((s, h) => s + h.c.lng * h.area, 0) / A}
    // the area-weighted centre can fall between two built strips (Golem, Plazh): anchor the bubble on the home nearest to it, on land
    const nearest = hs.sort((a, b) => distanceM(a.c, cen) - distanceM(b.c, cen))[0]
    const pt = pointIn(nearest)
    bubbles[k] = {lat: pt.lat, lng: pt.lng, count: list.length, buildings: hs.length, method: `area-weighted centre of ${hs.length} OSM footprints (50–2500 m²), snapped to the nearest one (${Math.round(distanceM(cen, nearest.c))} m)`}
  }
  for (const p of districtOnly) {
    const b = bubbles[p.district ? p.district : `city:${p.city ?? 'unknown'}`]
    if (b) p.proposed = {lat: b.lat, lng: b.lng, precision: 'district', radiusM: 0}
  }

  /* ---------- spot-check display names for every matched place ---------- */
  const displayByPlace = new Map<string, string>()
  for (const p of plan) {
    if (!p.match) continue
    const k = `${p.match.key}|${p.match.osm ?? ''}|${p.match.name}`
    if (!displayByPlace.has(k)) displayByPlace.set(k, await nominatimReverse(p.proposed.lat, p.proposed.lng).catch(() => ''))
    p.match.display = displayByPlace.get(k)
  }
  saveCache()

  /* ---------- plausibility now vs after ---------- */
  const exactRows = all.filter((r) => r.precision === 'exact')
  type Pin = {id: string; lat: number; lng: number; complex: string; text: string}
  const pinOf = (id: string, lat: number, lng: number): Pin => {
    const ev = evidence.get(id)!
    return {id, lat, lng, complex: ev.hits.find((h) => h.kind === 'complex')?.key ?? '', text: ev.textKey}
  }
  const now: Pin[] = all.map((r) => pinOf(r._id, r.lat, r.lng))
  const after: Pin[] = [
    ...exactRows.map((r) => pinOf(r._id, r.lat, r.lng)),
    ...plan.filter((p) => p.proposed.precision !== 'district').map((p) => pinOf(p.id, p.proposed.lat, p.proposed.lng)),
  ]
  const clusters = (pins: Pin[]) => {
    const parent = pins.map((_, k) => k)
    const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])))
    for (let a = 0; a < pins.length; a++)
      for (let b = a + 1; b < pins.length; b++) {
        if (Math.abs(pins[a].lat - pins[b].lat) > 0.0002) continue
        if (distanceM(pins[a], pins[b]) <= 15) parent[find(a)] = find(b)
      }
    const groups = new Map<number, Pin[]>()
    pins.forEach((p, k) => {
      const r = find(k)
      if (!groups.has(r)) groups.set(r, [])
      groups.get(r)!.push(p)
    })
    const big = [...groups.values()].filter((g) => g.length >= 3)
    const sameComplex = (g: Pin[]) => (g[0].complex && g.every((p) => p.complex === g[0].complex)) || (g[0].text && g.every((p) => p.text === g[0].text))
    const bad = big.filter((g) => !sameComplex(g))
    return {all: big.length, bad: bad.length, badListings: bad.reduce((s, g) => s + g.length, 0), samples: bad.slice(0, 8).map((g) => g.map((p) => p.id))}
  }
  const offNow = plan.filter((p) => !p.current.onBuilding)
  const afterPins = plan.filter((p) => p.proposed.precision !== 'district')
  const offAfter: PlanRow[] = []
  for (const p of afterPins) if (!(await buildingsNear(p.proposed.lat, p.proposed.lng, 25)).length) offAfter.push(p)
  const clNow = clusters(now)
  const clAfter = clusters(after)

  /* ---------- write ---------- */
  fs.writeFileSync(PLAN_FILE, JSON.stringify({generatedAt: new Date().toISOString(), listings: plan.length, plan}, null, 1))
  fs.writeFileSync(BUBBLES_FILE, JSON.stringify(bubbles, null, 1))

  /* ---------- summary ---------- */
  const tab = (key: (p: PlanRow) => string, cols: (p: PlanRow) => string, colNames: string[]) => {
    const t = new Map<string, Record<string, number>>()
    for (const p of plan) {
      const k = key(p)
      if (!t.has(k)) t.set(k, {})
      const c = cols(p)
      t.get(k)![c] = (t.get(k)![c] ?? 0) + 1
    }
    const lines = [`| | ${colNames.join(' | ')} | total |`, `|---|${colNames.map(() => '---:').join('|')}|---:|`]
    for (const [k, v] of [...t.entries()].sort((a, b) => sum(b[1]) - sum(a[1]))) lines.push(`| ${k} | ${colNames.map((c) => v[c] ?? 0).join(' | ')} | ${sum(v)} |`)
    return lines.join('\n')
  }
  const sum = (o: Record<string, number>) => Object.values(o).reduce((a, b) => a + b, 0)
  const CLS = ['a-complex', 'b-street', 'c-landmark', 'd-district', 'e-none']
  const PREC = ['exact', 'street', 'area', 'district']
  const cityKey = (p: PlanRow) => p.city ?? '—'
  const offByDistrict = new Map<string, Record<string, number>>()
  for (const p of offNow) {
    const k = p.district ?? `(${p.city ?? '—'})`
    if (!offByDistrict.has(k)) offByDistrict.set(k, {})
    offByDistrict.get(k)![p.current.surface ?? '?'] = (offByDistrict.get(k)![p.current.surface ?? '?'] ?? 0) + 1
  }
  const surfaces = ['beach/sand', 'road', 'park/green/field', 'yard/open ground', 'water']
  const dupGroups = [...textGroups.values()].filter((g) => g.length > 1)
  const dupKnown = dupGroups.filter((g) => g.some((id) => plan.find((p) => p.id === id)?.match?.key && GAZ.find((x) => x.key === plan.find((p) => p.id === id)!.match!.key)?.kind === 'complex'))
  const rejects = new Map<string, number>()
  for (const p of plan) for (const r of p.rejected) rejects.set(`${r.key}: ${r.reason}`, (rejects.get(`${r.key}: ${r.reason}`) ?? 0) + 1)
  const conf = (p: PlanRow) => `${p.proposed.precision}/${p.confidence}`
  const confT = new Map<string, number>()
  for (const p of plan) confT.set(conf(p), (confT.get(conf(p)) ?? 0) + 1)
  const spot = plan.filter((p) => p.match).sort((a, b) => (a.match!.key < b.match!.key ? -1 : 1))
  const seenKeys = new Set<string>()
  const spotRows = spot.filter((p) => (seenKeys.has(p.match!.key) ? false : (seenKeys.add(p.match!.key), true)))

  const md = `# Geocoding plan ${STAMP} (dry run)

${plan.length} approximate listings analysed (${all.length} with coordinates, ${exactRows.length} already exact).
Network calls this run: ${networkCalls} (cache: ${path.relative(WORKSPACE, CACHE_FILE)}).

## Evidence class by source
${tab((p) => p.source, (p) => p.evidenceClass, CLS)}

## Evidence class by city
${tab(cityKey, (p) => p.evidenceClass, CLS)}

Evidence from partner text vs only our rewritten text: ${plan.filter((p) => p.evidence[0]?.from === 'partner').length} partner / ${plan.filter((p) => p.evidence[0]?.from === 'site').length} site-only.
Unmatched named mentions (not in the gazetteer): ${plan.filter((p) => !p.evidence.length && (p.genericMentions.complex.length || p.genericMentions.street.length)).length} listings.

## Proposed precision by source
${tab((p) => p.source, (p) => p.proposed.precision, PREC)}

## Proposed precision by city
${tab(cityKey, (p) => p.proposed.precision, PREC)}

Precision / confidence: ${[...confT.entries()].sort().map(([k, v]) => `${k} ${v}`).join(' · ')}

## Same text, several units
${dupGroups.length} groups of identical listing text covering ${dupGroups.reduce((s, g) => s + g.length, 0)} listings; ${dupKnown.length} groups resolve to a known complex. Identical texts share one point (seed = text group).

## Physically implausible pins today
Approximate pins with no building footprint within 25 m: **${offNow.length} / ${plan.length}**.

| district | ${surfaces.join(' | ')} | total |
|---|${surfaces.map(() => '---:').join('|')}|---:|
${[...offByDistrict.entries()].sort((a, b) => sum(b[1]) - sum(a[1])).map(([k, v]) => `| ${k} | ${surfaces.map((s) => v[s] ?? 0).join(' | ')} | ${sum(v)} |`).join('\n')}

Clusters of ≥3 pins within 15 m: now ${clNow.all} (${clNow.bad} not one complex/text, ${clNow.badListings} listings) → after ${clAfter.all} (${clAfter.bad} not one complex/text, ${clAfter.badListings} listings).
Off-building after (individual pins only; district-only listings become bubbles): ${offAfter.length} / ${afterPins.length}${offAfter.length ? ` — ${offAfter.map((p) => `${p.match?.key}`).filter((v, k, a) => a.indexOf(v) === k).join(', ')}` : ''}.

## District bubbles
| district | lat | lng | listings | footprints |
|---|---:|---:|---:|---:|
${Object.entries(bubbles).sort((a, b) => b[1].count - a[1].count).map(([k, b]) => `| ${k} | ${b.lat} | ${b.lng} | ${b.count} | ${b.buildings} |`).join('\n')}

## Matched places (one listing each)
| place | precision | conf | listing | matched | source | Nominatim at the proposed point |
|---|---|---|---|---|---|---|
${spotRows.map((p) => `| ${p.match!.key} | ${p.proposed.precision} | ${p.confidence} | ${p.id} | ${p.match!.name} | ${p.match!.source.replace(/\|/g, '/')} | ${(p.match!.display ?? '').slice(0, 90)} |`).join('\n')}

## Rejected matches
${[...rejects.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => `- ${v} × ${k}`).join('\n')}
`
  fs.writeFileSync(SUMMARY_FILE, md)
  console.log(md)
  console.log(`\nWrote ${PLAN_FILE}\n      ${BUBBLES_FILE}\n      ${SUMMARY_FILE}`)

  if (!isExecute) {
    console.log('\nDry run — nothing written to Sanity.')
    return
  }

  /* ---------- execute (owner decision; not run on 2026-10-11) ---------- */
  const writable = plan.filter((p) => p.proposed.precision === 'district' || p.confidence !== 'low')
  const backup = all.filter((r) => writable.some((p) => p.id === r._id)).map((r) => ({_id: r._id, coordinatesLat: r.lat, coordinatesLng: r.lng, locationPrecision: r.precision}))
  const backupFile = path.join(GEO, `geocode-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`)
  fs.writeFileSync(backupFile, JSON.stringify(backup, null, 1))
  console.log(`backup: ${backupFile}`)
  let n = 0
  for (const p of writable) {
    if (!Number.isFinite(p.proposed.lat)) continue
    const evidenceText = p.match ? `${p.match.key}: ${p.match.source}${p.match.note ? `; ${p.match.note}` : ''}` : `district ${p.district ?? p.city}`
    const set = {
      coordinatesLat: p.proposed.lat,
      coordinatesLng: p.proposed.lng,
      locationPrecision: p.proposed.precision === 'exact' ? 'exact' : 'approximate',
      locationLevel: p.proposed.precision,
      locationEvidence: evidenceText.slice(0, 300),
    }
    await client.patch(p.id).set(set).commit()
    const draft = await client.getDocument(`drafts.${p.id}`)
    if (draft) await client.patch(`drafts.${p.id}`).set(set).commit()
    n++
  }
  console.log(`wrote ${n} listing(s).`)
}

main().catch((e) => {
  saveCache()
  console.error(e instanceof Error ? e.stack ?? e.message : e)
  process.exit(1)
})
