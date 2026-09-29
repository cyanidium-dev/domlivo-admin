/**
 * One-shot, 2026-09-30. The Vlora and Saranda listings created on 2026-05-04
 * (10:33–10:45, one seed batch, agents Drita Hoxha / Genti Mema / Arben Shala)
 * are demo data: their photos carry another agency's watermark
 * ("GRINCHENKO REAL ESTATE") and they opened the home page's popular carousel
 * and the "properties on this topic" block under articles. The owner asked
 * on 30.09 to delete the Vlora and Saranda ones.
 *
 * Dry run lists them with their incoming references; --execute writes a JSON
 * backup to scripts/data/backups/ and deletes them (references are unset
 * first, so the delete is not refused).
 *
 * Run:
 * - npx tsx scripts/deleteDemoListings20260930.ts            (dry)
 * - npx tsx scripts/deleteDemoListings20260930.ts --execute
 */
import fs from 'node:fs'
import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})
const execute = process.argv.slice(2).includes('--execute')
const CITIES = ['vlore', 'sarande']
const DAY = '2026-05-04'

const client = createClient({
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || process.env.SANITY_PROJECT_ID || 'g4aqp6ex',
  dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  apiVersion: '2025-01-01',
  token: process.env.SANITY_API_TOKEN || process.env.SANITY_TOKEN,
  useCdn: false,
})

type Row = {
  _id: string
  title: string
  city: string
  agent: string
  created: string
  images: number
  refs: Array<{_id: string; _type: string}>
}

async function main() {
  const rows = await client.fetch<Row[]>(
    `*[_type=="property" && city->slug.current in $cities && string::startsWith(_createdAt, $day)]{
      _id, "title": coalesce(title.en, title), "city": city->slug.current,
      "agent": coalesce(agent->name, agent->title, agent._ref), "created": _createdAt,
      "images": count(images),
      "refs": *[references(^._id) && !(_id in path("drafts.**"))]{_id,_type}
    } | order(_createdAt)`,
    {cities: CITIES, day: DAY},
  )
  for (const r of rows) console.log(`${r._id} | ${r.city} | ${r.agent} | ${r.created} | ${r.images} images | ${r.title} | refs: ${r.refs.map((x) => `${x._type}:${x._id}`).join(', ') || 'none'}`)
  console.log(execute ? 'EXECUTE' : 'DRY', rows.length, 'listings')
  if (!execute || rows.length === 0) return

  const full = await client.fetch(`*[_id in $ids]`, {ids: rows.map((r) => r._id)})
  const dir = path.resolve(process.cwd(), 'scripts/data/backups')
  fs.mkdirSync(dir, {recursive: true})
  const file = path.join(dir, `demo-listings-${DAY}-deleted-2026-09-30.json`)
  fs.writeFileSync(file, JSON.stringify(full, null, 2))
  console.log('backup', file)

  let tx = client.transaction()
  for (const r of rows) {
    for (const ref of r.refs) {
      // Strip every reference to this listing from arrays/fields of the referrer.
      const doc = await client.getDocument(ref._id)
      if (!doc) continue
      const paths: string[] = []
      const walk = (v: unknown, p: string) => {
        if (Array.isArray(v)) v.forEach((it, i) => walk(it, `${p}[${i}]`))
        else if (v && typeof v === 'object') {
          const o = v as Record<string, unknown>
          if (o._ref === r._id) { paths.push(p); return }
          for (const [k, val] of Object.entries(o)) if (!k.startsWith('_') || k === '_key') walk(val, p ? `${p}.${k}` : k)
        }
      }
      walk(doc, '')
      // Array items are unset by _key where possible.
      const keyed = paths.map((p) => {
        const m = /^(.*)\[(\d+)\]$/.exec(p)
        if (!m) return p
        const arr = m[1].split('.').reduce<unknown>((acc, k) => (acc as Record<string, unknown>)?.[k], doc) as Array<{_key?: string}>
        const key = arr?.[Number(m[2])]?._key
        return key ? `${m[1]}[_key=="${key}"]` : p
      })
      if (keyed.length) { console.log('unset', ref._id, keyed); tx = tx.patch(ref._id, (p) => p.unset(keyed)) }
    }
    tx = tx.delete(r._id).delete(`drafts.${r._id}`)
  }
  const res = await tx.commit()
  console.log('deleted', rows.length, 'transaction', res.transactionId)
}
main().catch((e) => { console.error(e.message); process.exit(1) })
