import fs from 'node:fs'; import path from 'node:path'
import {createRequire} from 'node:module'
const req = createRequire(path.resolve('package.json'))
const {config} = req('dotenv'); config({path: path.resolve('.env')})
const {createClient} = req('@sanity/client')
const c = createClient({projectId:'g4aqp6ex',dataset:'production',apiVersion:'2024-01-01',token:process.env.SANITY_API_TOKEN.trim(),useCdn:false})
const out = process.argv[2]
for (const t of ['blogPost','knowledgeArticle','landingPage','catalogSeoPage','city','district','property']) {
  const docs = await c.fetch(`*[_type==$t && !(_id in path("drafts.**"))]`, {t})
  fs.writeFileSync(path.join(out, t+'.json'), JSON.stringify(docs))
  console.log(t, docs.length)
}
const drafts = await c.fetch(`count(*[_id in path("drafts.**") && _type in ["blogPost","knowledgeArticle","landingPage","catalogSeoPage","city","district","property"]])`)
console.log('drafts', drafts)
