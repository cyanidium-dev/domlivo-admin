"""Score seg/ (before) against seg-new/ (after) for one work folder.
Usage: python segcheck.py <folder> [id ...]
Prints per language: Russian scanner score (ru), stock-phrase hits (other languages), long dashes."""
import sys, re, json
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
sys.path.insert(0, str(Path.home() / '.claude/skills/humanizer-ru/scripts'))
from humanizer_metrics import analyze, cleanliness_score
from humanizer_metrics.markers import effective_hard_bans
from markers import marker_hits, dashes, translation_flags

TAG = re.compile(r'^\[s(\d+)(?: [^\]]*)?\]\s*$')


def text(p):
    if not p.exists():
        return None
    out = []
    for line in p.read_text(encoding='utf-8').splitlines():
        if not TAG.match(line):
            out.append(line)
    return '\n'.join(out)


def ru(t):
    rep = analyze(t)
    sc = cleanliness_score(rep, 'marketing')
    bans = effective_hard_bans(rep.hard_bans, rep.rhythm.words)
    return sc.score, [f'{h.marker}x{h.count}' for h in bans], [p[0] for p in sc.penalties]


d = Path(sys.argv[1])
ids = sys.argv[2:] or sorted({p.name.rsplit('.', 2)[0] for p in (d / 'seg').glob('*.txt')})
for i in ids:
    print(f'== {i}')
    for l in ['ru', 'en', 'uk', 'de', 'it', 'pl', 'sq']:
        b, a = text(d / 'seg' / f'{i}.{l}.txt'), text(d / 'seg-new' / f'{i}.{l}.txt')
        if b is None:
            continue
        if l == 'ru':
            sb = ru(b)
            line = f'  ru  before {sb[0]} bans {sb[1]}'
            if a is not None:
                sa = ru(a)
                line += f'  ->  after {sa[0]} bans {sa[1]} penalties {sa[2]}'
        else:
            line = f'  {l}  before markers {sum(marker_hits(b, l).values())}'
            if a is not None:
                h = marker_hits(a, l)
                line += f'  ->  after markers {sum(h.values())} {list(h)[:6] if h else ""}'
        if a is not None and dashes(a):
            line += f'  LONG DASHES {dashes(a)}'
        fl = translation_flags(a if a is not None else b, l)
        if fl:
            line += f'  flags {fl[:4]}'
        print(line)
