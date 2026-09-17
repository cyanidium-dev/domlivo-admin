/** Does an unauthenticated client see the knowledge documents? */
import {createClient} from '@sanity/client'
import path from 'path'
import {config as loadDotenv} from 'dotenv'
loadDotenv({path: path.resolve(process.cwd(), '.env')})

async function main() {
  const projectId = (process.env.SANITY_PROJECT_ID || '').trim()
  const dataset = (process.env.SANITY_DATASET || 'production').trim()
  const anon = createClient({projectId, dataset, apiVersion: '2024-01-01', useCdn: false})
  const withToken = createClient({projectId, dataset, apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_API_TOKEN})
  for (const [label, c] of [['anon', anon], ['token', withToken]] as const) {
    try {
      const r = await c.fetch(`{
        "facts": count(*[_type=="knowledgeFact"]),
        "current": count(*[_type=="knowledgeFact" && isCurrent == true]),
        "articles": count(*[_type=="knowledgeArticle"]),
        "published": count(*[_type=="knowledgeArticle" && isPublished == true]),
        "props": count(*[_type=="property"])
      }`)
      console.log(label, r)
    } catch (e) {
      console.log(label, 'ERROR', e instanceof Error ? e.message : e)
    }
  }
}
main()
