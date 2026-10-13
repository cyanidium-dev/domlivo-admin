/**
 * One-shot, 2026-10-13. The listings imported from grinchenko-realestate.com
 * (DatoCMS project "BSTrust369") in May and August 2026 were spread
 * round-robin over the five seed agents of scripts/seedFull.ts (Elena
 * Krasniqi, Arben Shala, Olga Dervishi, Genti Mema, Drita Hoxha: invented
 * names, @domlivo.com emails, fake phones), and the seven August ones got no
 * agent at all. The owner asked to attribute them to Grinchenko Real Estate
 * so Viktor can find his own listings.
 *
 * What it does:
 * 1. Points the 35 listings (34 published/archived docs + 1 draft) in
 *    scripts/data/grinchenko-listings-2026-10-13.json at the existing agent
 *    bcc19aa6-… ("Real Estate AL", the agent Viktor's Telegram account
 *    @real_estate_al already submits listings as).
 * 2. Renames that agent to "Grinchenko Real Estate" and sets its Telegram
 *    link, on the published doc and on its draft (a stale draft would revert
 *    the change when published). Slug `real-estate-al` stays, so no URL moves.
 * 3. Removes the five seed agents from the home page logo strip
 *    (landing-home, investorLogosSection 0eac3c07b3f7) — they would link to
 *    empty catalogues — and sets them isPublished:false. Nothing is deleted.
 *
 * Backup of every touched document is written before the commit.
 *
 * Run:
 * - npx tsx scripts/attributeGrinchenkoListings20261013.ts            (dry)
 * - npx tsx scripts/attributeGrinchenkoListings20261013.ts --execute
 */
import fs from 'node:fs'
import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})
const execute = process.argv.includes('--execute')

const AGENT_ID = 'bcc19aa6-459a-4cd5-a9ed-5a16a8c39bbb'
const AGENT_NAME = 'Grinchenko Real Estate'
const AGENT_TELEGRAM = 'https://t.me/real_estate_al'
const SEED_AGENTS = ['agent-1', 'agent-2', 'agent-3', 'agent-4', 'agent-5']
const HOME_ID = 'landing-home'
const LOGO_SECTION_KEY = '0eac3c07b3f7'

const client = createClient({
  projectId: (process.env.SANITY_PROJECT_ID || '').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: (process.env.SANITY_API_VERSION || '2024-01-01').trim(),
  token: process.env.SANITY_API_TOKEN?.trim(),
  useCdn: false,
})

type Row = {id: string; fromAgent: string | null; slug: string}

async function main(): Promise<void> {
  const data = JSON.parse(
    fs.readFileSync(path.resolve('scripts/data/grinchenko-listings-2026-10-13.json'), 'utf8'),
  ) as {targetAgent: string; listings: Row[]}
  if (data.targetAgent !== AGENT_ID) throw new Error('target agent mismatch')
  const ids = data.listings.map((r) => r.id)

  const props = await client.fetch<Array<{_id: string; agentRef?: string; slug?: string}>>(
    `*[_id in $ids]{_id, "agentRef": agent._ref, "slug": slug.current}`,
    {ids},
  )
  const missing = ids.filter((id) => !props.some((p) => p._id === id))
  if (missing.length) throw new Error(`listings not found: ${missing.join(', ')}`)
  const unexpected = props.filter((p) => p.agentRef && p.agentRef !== AGENT_ID && !SEED_AGENTS.includes(p.agentRef))
  if (unexpected.length) {
    throw new Error(`refusing: listings on a non-seed agent: ${unexpected.map((p) => `${p._id}→${p.agentRef}`).join(', ')}`)
  }
  const toMove = props.filter((p) => p.agentRef !== AGENT_ID)

  const agentDocs = await client.fetch<Array<{_id: string; name?: string}>>(
    `*[_id in [$id, "drafts." + $id]]{_id, name}`,
    {id: AGENT_ID},
  )
  if (!agentDocs.some((d) => d._id === AGENT_ID)) throw new Error('target agent not found')

  const seeds = await client.fetch<Array<{_id: string; name?: string; isPublished?: boolean; refs: number}>>(
    `*[_id in $seeds]{_id, name, isPublished, "refs": count(*[_type=="property" && references(^._id)])}`,
    {seeds: SEED_AGENTS},
  )
  const home = await client.fetch<{_id: string; sec?: {agents?: Array<{_ref: string}>}} | null>(
    `*[_id==$id][0]{_id, "sec": pageSections[_key==$key][0]}`,
    {id: HOME_ID, key: LOGO_SECTION_KEY},
  )

  console.log(`listings: ${props.length} found, ${toMove.length} to re-point to ${AGENT_ID}`)
  const byFrom: Record<string, number> = {}
  for (const p of toMove) byFrom[p.agentRef ?? '(none)'] = (byFrom[p.agentRef ?? '(none)'] ?? 0) + 1
  console.log('  from:', byFrom)
  console.log(`agent docs: ${agentDocs.map((d) => `${d._id} "${d.name}"`).join(', ')} → "${AGENT_NAME}"`)
  console.log('seed agents:', seeds.map((s) => `${s._id} ${s.name} refs=${s.refs} published=${s.isPublished}`).join('; '))
  console.log(`home logo strip refs: ${(home?.sec?.agents ?? []).map((a) => a._ref).join(', ') || '(none)'}`)

  if (!execute) {
    console.log('Dry run. Re-run with --execute to write.')
    return
  }

  const backupIds = [...ids, ...agentDocs.map((d) => d._id), ...SEED_AGENTS, HOME_ID]
  const backup = await client.fetch(`*[_id in $ids]`, {ids: backupIds})
  const backupPath = path.resolve(`scripts/data/backups/grinchenko-attribution-2026-10-13.json`)
  fs.mkdirSync(path.dirname(backupPath), {recursive: true})
  fs.writeFileSync(backupPath, JSON.stringify(backup, null, 1))
  console.log(`backup: ${backup.length} docs → ${backupPath}`)

  let tx = client.transaction()
  for (const p of toMove) {
    tx = tx.patch(p._id, (pt) => pt.set({agent: {_type: 'reference', _ref: AGENT_ID}}))
  }
  for (const d of agentDocs) {
    tx = tx.patch(d._id, (pt) => pt.set({name: AGENT_NAME, telegramUrl: AGENT_TELEGRAM}))
  }
  if (home?.sec?.agents?.some((a) => SEED_AGENTS.includes(a._ref))) {
    tx = tx.patch(HOME_ID, (pt) => pt.set({[`pageSections[_key=="${LOGO_SECTION_KEY}"].agents`]: []}))
  }
  const res = await tx.commit()
  console.log(`transaction 1 (listings, agent, home strip): ${res.transactionId}`)

  // Seed agents only after nothing on the site points at them any more.
  const stillRef = await client.fetch<number>(
    `count(*[_type=="property" && !(_id in path("drafts.**")) && agent._ref in $seeds])`,
    {seeds: SEED_AGENTS},
  )
  if (stillRef > 0) {
    console.log(`seed agents still referenced by ${stillRef} listings; left published`)
    return
  }
  let tx2 = client.transaction()
  for (const s of SEED_AGENTS) tx2 = tx2.patch(s, (pt) => pt.set({isPublished: false}))
  const res2 = await tx2.commit()
  console.log(`transaction 2 (seed agents unpublished): ${res2.transactionId}`)
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
