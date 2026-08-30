/** Read-only: pulls every `object` record from DatoCMS and reports the shape. */
import path from 'path'
import {config} from 'dotenv'
config({path: path.resolve(process.cwd(), '.env')})
const T = (process.env.DATO_API_TOKEN || '').trim()
const B = 'https://site-api.datocms.com'
async function dato(p) {
  const r = await fetch(B + p, {headers: {Authorization: `Bearer ${T}`, Accept: 'application/json', 'X-Api-Version': '3'}})
  if (!r.ok) throw new Error(p + ' -> ' + r.status + ' ' + (await r.text()).slice(0, 300))
  return r.json()
}
const all = []
let off = 0
for (;;) {
  const j = await dato(`/items?filter[type]=object&page[limit]=100&page[offset]=${off}`)
  all.push(...j.data)
  if (j.data.length < 100) break
  off += 100
}
console.log('всего объектов:', all.length)
console.log('\n=== пример записи ===')
console.log(JSON.stringify(all[0].attributes, null, 1).slice(0, 1800))
import fs from 'fs'
fs.writeFileSync('dato-objects-raw.json', JSON.stringify(all, null, 2))
console.log('\nсохранено в dato-objects-raw.json')
