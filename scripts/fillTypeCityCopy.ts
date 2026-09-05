/**
 * Replaces the TODO-CONTENT paragraphs on the ТЗ-17 type×city landings with
 * the editorial prose in scripts/lib/typeCityCopy.ts (English), translated
 * into the other five locales through the studio-translate endpoint. Block
 * keys are preserved (`tc-<locale>-p1..p3`), so the section structure and the
 * generator's headings stay exactly as generated; only the three paragraphs
 * change. Writes the published document directly (these pages have no
 * drafts). Dry by default; snapshots each document before writing.
 *
 * Run:
 *   npm run fill:type-city-copy                 # dry: shows what would change
 *   npm run fill:type-city-copy -- --execute
 *   npm run fill:type-city-copy -- --only apartment-durres --execute
 */
import path from 'node:path'
import fs from 'node:fs'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'
import {PROJECT_LOCALE_IDS} from '../lib/sanity/localizedPaste/projectLocales'
import {studioTranslate} from './lib/studioTranslateFetch'
import {COPY, type CitySlug, type TypeSlug} from './lib/typeCityCopy'

loadDotenv({path: path.resolve(process.cwd(), '.env')})
const args = process.argv.slice(2)
const execute = args.includes('--execute')
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : ''
const BASE = 'en'
const TARGETS = PROJECT_LOCALE_IDS.filter((l) => l !== BASE)
const client = createClient({
  projectId: (process.env.SANITY_PROJECT_ID || '').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: '2024-06-01',
  token: process.env.SANITY_API_TOKEN?.trim(),
  useCdn: false,
})

type Block = {_key: string; _type: string; style?: string; markDefs?: unknown[]; children?: Array<{_key: string; _type: string; marks?: string[]; text?: string}>}
type Landing = {_id: string; slug: string; pageSections: Array<{_key: string; _type: string; content?: Record<string, Block[]>}>}

const PARAS: Array<keyof (typeof COPY)['durres']['apartment']> = ['why', 'who', 'check']

function paragraphBlock(key: string, text: string): Block {
  return {_key: key, _type: 'block', style: 'normal', markDefs: [], children: [{_key: `${key}s`, _type: 'span', marks: [], text}]}
}

async function main(): Promise<void> {
  const landings: Landing[] = await client.fetch(
    `*[_type=="landingPage" && _id match "landing-type-*" && !(_id in path("drafts.**"))]{ _id, "slug": slug.current, pageSections[_type=="seoTextSection"]{_key, _type, content} }`,
  )
  const todo = landings.filter((l) => !only || l.slug === only)
  let planned = 0
  const plans: Array<{l: Landing; type: TypeSlug; city: CitySlug; sectionKey: string; ops: Record<string, unknown>}> = []

  for (const l of todo) {
    const m = /^([a-z]+)-([a-z]+)$/.exec(l.slug)
    const type = (m?.[1] ?? '') as TypeSlug
    const city = (m?.[2] ?? '') as CitySlug
    const copy = type && city ? COPY[city]?.[type] : undefined
    const section = l.pageSections[0]
    if (!copy || !section?.content) {
      console.log(`  skip  ${l.slug} — ${!copy ? 'no copy for this pair' : 'no seoTextSection content'}`)
      continue
    }
    const enBlocks = section.content.en ?? []
    const stillStub = enBlocks.some((b) => (b.children?.[0]?.text ?? '').startsWith('TODO-CONTENT'))
    if (!stillStub && !args.includes('--redo')) {
      console.log(`  done  ${l.slug} — already filled (pass --redo to rewrite)`)
      continue
    }
    console.log(`  ${stillStub ? 'fill  ' : 'redo  '} ${l.slug}  (${PARAS.length} paragraphs × ${1 + TARGETS.length} locales)`)
    planned += 1
    plans.push({l, type, city, sectionKey: section._key, ops: {}})
  }
  console.log(`\n${planned} landing(s) to write.`)
  if (!execute) {
    console.log('Dry run. Re-run with --execute.')
    return
  }

  for (const p of plans) {
    const copy = COPY[p.city][p.type]
    // One paragraph per request and at most two target locales per request:
    // three ~800-character paragraphs into five locales at once exceeds the
    // endpoint's output budget and comes back as truncated JSON (seen on the
    // first run, 2026-09-05: 3 of 12 written, then "items is string").
    const LOCALE_GROUPS: string[][] = [['uk', 'ru'], ['sq', 'it'], ['pl']]
    const translated = new Map<string, Record<string, string>>()
    console.log(`\n${p.l.slug}: translating ${PARAS.length} paragraphs → ${TARGETS.join(', ')} (${PARAS.length * LOCALE_GROUPS.length} requests)`)
    for (let i = 0; i < PARAS.length; i += 1) {
      const key = `p${i + 1}`
      const merged: Record<string, string> = {}
      for (const group of LOCALE_GROUPS) {
        let lastErr: unknown
        for (let attempt = 1; attempt <= 3; attempt += 1) {
          try {
            const {items: out} = await studioTranslate(BASE, [{key, kind: 'text', text: copy[PARAS[i]]}], group)
            Object.assign(merged, out[0]?.locales ?? {})
            lastErr = undefined
            break
          } catch (e) {
            lastErr = e
            console.log(`    retry ${attempt}/3 for ${key} → ${group.join(',')}: ${e instanceof Error ? e.message : e}`)
          }
        }
        if (lastErr) throw lastErr
      }
      translated.set(key, merged)
    }
    const ops: Record<string, unknown> = {}
    const locales = [BASE, ...TARGETS]
    for (const loc of locales) {
      for (let i = 0; i < PARAS.length; i += 1) {
        const text = loc === BASE ? copy[PARAS[i]] : String(translated.get(`p${i + 1}`)?.[loc] ?? '').trim()
        if (!text) throw new Error(`${p.l.slug}: empty ${loc} paragraph ${i + 1}`)
        const blockKey = `tc-${loc}-p${i + 1}`
        ops[`pageSections[_key=="${p.sectionKey}"].content.${loc}[_key=="${blockKey}"]`] = paragraphBlock(blockKey, text)
      }
    }
    const dir = path.resolve(process.cwd(), 'scripts/data')
    fs.mkdirSync(dir, {recursive: true})
    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
    const full = await client.getDocument(p.l._id)
    fs.writeFileSync(path.join(dir, `typeCityCopy-${p.l.slug}-backup-${stamp}.json`), JSON.stringify(full, null, 2), 'utf8')
    await client.patch(p.l._id).set({...ops, contentUpdatedAt: new Date().toISOString().slice(0, 10)}).commit()
    console.log(`  wrote ${p.l._id}`)
  }
}
main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
