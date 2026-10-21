import re
# Short lists of AI-writing tells per language. en/de come from wave 1; it/pl/uk/sq follow the same idea:
# stock brochure adjectives, "not only ... but also", signposting, intensifiers, "dream home".
M = {
    'en': [r'\bdelv(e|es|ing)\b', r'\bnestled\b', r'\bvibrant\b', r'\bboasts?\b', r'\btapestry\b', r'\btestament\b', r'\bseamless(ly)?\b', r'\bunlock\b', r'\bembark\b', r'\belevate[sd]?\b', r"\bwhether you(?:'re| are)\b", r"\bin today'?s\b", r"\bit(?:'s| is) worth noting\b", r'\bit is important to note\b', r'\bnavigat(e|ing) the\b', r'\bin the heart of\b', r'\bstunning\b', r'\bbreathtaking\b', r'\bperfect for\b', r'\bideal for\b', r'\blook no further\b', r'\bhidden gem\b', r'\brich (history|heritage|culture)\b', r'\boffers? a unique\b', r'\ba (perfect |unique )?blend of\b', r'\bnot just\b[^.]{0,60}\bbut\b', r'\bnot only\b[^.]{0,80}\bbut also\b', r'\bdiscover\b', r'\bexperience the\b', r'\bpicturesque\b', r'\bbustling\b', r'\bcharming\b', r'\bultimately\b', r'\bmoreover\b', r'\bfurthermore\b', r'\bin conclusion\b', r'\bin summary\b', r'\bkey takeaways?\b', r'\bgame[- ]changer\b', r'\bpivotal\b', r'\brobust\b', r'\bcomprehensive\b', r'\bleverag(e|ing)\b', r'\bfoster(s|ing)?\b', r'\bcrucial\b', r'\bstreamline\b', r'\bdream (home|property|apartment)\b', r'\bcaptivating\b', r'\bunparalleled\b', r'\bexquisite\b'],
    'de': [r'\batemberaubend\w*', r'\beingebettet\w*', r'\bperfekt für\b', r'\bideal für\b', r'\bnicht nur\b[^.]{0,80}\bsondern auch\b', r'\bwahres? (Juwel|Paradies)\b', r'\bmalerisch\w*', r'\blebendig\w*', r'\bpulsierend\w*', r'\bim Herzen\b', r'\bverborgene[sn]? (Juwel|Perle)\b', r'\bentdecken Sie\b', r'\berleben Sie\b', r'\bein Hauch von\b', r'\bzeugt von\b', r'\bnahtlos\w*', r'\bumfassend\w*', r'\bentscheidend\w*', r'\bdarüber hinaus\b', r'\bzusammenfassend\b', r'\bletztendlich\b', r'\bes ist wichtig zu beachten\b', r'\bes ist erwähnenswert\b', r'\bcharmant\w*', r'\bgeschäftig\w*', r'\bTraum(haus|immobilie|wohnung)\w*', r'\beinzigartig\w*', r'\bunvergesslich\w*'],
    'it': [r'\bnel cuore d', r'\bimmers[aoie]\b', r'\bincastonat\w*', r'\bmozzafiato\b', r'\bsuggestiv\w*', r'\bpittoresc\w*', r'\bvibrant\w*', r'\bperfett[oaie] per\b', r'\bideale per\b', r'\bnon solo\b[^.]{0,80}\bma anche\b', r'\bvero e proprio\b', r'\bgioiell\w*', r'\bscopri(re|te)?\b', r"\bun.esperienza unica\b", r'\bun mix di\b', r'\binoltre\b', r'\bin conclusione\b', r'\bin sintesi\b', r'\bè importante (notare|sottolineare)\b', r'\bvale la pena (notare|sottolineare)\b', r'\bfondamental\w*', r'\bcrucial\w*', r'\bsenza soluzione di continuità\b', r'\bconnubio\b', r'\bunic[oaie] nel suo genere\b', r'\btestimonianza\b', r'\bopportunità unica\b', r'\ba tutto tondo\b', r'\bindimenticabil\w*', r'\bincantevol\w*', r'\bcasa dei (tuoi )?sogni\b', r'\bperla\b'],
    'pl': [r'\bw sercu\b', r'\bmalownicz\w*', r'\bzapierając\w* dech\b', r'\bidealn\w* dla\b', r'\bdoskonał\w* (wybór|miejsce|opcj)\w*', r'\bnie tylko\b[^.]{0,80}\b(ale|lecz) (także|również)\b', r'\bprawdziw\w* perł\w*', r'\bukryt\w* (skarb|perł)\w*', r'\bodkryj\w*', r'\bwarto (zauważyć|podkreślić|zaznaczyć)\b', r'\bnależy pamiętać\b', r'\bponadto\b', r'\bco więcej\b', r'\bpodsumowując\b', r'\bkluczow\w*', r'\bkompleksow\w*', r'\bniezapomnian\w*', r'\btętniąc\w*', r'\burokliw\w*', r'\bwyjątkow\w*', r'\bharmonijn\w*', r'\bunikaln\w*', r'\bbezproblemow\w*', r'\bwymarzon\w*', r'\bniezrównan\w*', r'\bzachwycając\w*'],
    'uk': [r'\b[ув] серці\b', r'\bмальовнич\w*', r'\bзахоплююч\w*', r'\bідеальн\w* (для|вибір)\b', r'\bне (лише|тільки)\b[^.]{0,80}\bа й\b', r'\bсправжн\w* перлин\w*', r'\bприхован\w* перлин\w*', r'\bвідкрийте для себе\b', r'\bварто (зазначити|відзначити|підкреслити)\b', r'\bважливо (зазначити|розуміти|пам.ятати)\b', r'\bкрім того\b', r'\bбільше того\b', r'\bпідсумовуючи\b', r'\bключов\w*', r'\bкомплексн\w*', r'\bнезабутн\w*', r'\bунікальн\w*', r'\bгармоні\w*', r'\bнеперевершен\w*', r'\bвражаюч\w*', r'\bомріян\w*', r'\bявляє собою\b', r'\bщо робить (його|її|їх)\b', r'\bзанурит\w*', r'\bнасолоджу\w*'],
    'sq': [r'\bnë zemër të\b', r'\bpiktoresk\w*', r'\bmahnitës\w*', r'\bmagjeps\w*', r'\bideal\w* për\b', r'\bperfekt\w* për\b', r'\bjo vetëm\b[^.]{0,80}\bpor edhe\b', r'\bperl[aëe]\b', r'\bxhevahir\w*', r'\bzbuloni\b', r'\bpërjetoni\b', r'\bvlen të (përmendet|theksohet)\b', r'\bështë e rëndësishme të\b', r'\bpër më tepër\b', r'\bsi përfundim\b', r'\bnë përmbledhje\b', r'\bthelbësor\w*', r'\bvendimtar\w*', r'\bgjithëpërfshirës\w*', r'\bunik\w*', r'\bpaharrueshm\w*', r'\bharmoni\w*', r'\bmundësi unike\b', r'\bpërzierje\b', r'\bëndrrave\b', r'\bmrekulli\w*'],
    'ru': [],
}
COMP = {l: [re.compile(p, re.I) for p in ps] for l, ps in M.items()}


def marker_hits(text, l):
    hits = {}
    for p in COMP[l]:
        n = len(p.findall(text))
        if n:
            hits[p.pattern] = n
    return hits


def dashes(text):
    return len(re.findall(r'\s[—–]\s|—', text))


STUDIO = {
    'ru': r'студи\w*', 'uk': r'студі\w*', 'it': r'monolocal\w*', 'pl': r'(kawalerk|jednopokojow)\w*',
    'de': r'Einzimmer\w*', 'en': r'\bstudio\b', 'sq': r'\bstudio\b',
}


def translation_flags(text, l):
    """Obvious translation errors to look at by hand."""
    f = []
    if l in ('ru', 'uk'):
        for m in re.finditer(r'\w*(?:[а-яёіїєґ][a-z]|[a-z][а-яёіїєґ])\w*', text, re.I):
            f.append('latin-in-cyrillic: ' + m.group(0))
    s = STUDIO[l]
    if re.search(rf'{s}[^.\n]{{0,40}}\b1\+1\b|\b1\+1\b[^.\n]{{0,40}}{s}', text, re.I):
        f.append('studio vs 1+1')
    return f
