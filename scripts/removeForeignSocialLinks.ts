/**
 * One-shot, 2026-09-21. The three "social" links in siteSettings were never
 * Domlivo's: checked in a browser, instagram.com/domlivo is a stranger's empty
 * account, facebook.com/domlivo is a private person ("Dom Livo"), and
 * linkedin.com/company/domlivo does not exist. They were shown in the footer
 * and published as `sameAs` of the Organization, which tells a search engine
 * that those strangers are the brand.
 *
 * Removes exactly those three URLs; contact-channel links are untouched. Add
 * the real profiles in Studio once they exist.
 *
 * Run:
 * - npx tsx scripts/removeForeignSocialLinks.ts            (dry)
 * - npx tsx scripts/removeForeignSocialLinks.ts --execute
 */

import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const execute = process.argv.slice(2).includes('--execute')

const FOREIGN = new Set([
  'https://facebook.com/domlivo',
  'https://instagram.com/domlivo',
  'https://linkedin.com/company/domlivo',
])

const client = createClient({
  projectId: (process.env.SANITY_PROJECT_ID || '').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: (process.env.SANITY_API_VERSION || '2024-01-01').trim(),
  token: process.env.SANITY_API_TOKEN?.trim(),
  useCdn: false,
})

type SocialLink = {_key: string; platform?: string; url?: string; channel?: string}

async function main(): Promise<void> {
  const doc: {_id: string; socialLinks?: SocialLink[]} | null = await client.fetch(
    `*[_id=="siteSettings"][0]{_id, socialLinks}`,
  )
  if (!doc) throw new Error('siteSettings not found')

  const links = doc.socialLinks ?? []
  const normalize = (u?: string) => (u ?? '').trim().replace(/\/+$/, '').replace('://www.', '://')
  const drop = links.filter((l) => FOREIGN.has(normalize(l.url)))
  const keep = links.filter((l) => !FOREIGN.has(normalize(l.url)))

  console.log('Removing:', drop.map((l) => `${l.platform} ${l.url}`))
  console.log('Keeping:', keep.map((l) => `${l.platform} ${l.url} (${l.channel})`))

  if (!execute) {
    console.log('Dry run. Re-run with --execute to write.')
    return
  }
  if (drop.length === 0) return
  const res = await client.patch(doc._id).set({socialLinks: keep}).commit()
  console.log(`Patched ${res._id}, rev ${res._rev}.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
