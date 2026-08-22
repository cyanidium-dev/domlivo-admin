/**
 * Data migrations for the 2026-08-22 schema-audit fixes.
 *
 * Default: dry-run (prints the patch it would apply).
 * Execute:  npx tsx scripts/migrateAuditRound1.ts --execute
 * Subset:   npx tsx scripts/migrateAuditRound1.ts --only=socials,priceRange
 *
 * Requires SANITY_API_TOKEN in cms/.env.
 *
 * Steps
 *  socials      — move footerTelegramUrl / footerWhatsappUrl into socialLinks[]
 *                 as channel:'contact' entries, stamp channel:'social' on the
 *                 rest, then unset the two legacy fields.
 *  footerApp    — set footerApp.enabled = false. The stored store URLs are
 *                 placeholders pointing at the website, and the GROQ alias fix
 *                 means the column would otherwise start rendering them.
 *  priceRange   — widen propertySettings.catalogDefaults.priceRange so the
 *                 filter covers the real catalogue (listings exist below the
 *                 old floor and above the old ceiling).
 *  countryTitle — convert country.title from a plain string to localizedString.
 *
 * Every step is idempotent: re-running changes nothing once applied.
 */

import {getSanityClientForScripts} from './lib/sanityEnvClient'

type SocialLink = {_key?: string; _type?: string; platform?: string; url?: string; channel?: string}

const ALL_STEPS = ['socials', 'footerApp', 'priceRange', 'countryTitle'] as const
type Step = (typeof ALL_STEPS)[number]

/** Albanian exonyms for the countries currently in the dataset. */
const COUNTRY_SQ: Record<string, string> = {
  albania: 'Shqipëri',
}

function key(prefix: string, i: number): string {
  return `${prefix}${i}${Math.random().toString(36).slice(2, 8)}`
}

async function main() {
  const execute = process.argv.includes('--execute')
  const onlyArg = process.argv.find((a) => a.startsWith('--only='))
  const steps: Step[] = onlyArg
    ? (onlyArg.slice('--only='.length).split(',').map((s) => s.trim()) as Step[])
    : [...ALL_STEPS]

  for (const s of steps) {
    if (!ALL_STEPS.includes(s)) {
      console.error(`Unknown step "${s}". Valid: ${ALL_STEPS.join(', ')}`)
      process.exit(1)
    }
  }

  const client = getSanityClientForScripts()
  console.log(execute ? '=== EXECUTING ===' : '=== DRY RUN (pass --execute to apply) ===')

  // ---------------------------------------------------------------- socials
  if (steps.includes('socials')) {
    const s = await client.fetch<{
      socialLinks?: SocialLink[]
      footerTelegramUrl?: string
      footerWhatsappUrl?: string
    }>(`*[_id == "siteSettings"][0]{socialLinks, footerTelegramUrl, footerWhatsappUrl}`)

    const existing = Array.isArray(s?.socialLinks) ? s.socialLinks : []
    const hasContact = existing.some((l) => l?.channel === 'contact')

    if (hasContact) {
      console.log('\n[socials] already migrated — contact entries present, skipping')
    } else {
      const stamped: SocialLink[] = existing.map((l, i) => ({
        ...l,
        _type: l._type ?? 'socialLink',
        _key: l._key ?? key('sl', i),
        channel: l.channel ?? 'social',
      }))
      const added: SocialLink[] = []
      const tg = s?.footerTelegramUrl?.trim()
      const wa = s?.footerWhatsappUrl?.trim()
      if (tg) added.push({_type: 'socialLink', _key: key('tg', 0), platform: 'Telegram', url: tg, channel: 'contact'})
      if (wa) added.push({_type: 'socialLink', _key: key('wa', 0), platform: 'WhatsApp', url: wa, channel: 'contact'})

      const next = [...stamped, ...added]
      console.log('\n[socials] socialLinks after migration:')
      for (const l of next) console.log(`   ${(l.channel ?? '?').padEnd(8)} ${l.platform} → ${l.url}`)
      console.log('[socials] unset: footerTelegramUrl, footerWhatsappUrl')

      if (execute) {
        await client
          .patch('siteSettings')
          .set({socialLinks: next})
          .unset(['footerTelegramUrl', 'footerWhatsappUrl'])
          .commit()
        console.log('[socials] applied')
      }
    }
  }

  // -------------------------------------------------------------- footerApp
  if (steps.includes('footerApp')) {
    const app = await client.fetch<{enabled?: boolean; appStoreUrl?: string; googlePlayUrl?: string}>(
      `*[_id == "siteSettings"][0].footerApp`,
    )
    if (app?.enabled === false) {
      console.log('\n[footerApp] already disabled, skipping')
    } else {
      console.log('\n[footerApp] set footerApp.enabled = false')
      console.log(`   current store URLs: ${app?.appStoreUrl ?? '—'} / ${app?.googlePlayUrl ?? '—'}`)
      console.log('   (re-enable once real App Store / Google Play URLs exist)')
      if (execute) {
        await client.patch('siteSettings').set({'footerApp.enabled': false}).commit()
        console.log('[footerApp] applied')
      }
    }
  }

  // ------------------------------------------------------------- priceRange
  if (steps.includes('priceRange')) {
    const bounds = await client.fetch<{min: number | null; max: number | null; current: {from?: number; to?: number} | null}>(
      `{
        "min": *[_type == "property" && isPublished == true && defined(price)] | order(price asc)[0].price,
        "max": *[_type == "property" && isPublished == true && defined(price)] | order(price desc)[0].price,
        "current": *[_id == "siteSettings"][0].propertySettings.catalogDefaults.priceRange
      }`,
    )
    // Round the ceiling up to a clean step so the slider reads well.
    const step = 500_000
    const to = Math.max(1_000_000, Math.ceil((bounds.max ?? 0) / step) * step)
    const from = 0
    if (bounds.current?.from === from && bounds.current?.to === to) {
      console.log('\n[priceRange] already correct, skipping')
    } else {
      console.log(`\n[priceRange] listings span €${bounds.min ?? '?'} – €${bounds.max ?? '?'}`)
      console.log(`   current: ${JSON.stringify(bounds.current)} → new: {from: ${from}, to: ${to}}`)
      if (execute) {
        await client
          .patch('siteSettings')
          .set({'propertySettings.catalogDefaults.priceRange': {_type: 'priceRange', from, to}})
          .commit()
        console.log('[priceRange] applied')
      }
    }
  }

  // ----------------------------------------------------------- countryTitle
  if (steps.includes('countryTitle')) {
    const countries = await client.fetch<{_id: string; slug: string; title: unknown}[]>(
      `*[_type == "country"]{_id, "slug": slug.current, title}`,
    )
    const pending = countries.filter((c) => typeof c.title === 'string')
    if (pending.length === 0) {
      console.log('\n[countryTitle] all titles already localized, skipping')
    } else {
      console.log('\n[countryTitle] converting plain strings to localizedString:')
      for (const c of pending) {
        const en = String(c.title).trim()
        const sq = COUNTRY_SQ[c.slug] ?? en
        const value = {_type: 'localizedString', en, uk: en, ru: en, sq, it: en}
        console.log(`   ${c.slug}: "${en}" → en/uk/ru/it "${en}", sq "${sq}"`)
        if (execute) await client.patch(c._id).set({title: value}).commit()
      }
      if (execute) console.log('[countryTitle] applied')
      console.log('   NOTE: uk/ru/it are seeded with the English name — have an editor translate them.')
    }
  }

  console.log(execute ? '\nDone.' : '\nDry run complete — nothing was written.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
