/**
 * Read-only audit of district taxonomy defects (2026-08-15).
 * Baseline check for PLAN-align-taxonomy-2026-08-15.md — run before and after
 * each mutation task. Exits 1 while any defect remains, 0 when all are clear.
 * Usage: sanity exec scripts/auditDistrictTaxonomy.ts --with-user-token
 */
import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2024-06-01'})

const LOCALES = ['en', 'sq', 'it', 'ru', 'uk'] as const

async function main() {
  const data = await client.fetch(`{
    "duplicates": *[_type == "district" && slug.current in ["livadhi", "new-bazaar"]]{
      "slug": slug.current, _id, isPublished
    },
    "staleNames": *[_type == "district" && slug.current in ["beachfront-durres", "dajti"]]{
      "slug": slug.current, "en": title.en
    },
    "missingTitleIt": *[_type == "district" && !defined(title.it)]{"slug": slug.current},
    "seedMetrics": *[_type == "district" && count(metrics) > 0]{
      "slug": slug.current, "labels": metrics[].label, "values": metrics[].value
    },
    "seedFaqDistricts": *[_type == "district" && "Question?" in faqItems[].question.en]{
      "slug": slug.current
    },
    "seedFaqCities": *[_type == "city" && "Question?" in faqItems[].question.en]{
      "slug": slug.current
    },
    "unsupported": *[_type == "district" && slug.current in ["porto-romano", "lukove"]]{
      "slug": slug.current, isPublished,
      "props": count(*[_type == "property" && references(^._id)])
    },
    "splitsPresent": *[_type == "district" && slug.current in ["golem-1st-line", "lungomare-2nd-line"]]{
      "slug": slug.current
    }
  }`)

  const defects: string[] = []

  if (data.duplicates.length > 0)
    defects.push(`duplicates still present: ${data.duplicates.map((d: any) => d.slug).join(', ')}`)
  if (data.staleNames.length > 0)
    defects.push(
      `stale names still present: ${data.staleNames.map((d: any) => `${d.slug} (${d.en})`).join(', ')}`,
    )
  if (data.missingTitleIt.length > 0)
    defects.push(`districts missing title.it: ${data.missingTitleIt.length}`)
  if (data.seedMetrics.length > 0)
    defects.push(`districts with metrics still set: ${data.seedMetrics.length}`)
  if (data.seedFaqDistricts.length > 0)
    defects.push(`districts with "Question?" FAQ: ${data.seedFaqDistricts.length}`)
  if (data.seedFaqCities.length > 0)
    defects.push(`cities with "Question?" FAQ: ${data.seedFaqCities.length}`)
  const stillPublished = data.unsupported.filter((d: any) => d.isPublished !== false)
  if (stillPublished.length > 0)
    defects.push(
      `unsupported districts still published: ${stillPublished.map((d: any) => d.slug).join(', ')}`,
    )
  if (data.splitsPresent.length < 2)
    defects.push(`line-split shells missing: ${2 - data.splitsPresent.length} of 2`)

  console.log('--- district taxonomy audit ---')
  console.log(JSON.stringify(data, null, 2))
  console.log(`\nlocales expected on title: ${LOCALES.join('/')}`)
  if (defects.length === 0) {
    console.log('\nRESULT: clean')
    return
  }
  console.log(`\nRESULT: ${defects.length} defect group(s)`)
  for (const d of defects) console.log(`  - ${d}`)
  process.exitCode = 1
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
