/**
 * Checks that a blog post's translated locales are actually translated —
 * every body block and every localized field, compared word-for-word
 * against the English source, not just a block count or a spot-checked
 * field. `translateBlogPost.ts`'s own summary output ("writes N field-
 * locale values, body for 4 locales") reports what it INTENDED to write,
 * not what the endpoint actually returned; a batch that comes back
 * malformed can silently leave several blocks unchanged in every non-
 * English locale while the run still reports success. This script is the
 * check that catches that after the fact, on the real document.
 *
 * Found exactly this bug in production data twice during the 2026-08
 * translate runs — one batch's response came back JSON-stringified rather
 * than parsed, another came back with a smaller batch cap fixing it, and
 * this script is what confirmed each fix before moving on rather than
 * trusting the loader's own success message.
 *
 * Run after every translateBlogPost.ts --execute, not just when something
 * looks wrong:
 *   npm run audit:block-translations -- <slug> [<slug> ...]
 */

import path from 'node:path'
import {config as loadDotenv} from 'dotenv'
import {createClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

const client = createClient({
  projectId: (process.env.SANITY_PROJECT_ID || '').trim(),
  dataset: (process.env.SANITY_DATASET || 'production').trim(),
  apiVersion: (process.env.SANITY_API_VERSION || '2024-01-01').trim(),
  token: process.env.SANITY_API_TOKEN?.trim(),
  useCdn: false,
})

const slugs = process.argv.slice(2)
if (slugs.length === 0) throw new Error('usage: tsx scripts/_auditBlockTranslations.ts <slug> [<slug> ...]')

function textOf(block: any): string {
  if (!block || block._type !== 'block') return '(non-block)'
  return (block.children || []).map((c: any) => c.text || '').join('')
}

async function main() {
  let totalIssues = 0
  for (const slug of slugs) {
    const doc: any = await client.getDocument(`drafts.blogPost-${slug}`)
    if (!doc) {
      console.log(slug, 'MISSING DRAFT')
      continue
    }
    const en = doc.content?.en || []
    let issues = 0
    for (let i = 0; i < en.length; i++) {
      if (en[i]._type !== 'block') continue
      const enText = textOf(en[i])
      for (const loc of ['uk', 'ru', 'sq', 'it']) {
        const b = (doc.content?.[loc] || [])[i]
        const t = textOf(b)
        if (t === enText || !t.trim()) {
          console.log(`  ${slug} block ${i} [${loc}]: ${!t.trim() ? 'EMPTY' : 'IDENTICAL TO EN'} -- "${t.slice(0, 50)}"`)
          issues++
        }
      }
    }
    // Also check the localized field level (title, excerpt, keyFacts, faq, seo)
    const fieldChecks: Array<[string, any]> = [
      ['title', doc.title],
      ['excerpt', doc.excerpt],
      ['seo.metaTitle', doc.seo?.metaTitle],
      ['seo.metaDescription', doc.seo?.metaDescription],
    ]
    for (const [name, obj] of fieldChecks) {
      if (!obj) continue
      for (const loc of ['uk', 'ru', 'sq', 'it']) {
        const v = obj[loc]
        if (!v || !String(v).trim()) {
          console.log(`  ${slug} field ${name} [${loc}]: EMPTY`)
          issues++
        } else if (v === obj.en) {
          console.log(`  ${slug} field ${name} [${loc}]: IDENTICAL TO EN -- "${String(v).slice(0, 40)}"`)
          issues++
        }
      }
    }
    for (const kf of doc.keyFacts || []) {
      for (const loc of ['uk', 'ru', 'sq', 'it']) {
        if (!kf[loc] || !String(kf[loc]).trim()) {
          console.log(`  ${slug} keyFacts[${kf._key}] [${loc}]: EMPTY`)
          issues++
        }
      }
    }
    for (const f of doc.faq || []) {
      for (const loc of ['uk', 'ru', 'sq', 'it']) {
        if (!f.question?.[loc] || !f.answer?.[loc]) {
          console.log(`  ${slug} faq[${f._key}] [${loc}]: EMPTY question or answer`)
          issues++
        }
      }
    }
    console.log(`${slug}: ${issues === 0 ? 'CLEAN' : `${issues} issue(s)`}`)
    totalIssues += issues
  }
  console.log(`\nTotal issues across ${slugs.length} document(s): ${totalIssues}`)
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
