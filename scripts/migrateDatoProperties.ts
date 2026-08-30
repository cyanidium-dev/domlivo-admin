/**
 * Domlivo CMS — apply the rewritten partner listings from DatoCMS.
 *
 * What it does:
 * - Updates the 15 properties already in Sanity (matched by slug) and creates
 *   the 7 that are missing.
 * - On an existing record it writes only content: title, shortDescription,
 *   description, address, propertyOffers, status and the city / district / type
 *   references. Price, area and room counts are written on creation only —
 *   see the note by `numericFields`. Gallery, agent, promotion, counters and
 *   SEO are never touched, so a previous photo import survives.
 * - Copies the DatoCMS photos into Sanity for records it creates. The 15
 *   existing properties already have galleries and are left alone. Sanity
 *   de-duplicates assets by content hash, so a rerun re-uses what is there
 *   rather than uploading again.
 * - Unpublishes rentals (`isPublished: false`). Nothing is ever deleted —
 *   CONTENT-OPS.md forbids hard-deleting CMS documents.
 * - Idempotent: a second run reports "unchanged" and writes nothing.
 *
 * Content lives in scripts/datoContent/*. The descriptions there are rewritten
 * from the DatoCMS source, not copied: the originals are Telegram sales posts
 * with emoji, calls to action and, in two cases, the partner's own contact
 * details.
 *
 * Run:
 *   npm run migrate:dato-properties:dry
 *   npm run migrate:dato-properties
 */

import path from 'path'
import {readFileSync} from 'fs'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'
import type {Li, PropertyContent} from './datoContent/types'
import {BATCH_1} from './datoContent/batch1'
import {BATCH_2} from './datoContent/batch2'
import {BATCH_3} from './datoContent/batch3'
import {BATCH_4} from './datoContent/batch4'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const ENV = {
  projectId: (process.env.SANITY_PROJECT_ID || 'g4aqp6ex').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: (process.env.SANITY_API_VERSION || '2024-01-01').trim(),
  token: process.env.SANITY_API_TOKEN?.trim() || null,
}

const isDry = process.argv.includes('--dry')
const isExecute = process.argv.includes('--execute')

if (!ENV.token) {
  console.error('Error: SANITY_API_TOKEN required. Add it to .env')
  process.exit(1)
}
if (!isDry && !isExecute) {
  console.error('Use --dry to preview or --execute to write.')
  process.exit(1)
}

const client = createClient({
  projectId: ENV.projectId,
  dataset: ENV.dataset,
  apiVersion: ENV.apiVersion,
  useCdn: false,
  token: ENV.token,
})

const CONTENT: PropertyContent[] = [...BATCH_1, ...BATCH_2, ...BATCH_3, ...BATCH_4]

const DATO_TOKEN = (process.env.DATO_API_TOKEN || '').trim()
const DATO_BASE = 'https://site-api.datocms.com'

/** The gallery field caps at 30 images; two source records carry more. */
const GALLERY_MAX = 30

type DatoUpload = {url: string; basename: string; format: string; mimeType: string}

async function datoUpload(id: string): Promise<DatoUpload | null> {
  const res = await fetch(`${DATO_BASE}/uploads/${id}`, {
    headers: {
      Authorization: `Bearer ${DATO_TOKEN}`,
      Accept: 'application/json',
      'X-Api-Version': '3',
    },
  })
  if (!res.ok) return null
  const json = (await res.json()) as {data?: {attributes?: Record<string, string>}}
  const a = json.data?.attributes
  if (!a?.url) return null
  return {
    url: a.url,
    basename: a.basename || id,
    format: a.format || 'jpg',
    mimeType: a.mime_type || 'image/jpeg',
  }
}

/** Photo upload ids for a listing, main photo first. */
function datoPhotoIds(rec: Record<string, unknown>): string[] {
  const ids: string[] = []
  const main = rec.mainphoto as {upload_id?: string} | undefined
  if (main?.upload_id) ids.push(main.upload_id)
  const rest = Array.isArray(rec.allphotos) ? (rec.allphotos as {upload_id?: string}[]) : []
  for (const p of rest) {
    if (p?.upload_id && !ids.includes(p.upload_id)) ids.push(p.upload_id)
  }
  return ids.slice(0, GALLERY_MAX)
}

/**
 * Downloads from DatoCMS and uploads to Sanity, returning gallery members.
 * Sanity keys assets by content hash, so re-running reuses the same asset
 * instead of duplicating it.
 */
async function buildGallery(
  slug: string,
  ids: string[],
  altText: string,
): Promise<Record<string, unknown>[]> {
  const gallery: Record<string, unknown>[] = []
  for (let i = 0; i < ids.length; i++) {
    const meta = await datoUpload(ids[i])
    if (!meta) {
      console.warn(`    ! ${slug}: upload ${ids[i]} could not be read from Dato — skipped`)
      continue
    }
    const bin = await fetch(meta.url)
    if (!bin.ok) {
      console.warn(`    ! ${slug}: ${meta.url} -> ${bin.status} — skipped`)
      continue
    }
    const buffer = Buffer.from(await bin.arrayBuffer())
    const asset = await client.assets.upload('image', buffer, {
      filename: `${slug}-${i + 1}.${meta.format}`,
      contentType: meta.mimeType,
    })
    gallery.push({
      _type: 'image',
      _key: `dato-${slug}-img-${i}`.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 60),
      asset: {_type: 'reference', _ref: asset._id},
      alt: altText,
    })
  }
  if (gallery.length) console.log(`    ${slug}: ${gallery.length}/${ids.length} photos copied`)
  return gallery
}

const LOCALES = ['en', 'uk', 'ru', 'sq', 'it', 'pl'] as const

/** Deterministic key so reruns do not churn array items. */
function offerKey(slug: string, index: number): string {
  return `dato-${slug}-offer-${index}`.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 60)
}

function liEqual(a: Li | undefined | null, b: Li): boolean {
  if (!a) return false
  return LOCALES.every((l) => (a as Record<string, string>)[l]?.trim() === b[l]?.trim())
}

type SanityProperty = {
  _id: string
  slug?: string
  title?: Li
  shortDescription?: Li
  description?: Li
  address?: Li
  price?: number
  area?: number
  bedrooms?: number
  bathrooms?: number
  status?: string
  isPublished?: boolean
  cityId?: string
  districtId?: string
  typeId?: string
  offersCount?: number
}

type Plan = {
  slug: string
  action: 'create' | 'update' | 'unchanged'
  fields: string[]
  doc?: Record<string, unknown>
  patch?: Record<string, unknown>
  id?: string
  review?: string
  /** DatoCMS upload ids to copy across, for records being created. */
  photoIds?: string[]
  altText?: string
}

async function run() {
  if (!DATO_TOKEN) {
    console.error('Error: DATO_API_TOKEN required for the photo copy. Add it to .env')
    process.exit(1)
  }
  // Raw DatoCMS dump produced by scripts/datoPull.mjs — the photo ids live here.
  const datoRaw = JSON.parse(
    readFileSync(path.resolve(process.cwd(), 'dato-objects-raw.json'), 'utf8'),
  ) as {attributes: Record<string, unknown>}[]
  const datoBySlug = new Map(
    datoRaw
      .map((r) => [String(r.attributes.slug || ''), r.attributes] as const)
      .filter(([slug]) => slug),
  )

  const [cities, districts, types, existing] = await Promise.all([
    client.fetch<{_id: string; slug: string}[]>(
      `*[_type=="city" && defined(slug.current)]{_id, "slug": slug.current}`,
    ),
    client.fetch<{_id: string; slug: string; city: string}[]>(
      `*[_type=="district" && defined(slug.current)]{_id, "slug": slug.current, "city": city->slug.current}`,
    ),
    client.fetch<{_id: string; slug: string}[]>(
      `*[_type=="propertyType" && defined(slug.current)]{_id, "slug": slug.current}`,
    ),
    client.fetch<SanityProperty[]>(
      `*[_type=="property"]{
        _id, "slug": slug.current, title, shortDescription, description, address,
        price, area, bedrooms, bathrooms, status, isPublished,
        "cityId": city._ref, "districtId": district._ref, "typeId": type._ref,
        "offersCount": count(propertyOffers)
      }`,
    ),
  ])

  const cityId = new Map(cities.map((c) => [c.slug, c._id]))
  const districtId = new Map(districts.map((d) => [d.slug, d._id]))
  const typeId = new Map(types.map((t) => [t.slug, t._id]))
  const bySlug = new Map(existing.filter((p) => p.slug).map((p) => [p.slug as string, p]))

  const plans: Plan[] = []
  const problems: string[] = []
  const mismatches: string[] = []

  for (const c of CONTENT) {
    const cid = cityId.get(c.city)
    const tid = typeId.get(c.type)
    if (!cid) {
      problems.push(`${c.slug}: city "${c.city}" not found in Sanity`)
      continue
    }
    if (!tid) {
      problems.push(`${c.slug}: property type "${c.type}" not found in Sanity`)
      continue
    }
    let did: string | undefined
    if (c.district) {
      did = districtId.get(c.district)
      if (!did) problems.push(`${c.slug}: district "${c.district}" not found — left unset`)
    }

    const offers = c.offers.map((o, i) => ({
      _type: 'propertyOffer',
      _key: offerKey(c.slug, i),
      title: o.title,
      iconKey: o.iconKey,
    }))

    // Content this import owns on every run.
    const contentFields: Record<string, unknown> = {
      title: c.title,
      shortDescription: c.shortDescription,
      description: c.description,
      address: c.address,
      propertyOffers: offers,
      status: c.status,
      city: {_type: 'reference', _ref: cid},
      type: {_type: 'reference', _ref: tid},
      ...(did ? {district: {_type: 'reference', _ref: did}} : {}),
    }

    // Commercial and numeric fields are written ONLY when creating a record.
    //
    // The prices already in Sanity sit above the DatoCMS ones - 169,000 vs
    // 135,000 on the Vlore house, 104,000 vs 94,000 on the central Durres flat
    // - which reads as a deliberate markup over the partner's figure.
    // Overwriting them from Dato would silently wipe that margin, and the brief
    // was to rewrite descriptions. Differences are reported instead, for the
    // owner to settle.
    const numericFields: Record<string, unknown> = {
      ...(c.price !== undefined ? {price: c.price} : {}),
      ...(c.area !== undefined ? {area: c.area} : {}),
      ...(c.bedrooms !== undefined ? {bedrooms: c.bedrooms} : {}),
      ...(c.bathrooms !== undefined ? {bathrooms: c.bathrooms} : {}),
    }

    const found = bySlug.get(c.slug)
    if (!found) {
      const sourceRec = datoBySlug.get(c.slug)
      plans.push({
        slug: c.slug,
        action: 'create',
        fields: [...Object.keys(contentFields), ...Object.keys(numericFields)],
        review: c.review,
        photoIds: sourceRec ? datoPhotoIds(sourceRec) : [],
        altText: c.title.en,
        doc: {
          _type: 'property',
          slug: {_type: 'slug', current: c.slug},
          isPublished: true,
          ...contentFields,
          ...numericFields,
        },
      })
      continue
    }

    const changed: string[] = []
    if (!liEqual(found.title, c.title)) changed.push('title')
    if (!liEqual(found.shortDescription, c.shortDescription)) changed.push('shortDescription')
    if (!liEqual(found.description, c.description)) changed.push('description')
    if (!liEqual(found.address, c.address)) changed.push('address')
    if ((found.offersCount ?? 0) !== offers.length) changed.push('propertyOffers')
    if (found.status !== c.status) changed.push('status')
    if (found.cityId !== cid) changed.push('city')
    if (found.typeId !== tid) changed.push('type')
    if (did && found.districtId !== did) changed.push('district')
    // Numeric differences are reported, never written, on an existing record.
    const numericNotes: string[] = []
    if (c.price !== undefined && found.price !== c.price) {
      numericNotes.push(`price: site ${found.price} vs partner ${c.price}`)
    }
    if (c.area !== undefined && found.area !== c.area) {
      numericNotes.push(`area: site ${found.area} vs partner ${c.area}`)
    }
    if (c.bedrooms !== undefined && found.bedrooms !== c.bedrooms) {
      numericNotes.push(`bedrooms: site ${found.bedrooms} vs partner ${c.bedrooms}`)
    }
    if (c.bathrooms !== undefined && found.bathrooms !== c.bathrooms) {
      numericNotes.push(`bathrooms: site ${found.bathrooms} vs partner ${c.bathrooms}`)
    }
    if (numericNotes.length) mismatches.push(`${c.slug}: ${numericNotes.join('; ')}`)

    // propertyOffers are always rewritten when anything else changed: the
    // count matching does not prove the copy matches.
    if (changed.length && !changed.includes('propertyOffers')) changed.push('propertyOffers')

    plans.push({
      slug: c.slug,
      action: changed.length ? 'update' : 'unchanged',
      fields: changed,
      id: found._id,
      patch: contentFields,
      review: c.review,
    })
  }

  // Rentals: hide from the site without deleting anything.
  const rentals = existing.filter((p) => p.status === 'rent' && p.isPublished !== false)

  // ——— Report ———
  const creates = plans.filter((p) => p.action === 'create')
  const updates = plans.filter((p) => p.action === 'update')
  const same = plans.filter((p) => p.action === 'unchanged')

  console.log(`\nDataset ${ENV.projectId}/${ENV.dataset}`)
  console.log(`Content records: ${CONTENT.length}`)
  console.log(`  create:    ${creates.length}`)
  console.log(`  update:    ${updates.length}`)
  console.log(`  unchanged: ${same.length}`)
  console.log(`Rentals to unpublish: ${rentals.length}`)

  if (creates.length) {
    console.log('\n— CREATE —')
    creates.forEach((p) => {
      const n = p.photoIds?.length ?? 0
      console.log(`  + ${p.slug}  (${n} photo${n === 1 ? '' : 's'} to copy)`)
    })
    const totalPhotos = creates.reduce((sum, p) => sum + (p.photoIds?.length ?? 0), 0)
    console.log(`    total photos to copy: ${totalPhotos}`)
  }
  if (updates.length) {
    console.log('\n— UPDATE —')
    updates.forEach((p) => console.log(`  ~ ${p.slug}  [${p.fields.join(', ')}]`))
  }
  if (same.length) {
    console.log('\n— UNCHANGED —')
    same.forEach((p) => console.log(`  = ${p.slug}`))
  }
  if (rentals.length) {
    console.log('\n— UNPUBLISH (rent) —')
    rentals.forEach((r) => console.log(`  · ${r.slug}`))
  }

  const reviews = plans.filter((p) => p.review)
  if (reviews.length) {
    console.log('\n— NEEDS THE OWNER’S EYE —')
    reviews.forEach((p) => console.log(`  ! ${p.slug}\n      ${p.review}`))
  }
  if (mismatches.length) {
    console.log('')
    console.log('- NUMBERS LEFT ALONE (site value kept, partner value differs) -')
    mismatches.forEach((m) => console.log(`  != ${m}`))
  }
  if (problems.length) {
    console.log('\n— PROBLEMS —')
    problems.forEach((p) => console.log(`  ✗ ${p}`))
  }

  console.log(
    '\nAlbanian copy is written natively but is PENDING NATIVE REVIEW, as CONTENT-OPS.md requires.',
  )
  console.log(
    'Photos are copied from DatoCMS for new records only; existing galleries are left as they are.',
  )

  if (isDry) {
    console.log('\n(dry run — nothing written)')
    return
  }

  if (!creates.length && !updates.length && !rentals.length) {
    console.log('\nNothing to write.')
    return
  }

  // Photos first: the gallery field requires at least one image, so a create
  // without it would be rejected by the schema.
  for (const p of creates) {
    const ids = p.photoIds ?? []
    if (!ids.length) {
      console.warn(`  ! ${p.slug}: no photos in the source record`)
      continue
    }
    const gallery = await buildGallery(p.slug, ids, p.altText || p.slug)
    if (gallery.length) (p.doc as Record<string, unknown>).gallery = gallery
  }

  let tx = client.transaction()
  for (const p of creates) tx = tx.create(p.doc as never)
  for (const p of updates) tx = tx.patch(p.id as string, (patch) => patch.set(p.patch as never))
  for (const r of rentals) tx = tx.patch(r._id, (patch) => patch.set({isPublished: false}))
  await tx.commit()

  console.log(
    `\nCreated ${creates.length}, updated ${updates.length}, unpublished ${rentals.length} rental(s).`,
  )
}

run().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
