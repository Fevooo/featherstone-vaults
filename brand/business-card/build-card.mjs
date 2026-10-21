/**
 * Builds the Featherstone Vaults business card.
 *
 * 85 x 55 mm trim (the UK and European standard), 3 mm bleed on every edge,
 * so the artboard is 91 x 61 mm. Nothing that must be read sits closer than
 * 4 mm to the trim.
 *
 * The logos are the supplied SVGs, embedded as data URIs rather than redrawn.
 * Caslon comes from the site's own woff2. Jost does NOT: the site ships a
 * variable font, and Chromium's PDF export silently substitutes variable
 * fonts instead of embedding them, which would reach the printer as the wrong
 * typeface. A static cut is used here for that reason alone.
 */
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright'

const REPO = '/home/user/featherstone-vaults'
const OUT = `${REPO}/brand/business-card`
mkdirSync(OUT, { recursive: true })

const b64 = (p) => readFileSync(p).toString('base64')
const svg = (n) => `data:image/svg+xml;base64,${b64(`${REPO}/public/brand/${n}.svg`)}`
const woff2 = (n) => `data:font/woff2;base64,${b64(`${REPO}/public/fonts/${n}.woff2`)}`
const ttf = (n) => `data:font/ttf;base64,${b64(`${OUT}/fonts/${n}.ttf`)}`

/** Printed details. Add `phone` here and it appears under the website. */
const CARD = {
  name: 'Thomas Featherstone',
  role: 'Principal',
  email: 'enquiries@featherstonevaults.com',
  web: 'featherstonevaults.com',
  phone: '',
  place: 'The Cotswolds, United Kingdom',
}

const css = `
  @font-face { font-family:'Caslon Display'; src:url('${woff2('caslon-display-400-latin')}') format('woff2'); font-weight:400 }
  @font-face { font-family:'Jost'; src:url('${ttf('jost-400-static')}') format('truetype'); font-weight:400 }
  @font-face { font-family:'Jost'; src:url('${ttf('jost-500-static')}') format('truetype'); font-weight:500 }

  :root {
    --ink:#0B0B0A; --ivory:#EFE9DD; --bronze:#96774A;
    --bronze-deep:#6E5733; --stone:#80776A;
  }
  * { margin:0; padding:0; box-sizing:border-box;
      -webkit-print-color-adjust:exact; print-color-adjust:exact }
  @page { size:91mm 61mm; margin:0 }
  html, body { width:91mm }

  .card { width:91mm; height:61mm; position:relative; overflow:hidden; display:flex }
  .card + .card { break-before:page }

  /* Face: the lockup on ink, centred, and nothing else on it. */
  .face { background:var(--ink); align-items:center; justify-content:center }
  .face img { width:43mm; display:block }

  /* Reverse: ink on ivory, the inverted band the site already uses. */
  .reverse { background:var(--ivory); padding:8.5mm 7mm; flex-direction:column;
             justify-content:space-between }
  .reverse .mark { width:33mm; display:block }

  .rule { height:0.2mm; background:var(--bronze); opacity:0.5; margin-top:3.2mm }

  .foot { display:flex; align-items:flex-end; justify-content:space-between; gap:5mm }
  .name { font-family:'Caslon Display', Georgia, serif; font-size:4.05mm;
          line-height:1.08; color:var(--ink); white-space:nowrap }
  .role { font-family:'Jost', sans-serif; font-weight:500; font-size:1.8mm;
          letter-spacing:0.22em; text-transform:uppercase;
          color:var(--bronze-deep); margin-top:1.5mm }
  .contact { font-family:'Jost', sans-serif; font-weight:400; font-size:2.25mm;
             line-height:1.62; color:var(--ink); text-align:right;
             white-space:nowrap }
  .place { font-family:'Jost', sans-serif; font-weight:400; font-size:2mm;
           line-height:1.5; letter-spacing:0.05em; color:var(--stone);
           margin-top:1.1mm; text-align:right; white-space:nowrap }
`

const html = `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><title>Featherstone Vaults business card</title><style>${css}</style></head><body>
  <section class="card face"><img src="${svg('lockup-ivory')}" alt=""></section>
  <section class="card reverse">
    <div class="head">
      <img class="mark" src="${svg('wordmark-ink')}" alt="">
      <div class="rule"></div>
    </div>
    <div class="foot">
      <div>
        <p class="name">${CARD.name}</p>
        <p class="role">${CARD.role}</p>
      </div>
      <div>
        <p class="contact">${CARD.email}<br>${CARD.web}${CARD.phone ? `<br>${CARD.phone}` : ''}</p>
        <p class="place">${CARD.place}</p>
      </div>
    </div>
  </section>
</body></html>`

writeFileSync(`${OUT}/card.html`, html)

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
})
const ctx = await browser.newContext({ deviceScaleFactor: 3.2 })
const page = await ctx.newPage()
await page.setContent(html, { waitUntil: 'networkidle' })
await page.evaluate(() => document.fonts.ready)

await page.pdf({
  path: `${OUT}/featherstone-vaults-card-print.pdf`,
  printBackground: true,
  preferCSSPageSize: true,
})

const sides = await page.$$('.card')
const MM = 96 / 25.4
for (const [i, name] of [[0, 'front'], [1, 'back']]) {
  await sides[i].screenshot({ path: `${OUT}/bleed-${name}.png` })
  /* What the card looks like once it is cut: 3 mm off every edge. */
  const box = await sides[i].boundingBox()
  await page.screenshot({
    path: `${OUT}/preview-${name}.png`,
    clip: {
      x: box.x + 3 * MM,
      y: box.y + 3 * MM,
      width: box.width - 6 * MM,
      height: box.height - 6 * MM,
    },
  })
}

await browser.close()
console.log('written to', OUT)
