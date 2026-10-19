/**
 * Creates the two founder bylines as `blogAuthor` documents, so articles can be
 * signed by a person instead of the editorial team:
 *   blogAuthor-fedir-alpatov       — writes the data and market articles
 *   blogAuthor-viktor-grinchenko   — checks the legal and tax articles (reviewedBy)
 *
 * Nothing here is new copy: role and bio in all seven locales are read from the
 * site's /about page messages (your-house-albania/messages/<locale>.json,
 * About.team.members.<key>), the photographs are the ones /about shows
 * (public/images/team), the links are those in src/lib/about/team.ts. The slugs
 * equal the Person @id fragments the site emits, which is how the frontend
 * joins an article's author to the founder on /about.
 *
 * createIfNotExists: a re-run never overwrites Studio edits.
 *
 * Run:
 *   npx tsx scripts/createFounderAuthors20261019.ts --site ../your-house-albania [--execute]
 */
import fs from 'node:fs'
import path from 'node:path'
import {getSanityClientForScripts} from './lib/sanityEnvClient'

const execute = process.argv.includes('--execute')
const siteArg = process.argv.indexOf('--site')
const SITE = path.resolve(process.cwd(), siteArg >= 0 ? process.argv[siteArg + 1] : '../your-house-albania')
const LOCALES = ['en', 'uk', 'ru', 'sq', 'it', 'pl', 'de'] as const

type Founder = {
  id: string
  key: 'fedir' | 'viktor'
  slug: string
  name: string
  photo: string
  links: Array<{platform: string; url: string}>
}

const FOUNDERS: Founder[] = [
  {
    id: 'blogAuthor-fedir-alpatov',
    key: 'fedir',
    slug: 'fedir-alpatov',
    name: 'Fedir Alpatov',
    photo: 'public/images/team/fedir-alpatov.jpg',
    links: [{platform: 'website', url: 'https://www.code-site.art'}],
  },
  {
    id: 'blogAuthor-viktor-grinchenko',
    key: 'viktor',
    slug: 'viktor-grinchenko',
    name: 'Viktor Grinchenko',
    photo: 'public/images/team/viktor-grinchenko.jpg',
    links: [
      {platform: 'website', url: 'https://www.grinchenko-realestate.com'},
      {platform: 'telegram', url: 'https://t.me/real_estate_al'},
      {platform: 'instagram', url: 'https://www.instagram.com/grinchenko.realestate'},
      {platform: 'youtube', url: 'https://www.youtube.com/@grinchenko.realestate'},
    ],
  },
]

function aboutCopy(key: Founder['key']) {
  const role: Record<string, string> = {_type: 'localizedString'}
  const bio: Record<string, string> = {_type: 'localizedText'}
  for (const l of LOCALES) {
    const m = JSON.parse(fs.readFileSync(path.join(SITE, 'messages', `${l}.json`), 'utf8'))
    const member = m?.About?.team?.members?.[key]
    if (!member?.role || !member?.bio) throw new Error(`messages/${l}.json has no About.team.members.${key}`)
    role[l] = member.role
    bio[l] = member.bio
  }
  return {role, bio}
}

async function main(): Promise<void> {
  const client = getSanityClientForScripts()
  const existing = new Set<string>(await client.fetch(`*[_id in $ids]._id`, {ids: FOUNDERS.map((f) => f.id)}))
  for (const f of FOUNDERS) {
    const {role, bio} = aboutCopy(f.key)
    const photoPath = path.join(SITE, f.photo)
    if (!fs.existsSync(photoPath)) throw new Error(`no photo at ${photoPath}`)
    console.log(`${existing.has(f.id) ? 'skip  ' : 'create'} ${f.id} — ${role.en}`)
    if (!execute || existing.has(f.id)) continue
    const asset = await client.assets.upload('image', fs.createReadStream(photoPath), {filename: path.basename(photoPath)})
    await client.createIfNotExists({
      _id: f.id,
      _type: 'blogAuthor',
      name: f.name,
      slug: {_type: 'slug', current: f.slug},
      active: true,
      role,
      bio,
      photo: {_type: 'image', asset: {_type: 'reference', _ref: asset._id}, alt: f.name},
      socialLinks: f.links.map((l, i) => ({_key: `${f.slug}-${i}`, _type: 'socialLink', channel: 'social', ...l})),
    })
    console.log(`  wrote ${f.id}`)
  }
  if (!execute) console.log('\nDry run. Re-run with --execute.')
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
