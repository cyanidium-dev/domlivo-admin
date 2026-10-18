import https from 'https'

const SANITY_PROJECT_ID = 'g4aqp6ex'
const SANITY_DATASET = 'production'
const SANITY_TOKEN = 'skkpHfFMHF5MeSnGL312RLexi4eBTG9nlZ2UeQ5DHSKiBRiNlsfqT3uFBVJfOkdJrImcIWIGfEeDpYGYhYaDErY1dTUorruOIuea08fNs7ioCicSDB4oQxsrmcAk4eu0eXDmVssgLHiDW4lLf3jMI6vRdJyWN9OZdiR7cUHItUOYOshKuX0U'
const SANITY_MUTATE = `https://${SANITY_PROJECT_ID}.api.sanity.io/v2024-01-01/data/mutate/${SANITY_DATASET}`
const SANITY_QUERY_BASE = `https://${SANITY_PROJECT_ID}.api.sanity.io/v2024-01-01/data/query/${SANITY_DATASET}`

function sanityMutate(mutations) {
  return new Promise((resolve, reject) => {
    const body = Buffer.from(JSON.stringify({ mutations }), 'utf8')
    const url = new URL(SANITY_MUTATE + '?returnIds=true')
    const req = https.request({
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SANITY_TOKEN}`,
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': body.length,
      }
    }, res => {
      const chunks = []
      res.on('data', c => chunks.push(c))
      res.on('end', () => {
        try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))) }
        catch (e) { reject(e) }
      })
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

function sanityQuery(groq) {
  return new Promise((resolve, reject) => {
    const url = new URL(SANITY_QUERY_BASE + '?query=' + encodeURIComponent(groq))
    const req = https.request({
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'GET',
      headers: { Authorization: `Bearer ${SANITY_TOKEN}` }
    }, res => {
      const chunks = []
      res.on('data', c => chunks.push(c))
      res.on('end', () => {
        try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))) }
        catch (e) { reject(e) }
      })
    })
    req.on('error', reject)
    req.end()
  })
}

// All title corrections: id → {ru, en, sq, uk}
const TITLE_FIXES = [
  { id: '2fcTC6RE9VYvTVnVmT9L3U',
    ru: 'Квартира 1+1 у моря, 70 м до пляжа',
    en: 'Apartment 1+1 by the sea, 70 m to the beach',
    sq: 'Apartament 1+1 pranë detit, 70 m nga plazhi',
    uk: 'Квартира 1+1 біля моря, 70 м до пляжу',
    seoRuTitle: 'Квартира 1+1 у моря, 70 м до пляжа | купить в Дурресе — Domlivo',
    seoUkTitle: 'Квартира 1+1 біля моря | купити в Дурресі — Domlivo',
  },
  { id: '2fcTC6RE9VYvTVnVmT9wAm',
    ru: 'Студия 42 м²',
    en: 'Studio 42 m²',
    sq: 'Studio 42 m²',
    uk: 'Студія 42 м²',
  },
  { id: '2fcTC6RE9VYvTVnVmT9yx2',
    ru: 'Просторная, стильная студия',
    en: 'Spacious, stylish studio',
    sq: 'Studio e hapësirshme dhe elegante',
    uk: 'Простора, стильна студія',
  },
  { id: '2fcTC6RE9VYvTVnVmTA7oi',
    ru: 'Квартира 2+1, 200 м от моря',
    en: 'Apartment 2+1, 200 m from the sea',
    sq: 'Apartament 2+1, 200 m nga deti',
    uk: 'Квартира 2+1, 200 м від моря',
  },
  { id: '2fcTC6RE9VYvTVnVmTATt6',
    ru: 'Уютная квартира 1+1 у моря',
    en: 'Cosy apartment 1+1 by the sea',
    sq: 'Apartament 1+1 pranë detit',
    uk: 'Затишна квартира 1+1 біля моря',
  },
  { id: '2fcTC6RE9VYvTVnVmTAWuq',
    ru: 'Уютная квартира 1+1, 50 м от моря',
    en: 'Cosy apartment 1+1, 50 m from the sea',
    sq: 'Apartament 1+1, 50 m nga deti',
    uk: 'Затишна квартира 1+1, 50 м від моря',
  },
  { id: '2fcTC6RE9VYvTVnVmTAoQe',
    ru: 'Видовая квартира 1+1 в районе Плепа',
    en: 'Sea view apartment 1+1 in Plepa district',
    sq: 'Apartament 1+1 me pamje panoramike në lagjen Plepa',
    uk: 'Видова квартира 1+1 в районі Плепа',
  },
  { id: '2fcTC6RE9VYvTVnVmTB5oi',
    ru: 'Дом во Влёре',
    en: 'House in Vlore',
    sq: 'Shtëpi në Vlorë',
    uk: 'Будинок у Вльорі',
  },
  { id: '2fcTC6RE9VYvTVnVmTBCai',
    ru: 'Квартира с большой террасой и видом на море',
    en: 'Apartment with large terrace and sea view',
    sq: 'Apartament me tarracë të madhe dhe pamje deti',
    uk: 'Квартира з великою терасою і видом на море',
  },
  { id: '2fcTC6RE9VYvTVnVmTAtQK',
    ru: 'Большой семейный дом в Дурресе',
    en: 'Large family house in Durres',
    sq: 'Shtëpi familjare e madhe në Durrës',
    uk: 'Великий сімейний будинок у Дурресі',
  },
  { id: 'Bvr0zm8arkql17QDTGKeaR',
    ru: 'Видовая квартира 2+1 — Шенджин',
    en: 'Sea view apartment 2+1 — Shëngjin',
    sq: 'Apartament 2+1 me pamje deti — Shëngjin',
    uk: 'Видова квартира 2+1 — Шенджін',
  },
  { id: 'Bvr0zm8arkql17QDTGKspz',
    ru: 'Студия с панорамными окнами, 400 м до моря',
    en: 'Studio with panoramic windows, 400 m to the sea',
    sq: 'Studio me dritare panoramike, 400 m nga deti',
    uk: 'Студія з панорамними вікнами, 400 м до моря',
  },
  { id: 'Bvr0zm8arkql17QDTGLgSR',
    ru: 'Квартира у моря, 68 м²',
    en: 'Apartment by the sea, 68 m²',
    sq: 'Apartament pranë detit, 68 m²',
    uk: 'Квартира біля моря, 68 м²',
  },
  { id: 'Bvr0zm8arkql17QDTGOMQl',
    ru: 'Отель у моря — действующий бизнес + земля',
    en: 'Hotel by the sea — operating business + land',
    sq: 'Hotel pranë detit — biznes aktiv + tokë',
    uk: 'Готель біля моря — діючий бізнес + земля',
  },
  { id: 'tAsBDJwz7xVWniA1Klvgdw',
    ru: 'Премиальная квартира 1+1 в центре Дурреса',
    en: 'Premium apartment 1+1 in the center of Durres',
    sq: 'Apartament premium 1+1 në qendër të Durrësit',
    uk: 'Преміальна квартира 1+1 в центрі Дурреса',
  },
  { id: 'tAsBDJwz7xVWniA1KlvlZm',
    ru: 'Квартира 2+1 с террасой 99 м² и видом на море — Шенджин',
    en: 'Apartment 2+1 with 99 m² terrace and sea view — Shëngjin',
    sq: 'Apartament 2+1 me tarracë 99 m² dhe pamje deti — Shëngjin',
    uk: 'Квартира 2+1 з терасою 99 м² та видом на море — Шенджін',
  },
  { id: 'tAsBDJwz7xVWniA1Klvo4E',
    ru: 'Квартира 2+1 у моря с новым ремонтом, р-н Пляж',
    en: 'Renovated apartment 2+1 by the sea, Beach district',
    sq: 'Apartament 2+1 pranë detit me rinovim të ri, lagjja Plazh',
    uk: 'Квартира 2+1 біля моря з новим ремонтом, р-н Пляж',
  },
  { id: 'tAsBDJwz7xVWniA1Klvot6',
    ru: 'Большая квартира 3+1 с двумя санузлами',
    en: 'Large apartment 3+1 with two bathrooms',
    sq: 'Apartament i madh 3+1 me dy banja',
    uk: 'Велика квартира 3+1 з двома санвузлами',
  },
  { id: 'tAsBDJwz7xVWniA1Klvw10',
    ru: 'Квартира у моря, 61 м²',
    en: 'Apartment by the sea, 61 m²',
    sq: 'Apartament pranë detit, 61 m²',
    uk: 'Квартира біля моря, 61 м²',
  },
  { id: 'tAsBDJwz7xVWniA1Klvwum',
    ru: 'Квартира 1+1 с видом на море',
    en: 'Apartment 1+1 with sea view',
    sq: 'Apartament 1+1 me pamje nga deti',
    uk: 'Квартира 1+1 з видом на море',
  },
  { id: 'tAsBDJwz7xVWniA1KlvzHG',
    ru: 'Бюджетная квартира 1+1 в хорошей локации',
    en: 'Budget apartment 1+1 in a great location',
    sq: 'Apartament 1+1 me çmim të përballueshëm',
    uk: 'Бюджетна квартира 1+1 у хорошій локації',
  },
  { id: 'tAsBDJwz7xVWniA1Klw2d2',
    ru: 'Видовая студия с панорамным видом',
    en: 'Studio with panoramic sea view',
    sq: 'Studio me pamje panoramike deti',
    uk: 'Видова студія з панорамним видом',
  },
  { id: 'tAsBDJwz7xVWniA1Klw5EE',
    ru: 'Новострой — инвестиционный объект в Саранде',
    en: 'New build — investment property in Saranda',
    sq: 'Ndërtim i ri — investim në Sarandë',
    uk: 'Новобудова — інвестиційний обʼєкт у Саранді',
  },
  { id: 'tAsBDJwz7xVWniA1Klw8Se',
    ru: 'Большая квартира 1+1 в районе Плепа',
    en: 'Large apartment 1+1 in Plepa district',
    sq: 'Apartament i madh 1+1 në lagjen Plepa',
    uk: 'Велика квартира 1+1 в районі Плепа',
  },
  { id: 'tAsBDJwz7xVWniA1KlwIwK',
    ru: 'Уютная квартира 1+1 у горы',
    en: 'Cosy apartment 1+1 near the mountain',
    sq: 'Apartament 1+1 pranë malit',
    uk: 'Затишна квартира 1+1 біля гори',
  },
]

async function main() {
  console.log('Fixing titles with correct UTF-8 encoding...\n')

  // Process in batches of 10
  for (let i = 0; i < TITLE_FIXES.length; i += 10) {
    const batch = TITLE_FIXES.slice(i, i + 10)
    const mutations = batch.flatMap(fix => {
      const sets = {
        'title.ru': fix.ru,
        'title.en': fix.en,
        'title.sq': fix.sq,
        'title.uk': fix.uk,
      }
      // Also update SEO ru/uk titles if provided
      if (fix.seoRuTitle) sets['seo.ru.title'] = fix.seoRuTitle
      if (fix.seoUkTitle) sets['seo.uk.title'] = fix.seoUkTitle
      // Also update seo.ru.description and seo.uk.description to reference correct title
      sets['seo.ru.title'] = `${fix.ru} | Domlivo`
      sets['seo.uk.title'] = `${fix.uk} | Domlivo`
      return [{ patch: { id: fix.id, set: sets } }]
    })

    const result = await sanityMutate(mutations)
    if (result.error) {
      console.error('Error:', JSON.stringify(result.error).slice(0, 200))
    } else {
      const updated = result.results?.filter(r => r.operation === 'update').length || 0
      console.log(`Batch ${Math.floor(i/10)+1}: Updated ${updated}/${batch.length} documents`)
      batch.forEach(fix => console.log(`  ✓ ${fix.id}: "${fix.ru}"`))
    }
  }

  // Verify one
  console.log('\nVerifying first property...')
  const check = await sanityQuery('*[_type=="property" && _id=="2fcTC6RE9VYvTVnVmT9L3U"][0]{title}')
  console.log('title.ru =', check.result?.title?.ru)
  console.log('title.en =', check.result?.title?.en)

  console.log('\n✓ All titles fixed!')
}

main().catch(err => { console.error('FATAL:', err); process.exit(1) })
