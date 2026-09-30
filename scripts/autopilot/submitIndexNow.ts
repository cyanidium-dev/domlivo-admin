/**
 * Submits URLs to IndexNow (Bing, Yandex, Seznam and partners) by hand.
 *
 * The site announces changes itself only from the Sanity revalidate webhook,
 * which has no secret configured, so a post created by a script is never
 * announced. The key is public by design: GET /api/indexnow-key serves it and
 * /indexnow-<key>.txt is the key file the protocol verifies.
 *
 * Run:
 *   npx tsx scripts/autopilot/submitIndexNow.ts https://www.domlivo.com/en/blog/x [more urls]
 *   npx tsx scripts/autopilot/submitIndexNow.ts --slug albania-property-market-h1-2026   (all 7 locales of a blog post)
 */
const SITE = 'https://www.domlivo.com'
const LOCALES = ['en', 'uk', 'ru', 'sq', 'it', 'pl', 'de']

async function main() {
  const args = process.argv.slice(2)
  let urls: string[] = []
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--slug') {
      const slug = args[++i]
      urls.push(...LOCALES.map((l) => `${SITE}/${l}/blog/${slug}`))
    } else if (args[i] === '--path') {
      const p = args[++i]
      urls.push(...LOCALES.map((l) => `${SITE}/${l}${p.startsWith('/') ? p : `/${p}`}`))
    } else if (args[i].startsWith('https://')) urls.push(args[i])
  }
  urls = [...new Set(urls)]
  if (!urls.length) throw new Error('no urls')
  const key = (await (await fetch(`${SITE}/api/indexnow-key`, {signal: AbortSignal.timeout(30_000)})).text()).trim()
  if (!/^[a-f0-9]{32}$/i.test(key)) throw new Error(`unexpected key: ${key.slice(0, 20)}`)
  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: {'Content-Type': 'application/json; charset=utf-8'},
    body: JSON.stringify({host: 'www.domlivo.com', key, keyLocation: `${SITE}/indexnow-${key}.txt`, urlList: urls}),
    signal: AbortSignal.timeout(30_000),
  })
  console.log(`indexnow ${res.status} for ${urls.length} urls`)
  if (res.status >= 400) {
    console.error(await res.text())
    process.exit(1)
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
