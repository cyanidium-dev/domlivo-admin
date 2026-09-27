/**
 * One-shot, 2026-09-28. Adds the brand's own Facebook page and LinkedIn
 * company page to siteSettings.socialLinks (channel "social"), so they reach
 * the Organization `sameAs` on every page. The previous three "social" links
 * belonged to strangers and were removed on 2026-09-21
 * (removeForeignSocialLinks.ts); these two were created by the owner today.
 *
 * Idempotent: a URL already present (ignoring www and a trailing slash) is not
 * added twice.
 *
 * Run:
 * - npx tsx scripts/addSocialProfiles20260928.ts            (dry)
 * - npx tsx scripts/addSocialProfiles20260928.ts --execute
 */

import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const execute = process.argv.slice(2).includes('--execute')

const NEW_LINKS = [
  {_key: 'linkedin-company-2026-09-28', platform: 'LinkedIn', url: 'https://www.linkedin.com/company/domlivo', channel: 'social'},
  {_key: 'facebook-page-2026-09-28', platform: 'Facebook', url: 'https://www.facebook.com/profile.php?id=61594817704149', channel: 'social'},
]

const client = createClient({
  projectId: (process.env.SANITY_PROJECT_ID || '').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: (process.env.SANITY_API_VERSION || '2024-01-01').trim(),
  token: process.env.SANITY_API_TOKEN?.trim(),
  useCdn: false,
})

type SocialLink = {_key: string; platform?: string; url?: string; channel?: string}

const normalize = (u?: string) => (u ?? '').trim().replace(/\/+$/, '').replace('://www.', '://')

async function main(): Promise<void> {
  const doc: {_id: string; socialLinks?: SocialLink[]} | null = await client.fetch(
    `*[_id=="siteSettings"][0]{_id, socialLinks}`,
  )
  if (!doc) throw new Error('siteSettings not found')

  const links = doc.socialLinks ?? []
  const have = new Set(links.map((l) => normalize(l.url)))
  const add = NEW_LINKS.filter((l) => !have.has(normalize(l.url)))

  console.log('Existing:', links.map((l) => `${l.platform} ${l.url} (${l.channel})`))
  console.log('Adding:', add.map((l) => `${l.platform} ${l.url}`))

  if (!execute) {
    console.log('Dry run. Re-run with --execute to write.')
    return
  }
  if (add.length === 0) return
  const res = await client.patch(doc._id).set({socialLinks: [...links, ...add]}).commit()
  console.log(`Patched ${res._id}, rev ${res._rev}.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
