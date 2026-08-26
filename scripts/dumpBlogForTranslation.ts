/** Dumps one blogPost's EN source (title/excerpt/keyFacts/faq/content) as JSON for inline translation. */
import path from 'node:path'
import { config as loadDotenv } from 'dotenv'
import { createClient } from '@sanity/client'
loadDotenv({ path: path.resolve(process.cwd(), '.env') })
const client = createClient({
  projectId: (process.env.SANITY_PROJECT_ID || '').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN?.trim(),
  useCdn: false,
})
async function main() {
  const slug = process.argv[2]
  const doc = await client.fetch(
    `*[_type == "blogPost" && slug.current == $slug][0]{
      _id, "titleEn": title.en, "excerptEn": excerpt.en,
      "keyFacts": keyFacts[]{_key, "en": en},
      "faq": faq[]{_key, "questionEn": question.en, "answerEn": answer.en},
      "content": content.en
    }`,
    { slug }
  )
  if (!doc) { console.log('NOT FOUND'); return }
  console.log(JSON.stringify(doc, null, 1))
}
main()
