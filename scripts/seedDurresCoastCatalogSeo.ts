/**
 * Albanian commercial copy for the Durrës coast catalogue pages.
 *
 * What was wrong, measured on 2026-09-08:
 *  - every `catalogSeoPage.title` (the H1) read "Pasuri në Durrësi" — no
 *    keyword, and the nominative where Albanian wants the locative — while
 *    `seo.metaTitle` already said "Shtëpi dhe apartamente në shitje në Durrës".
 *  - `intro` and `bottomText` were one-liners of 70–90 characters.
 *  - Qerret, Mali i Robit, Gjiri i Lalzit, Kavajë and Spille had no catalogue
 *    page document at all, though they carry listings now.
 *
 * What this writes:
 *  - H1 in every locale := the brand-stripped metaTitle, on every catalogue
 *    page document (the metaTitles were rewritten with keywords in SEO-02).
 *  - For Durrës and its coastal districts, Albanian H1, intro and bottom text
 *    written by hand: the search phrasing the market uses ("apartamente në
 *    shitje", "1+1", "2+1", "okazion", "vija e parë") and price bands that
 *    trace to scripts/data/zone-metrics-seed.json (2026-H1 asking prices,
 *    kbSource 02-cities/durres.md). Zones with no metrics record get no number.
 *
 * Idempotent; other locales' intro/bottomText are left as they are.
 *
 * Run:
 * - npx tsx scripts/seedDurresCoastCatalogSeo.ts --dry
 * - npx tsx scripts/seedDurresCoastCatalogSeo.ts --execute
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

const LOCALES = ['en', 'uk', 'ru', 'sq', 'it', 'pl'] as const
type Locale = (typeof LOCALES)[number]
type Localized = Partial<Record<Locale, string>>

function stripBrand(s: string): string {
  return s.replace(/\s*[|—–-]\s*Domlivo\s*$/i, '').trim()
}

type ZoneCopy = {
  /** district document id, or null for the city page */
  district: string | null
  title: Localized
  metaTitle: Localized
  metaDescription: Localized
  introSq: string
  bottomSq: string
}

const CITY_ID = 'city-durres'

/**
 * Figures below: zone-metrics-seed.json, 2026-H1, asking prices, €/m².
 * durres median 1,450 (+18% y/y) · plazh 1,200–1,700 · shkembi new 1,200–2,000,
 * resale 450–800 · golem 1,100–1,500, first line 2,000–2,500 · plepa 1,000–1,270,
 * sea view 1,800–2,160 · qerret 1,100–2,500 (+21–43%) · mali i robit 950–1,200 ·
 * gjiri i lalzit 1,500–1,700, complexes 2,500–3,500 · centre 1,900–2,800.
 * Kavajë and Spille: no record — no numbers.
 */
const ZONES: ZoneCopy[] = [
  {
    district: null,
    title: {sq: 'Shtëpi dhe apartamente në shitje në Durrës'},
    metaTitle: {sq: 'Shtëpi dhe apartamente në shitje në Durrës — çmime 2026'},
    metaDescription: {
      sq: 'Apartamente 1+1 dhe 2+1, garsoniere, vila dhe tokë në shitje në Durrës: Plazh, Shkëmbi i Kavajës, Golem, Qerret. Çmime aktuale nga pronarët dhe agjencitë, pa komision.',
    },
    introSq:
      'Apartamente, garsoniere, vila dhe tokë në shitje në Durrës dhe në bregdetin e tij — nga qendra dhe Plazhi deri në Golem, Qerret dhe Spille. Çmime reale, foto dhe kontakt i drejtpërdrejtë.',
    bottomSq:
      'Durrësi është tregu më i madh i banesave bregdetare në Shqipëri dhe qyteti ku kërkimi "apartamente në shitje" ka më shumë përgjigje. Çmimi mesatar i kërkuar në qytet është rreth 1,450 €/m² (gjysma e parë e 2026), me rritje prej afro 18% brenda një viti. Diferenca mes zonave është e madhe: nga 450–800 €/m² për fondin e vjetër te Shkëmbi i Kavajës, te 1,200–1,700 €/m² në Plazh dhe 1,900–2,800 €/m² në qendër e në vijën e parë të Currilës.\n\nNë këtë katalog gjeni apartamente 1+1 dhe 2+1 në ndërtime të reja dhe të përfunduara, garsoniere për qira turistike, vila me truall në Shkallnur dhe Gjirin e Lalzit, si dhe tokë në Qerret dhe Spille. Çdo njoftim ka çmimin e vërtetë, sipërfaqen dhe fotot; për ndërtimet në proces tregohet çmimi për m² dhe afati i dorëzimit.\n\nFiltroni sipas zonës, çmimit, sipërfaqes dhe numrit të dhomave, ose hapni faqet e lagjeve — Plazh, Shkëmbi i Kavajës, Golem, Mali i Robit, Qerret, Kavajë, Spille — për çmimet dhe ofertat e secilës.',
  },
  {
    district: 'district-plazh',
    title: {sq: 'Apartamente në shitje në Plazh, Durrës'},
    metaTitle: {sq: 'Apartamente në shitje në Plazh, Durrës — 1+1, 2+1, çmime 2026'},
    metaDescription: {
      sq: 'Apartamente 1+1 dhe 2+1 në shitje në Plazh, Durrës, pranë detit dhe shëtitores. Çmime 1,200–1,700 €/m², foto dhe kontakt i drejtpërdrejtë, pa komision.',
    },
    introSq:
      'Plazhi është zona masive e banimit buzë detit në Durrës: apartamente 1+1 dhe 2+1 pranë shëtitores, me dyqane, transport dhe jetë gjatë gjithë vitit.',
    bottomSq:
      'Plazhi i Durrësit është segmenti më i kërkuar i qytetit për banim dhe pushime: rruga bregdetare, shëtitorja, supermarketet dhe linjat urbane funksionojnë gjithë vitin, ndryshe nga zonat më në jug. Çmimet e kërkuara janë 1,200–1,700 €/m² (2026-H1), me rritje deri në 21% brenda vitit; pallatet e reja me ashensor dhe pamje nga deti shkojnë në pjesën e sipërme, ndërsa fondi i viteve 2000 shitet më lirë.\n\nOferta tipike: apartamente 1+1 prej 45–65 m² dhe 2+1 prej 70–100 m², shpesh të mobiluara dhe të gatshme për banim ose për qira ditore në sezon. Kërkoni distancën nga deti dhe katin — në vijën e dytë dhe të tretë diferenca në çmim është e ndjeshme.\n\nNë këtë faqe janë njoftimet aktuale në Plazh; për zonat fqinje shihni Plepën, Shkëmbin e Kavajës dhe qendrën e Durrësit.',
  },
  {
    district: 'district-shkembi-durres',
    title: {sq: 'Apartamente në shitje në Shkëmbin e Kavajës, Durrës'},
    metaTitle: {sq: 'Apartamente në shitje në Shkëmbin e Kavajës — 1+1, 2+1, garsoniere'},
    metaDescription: {
      sq: 'Apartamente 1+1, 2+1 dhe garsoniere në shitje në Shkëmbin e Kavajës, Durrës. Ndërtime të reja 1,200–2,000 €/m², fond i vjetër nga 450 €/m². Foto, çmime reale, pa komision.',
    },
    introSq:
      'Shkëmbi i Kavajës është zona me diferencën më të madhe të çmimeve në Durrës: fond i vjetër nga 450 €/m² dhe ndërtime të reja buzë detit deri në 2,000 €/m².',
    bottomSq:
      'Shkëmbi i Kavajës shtrihet mes Plepës dhe Golemit, me plazh të gjerë dhe pallate që fillojnë nga vija e parë. Çmimet e kërkuara në ndërtimet e reja janë 1,200–2,000 €/m² (2026-H1), ndërsa fondi i vjetër shitet për 450–800 €/m² — hendeku më i gjerë mes së resë dhe së vjetrës në gjithë Durrësin, që e bën zonën interesante si për banim me buxhet të ulët, ashtu edhe për investim në ndërtim të ri.\n\nNë katalog gjeni garsoniere prej 30–40 m² për qira turistike, apartamente 1+1 dhe 2+1 me pamje nga deti, penthouse dhe garazhe. Shumë njoftime janë nga agjencitë partnere që punojnë vetëm në këtë bregdet, prandaj çmimet janë ato të tregut, jo të llogaritura.\n\nShihni edhe Golemin dhe Malin e Robit më në jug, ose Plepën drejt qytetit — të tria janë brenda pak minutash me makinë.',
  },
  {
    district: 'district-golem-durres',
    title: {sq: 'Apartamente në shitje në Golem, Durrës'},
    metaTitle: {sq: 'Apartamente në shitje në Golem — 1+1, 2+1, ndërtim i ri, çmime 2026'},
    metaDescription: {
      sq: 'Apartamente 1+1 dhe 2+1 në shitje në Golem, plazhi i Durrësit: ndërtime të reja nga 1,100 €/m², vija e parë 2,000–2,500 €/m². Foto, çmime reale, okazione, pa komision.',
    },
    introSq:
      'Golemi është plazhi më i kërkuar në jug të Durrësit: ndërtime të reja 1+1 dhe 2+1 nga 1,100 €/m² në vijën e dytë dhe 2,000–2,500 €/m² në vijën e parë.',
    bottomSq:
      'Golemi (Bashkia Kavajë, por për tregun pjesë e bregdetit të Durrësit) është zona me numrin më të madh të ndërtimeve të reja në këtë bregdet. Çmimet e kërkuara në vijën e dytë dhe të tretë janë 1,100–1,500 €/m² (2026-H1), me rritje 8–15% brenda vitit; vija e parë, ku nuk ndërtohet më, kërkon 2,000–2,500 €/m² dhe rritet edhe më shpejt, sepse oferta atje nuk shtohet.\n\nOferta tipike: garsoniere dhe apartamente 1+1 prej 40–60 m² në komplekse me pishinë dhe administrim, 2+1 prej 70–90 m² për familje, shpesh me çmim për m² dhe pagesë me këste gjatë ndërtimit. Pyesni gjithmonë për fazën e ndërtimit, afatin e dorëzimit dhe certifikatën e pronësisë — të tria shënohen në çdo njoftim tonin.\n\nPër çmime më të ulëta shihni Malin e Robit ngjitur; për vila dhe truall — Qerretin dhe Gjirin e Lalzit.',
  },
  {
    district: 'district-plepa-durres',
    title: {sq: 'Apartamente në shitje në Plepa, Durrës'},
    metaTitle: {sq: 'Apartamente në shitje në Plepa, Durrës — çmime 2026'},
    metaDescription: {
      sq: 'Apartamente 1+1 dhe 2+1 në shitje në Plepa, Durrës: fond masiv 1,000–1,270 €/m² dhe pamje nga deti 1,800–2,160 €/m². Foto, çmime reale, pa komision.',
    },
    introSq:
      'Plepa është zona mes Plazhit dhe Shkëmbit të Kavajës: apartamente masive nga 1,000 €/m² dhe ndërtime me pamje nga deti deri në 2,160 €/m².',
    bottomSq:
      'Plepa ndan Plazhin nga Shkëmbi i Kavajës dhe ka dy tregje brenda një zone: fondin masiv me 1,000–1,270 €/m² dhe ndërtimet me pamje nga deti me 1,800–2,160 €/m² (2026-H2, çmime të kërkuara, mbi 150 njoftime të analizuara). Për të njëjtat para në Plepa merrni ose apartament më të madh larg detit, ose më të vogël në vijën e parë.\n\nNë katalog: apartamente 1+1 dhe 2+1 në pallate të përfunduara, shumë prej tyre të mobiluara, si dhe ndërtime në proces me çmim për m². Zona ka dyqane, shkolla dhe transport urban për në qendër.\n\nKrahasoni me Plazhin (më pranë qytetit) dhe Shkëmbin e Kavajës (fond i vjetër më i lirë) para se të vendosni.',
  },
  {
    district: 'district-qerret',
    title: {
      sq: 'Apartamente dhe vila në shitje në Qerret, Durrës',
      en: 'Property for Sale in Qerret, Durres',
      ru: 'Черрет, Дуррес: недвижимость и квартиры',
      uk: 'Черрет, Дуррес: нерухомість та квартири',
      it: 'Case in vendita a Qerret, Durazzo',
      pl: 'Qerret, Durrës: nieruchomości i mieszkania',
    },
    metaTitle: {
      sq: 'Apartamente dhe vila në shitje në Qerret — plazhi i Durrësit, çmime 2026',
      en: 'Property for Sale in Qerret, Durres',
      ru: 'Черрет, Дуррес: недвижимость и квартиры',
      uk: 'Черрет, Дуррес: нерухомість та квартири',
      it: 'Case in vendita a Qerret, Durazzo',
      pl: 'Qerret, Durrës: nieruchomości i mieszkania',
    },
    metaDescription: {
      sq: 'Apartamente 1+1 dhe 2+1, vila dhe tokë në shitje në Qerret, Durrës: nga 1,100 €/m² pas vilave deri në 2,500 €/m² në vijën e parë. Foto, çmime reale, pa komision.',
      en: 'Apartments, villas and land for sale in Qerret, the fastest-moving beach zone south of Durres. Real prices, photos, no commission.',
      ru: 'Квартиры, виллы и участки в Черрете, Дуррес: самая быстрорастущая пляжная зона к югу от города. Реальные цены, фото, без комиссии.',
      uk: 'Квартири, вілли та ділянки в Черреті, Дуррес: пляжна зона з найшвидшим зростанням цін на південь від міста. Реальні ціни, без комісії.',
      it: 'Appartamenti, ville e terreni in vendita a Qerret, la zona balneare in più rapida crescita a sud di Durazzo. Prezzi reali, senza commissioni.',
      pl: 'Mieszkania, wille i działki na sprzedaż w Qerret, najszybciej rosnącej strefie plażowej na południe od Durrës. Realne ceny, bez prowizji.',
    },
    introSq:
      'Qerreti është zona me rritjen më të shpejtë të çmimeve në bregdetin e Durrësit: 1,100–1,500 €/m² pas vilave, 1,700–2,000 pranë detit dhe deri në 2,500 €/m² në vijën e parë.',
    bottomSq:
      'Qerreti është plazhi i vilave dhe rezidencave në jug të Golemit, me pisha, hotele të vogla dhe ndërtime të reja të ulëta. Çmimet e kërkuara (2026-H1) shkojnë nga 1,100–1,500 €/m² për apartamentet pas vilave, 1,700–2,000 €/m² pranë detit dhe 2,200–2,500 €/m² në vijën e parë — me rritje 21–43% brenda vitit, më e shpejta në gjithë aglomeratin e Durrësit.\n\nOferta: garsoniere dhe apartamente 1+1 e 2+1 në rezidenca të reja me pishinë, vila me truall dhe parcela toke për ndërtim ose investim. Për ndërtimet në proces tregohet çmimi për m² dhe afati i dorëzimit.\n\nZona fqinje me çmime më të ulëta janë Golemi dhe Mali i Robit; për tokë me çmim edhe më të ulët shihni Spillen më në jug.',
  },
  {
    district: 'district-mali-i-robit',
    title: {
      sq: 'Apartamente në shitje në Malin e Robit, Golem',
      en: 'Property for Sale in Mali i Robit, Durres',
      ru: 'Мали-и-Робит, Дуррес: недвижимость и квартиры',
      uk: 'Малі-і-Робіт, Дуррес: нерухомість та квартири',
      it: 'Case in vendita a Mali i Robit, Durazzo',
      pl: 'Mali i Robit, Durrës: nieruchomości i mieszkania',
    },
    metaTitle: {
      sq: 'Apartamente në shitje në Malin e Robit — më lirë se Golemi, çmime 2026',
      en: 'Property for Sale in Mali i Robit, Durres',
      ru: 'Мали-и-Робит, Дуррес: недвижимость и квартиры',
      uk: 'Малі-і-Робіт, Дуррес: нерухомість та квартири',
      it: 'Case in vendita a Mali i Robit, Durazzo',
      pl: 'Mali i Robit, Durrës: nieruchomości i mieszkania',
    },
    metaDescription: {
      sq: 'Apartamente 1+1 dhe 2+1 dhe garsoniere në shitje në Malin e Robit, Golem: 950–1,200 €/m², pika më e lirë e plazhit Durrës–Kavajë. Foto, çmime reale, pa komision.',
      en: 'Apartments and studios for sale in Mali i Robit, the cheapest point on the Durres–Kavaje beach strip. Real prices, no commission.',
      ru: 'Квартиры и студии в Мали-и-Робит: самая дешёвая точка пляжной полосы Дуррес — Кавая. Реальные цены, без комиссии.',
      uk: 'Квартири та студії в Малі-і-Робіт: найдешевша точка пляжної смуги Дуррес — Кавая. Реальні ціни, без комісії.',
      it: 'Appartamenti e monolocali in vendita a Mali i Robit, il punto più economico della costa Durazzo–Kavajë. Prezzi reali, senza commissioni.',
      pl: 'Mieszkania i kawalerki na sprzedaż w Mali i Robit, najtańszym punkcie plaży Durrës–Kavajë. Realne ceny, bez prowizji.',
    },
    introSq:
      'Mali i Robit është pika më e lirë e bregdetit Durrës–Kavajë: apartamente dhe garsoniere me 950–1,200 €/m², disa minuta nga Golemi.',
    bottomSq:
      'Mali i Robit ndodhet mes Golemit dhe Qerretit, në rrëzë të kodrës me pisha. Çmimet e kërkuara janë 950–1,200 €/m² (2026-H1) — nën Golemin dhe shumë nën Qerretin — sepse zona është më e vogël, me më pak shërbime dhe pa ofertë të re në vijën e parë. Për blerësin me buxhet të kufizuar që kërkon det brenda 100 metrash, kjo është zgjedhja më e arsyeshme në këtë bregdet.\n\nNë katalog: garsoniere dhe apartamente 1+1 në ndërtime të reja, 2+1 për familje, shpesh me çmim për m² dhe këste gjatë ndërtimit. Të dhënat e çmimeve për këtë zonë vijnë vetëm nga njoftimet, jo nga seri agjencish — prandaj i trajtojmë si orientuese.\n\nShihni edhe Golemin ngjitur për më shumë ofertë dhe Qerretin për vila.',
  },
  {
    district: 'district-gjiri-i-lalzit',
    title: {
      sq: 'Vila dhe apartamente në shitje në Gjirin e Lalzit',
      en: 'Property for Sale in Gjiri i Lalzit, Durres',
      ru: 'Залив Лальзит, Дуррес: недвижимость и виллы',
      uk: 'Затока Лальзіт, Дуррес: нерухомість та вілли',
      it: 'Case in vendita a Gjiri i Lalzit, Durazzo',
      pl: 'Gjiri i Lalzit, Durrës: nieruchomości i wille',
    },
    metaTitle: {
      sq: 'Vila dhe apartamente në shitje në Gjirin e Lalzit — çmime 2026',
      en: 'Property for Sale in Gjiri i Lalzit, Durres',
      ru: 'Залив Лальзит, Дуррес: недвижимость и виллы',
      uk: 'Затока Лальзіт, Дуррес: нерухомість та вілли',
      it: 'Case in vendita a Gjiri i Lalzit, Durazzo',
      pl: 'Gjiri i Lalzit, Durrës: nieruchomości i wille',
    },
    metaDescription: {
      sq: 'Vila private, apartamente dhe tokë në shitje në Gjirin e Lalzit: vija e dytë 1,500–1,700 €/m², kompleksët 2,500–3,500 €/m². Foto, çmime reale, pa komision.',
      en: 'Villas, apartments and land for sale in Lalzi Bay north of Durres. Real prices, photos, no commission.',
      ru: 'Виллы, квартиры и участки в заливе Лальзит к северу от Дурреса. Реальные цены, фото, без комиссии.',
      uk: 'Вілли, квартири та ділянки в затоці Лальзіт на північ від Дурреса. Реальні ціни, фото, без комісії.',
      it: 'Ville, appartamenti e terreni in vendita nella baia di Lalzi, a nord di Durazzo. Prezzi reali, senza commissioni.',
      pl: 'Wille, mieszkania i działki na sprzedaż w zatoce Lalzit na północ od Durrës. Realne ceny, bez prowizji.',
    },
    introSq:
      'Gjiri i Lalzit është bregdeti i vilave dhe kompleksëve në veri të Durrësit: vija e dytë 1,500–1,700 €/m², rezidencat e mëdha 2,500–3,500 €/m².',
    bottomSq:
      'Gjiri i Lalzit shtrihet në veri të Durrësit, nga Kepi i Rodonit deri te plazhi i Lalzit, me pyll pishash dhe komplekse të mbyllura me plazh privat. Çmimet e kërkuara në vijën e dytë dhe në fazat e para të ndërtimit janë 1,500–1,700 €/m² (2026-H1), ndërsa rezidencat e mëdha të gjirit kërkojnë 2,500–3,500 €/m².\n\nOferta këtu ndryshon nga pjesa tjetër e Durrësit: vila private me truall, apartamente në komplekse me administrim dhe pishinë, si dhe tokë arë pranë Kepit të Rodonit për investim afatgjatë. Distanca nga Tirana është rreth 40 minuta, prandaj zona blihet si shtëpi e dytë nga banorët e kryeqytetit.\n\nPër apartamente më të lira shihni Plazhin dhe Shkëmbin e Kavajës në jug të qytetit.',
  },
  {
    district: 'district-durres-center',
    title: {sq: 'Apartamente në shitje në qendër të Durrësit'},
    metaTitle: {sq: 'Apartamente në shitje në qendër të Durrësit — Currila, Vollga, çmime 2026'},
    metaDescription: {
      sq: 'Apartamente 1+1, 2+1 dhe penthouse në shitje në qendër të Durrësit, Currila dhe Vollga: 1,900–2,800 €/m². Foto, çmime reale, pa komision.',
    },
    introSq:
      'Qendra e Durrësit, Currila dhe Vollga janë vija premium e qytetit: apartamente me 1,900–2,800 €/m² dhe penthouse mbi 3,000 €/m², me jetë gjithë vitin.',
    bottomSq:
      'Qendra e Durrësit — bulevardi, Vollga, Taulantia dhe Currila — është zona ku banohet gjithë vitin dhe ku çmimet janë më të lartat e qytetit: 1,900–2,800 €/m² (2026-H1) për apartamentet, mbi 3,000 €/m² për penthouse me pamje nga deti. Currila është rritur 70–90% që nga viti 2019.\n\nNë katalog: apartamente 1+1 dhe 2+1 në pallate të reja pranë shëtitores, apartamente të rinovuara në fondin e vjetër të qendrës, prona tregtare dhe zyra. Për blerësin që kërkon qytet, jo pushime, kjo është zona: amfiteatri, porti, stacioni dhe shkollat janë në këmbë.\n\nPër buxhet më të ulët shihni Shkozetin dhe Rrashbullin brenda qytetit, ose Plazhin përgjatë detit.',
  },
  {
    district: 'district-kavaje',
    title: {
      sq: 'Shtëpi dhe apartamente në shitje në Kavajë',
      en: 'Property for Sale in Kavajë',
      ru: 'Кавая: недвижимость, дома и квартиры',
      uk: 'Кавая: нерухомість, будинки та квартири',
      it: 'Case in vendita a Kavajë',
      pl: 'Kavajë: nieruchomości, domy i mieszkania',
    },
    metaTitle: {
      sq: 'Shtëpi dhe apartamente në shitje në Kavajë — qytet, Golem, Qerret',
      en: 'Property for Sale in Kavajë — Houses and Apartments',
      ru: 'Кавая: недвижимость, дома и квартиры',
      uk: 'Кавая: нерухомість, будинки та квартири',
      it: 'Case in vendita a Kavajë',
      pl: 'Kavajë: nieruchomości, domy i mieszkania',
    },
    metaDescription: {
      sq: 'Shtëpi private, apartamente, kapanone dhe tokë në shitje në Kavajë dhe rrethinat: më lirë se plazhi, dhjetë minuta nga deti. Foto, çmime reale, pa komision.',
      en: 'Houses, apartments and commercial property for sale in Kavajë, the town behind the Golem and Qerret beaches. Real prices, no commission.',
      ru: 'Дома, квартиры и коммерческая недвижимость в Кавае, городе за пляжами Голем и Черрет. Реальные цены, без комиссии.',
      uk: 'Будинки, квартири та комерційна нерухомість у Каваї, місті за пляжами Голем і Черрет. Реальні ціни, без комісії.',
      it: 'Case, appartamenti e immobili commerciali in vendita a Kavajë, la città dietro le spiagge di Golem e Qerret. Prezzi reali, senza commissioni.',
      pl: 'Domy, mieszkania i nieruchomości komercyjne na sprzedaż w Kavajë, mieście za plażami Golem i Qerret. Realne ceny, bez prowizji.',
    },
    introSq:
      'Kavaja është qyteti pas plazheve të Golemit dhe Qerretit: apartamente më lirë se bregu, shtëpi me truall në fshatra dhe prona tregtare në rrugën kryesore.',
    bottomSq:
      'Kavaja shtrihet disa kilometra në brendësi të bregdetit, në rrugën Durrës–Rrogozhinë, dhe jeton gjithë vitin: hekurudhë, treg, shkolla, qendër shëndetësore. Golemi, Mali i Robit dhe Qerreti janë plazhet e saj, por çmimet në qytet janë një treg tjetër nga vija e parë — më të ulëta për të njëjtën sipërfaqe, pa premiumin e pamjes nga deti.\n\nNë katalog: apartamente 1+1 dhe 2+1 në qytet, shtëpi private me truall në fshatrat përreth, kapanone dhe godina tregtare në rrugën kryesore e në hyrje të qytetit, tokë për ndërtim. Për këtë zonë nuk kemi ende seri çmimesh nga burime të pavarura, prandaj orientohuni nga çmimet e njoftimeve.\n\nPër plazh shihni Golemin dhe Qerretin, dhjetë minuta larg me makinë.',
  },
  {
    district: 'district-spille',
    title: {
      sq: 'Tokë dhe prona në shitje në Spille',
      en: 'Property for Sale in Spille',
      ru: 'Спилле: участки и недвижимость у моря',
      uk: 'Спілле: ділянки та нерухомість біля моря',
      it: 'Terreni e immobili in vendita a Spille',
      pl: 'Spille: działki i nieruchomości nad morzem',
    },
    metaTitle: {
      sq: 'Tokë dhe prona në shitje në Spille — plazhi, Rreth-Greth, Vilë-Bashtovë',
      en: 'Property for Sale in Spille — Land, Hotels, Apartments',
      ru: 'Спилле: участки и недвижимость у моря',
      uk: 'Спілле: ділянки та нерухомість біля моря',
      it: 'Terreni e immobili in vendita a Spille',
      pl: 'Spille: działki i nieruchomości nad morzem',
    },
    metaDescription: {
      sq: 'Tokë arë dhe truall me çmim për m², hotele dhe apartamentet e para në shitje në Spille, Rreth-Greth dhe Vilë-Bashtovë. Foto, çmime reale, pa komision.',
      en: 'Land priced per square metre, hotel buildings and the first apartment blocks for sale in Spille, the southern end of the Durres coast. Real prices, no commission.',
      ru: 'Участки с ценой за м², здания отелей и первые квартиры в Спилле, на южном краю побережья Дурреса. Реальные цены, без комиссии.',
      uk: 'Ділянки з ціною за м², будівлі готелів і перші квартири у Спілле, на південному краю узбережжя Дурреса. Реальні ціни, без комісії.',
      it: 'Terreni al metro quadro, edifici alberghieri e i primi appartamenti in vendita a Spille, all’estremità sud della costa di Durazzo. Prezzi reali, senza commissioni.',
      pl: 'Działki z ceną za metr, budynki hotelowe i pierwsze mieszkania na sprzedaż w Spille, na południowym krańcu wybrzeża Durrës. Realne ceny, bez prowizji.',
    },
    introSq:
      'Spille është skaji jugor i bregdetit të Durrësit: plazh i gjatë me pisha, tokë që ende shitet me metër katror, hotele dhe apartamentet e para.',
    bottomSq:
      'Spille ndodhet rreth 35 km në jug të Durrësit, në Bashkinë Rrogozhinë, me plazh disa kilometra të gjatë, brez pishash dhe lagunat e grykëderdhjes së Shkumbinit që e mbajnë zonën me ndërtime të ulëta. Oferta këtu është kryesisht tokë — arë dhe truall në Rreth-Greth, Vilë-Bashtovë dhe Spille Kodër, me çmim për metër katror — si dhe godina hotelesh në vijën e parë dhe pallatet e para me garsoniere, 1+1 dhe 2+1.\n\nÇmimet janë shumë nën Golemin dhe Qerretin, por edhe infrastruktura është më pak: rruga nga Rrogozhina është hyrja e vetme dhe shërbimet punojnë në sezon. Është zonë për blerësin që merr truall pranë detit sot dhe pret zhvillimin. Për këtë zonë nuk kemi seri çmimesh nga burime të pavarura — çmimet e njoftimeve janë orientimi.\n\nPër apartamente të gatshme pranë detit shihni Golemin, Malin e Robit dhe Qerretin.',
  },
]

type SeoDoc = {
  _id: string
  pageScope: string
  title?: Localized
  seo?: {metaTitle?: Localized}
}

async function main() {
  const docs = await client.fetch<SeoDoc[]>(`*[_type == "catalogSeoPage"]{_id, pageScope, title, seo{metaTitle}}`)
  const byId = new Map(docs.map((d) => [d._id, d]))
  const tx = client.transaction()
  let h1Changes = 0
  let zoneWrites = 0
  let created = 0

  // 1. H1 := brand-stripped metaTitle, every locale, every document.
  for (const doc of docs) {
    const patch: Record<string, string> = {}
    for (const loc of LOCALES) {
      const meta = stripBrand(doc.seo?.metaTitle?.[loc] ?? '')
      if (meta && doc.title?.[loc] !== meta) patch[`title.${loc}`] = meta
    }
    if (Object.keys(patch).length) {
      h1Changes += Object.keys(patch).length
      if (isDry) console.log(`h1  ${doc._id}: ${Object.entries(patch).map(([k, v]) => `${k}="${v}"`).join('; ')}`)
      else tx.patch(doc._id, (p) => p.set(patch))
    }
  }

  // 2. Hand-written Albanian copy for the Durrës coast, on top of step 1.
  for (const zone of ZONES) {
    const id = zone.district ? `catalogSeoPage-district-${zone.district}` : `catalogSeoPage-city-${CITY_ID}`
    const set: Record<string, unknown> = {
      'intro.sq': zone.introSq,
      'bottomText.sq': zone.bottomSq,
    }
    for (const loc of LOCALES) {
      if (zone.title[loc]) set[`title.${loc}`] = zone.title[loc]
      if (zone.metaTitle[loc]) set[`seo.metaTitle.${loc}`] = zone.metaTitle[loc]
      if (zone.metaDescription[loc]) set[`seo.metaDescription.${loc}`] = zone.metaDescription[loc]
    }
    if (!byId.has(id)) {
      if (!zone.district) throw new Error(`city page ${id} missing`)
      created += 1
      const doc = {
        _id: id,
        _type: 'catalogSeoPage',
        pageScope: 'district',
        city: {_type: 'reference', _ref: CITY_ID},
        district: {_type: 'reference', _ref: zone.district},
        active: true,
        seo: {_type: 'localizedSeo', noIndex: false},
      }
      if (isDry) console.log(`new ${id}`)
      else tx.createIfNotExists(doc as never)
    }
    zoneWrites += 1
    if (isDry) {
      console.log(`sq  ${id}: H1 "${zone.title.sq}" · intro ${zone.introSq.length} · bottom ${zone.bottomSq.length} chars`)
    } else {
      tx.patch(id, (p) => p.set(set))
    }
  }

  console.log(`\n${h1Changes} H1 fields aligned to metaTitle across ${docs.length} documents; ${zoneWrites} Durrës zones written (${created} new).`)
  if (isDry) {
    console.log('Dry run — nothing written.')
    return
  }
  await tx.commit()
  console.log('Committed.')
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
