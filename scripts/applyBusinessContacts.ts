/**
 * One-shot, 2026-09-20. The owners supplied the real business contacts:
 *   WhatsApp  https://wa.me/message/KPXIGD5DJISGO1  (WhatsApp Business short link)
 *   Telegram  https://t.me/real_estate_al
 *
 * Until now siteSettings carried a placeholder phone, `+355 69 000 0000`, which
 * was live in the Organization JSON-LD, and the only contact-channel link was
 * the publishing bot (`t.me/domlivobot`), which is not where a buyer should
 * write.
 *
 * What it does:
 * - unsets `contactPhone` when it is the placeholder (the real number was not
 *   supplied; a fake one is worse than none);
 * - points the contact-channel Telegram link at the business account;
 * - adds a contact-channel WhatsApp link if none exists.
 *
 * The previous values are printed, so the change can be reverted by hand.
 *
 * Run:
 * - npx tsx scripts/applyBusinessContacts.ts            (dry)
 * - npx tsx scripts/applyBusinessContacts.ts --execute
 */

import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const execute = process.argv.slice(2).includes('--execute')

const PLACEHOLDER_PHONE = '+355 69 000 0000'
const WHATSAPP_URL = 'https://wa.me/message/KPXIGD5DJISGO1'
const TELEGRAM_URL = 'https://t.me/real_estate_al'

const client = createClient({
  projectId: (process.env.SANITY_PROJECT_ID || '').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: (process.env.SANITY_API_VERSION || '2024-01-01').trim(),
  token: process.env.SANITY_API_TOKEN?.trim(),
  useCdn: false,
})

type SocialLink = {_key: string; _type: 'socialLink'; platform?: string; url?: string; channel?: string}

async function main(): Promise<void> {
  const doc: {_id: string; contactPhone?: string; socialLinks?: SocialLink[]} | null = await client.fetch(
    `*[_id=="siteSettings"][0]{_id, contactPhone, socialLinks}`,
  )
  if (!doc) throw new Error('siteSettings not found')

  console.log('Before:', JSON.stringify({contactPhone: doc.contactPhone, socialLinks: doc.socialLinks}, null, 1))

  const links = [...(doc.socialLinks ?? [])]
  const isContact = (l: SocialLink, platform: string) =>
    l.channel === 'contact' && (l.platform ?? '').toLowerCase() === platform

  const telegram = links.find((l) => isContact(l, 'telegram'))
  if (telegram) telegram.url = TELEGRAM_URL
  else links.push({_key: 'contact-telegram', _type: 'socialLink', platform: 'Telegram', url: TELEGRAM_URL, channel: 'contact'})

  const whatsapp = links.find((l) => isContact(l, 'whatsapp'))
  if (whatsapp) whatsapp.url = WHATSAPP_URL
  else {
    // WhatsApp first among the contact links: it is the channel most locales use.
    const firstContact = links.findIndex((l) => l.channel === 'contact')
    const entry: SocialLink = {_key: 'contact-whatsapp', _type: 'socialLink', platform: 'WhatsApp', url: WHATSAPP_URL, channel: 'contact'}
    if (firstContact === -1) links.push(entry)
    else links.splice(firstContact, 0, entry)
  }

  const dropPhone = (doc.contactPhone ?? '').trim() === PLACEHOLDER_PHONE
  console.log('After:', JSON.stringify({contactPhone: dropPhone ? undefined : doc.contactPhone, socialLinks: links}, null, 1))

  if (!execute) {
    console.log('Dry run. Re-run with --execute to write.')
    return
  }

  let patch = client.patch(doc._id).set({socialLinks: links})
  if (dropPhone) patch = patch.unset(['contactPhone'])
  const res = await patch.commit()
  console.log(`Patched ${res._id}, rev ${res._rev}.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
