/**
 * Covers for the 2026-10-15 articles (protests overview, protests and property).
 * Two Wikimedia Commons photographs, each checked on its Commons page: licence,
 * author, place and date. Uploads the image and writes its `imageCredit`, so
 * the author reaches the reader on /image-credits as CC BY requires.
 *
 * Run: npx tsx scripts/uploadArticleCovers20261015.ts [--execute]
 * Prints the asset ids to pass to createArticlesFromDir.ts --cover.
 */
import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const execute = process.argv.includes('--execute')
const UA = 'domlivo-image-credits/1.0 (https://www.domlivo.com/en/image-credits)'

const client = createClient({
  projectId: (process.env.SANITY_PROJECT_ID || '').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: (process.env.SANITY_API_VERSION || '2024-01-01').trim(),
  token: process.env.SANITY_API_TOKEN?.trim(),
  useCdn: false,
})

const COVERS = [
  {
    file: 'Flamingo Revolution Tirana Protest nr14 June 13 2026 05.jpg',
    author: 'Albinfo',
    licence: 'cc-by-4.0',
    licenceLabel: 'CC BY 4.0',
    licenceUrl: 'https://creativecommons.org/licenses/by/4.0/',
    alt: 'Protesters with Albanian flags on Bulevardi Dëshmorët e Kombit in Tirana, 13 June 2026',
  },
  {
    file: 'Sazan island, view from Vlora.jpg',
    author: 'Zalasem1',
    licence: 'cc-by-4.0',
    licenceLabel: 'CC BY 4.0',
    licenceUrl: 'https://creativecommons.org/licenses/by/4.0/',
    alt: 'Sazan island seen from the Vlorë seafront between two palm trees',
  },
]

async function thumbUrl(file: string): Promise<string> {
  const api =
    'https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url&iiurlwidth=2400&titles=' +
    encodeURIComponent(`File:${file}`)
  const res = await fetch(api, {headers: {'User-Agent': UA}})
  const data = (await res.json()) as {query: {pages: Record<string, {imageinfo?: Array<{thumburl?: string; url: string}>}>}}
  const info = Object.values(data.query.pages)[0]?.imageinfo?.[0]
  if (!info) throw new Error(`${file}: not on Commons`)
  return info.thumburl ?? info.url
}

async function main(): Promise<void> {
  for (const c of COVERS) {
    const sourceUrl = `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(c.file.replace(/ /g, '_'))}`
    const url = await thumbUrl(c.file)
    console.log(`${c.file}\n  ${c.licenceLabel} · ${c.author}\n  ${url}`)
    if (!execute) continue
    const bytes = Buffer.from(await (await fetch(url, {headers: {'User-Agent': UA}})).arrayBuffer())
    const asset = await client.assets.upload('image', bytes, {
      filename: c.file,
      description: `Source: ${sourceUrl} · Licence: ${c.licenceLabel} · Author: ${c.author}.`,
    })
    await client.createOrReplace({
      _id: `imageCredit-${asset._id.replace(/^image-/, '').slice(0, 40)}`,
      _type: 'imageCredit',
      image: {_type: 'image', asset: {_type: 'reference', _ref: asset._id}},
      title: c.alt,
      author: c.author,
      licence: c.licence,
      licenceUrl: c.licenceUrl,
      sourceUrl,
      isStandIn: false,
    } as never)
    console.log(`  → ${asset._id}`)
  }
  if (!execute) console.log('\nDry run — nothing uploaded. Add --execute.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
