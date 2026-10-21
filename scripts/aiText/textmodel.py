"""Shared text model: which localized strings are editable prose, and how to walk them."""
import re
LOCALES = ['en', 'ru', 'uk', 'sq', 'it', 'pl', 'de']
LSET = set(LOCALES)
# path segments never rewritten: page titles, SEO (neighbour experiments), slugs, addresses,
# button/UI labels, table data
EXCLUDE_KEYS = {'seo', 'slug', 'localizedSlug', 'address', 'keywords', 'heroTitle', 'label', 'submitLabel',
                'seeAllLabel', 'cardCtaLabel', 'tabs', 'presets', 'columns', 'localizedCells', 'cells', 'search',
                'questionSet', 'propertyOffers'}


def is_loc(x):
    if not isinstance(x, dict):
        return False
    ks = set(x) - {'_type', '_key'}
    return bool(ks) and ks <= LSET and any(isinstance(x[k], (str, list)) for k in ks)


def hint(p):
    return '.'.join(str(s) if not isinstance(s, int) else '#' for s in p)


def segments(doc, locale):
    """(path, hint, text) for editable prose of one locale; path goes from the doc root to the string."""
    out = []

    def walk(x, p, top):
        if isinstance(x, dict):
            if is_loc(x):
                v = x.get(locale)
                if isinstance(v, str):
                    if v.strip():
                        out.append((p + [locale], hint(p), v))
                elif isinstance(v, list):
                    for bi, b in enumerate(v):
                        if not isinstance(b, dict) or b.get('_type') != 'block':
                            continue
                        for si, s in enumerate(b.get('children') or []):
                            t = s.get('text')
                            if isinstance(t, str) and t.strip():
                                h = hint(p) + f" {b.get('style', '')}" + (' LINK' if s.get('marks') else '') + (' li' if b.get('listItem') else '')
                                out.append((p + [locale, bi, 'children', si, 'text'], h, t))
                return
            for k, v in x.items():
                if k.startswith('_') or k in EXCLUDE_KEYS:
                    continue
                if top and k == 'title':
                    continue
                walk(v, p + [k], False)
        elif isinstance(x, list):
            for i, v in enumerate(x):
                walk(v, p + [i], False)

    walk(doc, [], True)
    return out


def get(doc, path):
    for k in path:
        doc = doc[k]
    return doc


def put(doc, path, v):
    for k in path[:-1]:
        doc = doc[k]
    doc[path[-1]] = v


def plain(doc, locale):
    """Prose of one locale: spans of one block joined, blocks and fields on their own lines."""
    lines, last = [], None
    for path, h, t in segments(doc, locale):
        blk = tuple(path[:-2]) if path[-1] == 'text' else None
        if blk is not None and blk == last:
            lines[-1] += t
        else:
            lines.append(t)
        last = blk
    return '\n'.join(lines)
