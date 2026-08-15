/**
 * Purge seed placeholders (2026-08-15) — see
 * docs/engineering/PLAN-align-taxonomy-2026-08-15.md Task 5.
 *
 * Removes the single seeded `Avg Price` metric from districts (the Blloku value
 * of €1,200/m² contradicts the KB by 2-4x and is published) and the
 * "Question?" / "Answer." FAQ stubs from districts and cities. Real values are
 * entered in the fill step from knowledge-base/03-districts + 02-cities.
 * Usage: sanity exec scripts/purgeSeedPlaceholders.ts --with-user-token [-- --apply]
 */
import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2024-06-01'})
const APPLY = process.argv.includes('--apply')

const SEED_METRIC_LABEL = 'Avg Price'
const SEED_QUESTION_EN = 'Question?'

async function main() {
  console.log(`[${APPLY ? 'APPLY' : 'DRY-RUN'}]`)

  const metricDocs = await client.fetch<{_id: string; slug: string; labels: string[]}[]>(
    `*[_type == "district" && count(metrics) > 0]{
      _id, "slug": slug.current, "labels": metrics[].label
    }`,
  )
  const unexpected = metricDocs.filter(
    (d) => d.labels.length !== 1 || d.labels[0] !== SEED_METRIC_LABEL,
  )
  if (unexpected.length > 0) {
    throw new Error(
      `non-seed metrics found on ${unexpected.map((d) => d.slug).join(', ')} — ` +
        `aborting, review before purging`,
    )
  }

  const faqDocs = await client.fetch<{_id: string; _type: string; slug: string}[]>(
    `*[_type in ["district", "city"] && $q in faqItems[].question.en]{
      _id, _type, "slug": slug.current
    }`,
    {q: SEED_QUESTION_EN},
  )

  console.log(`districts losing seed metrics: ${metricDocs.length}`)
  console.log(
    `docs losing seed FAQ: ${faqDocs.length} ` +
      `(districts ${faqDocs.filter((d) => d._type === 'district').length}, ` +
      `cities ${faqDocs.filter((d) => d._type === 'city').length})`,
  )

  if (!APPLY) {
    console.log('\nno changes written (dry run)')
    return
  }

  const tx = client.transaction()
  for (const d of metricDocs) tx.patch(d._id, (p) => p.unset(['metrics']))
  for (const d of faqDocs) tx.patch(d._id, (p) => p.unset(['faqItems']))
  await tx.commit()

  const after = await client.fetch(
    `{
      "districtsWithMetrics": count(*[_type == "district" && count(metrics) > 0]),
      "seedFaqLeft": count(*[_type in ["district", "city"] && $q in faqItems[].question.en])
    }`,
    {q: SEED_QUESTION_EN},
  )
  console.log('after:', JSON.stringify(after))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
