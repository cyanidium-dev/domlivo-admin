// Writes group-review.html: every same-building group (photo engine) that has
// no trusted pin yet, biggest first, with its best "place" photos and members.
// Pinning ONE listing of a group in the Studio (Google Maps link or a click on
// the map) lets the next engine run place every other member.
//
//   node group-review.mjs
import fs from 'node:fs'
import path from 'node:path'

const HERE = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Z]:)/, '$1')
// data (thumbnails, manifest, groups) stays out of git, in the workspace next to the repo
const DATA = process.env.GEO_ENGINE_DATA || path.resolve(HERE, "../../../domlivo-workspace/geo/photo-engine")
const groups = JSON.parse(fs.readFileSync(path.join(DATA, 'groups.json'), 'utf8'))
const manifest = JSON.parse(fs.readFileSync(path.join(DATA, 'manifest.json'), 'utf8'))
const classes = JSON.parse(fs.readFileSync(path.join(DATA, 'photo-classes.json'), 'utf8'))
const byId = new Map(manifest.map((m) => [m.id, m]))
const PLACE_FIRST = ['facade', 'aerial', 'render', 'view_city', 'view_sea', 'construction', 'amenity', 'common', 'balcony']

const open = groups.filter((g) => g.seeds.length === 0).sort((a, b) => b.size - a.size)
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'})[c])

const cards = open
  .map((g, i) => {
    const members = g.members.map((m) => byId.get(m.id)).filter(Boolean)
    const photos = []
    for (const cls of PLACE_FIRST)
      for (const m of members)
        for (const p of m.photos)
          if (classes[p.asset]?.cls === cls && photos.length < 4 && !photos.some((x) => x.asset === p.asset)) photos.push(p)
    const districts = [...new Set(members.map((m) => m.district || m.city))].join(', ')
    const guess = g.predicted ? `Text suggests: ${g.predicted.level} at ${g.predicted.lat.toFixed(5)}, ${g.predicted.lng.toFixed(5)}` : 'No place named in the texts'
    return `<section>
  <h2>${i + 1}. ${members.length} listings · ${esc(districts)}</h2>
  <p class="hint">${esc(guess)}</p>
  <div class="photos">${photos.map((p) => `<img loading="lazy" src="${p.url}?w=360&h=270&fit=crop&fm=jpg&q=70" alt="">`).join('')}</div>
  <ul>${members
    .map(
      (m) =>
        `<li><code>${esc(m.id)}</code> — <a href="https://domlivo.com/en/property/${esc(m.slug)}" target="_blank" rel="noopener">${esc(m.title)}</a> <span class="agent">${esc(m.agent)}</span></li>`,
    )
    .join('')}</ul>
</section>`
  })
  .join('\n')

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Buildings to pin</title>
<style>
:root{--bg:#fafaf8;--fg:#1a1a1a;--muted:#666;--line:#e3e3df;--accent:#078660}
@media (prefers-color-scheme:dark){:root{--bg:#141514;--fg:#ecece8;--muted:#a3a39e;--line:#2c2e2c;--accent:#3fbf8f}}
body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.5 system-ui,sans-serif}
main{max-width:1040px;margin:0 auto;padding:24px 16px 64px}
h1{font-size:24px;margin:0 0 4px}h2{font-size:17px;margin:0 0 4px}
.lead{color:var(--muted);margin:0 0 24px}
section{border-top:1px solid var(--line);padding:18px 0}
.hint{color:var(--muted);margin:0 0 8px;font-size:13px}
.photos{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:6px;margin-bottom:8px}
.photos img{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:6px;background:var(--line)}
ul{margin:0;padding-left:18px}li{margin:2px 0}code{font-size:12px;color:var(--muted)}
a{color:var(--accent)}.agent{color:var(--muted);font-size:12px}
</style></head><body><main>
<h1>Buildings to pin: ${open.length} groups, ${open.reduce((s, g) => s + g.size, 0)} listings</h1>
<p class="lead">The photos of the listings in each group show the same building (identical photos, or the same view verified point by point). None of them has a trusted pin yet. Open any ONE listing of a group in the Studio, Location tab: paste the building's Google Maps link, or click the building on the map, and publish. The next geo engine run gives the same point to every other listing of the group.</p>
${cards}
</main></body></html>`
fs.writeFileSync(path.join(DATA, 'group-review.html'), html)
console.log(`group-review.html: ${open.length} groups, ${open.reduce((s, g) => s + g.size, 0)} listings`)
