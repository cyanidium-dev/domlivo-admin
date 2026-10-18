/** Read-only sanity check after a knowledge import. Run: npx tsx scripts/knowledge/verifyImport.ts */
import {getSanityClientForScripts} from '../lib/sanityEnvClient'

async function main() {
  const c = getSanityClientForScripts()
  const counts = await c.fetch(`{
    "sources": count(*[_type=="knowledgeSource"]),
    "facts": count(*[_type=="knowledgeFact"]),
    "factsWithCity": count(*[_type=="knowledgeFact" && defined(city)]),
    "factsWithValue": count(*[_type=="knowledgeFact" && defined(value)]),
    "factsWithSource": count(*[_type=="knowledgeFact" && defined(source)]),
    "articles": count(*[_type=="knowledgeArticle"]),
    "tables": count(*[_type=="knowledgeArticle"].sections[].tables[])
  }`)
  console.log(counts)
  const sample = await c.fetch(`*[_type=="knowledgeArticle" && documentId=="UTIL-ELEC-ALB-2026"][0]{
    documentId, "slug": slug.current, "title": title.en, category, dataPeriod, lastUpdated, nextReviewAt,
    "questions": count(questionSet),
    sections[]{sectionKey, "heading": heading.en, "tables": tables[]{tableId, "cols": count(columns), "rows": count(rows), "firstRow": rows[0]{rowId, cells, "facts": count(facts)}}}
  }`)
  console.log(JSON.stringify(sample, null, 1).slice(0, 1800))
  const fact = await c.fetch(`*[_type=="knowledgeFact" && dataId=="DATA-ELEC-0001"][0]{
    dataId, metric, value, unit, originalValue, originalCurrency, confidence, period, season, category,
    "source": source->{sourceId, name, url}, rawQuote
  }`)
  console.log(fact)
}
main().catch((e) => { console.error(e); process.exit(1) })
