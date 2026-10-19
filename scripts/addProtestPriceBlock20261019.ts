/**
 * Track B, item 5 (2026-10-19): the two protest articles get a "what this means
 * for prices" section in Ukrainian and Russian, the languages that bring their
 * traffic (314 entries a month, no leads). The section states the Domlivo
 * Durrës asking-price index (20.09 and 01.10.2026 editions, unchanged) and the
 * live listing medians of 18.10.2026, then drops in the live zone band and the
 * Durrës PDF guide card (`guideDownloadEmbed`).
 *
 * Every figure is from Domlivo's own published index:
 *   /blog/durres-asking-price-index-2026-10 and /albania/durres/info.
 *
 * Inserted before the "what to do if you buy now" heading in the impact
 * article and at the end of the overview. Idempotent: a block with the key
 * prefix `price-index-2026-10` is never added twice. Backup of the previous
 * bodies to scripts/data/protest-price-block-2026-10-19/.
 *
 * `--no-guide` leaves the PDF card out (for a site that does not render
 * `guideDownloadEmbed` yet); a later run without it adds the card after the
 * zone band of the section already in place.
 *
 * Run: npx tsx scripts/addProtestPriceBlock20261019.ts [--no-guide] [--execute]
 */
import fs from 'node:fs'
import path from 'node:path'
import {getSanityClientForScripts} from './lib/sanityEnvClient'

const execute = process.argv.includes('--execute')
const noGuide = process.argv.includes('--no-guide')
const P = 'price-index-2026-10'
type Block = Record<string, unknown> & {_key: string; _type: string; style?: string; children?: Array<{text?: string}>}

let n = 0
const k = () => `${P}-${(n += 1)}`
function para(parts: Array<string | {text: string; href: string}>, style: 'normal' | 'h2' = 'normal'): Block {
  const markDefs: Array<Record<string, unknown>> = []
  const children = parts.map((p) => {
    if (typeof p === 'string') return {_key: k(), _type: 'span', marks: [], text: p}
    const def = k()
    markDefs.push({_key: def, _type: 'link', href: p.href})
    return {_key: k(), _type: 'span', marks: [def], text: p.text}
  })
  return {_key: k(), _type: 'block', style, markDefs, children}
}

const guideBlock = (): Block => ({_key: `${P}-guide`, _type: 'guideDownloadEmbed', guide: 'durres-buying-guide'})
const INDEX = '/blog/durres-asking-price-index-2026-10'
const INFO = '/albania/durres/info'

function section(locale: 'uk' | 'ru', zoneId: string): Block[] {
  const t = {
    ru: {
      h: 'Что это значит для цен: цифры индекса Domlivo',
      p1: 'С начала протестов цены предложения на наших объявлениях не упали. В индексе цен предложения Дурреса медиана за квадратный метр в выпусках 20 сентября и 1 октября 2026 года была одинаковой: 1 413 € по 268 квартирам, изменение 0%. На 18 октября 2026 года медиана 511 квартир и студий, выставленных на Domlivo в Дурресе, составила 1 500 € за м². Выборка за это время выросла, поэтому разница отражает более полный набор объявлений, а не рост цен.',
      p2: 'По районам на 18 октября: Плаж — 1 611 € за м² (148 квартир), Голем — 1 376 € (139), Шкемби — 1 404 € (72), центр — 1 616 € (66). Это цены предложения, а не цены сделок: данные о сделках Банк Албании публикует раз в полгода.',
      p3a: 'Ежемесячные цифры — в ',
      p3l: 'индексе цен Дурреса',
      p3b: ', текущая полоса цен по районам — на ',
      p3l2: 'странице цен Дурреса',
      p3c: '.',
    },
    uk: {
      h: 'Що це означає для цін: цифри індексу Domlivo',
      p1: 'Від початку протестів ціни пропозиції в наших оголошеннях не знизилися. В індексі цін пропозиції Дурреса медіана за квадратний метр у випусках 20 вересня та 1 жовтня 2026 року була однаковою: 1 413 € за 268 квартирами, зміна 0%. Станом на 18 жовтня 2026 року медіана 511 квартир і студій, виставлених на Domlivo в Дурресі, становила 1 500 € за м². Вибірка за цей час зросла, тож різниця відображає повніший набір оголошень, а не зростання цін.',
      p2: 'За районами на 18 жовтня: Плаж — 1 611 € за м² (148 квартир), Голем — 1 376 € (139), Шкембі — 1 404 € (72), центр — 1 616 € (66). Це ціни пропозиції, а не ціни угод: дані про угоди Банк Албанії публікує раз на пів року.',
      p3a: 'Щомісячні цифри — в ',
      p3l: 'індексі цін Дурреса',
      p3b: ', поточний діапазон цін за районами — на ',
      p3l2: 'сторінці цін Дурреса',
      p3c: '.',
    },
  }[locale]
  return [
    para([t.h], 'h2'),
    para([t.p1]),
    para([t.p2]),
    para([t.p3a, {text: t.p3l, href: INDEX}, t.p3b, {text: t.p3l2, href: INFO}, t.p3c]),
    {_key: k(), _type: 'zoneStatsEmbed', zone: {_type: 'reference', _ref: zoneId}},
    ...(noGuide ? [] : [guideBlock()]),
  ]
}

const TARGETS: Array<{id: string; before?: Record<'uk' | 'ru', string>}> = [
  {
    id: 'blogPost-albania-protests-property-market-impact',
    before: {ru: 'Что делать, если вы покупаете сейчас', uk: 'Що робити, якщо ви купуєте зараз'},
  },
  {id: 'blogPost-albania-protests-2026-what-is-happening'},
]

async function main(): Promise<void> {
  const client = getSanityClientForScripts()
  const zoneId = await client.fetch<string>(`*[_type=="city" && slug.current=="durres" && !(_id in path("drafts.**"))][0]._id`)
  if (!zoneId) throw new Error('city durres not found')
  const backup: Record<string, unknown> = {}
  const tx = client.transaction()
  for (const t of TARGETS) {
    const doc = await client.fetch<{content: Record<string, Block[]>}>(`*[_id==$id][0]{content}`, {id: t.id})
    if (!doc) throw new Error(`no ${t.id}`)
    const set: Record<string, unknown> = {}
    for (const l of ['uk', 'ru'] as const) {
      const body = doc.content[l] ?? []
      if (body.some((b) => b._key.startsWith(P))) {
        const zoneAt = body.findIndex((b) => b._key.startsWith(P) && b._type === 'zoneStatsEmbed')
        if (noGuide || body.some((b) => b._key === `${P}-guide`) || zoneAt < 0) {
          console.log(`skip ${t.id} [${l}]: section already there`)
          continue
        }
        backup[`${t.id}:${l}`] = body
        set[`content.${l}`] = [...body.slice(0, zoneAt + 1), guideBlock(), ...body.slice(zoneAt + 1)]
        console.log(`${t.id} [${l}]: add the guide card after the zone band`)
        continue
      }
      backup[`${t.id}:${l}`] = body
      const blocks = section(l, zoneId)
      let at = body.length
      if (t.before) {
        at = body.findIndex((b) => b.style === 'h2' && (b.children ?? []).map((c) => c.text).join('').trim() === t.before![l])
        if (at < 0) throw new Error(`${t.id} [${l}]: heading "${t.before[l]}" not found`)
      }
      set[`content.${l}`] = [...body.slice(0, at), ...blocks, ...body.slice(at)]
      console.log(`${t.id} [${l}]: insert ${blocks.length} blocks at ${at} of ${body.length}`)
    }
    if (Object.keys(set).length) tx.patch(t.id, (p) => p.set(set))
  }
  if (!execute) {
    console.log('\nDry run. Re-run with --execute.')
    return
  }
  const dir = path.resolve(process.cwd(), 'scripts/data/protest-price-block-2026-10-19')
  fs.mkdirSync(dir, {recursive: true})
  fs.writeFileSync(path.join(dir, `backup-${Date.now()}.json`), JSON.stringify(backup, null, 2))
  const res = await tx.commit()
  console.log(`transaction ${res.transactionId}`)
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
