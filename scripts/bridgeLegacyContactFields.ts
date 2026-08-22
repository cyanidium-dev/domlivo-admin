/**
 * TEMPORARY bridge: re-set footerTelegramUrl / footerWhatsappUrl on siteSettings.
 *
 * The socials migration unset them, but the *deployed* frontend still reads them
 * (it predates socialLinks[].channel). With `revalidate: 60` on siteSettings the
 * live footer would drop Telegram and WhatsApp within a minute of the migration.
 *
 * Both code paths are safe with the fields present:
 *   - deployed frontend  → reads the legacy fields
 *   - fix/schema-audit-round1 → ignores them, reads socialLinks[].channel
 *
 * Run `--unset` once the new frontend is deployed, to restore the single source.
 *   npx tsx scripts/bridgeLegacyContactFields.ts            (dry run)
 *   npx tsx scripts/bridgeLegacyContactFields.ts --execute
 *   npx tsx scripts/bridgeLegacyContactFields.ts --unset --execute
 */
import {getSanityClientForScripts} from './lib/sanityEnvClient'

async function main() {
  const execute = process.argv.includes('--execute')
  const unset = process.argv.includes('--unset')
  const client = getSanityClientForScripts()

  const links = await client.fetch<{platform?: string; url?: string; channel?: string}[]>(
    `*[_id == "siteSettings"][0].socialLinks[channel == "contact"]{platform, url, channel}`,
  )
  const find = (name: string) =>
    links?.find((l) => (l.platform ?? '').toLowerCase() === name)?.url?.trim()

  if (unset) {
    console.log('unset: footerTelegramUrl, footerWhatsappUrl')
    if (execute) {
      await client.patch('siteSettings').unset(['footerTelegramUrl', 'footerWhatsappUrl']).commit()
      console.log('applied')
    }
    return
  }

  const set: Record<string, string> = {}
  const tg = find('telegram')
  const wa = find('whatsapp')
  if (tg) set.footerTelegramUrl = tg
  if (wa) set.footerWhatsappUrl = wa

  if (Object.keys(set).length === 0) {
    console.log('no contact-channel links found — nothing to bridge')
    return
  }
  console.log('set:', set)
  if (execute) {
    await client.patch('siteSettings').set(set).commit()
    console.log('applied')
  } else {
    console.log('(dry run — pass --execute)')
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
