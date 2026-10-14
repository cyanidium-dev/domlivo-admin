/**
 * One-shot, 2026-10-14. The generated type × city guides (landing-type-*,
 * e.g. "Apartment in Durrës") inserted the property type with its capital
 * into running text: "Чому саме Квартира у місті Дуррес", "Покупка жилья:
 * Квартира в городе Дуррес". The owner read it as broken copy. This lowercases
 * the type word where it sits mid-sentence, in ru/uk/pl/it/sq only (German
 * capitalises nouns; English already reads "an apartment").
 *
 *   npx tsx scripts/fixTypeLandingCapitals20261014.ts            (dry)
 *   npx tsx scripts/fixTypeLandingCapitals20261014.ts --execute
 */
import path from 'node:path'
import {config} from 'dotenv'
import {createClient} from '@sanity/client'

config({path: path.resolve(process.cwd(), '.env')})
const execute = process.argv.includes('--execute')
const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID!,
  dataset: process.env.SANITY_DATASET || 'production',
  apiVersion: '2025-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
})

const LOCALES = ['ru', 'uk', 'pl', 'it', 'sq'] as const
// A type word preceded by a lowercase letter, a colon or a comma and a space,
// and followed by the "in <city>" phrase of the template.
const RE =
  /(?<=[a-zа-яіїєёçëąćęłńóśźż:,] )(Квартира|Дом|Вилла|Будинок|Вілла|Mieszkanie|Dom|Willa|Appartamento|Casa|Villa|Apartament|Shtëpi|Vilë)(?= (в городе|у місті|w mieście|a |në ))/gu

type Doc = {_id: string; _rev: string; pageSections?: Array<Record<string, unknown>>}

function fixString(s: string): string {
  return s.replace(RE, (w) => w.charAt(0).toLocaleLowerCase() + w.slice(1))
}

async function main() {
  const docs = await client.fetch<Doc[]>(
    `*[_type=="landingPage" && _id match "landing-type-*" && !(_id in path("drafts.**"))]{_id, _rev, pageSections}`,
  )
  let changed = 0
  const tx = client.transaction()
  for (const doc of docs) {
    const set: Record<string, unknown> = {}
    ;(doc.pageSections ?? []).forEach((section) => {
      const key = section._key as string
      for (const field of ['title', 'subtitle', 'description']) {
        const loc = section[field] as Record<string, unknown> | undefined
        if (!loc || typeof loc !== 'object') continue
        for (const l of LOCALES) {
          const v = loc[l]
          if (typeof v === 'string') {
            const f = fixString(v)
            if (f !== v) {
              set[`pageSections[_key=="${key}"].${field}.${l}`] = f
              console.log(doc._id, l, JSON.stringify(v.slice(0, 60)), '→', JSON.stringify(f.slice(0, 60)))
            }
          }
        }
      }
      const content = section.content as Record<string, unknown> | undefined
      if (content && typeof content === 'object') {
        for (const l of LOCALES) {
          const blocks = content[l]
          if (!Array.isArray(blocks)) continue
          let touched = false
          const next = blocks.map((b: any) => {
            if (b?._type !== 'block' || !Array.isArray(b.children)) return b
            return {
              ...b,
              children: b.children.map((c: any) => {
                if (typeof c?.text !== 'string') return c
                const f = fixString(c.text)
                if (f !== c.text) {
                  touched = true
                  console.log(doc._id, l, 'block', JSON.stringify(c.text.slice(0, 60)), '→', JSON.stringify(f.slice(0, 60)))
                }
                return f === c.text ? c : {...c, text: f}
              }),
            }
          })
          if (touched) set[`pageSections[_key=="${key}"].content.${l}`] = next
        }
      }
    })
    if (Object.keys(set).length) {
      changed++
      tx.patch(doc._id, (p) => p.ifRevisionId(doc._rev).set(set))
    }
  }
  console.log(`${execute ? 'EXECUTE' : 'DRY'}: ${changed} of ${docs.length} docs to patch`)
  if (execute && changed) console.log('transaction', (await tx.commit()).transactionId)
}
main().catch((e) => {
  console.error(e.message)
  process.exit(1)
})
