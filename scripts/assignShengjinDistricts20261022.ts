/**
 * Shëngjin districts (2026-10-22): put every listing in its district and
 * describe the districts the hub shows.
 *
 * Why: on 21-22.10 a local agency's catalogue (agent `shengjin-banesa`) took
 * Shëngjin from 20 to 123 sale listings, imported without a district. The
 * districts hub `/albania/shengjin/districts` then showed three districts:
 * two with a handful of flats, Tale with none, and 89 flats belonged to
 * nobody. Every listing has coordinates (the markets session moved the 103
 * new ones onto real buildings on 22.10), so the district is read from
 * them. Reverse geocoding (OpenStreetMap Nominatim, 22.10) of the clusters:
 *
 * - town centre: Shëtitorja Wilson, Rruga Nënë Tereza, Rruga Fran Ivanaj up
 *   the hill (OSM: Mali Shëngjinit, Margjonaj, Skutaj) → `center-shengjin`
 * - south of the town along Rruga Fran Ivanaj towards the Kune-Vain lagoon
 *   (OSM suburb "Kunë") → new district `kune`
 * - the Rruga Riviera slope north-west of the port and the dune beach
 *   (OSM: Rruga Riviera, Marvukaj) → `rana-e-hedhur`
 * - two land plots inland at Stom i Madh stay without a district
 * - Tale (the beach south of the lagoons) has no listing: unpublished until
 *   one arrives, so the hub shows only districts with flats.
 *
 * The rules are three straight lines (see `zoneOf`); the 34 listings that
 * already had a district all fall on the right side of them.
 *
 * Also writes `shortDescription` and `description` (seven locales) for the
 * three districts with listings: these fields exist on 59 districts, so no
 * new attribute path is added (the dataset is at its 2000-attribute cap).
 * The texts state what the data shows on 22.10 without volatile figures;
 * the live figures are on the listing pages.
 *
 * Run:
 *   npx tsx scripts/assignShengjinDistricts20261022.ts            # dry run
 *   npx tsx scripts/assignShengjinDistricts20261022.ts --execute  # write, with a backup
 */
import fs from 'node:fs'
import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv()

const execute = process.argv.includes('--execute')

const client = createClient({
  projectId: (process.env.SANITY_PROJECT_ID || 'g4aqp6ex').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: (process.env.SANITY_API_VERSION || '2024-01-01').trim(),
  token: process.env.SANITY_API_TOKEN?.trim(),
  useCdn: false,
})

const CITY_ID = 'city-shengjin'
const CENTER_ID = 'district-shengjin-center'
const KUNE_ID = 'district-kune'
const RANA_ID = 'district-rana-e-hedhur'
const TALE_ID = 'district-tale'

type L7 = {en: string; uk: string; ru: string; sq: string; it: string; pl: string; de: string}

const localized = (type: 'localizedString' | 'localizedText', v: L7) => ({_type: type, ...v})

const KUNE_TITLE: L7 = {en: 'Kunë', uk: 'Куне', ru: 'Куне', sq: 'Kunë', it: 'Kunë', pl: 'Kunë', de: 'Kunë'}

const SHORT: Record<string, L7> = {
  [CENTER_ID]: {
    en: 'Port, promenade, the old town',
    uk: 'Порт, набережна, старе місто',
    ru: 'Порт, набережная, старый город',
    sq: 'Porti, shëtitorja, qyteti i vjetër',
    it: 'Porto, lungomare, la città vecchia',
    pl: 'Port, promenada, stare miasto',
    de: 'Hafen, Promenade, Altstadt',
  },
  [KUNE_ID]: {
    en: 'New blocks by the beach, cheapest per m²',
    uk: 'Нові будинки біля пляжу, найдешевший м²',
    ru: 'Новые дома у пляжа, самый дешёвый м²',
    sq: 'Pallate të reja pranë plazhit, m² më i lirë',
    it: 'Palazzine nuove sulla spiaggia, il m² più economico',
    pl: 'Nowe bloki przy plaży, najtańszy m²',
    de: 'Neue Blocks am Strand, günstigster m²',
  },
  [RANA_ID]: {
    en: 'Dune beach, slope with sea views',
    uk: 'Дюнний пляж, схил з видом на море',
    ru: 'Дюнный пляж, склон с видом на море',
    sq: 'Plazhi me duna, kodra me pamje nga deti',
    it: 'Spiaggia di dune, pendio con vista mare',
    pl: 'Plaża z wydmami, zbocze z widokiem na morze',
    de: 'Dünenstrand, Hang mit Meerblick',
  },
}

const DESCRIPTION: Record<string, L7> = {
  [CENTER_ID]: {
    en: 'The centre is the old part of Shëngjin: the port, the Wilson promenade with the restaurants and shops, the beach that starts right at it, and the streets climbing the hill of Mali i Shëngjinit behind it. Most of what is for sale here is in completed buildings, a mix of 1+1 and 2+1 flats, some on the front line of the promenade; the listings that state a distance to the sea mostly stand within a few hundred metres of it. It is the part of town that lives all year, with the bus stop, the pharmacy and the market, and the one buyers choose when they want to walk to everything.',
    uk: 'Центр - стара частина Шенджина: порт, набережна Вілсона з ресторанами й магазинами, пляж, що починається просто від неї, і вулиці, які піднімаються на пагорб Малі-і-Шенджиніт. Більшість того, що тут продається, - у збудованих будинках, суміш 1+1 і 2+1, частина на першій лінії набережної; оголошення з указаною відстанню до моря здебільшого стоять за кілька сотень метрів від нього. Це частина міста, яка живе цілий рік, із зупинкою, аптекою та ринком, і її обирають ті, хто хоче ходити всюди пішки.',
    ru: 'Центр - старая часть Шенджина: порт, набережная Вильсона с ресторанами и магазинами, пляж, который начинается прямо от неё, и улицы, поднимающиеся на холм Мали-и-Шенджинит. Большая часть того, что здесь продаётся, - в построенных домах, вперемешку 1+1 и 2+1, часть на первой линии набережной; объявления с указанным расстоянием до моря в основном стоят в нескольких сотнях метров от него. Это часть города, которая живёт круглый год, с остановкой, аптекой и рынком, и её выбирают те, кто хочет ходить везде пешком.',
    sq: 'Qendra është pjesa e vjetër e Shëngjinit: porti, shëtitorja Wilson me restorantet dhe dyqanet, plazhi që nis pikërisht aty dhe rrugët që ngjiten në kodrën e Malit të Shëngjinit. Shumica e asaj që shitet këtu është në ndërtesa të përfunduara, një përzierje 1+1 dhe 2+1, disa në vijën e parë të shëtitores; njoftimet që tregojnë distancën nga deti ndodhen kryesisht disa qindra metra prej tij. Është pjesa e qytetit që jeton gjithë vitin, me stacionin e autobusit, farmacinë dhe tregun, dhe ajo që zgjedhin blerësit që duan të shkojnë kudo në këmbë.',
    it: 'Il centro è la parte vecchia di Shëngjin: il porto, il lungomare Wilson con i ristoranti e i negozi, la spiaggia che comincia proprio lì e le vie che salgono sulla collina di Mali i Shëngjinit. Gran parte di ciò che è in vendita qui sta in edifici completati, un misto di 1+1 e 2+1, alcuni in prima linea sul lungomare; gli annunci che indicano la distanza dal mare sono per lo più a poche centinaia di metri. È la parte della città che vive tutto l\'anno, con la fermata del bus, la farmacia e il mercato, e quella che scelgono i compratori che vogliono fare tutto a piedi.',
    pl: 'Centrum to stara część Shëngjin: port, promenada Wilsona z restauracjami i sklepami, plaża zaczynająca się tuż przy niej i ulice wspinające się na wzgórze Mali i Shëngjinit. Większość tego, co tu na sprzedaż, jest w ukończonych budynkach, mieszanka 1+1 i 2+1, część w pierwszej linii przy promenadzie; oferty z podaną odległością od morza stoją przeważnie kilkaset metrów od niego. To część miasta, która żyje cały rok, z przystankiem, apteką i targiem, wybierana przez tych, którzy chcą wszędzie chodzić pieszo.',
    de: 'Das Zentrum ist der alte Teil von Shëngjin: der Hafen, die Wilson-Promenade mit den Restaurants und Geschäften, der Strand, der direkt dort beginnt, und die Straßen, die den Hügel Mali i Shëngjinit hinaufführen. Das meiste, was hier verkauft wird, liegt in fertigen Gebäuden, eine Mischung aus 1+1- und 2+1-Wohnungen, einige in erster Reihe an der Promenade; die Inserate mit Entfernungsangabe stehen meist wenige hundert Meter vom Meer. Es ist der Teil der Stadt, der das ganze Jahr lebt, mit Bushaltestelle, Apotheke und Markt, und der, den Käufer wählen, die alles zu Fuß erreichen wollen.',
  },
  [KUNE_ID]: {
    en: 'Kunë is the strip south of the town, along Rruga Fran Ivanaj between the road and the beach, running towards the Kune-Vain lagoons, a protected reserve. It is where Shëngjin has been building: most of the listings here are 1+1 flats in recent residential blocks, and more of them stand on the first line than anywhere else in town. Of the three districts it asks the least per square metre on our listings, and the beach is wide and quieter than the promenade. Shops and restaurants are fewer; the centre is a few minutes by car or a walk along the shore.',
    uk: 'Куне - смуга на південь від міста вздовж Rruga Fran Ivanaj, між дорогою та пляжем, що тягнеться до лагун Куне-Ваїн, заповідної зони. Саме тут Шенджин будувався останні роки: більшість оголошень тут - квартири 1+1 у нових житлових будинках, і на першій лінії їх більше, ніж будь-де в місті. З трьох районів за м² тут просять найменше серед наших оголошень, а пляж широкий і тихіший за набережну. Магазинів і ресторанів менше; до центру кілька хвилин автомобілем або пішки вздовж берега.',
    ru: 'Куне - полоса к югу от города вдоль Rruga Fran Ivanaj, между дорогой и пляжем, тянущаяся к лагунам Куне-Ваин, заповедной зоне. Именно здесь Шенджин строился в последние годы: большинство объявлений - квартиры 1+1 в недавних жилых домах, и на первой линии их больше, чем где-либо в городе. Из трёх районов за м² здесь просят меньше всего среди наших объявлений, а пляж широкий и тише набережной. Магазинов и ресторанов меньше; до центра несколько минут на машине или пешком вдоль берега.',
    sq: 'Kuna është brezi në jug të qytetit, përgjatë Rrugës Fran Ivanaj mes rrugës dhe plazhit, që shkon drejt lagunave të Kune-Vainit, zonë e mbrojtur. Këtu ka ndërtuar Shëngjini vitet e fundit: shumica e njoftimeve janë apartamente 1+1 në pallate të reja banimi, dhe në vijë të parë ka më shumë se kudo tjetër në qytet. Nga tre zonat, këtu kërkohet më pak për metër katror në njoftimet tona, dhe plazhi është i gjerë e më i qetë se shëtitorja. Dyqane dhe restorante ka më pak; qendra është disa minuta me makinë ose në këmbë buzë detit.',
    it: 'Kunë è la fascia a sud della città, lungo Rruga Fran Ivanaj tra la strada e la spiaggia, verso le lagune di Kune-Vain, riserva protetta. È dove Shëngjin ha costruito negli ultimi anni: la maggior parte degli annunci qui sono 1+1 in palazzine residenziali recenti, e in prima linea ce ne sono più che in qualsiasi altra parte della città. Dei tre quartieri è quello che chiede meno al metro quadro sui nostri annunci, e la spiaggia è ampia e più tranquilla del lungomare. Negozi e ristoranti sono meno; il centro è a pochi minuti in auto o a piedi lungo la riva.',
    pl: 'Kunë to pas na południe od miasta, wzdłuż Rruga Fran Ivanaj między drogą a plażą, ciągnący się ku lagunom Kune-Vain, obszarowi chronionemu. To tu Shëngjin budował w ostatnich latach: większość ofert to mieszkania 1+1 w nowych blokach, a w pierwszej linii jest ich więcej niż gdziekolwiek w mieście. Z trzech dzielnic tu żąda się najmniej za metr kwadratowy w naszych ofertach, a plaża jest szeroka i spokojniejsza niż promenada. Sklepów i restauracji jest mniej; do centrum kilka minut autem lub spacerem brzegiem.',
    de: 'Kunë ist der Streifen südlich der Stadt, entlang der Rruga Fran Ivanaj zwischen Straße und Strand, Richtung der Lagunen von Kune-Vain, einem Schutzgebiet. Hier hat Shëngjin in den letzten Jahren gebaut: Die meisten Inserate sind 1+1-Wohnungen in neueren Wohnblocks, und in erster Reihe stehen mehr davon als irgendwo sonst in der Stadt. Von den drei Vierteln wird hier auf unseren Inseraten am wenigsten pro Quadratmeter verlangt, und der Strand ist breit und ruhiger als die Promenade. Geschäfte und Restaurants gibt es weniger; das Zentrum ist wenige Minuten mit dem Auto oder zu Fuß am Ufer entlang.',
  },
  [RANA_ID]: {
    en: 'Rana e Hedhun is the dune beach north-west of the port and the slope above it along Rruga Riviera, where the newer residences look down on the sea. The listings here are few, mostly 1+1 flats and studios with sea views, and none of them on the sand itself: the beach is reached down the road. It is the quietest of the three districts, with pine woods and the dunes instead of a promenade, and the restaurants of the centre are a short drive away.',
    uk: 'Рана-е-Хедхун - дюнний пляж на північний захід від порту і схил над ним уздовж Rruga Riviera, де новіші резиденції дивляться на море. Оголошень тут небагато, переважно квартири 1+1 і студії з видом на море, і жодне не стоїть просто на піску: до пляжу спускаються дорогою. Це найтихіший із трьох районів, із сосновим лісом і дюнами замість набережної, а до ресторанів центру кілька хвилин автомобілем.',
    ru: 'Рана-э-Хедхун - дюнный пляж к северо-западу от порта и склон над ним вдоль Rruga Riviera, где более новые резиденции смотрят на море. Объявлений здесь немного, в основном квартиры 1+1 и студии с видом на море, и ни одно не стоит прямо на песке: к пляжу спускаются по дороге. Это самый тихий из трёх районов, с сосновым лесом и дюнами вместо набережной, а до ресторанов центра несколько минут на машине.',
    sq: 'Rana e Hedhun është plazhi me duna në veriperëndim të portit dhe kodra mbi të përgjatë Rrugës Riviera, ku rezidencat më të reja shohin nga deti. Njoftimet këtu janë të pakta, kryesisht apartamente 1+1 dhe garsoniera me pamje nga deti, dhe asnjë mbi vetë rërën: te plazhi zbritet nga rruga. Është më e qeta nga tre zonat, me pishat dhe dunat në vend të shëtitores, dhe restorantet e qendrës janë disa minuta larg me makinë.',
    it: 'Rana e Hedhun è la spiaggia di dune a nord-ovest del porto e il pendio sopra di essa lungo Rruga Riviera, dove i residence più recenti guardano il mare. Gli annunci qui sono pochi, soprattutto 1+1 e monolocali con vista mare, e nessuno direttamente sulla sabbia: alla spiaggia si scende dalla strada. È il più tranquillo dei tre quartieri, con la pineta e le dune al posto del lungomare, e i ristoranti del centro sono a pochi minuti d\'auto.',
    pl: 'Rana e Hedhun to plaża z wydmami na północny zachód od portu i zbocze nad nią wzdłuż Rruga Riviera, gdzie nowsze rezydencje patrzą na morze. Ofert jest tu niewiele, głównie mieszkania 1+1 i kawalerki z widokiem na morze, i żadna nie stoi na samym piasku: na plażę schodzi się drogą. To najspokojniejsza z trzech dzielnic, z sosnowym lasem i wydmami zamiast promenady, a restauracje centrum są kilka minut autem.',
    de: 'Rana e Hedhun ist der Dünenstrand nordwestlich des Hafens und der Hang darüber entlang der Rruga Riviera, wo die neueren Wohnanlagen aufs Meer blicken. Inserate gibt es hier wenige, meist 1+1-Wohnungen und Studios mit Meerblick, keines direkt am Sand: Zum Strand geht es die Straße hinunter. Es ist das ruhigste der drei Viertel, mit Pinienwald und Dünen statt Promenade, und die Restaurants des Zentrums sind wenige Autominuten entfernt.',
  },
}

type Listing = {_id: string; slug: string; d: string | null; lat: number | null; lng: number | null; t: string | null}

/** Three straight lines over the coordinates; see the header for what lies where. */
function zoneOf(l: Listing): string | null {
  if (typeof l.lat !== 'number' || typeof l.lng !== 'number') return null
  if (l.lng < 19.585 && l.lat >= 41.8) return RANA_ID
  if (l.lat >= 41.8035) return CENTER_ID
  if (l.lat >= 41.785) return KUNE_ID
  return null
}

async function main() {
  const listings = await client.fetch<Listing[]>(
    `*[_type == "property" && city._ref == $city && !(_id in path("drafts.**"))]{
      _id, "slug": slug.current, "d": district->slug.current, "lat": coordinatesLat, "lng": coordinatesLng, "t": title.en
    }`,
    {city: CITY_ID},
  )
  const districts = await client.fetch<Array<{_id: string; slug: string; isPublished: boolean | null; order: number | null}>>(
    `*[_type == "district" && city._ref == $city]{_id, "slug": slug.current, isPublished, order}`,
    {city: CITY_ID},
  )
  const bySlug = new Map(districts.map((d) => [d.slug, d._id]))
  const slugOfId = new Map(districts.map((d) => [d._id, d.slug]))

  const changes: Array<{_id: string; slug: string; from: string | null; to: string | null}> = []
  const counts = new Map<string | null, number>()
  for (const l of listings) {
    const to = zoneOf(l)
    counts.set(to, (counts.get(to) ?? 0) + 1)
    const fromId = l.d ? bySlug.get(l.d) ?? null : null
    if (fromId !== to) changes.push({_id: l._id, slug: l.slug, from: l.d, to: to ? slugOfId.get(to) ?? (to === KUNE_ID ? 'kune' : to) : null})
  }
  console.log(`Shëngjin listings: ${listings.length}`)
  for (const [zone, n] of counts) console.log(`  ${zone ? slugOfId.get(zone) ?? zone : '(none)'}: ${n}`)
  console.log(`District changes: ${changes.length}`)
  for (const c of changes) console.log(`  ${c.slug}: ${c.from ?? '-'} -> ${c.to ?? '-'}`)
  const kuneExists = districts.some((d) => d._id === KUNE_ID)
  console.log(`Kunë district: ${kuneExists ? 'exists' : 'to create'}; Tale: ${districts.find((d) => d._id === TALE_ID)?.isPublished === false ? 'already unpublished' : 'to unpublish'}`)

  if (!execute) {
    console.log('\nDry run. Add --execute to write.')
    return
  }
  if (!process.env.SANITY_API_TOKEN) throw new Error('SANITY_API_TOKEN missing')

  // Backup: every document this script touches, as it is now.
  const ids = [...new Set([...changes.map((c) => c._id), CENTER_ID, RANA_ID, TALE_ID, ...(kuneExists ? [KUNE_ID] : [])])]
  const backup = await client.fetch(`*[_id in $ids]`, {ids})
  const backupDir = path.resolve(process.cwd(), 'reports', 'backups')
  fs.mkdirSync(backupDir, {recursive: true})
  const backupPath = path.join(backupDir, `shengjin-districts-${new Date().toISOString().replace(/[:.]/g, '-')}.json`)
  fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2))
  console.log(`Backup: ${backupPath} (${backup.length} documents)`)

  let tx = client.transaction()
  if (!kuneExists) {
    tx = tx.createIfNotExists({
      _id: KUNE_ID,
      _type: 'district',
      title: localized('localizedString', KUNE_TITLE),
      slug: {_type: 'slug', current: 'kune'},
      city: {_type: 'reference', _ref: CITY_ID},
      isPublished: true,
      order: 2,
    })
  }
  tx = tx
    .patch(CENTER_ID, (p) => p.set({order: 1, shortDescription: localized('localizedText', SHORT[CENTER_ID]), description: localized('localizedText', DESCRIPTION[CENTER_ID])}))
    .patch(KUNE_ID, (p) => p.set({order: 2, shortDescription: localized('localizedText', SHORT[KUNE_ID]), description: localized('localizedText', DESCRIPTION[KUNE_ID])}))
    .patch(RANA_ID, (p) => p.set({order: 3, shortDescription: localized('localizedText', SHORT[RANA_ID]), description: localized('localizedText', DESCRIPTION[RANA_ID])}))
    .patch(TALE_ID, (p) => p.set({order: 4, isPublished: false}))
  await tx.commit()
  console.log('Districts written.')

  // Listings in chunks of 50.
  for (let i = 0; i < changes.length; i += 50) {
    let t = client.transaction()
    for (const c of changes.slice(i, i + 50)) {
      const l = listings.find((x) => x._id === c._id)!
      const to = zoneOf(l)
      t = to
        ? t.patch(c._id, (p) => p.set({district: {_type: 'reference', _ref: to}}))
        : t.patch(c._id, (p) => p.unset(['district']))
    }
    await t.commit()
    console.log(`Listings ${i + 1}-${Math.min(i + 50, changes.length)} written.`)
  }
  console.log('Done.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
