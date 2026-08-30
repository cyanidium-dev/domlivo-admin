/**
 * Content cleanup following the 2026-08-22 schema-audit fixes.
 *
 * Default: dry-run.
 * Execute:  npx tsx scripts/cleanupAuditRound1.ts --execute
 * Subset:   npx tsx scripts/cleanupAuditRound1.ts --only=countryTitles
 *
 * Requires SANITY_API_TOKEN in cms/.env.
 *
 * Steps
 *  countryTitles — fill the uk / ru / it locales on country.title. The migration
 *                  seeded them with the English name; sq was already correct.
 *  testBanners   — delete the three `Test` catalog banners. Every one points at
 *                  a property that no longer exists, so none can ever render.
 *  locationTags  — delete the orphaned locationTag documents. The document type
 *                  and property.locationTags were removed from the schema; the
 *                  script refuses to delete anything still referenced.
 *
 * Idempotent: a second run reports nothing to do.
 */

import {getSanityClientForScripts} from './lib/sanityEnvClient'

const ALL_STEPS = ['countryTitles', 'testBanners', 'locationTags'] as const
type Step = (typeof ALL_STEPS)[number]

/** Exonyms per locale, keyed by country slug. `sq` is already set correctly. */
const COUNTRY_TITLES: Record<string, {en: string; uk: string; ru: string; sq: string; it: string}> = {
  albania: {en: 'Albania', uk: 'Албанія', ru: 'Албания', sq: 'Shqipëri', it: 'Albania'},
}

/** Banner labels treated as test data. Matched case-insensitively, trimmed. */
const TEST_BANNER_LABELS = ['test', 'test 2', 'test 3']

type Banner = {_key?: string; label?: string; property?: {_ref?: string}}

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

  // ------------------------------------------------------------ countryTitles
  if (steps.includes('countryTitles')) {
    const countries = await client.fetch<{_id: string; slug: string; title?: Record<string, string>}[]>(
      `*[_type == "country"]{_id, "slug": slug.current, title}`,
    )
    let changed = 0
    for (const c of countries) {
      const want = COUNTRY_TITLES[c.slug]
      if (!want) {
        console.log(`\n[countryTitles] ${c.slug}: no translation table entry — skipped`)
        continue
      }
      const current = c.title ?? {}
      const diff = (Object.keys(want) as (keyof typeof want)[]).filter((k) => current[k] !== want[k])
      if (diff.length === 0) {
        console.log(`\n[countryTitles] ${c.slug}: already correct`)
        continue
      }
      changed++
      console.log(`\n[countryTitles] ${c.slug}: updating ${diff.join(', ')}`)
      for (const k of diff) console.log(`   ${k}: ${JSON.stringify(current[k])} → ${JSON.stringify(want[k])}`)
      if (execute) {
        await client.patch(c._id).set({title: {_type: 'localizedString', ...want}}).commit()
        console.log('   applied')
      }
    }
    if (changed === 0) console.log('[countryTitles] nothing to do')
  }

  // -------------------------------------------------------------- testBanners
  if (steps.includes('testBanners')) {
    const banners = await client.fetch<Banner[]>(
      `*[_id == "siteSettings"][0].propertySettings.propertyCatalogBanners[]{_key, label, property}`,
    )
    const list = Array.isArray(banners) ? banners : []
    const doomed = list.filter((b) => TEST_BANNER_LABELS.includes((b.label ?? '').trim().toLowerCase()))

    if (doomed.length === 0) {
      console.log('\n[testBanners] no test banners found — nothing to do')
    } else {
      console.log(`\n[testBanners] deleting ${doomed.length} of ${list.length} banner(s):`)
      for (const b of doomed) console.log(`   "${b.label}" (_key ${b._key}, ref ${b.property?._ref ?? '—'})`)
      const keep = list.filter((b) => !doomed.includes(b))
      console.log(`   ${keep.length} banner(s) kept`)
      if (execute) {
        // Remove by _key so any concurrently-added banner is left alone.
        const selectors = doomed.map((b) => `propertySettings.propertyCatalogBanners[_key=="${b._key}"]`)
        await client.patch('siteSettings').unset(selectors).commit()
        console.log('   applied')
      }
    }
  }

  // ------------------------------------------------------------- locationTags
  if (steps.includes('locationTags')) {
    const tags = await client.fetch<{_id: string; title?: unknown}[]>(`*[_type == "locationTag"]{_id, title}`)
    if (tags.length === 0) {
      console.log('\n[locationTags] none left — nothing to do')
    } else {
      // Never delete something still pointed at; Sanity would reject it anyway,
      // but failing loudly here is clearer than a transaction error.
      const referenced = await client.fetch<{_id: string; _type: string}[]>(
        `*[references(*[_type == "locationTag"]._id)]{_id, _type}`,
      )
      if (referenced.length > 0) {
        console.error(`\n[locationTags] ABORT — ${referenced.length} document(s) still reference a locationTag:`)
        for (const r of referenced.slice(0, 10)) console.error(`   ${r._type} ${r._id}`)
        process.exit(1)
      }
      console.log(`\n[locationTags] deleting ${tags.length} orphaned document(s) (0 referrers)`)
      if (execute) {
        let tx = client.transaction()
        for (const t of tags) tx = tx.delete(t._id)
        await tx.commit()
        console.log('   applied')
      }
    }
  }

  console.log(execute ? '\nDone.' : '\nDry run complete — nothing was written.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
