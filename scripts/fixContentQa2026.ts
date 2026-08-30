/**
 * Idempotent content-QA remediation for the 2026 audit (ТЗ-6, part 3).
 *
 *   npx tsx scripts/fixContentQa2026.ts            # dry run (default)
 *   npx tsx scripts/fixContentQa2026.ts --execute  # apply mutations
 *
 * Does NOT delete anything: duplicates/garbage are unpublished (isPublished:false).
 * Content facts come only from the research knowledge base — see the data files.
 * Re-running is safe: it writes the same authored values every time.
 */

import 'dotenv/config';
import { createClient } from '@sanity/client';
import {
  CITY_DECLENSION,
  HOME_FAQ,
  HOME_HERO_TITLE,
  HOME_SEO_TEXT,
  type L,
} from './fixContentQa2026.data';
import { DISTRICT_DESCRIPTIONS } from './fixContentQa2026.districts';

const projectId = process.env.SANITY_PROJECT_ID || process.env.SANITY_STUDIO_PROJECT_ID || 'g4aqp6ex';
const dataset = process.env.SANITY_DATASET || process.env.SANITY_STUDIO_DATASET || 'production';
const token = process.env.SANITY_API_TOKEN;

const EXECUTE = process.argv.includes('--execute');

if (!token) {
  console.error('Missing SANITY_API_TOKEN in env.');
  process.exit(1);
}

const client = createClient({ projectId, dataset, apiVersion: '2024-01-01', token, useCdn: false });

const HOME_ID = 'landing-home';
/** Duplicate of pazari-i-ri (native slug kept); English-slug twin unpublished. */
const UNPUBLISH_DISTRICTS = ['district-new-bazaar'];
/** "canggu" is actually the Shkodër city document with a wrong slug — hidden for owner review. */
const UNPUBLISH_CITIES = ['city-shkoder'];

type Patch = { id: string; set?: Record<string, unknown>; unset?: string[] };
const patches: Patch[] = [];
const notes: string[] = [];

function localizedText(l: L) {
  return { en: l.en, ru: l.ru, uk: l.uk, sq: l.sq, it: l.it };
}

async function plan() {
  // 1. Unpublish duplicate district + mislabelled city (reversible).
  for (const id of [...UNPUBLISH_DISTRICTS, ...UNPUBLISH_CITIES]) {
    const doc = await client.fetch<{ _id: string; isPublished?: boolean } | null>(
      `*[_id == $id][0]{_id, isPublished}`,
      { id },
    );
    if (doc && doc.isPublished !== false) {
      patches.push({ id, set: { isPublished: false } });
      notes.push(`unpublish ${id}`);
    }
  }

  // 2. City Albanian declension forms (fills the CQ-04 grammar source).
  for (const [slug, forms] of Object.entries(CITY_DECLENSION)) {
    const city = await client.fetch<{ _id: string; sqDeclension?: unknown } | null>(
      `*[_type == "city" && slug.current == $slug][0]{_id, sqDeclension}`,
      { slug },
    );
    if (city) {
      patches.push({ id: city._id, set: { sqDeclension: { locative: forms.locative, genitive: forms.genitive } } });
      notes.push(`declension ${slug} → në ${forms.locative} / e ${forms.genitive}`);
    }
  }

  // 3. Tirana district descriptions (only for published, kept districts).
  for (const [slug, desc] of Object.entries(DISTRICT_DESCRIPTIONS)) {
    const d = await client.fetch<{ _id: string } | null>(
      `*[_type == "district" && slug.current == $slug && !(_id in $skip)][0]{_id}`,
      { slug, skip: UNPUBLISH_DISTRICTS },
    );
    if (d) {
      patches.push({ id: d._id, set: { description: localizedText(desc) } });
      notes.push(`district description ${slug} (${desc.en.length} chars en)`);
    }
  }

  // 4. Home landing: hero title, SEO text, FAQ, drop rent property type.
  const home = await client.fetch<{
    _id: string;
    pageSections?: Array<{ _key: string; _type: string; propertyTypes?: Array<{ _ref: string }> }>;
  } | null>(`*[_id == $id][0]{_id, pageSections[]{_key, _type, propertyTypes}}`, { id: HOME_ID });

  if (home?.pageSections) {
    for (const s of home.pageSections) {
      if (s._type === 'heroSection') {
        patches.push({ id: HOME_ID, set: { [`pageSections[_key=="${s._key}"].title`]: localizedText(HOME_HERO_TITLE) } });
        notes.push('home hero title → sale-focus');
      }
      if (s._type === 'seoTextSection') {
        patches.push({ id: HOME_ID, set: { [`pageSections[_key=="${s._key}"].content`]: localizedText(HOME_SEO_TEXT) } });
        notes.push('home SEO text → sale-focus');
      }
      if (s._type === 'faqSection') {
        const items = HOME_FAQ.map((item, i) => ({
          _key: `faq-sale-${i + 1}`,
          _type: 'localizedFaqItem',
          question: localizedText(item.q),
          answer: localizedText(item.a),
        }));
        patches.push({ id: HOME_ID, set: { [`pageSections[_key=="${s._key}"].items`]: items } });
        notes.push(`home FAQ → ${items.length} sale-focus items`);
      }
      if (s._type === 'propertyTypesSection' && Array.isArray(s.propertyTypes)) {
        // Drop the short-term-rent "type" ref (it links to a rent listing).
        const rentType = await client.fetch<string | null>(
          `*[_type == "propertyType" && slug.current == "short-term-rent"][0]._id`,
        );
        if (rentType && s.propertyTypes.some((r) => r._ref === rentType)) {
          patches.push({ id: HOME_ID, unset: [`pageSections[_key=="${s._key}"].propertyTypes[_ref=="${rentType}"]`] });
          notes.push('home propertyTypes → drop short-term-rent');
        }
      }
    }
  }
}

async function apply() {
  let tx = client.transaction();
  for (const p of patches) {
    let patch = client.patch(p.id);
    if (p.set) patch = patch.set(p.set);
    if (p.unset) patch = patch.unset(p.unset);
    tx = tx.patch(patch);
  }
  const res = await tx.commit();
  console.log(`Applied ${patches.length} patches. Transaction ${res.transactionId}.`);
}

async function main() {
  console.log(`fixContentQa2026 — ${EXECUTE ? 'EXECUTE' : 'DRY RUN'} (${projectId}/${dataset})\n`);
  await plan();
  for (const n of notes) console.log('  •', n);
  console.log(`\n${patches.length} patch(es) planned.`);
  if (!EXECUTE) {
    console.log('Dry run only. Re-run with --execute to apply.');
    return;
  }
  await apply();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
