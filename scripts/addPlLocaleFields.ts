/**
 * ТЗ-15 coverage report: for every document type carrying a localized field,
 * how many documents have `pl` filled vs. empty on their primary field(s).
 *
 * Read-only — field-level i18n needs no data migration (a Sanity document
 * just gains an empty `pl` sub-value the moment the schema defines it), so
 * there is nothing to "add" here except visibility into what still needs
 * translating. For `property` and `amenity`, this script points at the
 * existing `backfillPropertyLocales.ts --locale pl` / `backfillAmenityLocales.ts`
 * scripts, which already handle `pl` with no code changes (they derive their
 * locale list from `PROJECT_LOCALE_IDS`).
 *
 * Run: npm run audit:pl-locale
 */

import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const client = createClient({
  projectId: (process.env.SANITY_PROJECT_ID || '').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: (process.env.SANITY_API_VERSION || '2024-01-01').trim(),
  token: process.env.SANITY_API_TOKEN?.trim(),
  useCdn: false,
})

type Target = {type: string; field: string}

const TARGETS: Target[] = [
  {type: 'property', field: 'title'},
  {type: 'property', field: 'shortDescription'},
  {type: 'blogPost', field: 'title'},
  {type: 'blogPost', field: 'excerpt'},
  {type: 'landingPage', field: 'title'},
  {type: 'district', field: 'title'},
  {type: 'city', field: 'title'},
  {type: 'amenity', field: 'title'},
]

async function main(): Promise<void> {
  console.log('ТЗ-15 pl coverage report (read-only — no writes)\n')

  for (const {type, field} of TARGETS) {
    const query = `{
      "total": count(*[_type == $type]),
      "withPl": count(*[_type == $type && defined(${field}.pl) && ${field}.pl != ""])
    }`
    const {total, withPl} = await client.fetch<{total: number; withPl: number}>(query, {type})
    const missing = total - withPl
    const pad = (s: string, n: number) => s.padEnd(n)
    console.log(
      `${pad(type, 14)}${pad(field, 18)}${String(withPl).padStart(4)} / ${String(total).padEnd(4)} have pl` +
        (missing > 0 ? `  (${missing} missing)` : '  (complete)'),
    )
  }

  console.log(
    '\nTo fill gaps: `npm run backfill:property-locales -- --locale pl --execute` (property),' +
      ' `npm run backfill:amenity-locales -- --execute` (amenity, fills every missing locale, not just pl).' +
      ' blogPost/landingPage/district/city have no locale-specific backfill script today — use Studio\'s' +
      ' 🌐 Translate action per document, or scope a new script when a dedicated pl content pass is planned.',
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
