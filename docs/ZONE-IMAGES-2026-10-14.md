# Zone images, round 2026-10-14

Districts that had **no hero image at all** (32 on 14.10, published `district`
docs with `!defined(heroImage)`). Sourced from Wikimedia Commons, every file
opened and checked against its Commons description, categories and coordinates
before it was accepted. Credits are published at `/image-credits`.

How to repeat:

1. Look for candidates (Commons search + geosearch around the district), open
   them, and add the chosen file titles to `REVIEWED_FILES` in
   `scripts/sourceZoneImages.ts`.
2. `npm run source:zone-images -- --only a,b,c` downloads exactly those files to
   `../domlivo-workspace/tmp/image-replacements/` and merges the manifest.
3. Add the decision (role `zone` or `stand-in`, alt text) to
   `DECISIONS_2026_10_14` in `scripts/applyZoneImages.ts`.
4. `npm run apply:zone-images -- --dry`, then `--execute`. This round skips any
   district that has acquired a hero image since the review.

Rules applied: free licences only (CC0, PD, CC BY / BY-SA **3.0 or 4.0** — the
schema and credits page cannot label 2.0/2.5, so those were passed over); a photo
is the district's own only if it shows that place; a stand-in's alt text
describes the photograph and its credit is stamped STAND-IN; no maps, paintings,
satellite images or people as the subject.

## Decisions

| District | Result | Commons file | Licence | Author |
|---|---|---|---|---|
| qerret | own photo | Qerret Plazh.jpg | CC BY 4.0 | Albinfo |
| gjiri-i-lalzit | own photo | GJIRI I LALZIT - panoramio.jpg | CC BY-SA 3.0 | landi61 |
| spille | own photo | Spille Beach2.JPG | CC BY-SA 4.0 | Arianit |
| currila | own photo | Currila Beach 2.jpg | CC BY-SA 4.0 | Joseph2302 |
| arapaj | own photo | Arapaj Basilica 2016-07-12 02.jpg | CC BY-SA 4.0 | Pasztilla aka Attila Terbócs |
| kavaje | own photo | Kavajë, Albania – Main Square 2017 02.jpg | CC BY-SA 4.0 | Pasztilla aka Attila Terbócs |
| shkallnur | own photo | Albania residential houses near Durres.JPG | CC0 | Jan Pešula |
| spitalle | own photo | Spitalle l.15 - panoramio.jpg | CC BY 3.0 | xhoni_bg_dr |
| sukth | own photo | Sukth i Ri Main Road - Mapillary (3131407893840738) (cropped).jpg | CC BY-SA 4.0 | atpl_pilot @ Mapillary |
| shijak | own photo | Shijak central square (OSCAL19 trip).jpg | CC0 | albinfo |
| xhafzotaj | own photo | Xhafzotaj, město.jpg | CC BY-SA 4.0 | Aktron (asks to be notified of use outside Wikimedia) |
| maminas | own photo | Maminas, odbočka.jpg | CC BY-SA 4.0 | Aktron |
| koxhas | stand-in | Xhafzotaj, louka u dálnice.jpg — fields by the motorway at Xhafzotaj, the unit Koxhas belongs to | CC BY-SA 4.0 | Aktron |
| qeparo | own photo | Qeparo beach.jpg | CC BY-SA 4.0 | Leeturtle |
| vuno | own photo | Vuno, Himarë, Albania 2015 01.jpg (1800 px) | CC BY-SA 4.0 | Pasztilla aka Attila Terbócs |
| palasa | own photo | Palasa Beach from Llogara Pass.jpg | CC BY-SA 4.0 | Liridon |
| skele-vlore | own photo | Vlora Port & Skela.jpg | CC BY 4.0 | Albinfo |
| zona-e-portit | own photo | Hafen von sarande - 2.jpg | CC0 | Z thomas |
| rruga-butrinti | own photo | Sarandë, mořské pobřeží.jpg (geotagged 300 m from Rruga Butrinti) | CC BY 4.0 | Aktron |
| gjiri-i-hartes | own photo | 15.7.2023 Gjiri i Hartes.jpg (1280 px) | CC BY-SA 4.0 | EB1508 |
| akernia | own photo | Laguna e Nartës - Vlorë (5).jpg ("Village Akërni near Vlorë") | CC BY 4.0 | Arbenllapashtica |
| fllake | none | nothing on Commons shows Fllakë or its surroundings | — | — |
| manez | none | only photo shows election-time party flags; other geotagged file is a tent advert | — | — |
| golem-1st-line | not imaged | — | — | metric-only price line (`scripts/data/zones.json`), not a page |
| lungomare-2nd-line | not imaged | — | — | metric-only price line, not a page |
