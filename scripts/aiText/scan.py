"""Score every editable prose field of the seven Sanity types per language and join it with
search impressions per URL (AI-text audit, wave 2, 2026-10-21).

Russian: the humanizer-ru scanner (~/.claude/skills/humanizer-ru), 0-100. Other languages: stock-phrase
and long-dash density from markers.py, capped by the Russian score of the same document, since the
translations share its structure. Priority of a document = sum over languages of
impressions (90 days) x (100 - score).

Run from the repo root:
  node scripts/aiText/dump.mjs <dumpdir>          (all published docs of the seven types, as JSON)
  python scripts/aiText/scan.py <dumpdir> <out.json>
The page analytics CSV path is CSV below; textmodel.py must walk fields the same way as
scripts/applyTextRewrite.ts."""
import csv, json, sys, re, collections
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
sys.path.insert(0, str(Path.home() / '.claude/skills/humanizer-ru/scripts'))
from humanizer_metrics import analyze, cleanliness_score
from textmodel import segments, plain, LOCALES
from markers import marker_hits, dashes, translation_flags

DUMP = Path(sys.argv[1]); OUT = sys.argv[2]
CSV = Path(r'C:/Users/User/Documents/GitHub/reports/domlivo-page-analytics-2026-10-20.csv')
TYPES = ['blogPost', 'knowledgeArticle', 'landingPage', 'catalogSeoPage', 'city', 'district', 'property']
docs = {t: json.load(open(DUMP / f'{t}.json', encoding='utf-8')) for t in TYPES}


def other_score(text, l):
    # each marker costs 15 points in a text up to 400 words, proportionally less in longer ones
    w = max(len(text.split()), 400)
    m = sum(marker_hits(text, l).values()); d = dashes(text)
    return max(0, round(100 - min(60, 6 * m * 1000 / w) - min(30, 2 * d * 1000 / w))), m, d


def score(text, l):
    if l == 'ru':
        if len(text.split()) < 15:
            return None, {}
        sc = cleanliness_score(analyze(text), 'marketing')
        return sc.score, {'pen': [p[0] for p in sc.penalties]}
    s, m, d = other_score(text, l)
    return s, {'markers': marker_hits(text, l), 'dashes': d}


# ---- URL -> doc ids
slug = lambda d: (d.get('slug') or {}).get('current')
by = collections.defaultdict(list)
for d in docs['blogPost']: by[('blog', slug(d))].append(d['_id'])
for d in docs['knowledgeArticle']: by[('knowledge', slug(d))].append(d['_id'])
for d in docs['landingPage']:
    pt = d.get('pageType')
    if pt == 'custom': by[('guide', slug(d))].append(d['_id'])
    elif pt in ('unique', 'investment'): by[('seo-landing', slug(d))].append(d['_id'])
    elif pt == 'city': by[('city', (d.get('linkedCity') or {}).get('_ref', '')[5:])].append(d['_id'])
    elif pt == 'district': by[('district', (d.get('linkedDistrict') or {}).get('_ref', '')[9:])].append(d['_id'])
for d in docs['city']: by[('city', slug(d))].append(d['_id'])
for d in docs['district']: by[('district', slug(d))].append(d['_id'])
for d in docs['catalogSeoPage']:
    if d.get('pageScope') == 'city': by[('citycat', (d.get('city') or {}).get('_ref', '')[5:])].append(d['_id'])
    if d.get('pageScope') == 'district': by[('distcat', (d.get('district') or {}).get('_ref', '')[9:])].append(d['_id'])
for d in docs['property']:
    for v in set([slug(d)] + list((d.get('localizedSlug') or {}).values())):
        if v: by[('property', v)].append(d['_id'])


def doc_ids(url, typ):
    parts = [p for p in url.split('/') if p]
    if parts and parts[0] in LOCALES: parts = parts[1:]
    if typ == 'blog': return by[('blog', parts[-1])]
    if typ == 'knowledge': return by[('knowledge', parts[-1])]
    if typ == 'guide': return by[('guide', parts[-1])]
    if typ == 'seo-landing': return by[('seo-landing', parts[0])]
    if typ == 'city-info': return by[('city', parts[1])]
    if typ == 'district-page': return by[('district', parts[3])]
    if typ in ('city-catalog', 'city-catalog-facet'): return by[('citycat', parts[1])] + [i for i in by[('city', parts[1])] if i.startswith('city-')]
    if typ in ('district-catalog', 'district-catalog-facet'): return by[('distcat', parts[3])] if len(parts) > 3 else []
    if typ == 'property': return by[('property', parts[-1])]
    return []


impr = collections.defaultdict(lambda: collections.defaultdict(lambda: [0, 0, 0, 0]))  # id -> locale -> [impr90, clicks90, impr28, clicks28]
urls = collections.defaultdict(set)
unmapped = collections.Counter()
for r in csv.DictReader(open(CSV, encoding='utf-8-sig')):
    ids = doc_ids(r['url'], r['type'])
    i90 = int(float(r['impr90'] or 0))
    if not ids:
        if i90: unmapped[r['type']] += i90
        continue
    l = r['locale'] or 'en'
    for i in ids:
        a = impr[i][l]
        a[0] += i90; a[1] += int(float(r['clicks90'] or 0)); a[2] += int(float(r['impr28'] or 0)); a[3] += int(float(r['clicks28'] or 0))
        urls[i].add(r['url'])

res = []
for t in TYPES:
    for d in docs[t]:
        row = {'type': t, 'id': d['_id'], 'rev': d['_rev'], 'slug': slug(d), 'pageType': d.get('pageType'), 'loc': {}, 'urls': sorted(urls[d['_id']])}
        pr = 0
        for l in LOCALES:
            text = plain(d, l)
            w = len(text.split())
            if not w: continue
            s, extra = score(text, l)
            im = impr[d['_id']][l]
            row['loc'][l] = {'words': w, 'score': s, **extra, 'impr90': im[0], 'clicks90': im[1], 'impr28': im[2], 'clicks28': im[3],
                             'flags': translation_flags(text, l)}
            if s is not None: pr += im[0] * (100 - s)
        # translations inherit the structure of the source text: a language without stock words
        # still gets at most the Russian scanner's score
        ru = (row['loc'].get('ru') or {}).get('score')
        pr = 0
        for l, v in row['loc'].items():
            if v['score'] is None: continue
            v['combined'] = min(v['score'], ru) if (ru is not None and l != 'ru') else v['score']
            pr += v['impr90'] * (100 - v['combined'])
        sc = [v['combined'] for v in row['loc'].values() if 'combined' in v]
        row['score'] = min(sc) if sc else None
        row['priority'] = pr
        row['impr90'] = sum(v['impr90'] for v in row['loc'].values())
        res.append(row)
json.dump({'docs': res, 'unmapped_impr90': unmapped}, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
print('unmapped impressions by type:', dict(unmapped))
