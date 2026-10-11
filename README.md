# Featherstone Vaults

The production website for [featherstonevaults.com](https://featherstonevaults.com).

Astro 7, TypeScript and Tailwind CSS 4. Statically generated, no client framework.

> Deployment note: production hosting is currently handled outside this repository. Keep the active hosting provider pointed at the branch that contains the latest site changes.

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # typecheck + static build into dist/
npm run preview
```

---

## What still needs to be supplied

Two things in this repository are deliberately unfinished, because finishing them
would have meant inventing material that does not exist. Both are marked in the
interface so that nothing on the live site misleads a visitor.

### 1. Photography

**No sale-object photography is used anywhere on the site unless a real object image is supplied.** Department pages may use clearly credited open-access museum or public-domain imagery as representative editorial photography. Sale-object plates remain blank until Featherstone Vaults has photography of the actual object.

Every image position is already wired. Drop a file in the right place, name it
in the front matter, and the blank mount is replaced. Everything local runs through
`astro:assets`, so responsive `srcset`, modern formats, intrinsic dimensions and
lazy loading are handled for you.

**An object** — file beside the markdown in `src/content/objects/`:

```yaml
images:
  - src: ./roman-marble-portrait-head-01.jpg
    alt: Roman marble portrait head, three-quarter view against a grey ground
    caption: Front view
  - src: ./roman-marble-portrait-head-02.jpg
    alt: The same head in profile
```

The first image fills the main plate and becomes the page's social card; the
next three appear as detail thumbnails beneath it.

**A department** — either a local image or a stable open-access museum/public-domain URL:

```yaml
image: ./natural-history.jpg
imageAlt: A prepared Jurassic ammonite lit from the left
```

or

```yaml
remoteImage: https://example.org/open-access-image.jpg
imageAlt: A prepared Jurassic ammonite
imageCredit: Museum or photographer · Public Domain / CC0
imageSourceUrl: https://example.org/object-record
```

One department image drives the homepage strip, the `/collections` grid and
the department page.

**A journal article** — file beside the markdown in `src/content/journal/`:

```yaml
image: ./dirty-dozen.jpg
imageAlt: Twelve military wristwatches laid out in a grid
```

**The premises shot on `/about`** — `src/assets/cotswolds.jpg`. Picked up by
name; see `src/assets/README.md`.

Photography still required:

| Where | What | Count | Format |
| --- | --- | --- | --- |
| Objects | Primary shot plus two or three details | per object | portrait, 4:5 |
| Department banners | Optional dedicated wide shot | up to 10 | landscape, 21:9, 2000px wide |
| `/about` | The premises or the Cotswolds setting | 1 | landscape, 4:3, 1600px wide |
| Journal | Optional lead image per article | per article | landscape, 16:9 |
| `public/og/featherstone-vaults.png` | Regenerate the brand social card if you want a photograph on it | 1 | 1200x630 |

Remove the standing note in `src/pages/objects/index.astro` and
`src/pages/collections/[slug].astro` once object photography is complete.

### 2. Catalogue entries

The thirteen entries in `src/content/objects/` are **format specimens**. They
demonstrate the catalogue layout and the data model. They are not inventory, and
they say so: each one carries a visible notice, is excluded from `Product` and
`Offer` structured data, and is set to `noindex` so that no search engine
publishes a non-existent object.

No provenance, historical context, condition report, literature or comparative
example has been written for them. Those sections render an explicit "In
preparation" line rather than approximated text.

To publish real stock: delete the specimen files, add real entries with
`specimen` omitted or `false`, and fill the narrative fields.

Seven of the eight journal articles are likewise `inPreparation: true` and
`noindex`. Only *How to Build a Serious Private Collection* is published; it is
written in the house's voice and should be read and approved before launch.

`/terms` and `/privacy` are working drafts and carry a note to that effect. They
should be reviewed by a solicitor against the business's actual practice.

---

## Structure

```
public/
  brand/          logo artwork (see "Brand assets" below)
  fonts/          self-hosted woff2, latin subset
  og/             social card
  _headers        hosting cache and security headers
  __forms.html    Netlify form declarations (see "Forms" below)
  robots.txt
netlify/
  functions/
    enquiry.mts   form handler, routed at /api/enquiry by config.path
scripts/
  verify-forms.mjs  build check: form fields match their declaration
  indexnow.mjs
src/
  components/     Plate, ObjectTile, CollectionPanel, SectionHead, forms, SEO
  content/
    collections/  the ten departments
    objects/      the catalogue
    journal/      editorial
  content.config.ts   zod schemas for all three collections
  layouts/        Base (head, header, footer), Page (heading furniture)
  lib/catalogue.ts    queries and formatting — the single source for prices,
                      availability labels and dates
  pages/
  styles/global.css   design tokens and component classes
```

### Object data model

`src/content.config.ts` defines the schema. Every narrative field is optional by
design: a field that has not been researched is left out rather than guessed, and
the template renders a note in its place.

Availability is one of `AVAILABLE`, `RESERVED`, `SOLD`, `PRIVATE`. Setting
`SOLD` moves an object out of the live catalogue and into `/archive`
automatically — entries are never deleted, and their URLs stay indexed.

The schema is a plain zod object over Markdown front matter, so moving to a CMS
later means swapping the `glob()` loader for an API loader and keeping the same
field names.

---

## Brand assets

`public/brand/` holds the Featherstone Vaults logo: the full lockup, the wordmark
and the arch mark, in ivory, ink and bronze.

These are **vector reproductions traced from the supplied brand sheet**, not the
original vector masters, which were not in the repository. They are faithful at
every size the site uses them, but if the original AI/EPS/SVG masters exist they
should replace these files. The geometry of the lockup (mark size, spacing,
optical centring) was measured from the supplied artwork and is reproduced
exactly.

Do not hand-edit the path data in these files. If the mark needs to change,
replace the SVGs from the master artwork.

---

## Design system

Tokens live at the top of `src/styles/global.css`.

| Token | Value | Use |
| --- | --- | --- |
| `--color-ink` | `#0B0B0A` | page ground |
| `--color-charcoal` | `#131310` | raised surfaces |
| `--color-ivory` | `#EFE9DD` | primary type, inverted bands |
| `--color-parchment` | `#D7CBB9` | secondary type |
| `--color-bronze` | `#96774A` | rules and marks |
| `--color-bronze-lit` | `#B2925F` | bronze small type on dark (AA) |
| `--color-bronze-deep` | `#6E5733` | bronze small type on ivory (AA) |
| `--color-stone` | `#80776A` | hairlines only, never body text |
| `--color-ash` | `#AAA093` | metadata and captions |

Type: **Libre Caslon Display** for display, **Libre Caslon Text** for reading,
**Jost** for navigation, labels, metadata and prices. All self-hosted, latin
subset, about 129 KB total.

Bronze is an accent. Most of the site is ink, charcoal, ivory and photography.
There are no rounded corners, gradients, shadows or decorative flourishes
anywhere; if an element is decorative rather than necessary it has been removed.

`.on-paper` inverts a band to ink-on-ivory and rebinds the rule, prose and
button colours. It is used once on the homepage, deliberately.

---

## Consignment terms

`/consignments` is the primary commercial page and carries `Service` and
`FAQPage` structured data. The commercial figures live in a single `TERMS`
object at the top of `src/pages/consignments.astro`:

| Key | Fill in with | Shown where |
| --- | --- | --- |
| `commission` | e.g. `'15 per cent'` or `'between 10 and 20 per cent by value'` | "What it costs" and the first FAQ answer |
| `settlement` | e.g. `'within 14 days of cleared funds'` | Stage 5, "Settlement" |
| `minimumValue` | e.g. `'£1,000'` | An extra paragraph under "What it costs" |

Leave a key `undefined` and the page falls back to honest "agreed per object"
wording rather than printing a number nobody has committed to. Filling
`commission` in particular is worth doing: "what does consignment cost" is the
question owners search for, and a page that will not answer it converts and
ranks worse than one that does.

## Forms

Four forms (enquiry, sell an object, private acquisitions, private access) post
to `/api/enquiry`, handled by the Netlify Function in
`netlify/functions/enquiry.mts`. The function pins its own route with
`config.path`, so the endpoint does not depend on a redirect rule. The forms
work without JavaScript (native form POST) and are progressively enhanced to
submit in place.

**Every form delivers to `enquiries@featherstonevaults.com`.** That is the
default in the function; nothing needs configuring for the destination.

### Two delivery channels

The handler attempts both at once, and either one succeeding counts as
delivered. One needs no setup at all; the other is the one worth having.

**1. Netlify Forms — no API key, no DNS.** Every submission is recorded against
the site and appears under Forms in the Netlify dashboard. `public/__forms.html`
declares each form and its fields, which is how Netlify learns the schema: the
real forms submit by `fetch`, so the build bot never sees them. Netlify
**silently discards fields it was not told about**, so `scripts/verify-forms.mjs`
runs at the end of every build and fails it if a form gains a field the
declaration lacks. Add a field to a form, add it to `__forms.html`.

**2. Resend email — when `RESEND_API_KEY` is set.** This is the channel that
matters commercially. The enquiry arrives in the enquiries@ inbox, from the
house domain, subject prefixed `[FV]`, with `reply_to` set to the enquirer, so
hitting reply answers them directly. Netlify's own notification emails come
from Netlify and cannot do that.

If both channels fail, the form replaces the submit message with a `mailto:`
link prefilled with everything the sender typed. A lead is never dropped on the
floor. There is a honeypot field and a 5,000-character cap on the way in.

### Setting it up

**Step one, no DNS involved.** In Netlify: Forms → enable form detection, then
redeploy so the declarations are parsed. Add an email notification pointing at
enquiries@. From then on every enquiry is recorded and notified.

**Step two, recommended.** Create a Resend account, verify a sending domain,
and add the key under Site configuration → Environment variables:

| Variable | Required | Default |
| --- | --- | --- |
| `RESEND_API_KEY` | no, but wanted | none |
| `ENQUIRY_TO` | no | `enquiries@featherstonevaults.com` |
| `ENQUIRY_FROM` | no | `Featherstone Vaults <website@featherstonevaults.com>` |

`ENQUIRY_FROM` is a sending identity, not a mailbox. The domain has to be
verified in Resend, but no inbox needs to exist at that address: replies go to
the enquirer through `reply_to`, not back to the sender.

### DNS, and a conflict to avoid

Sending and receiving are separate. Setting Resend up does not change where
inbound mail to `enquiries@` is delivered, and nothing about the forms requires
the inbound setup to change.

Verify **`send.featherstonevaults.com`**, not the root domain. Resend then puts
its SPF and DKIM records on that subdomain and the root is untouched. That
matters here for two reasons:

- A domain can have only one SPF `TXT` record at the root. The existing one is
  `v=spf1 include:_spf.mx.cloudflare.net ~all`; a second must be *merged* into
  it, not added alongside, or both break.
- The root `MX` currently points at Microsoft
  (`featherstonevaults-com.mail.protection.outlook.com`), which is what delivers
  enquiries@. Cloudflare Email Routing wants to replace it with its own `MX`
  records. **Do not add them.** A domain has one mail host; running both makes
  inbound delivery unpredictable. Cloudflare Email Routing also only forwards,
  so it cannot send the form email and is not an alternative to Resend.

### Known rough edge

With JavaScript disabled the form does a native POST and the browser renders
the handler's JSON response rather than a styled confirmation. Rare, and no
enquiry is lost, but a `/thank-you` page and a `303` redirect for non-`fetch`
submissions would close it.

## Deployment

Build settings:

| Setting | Value |
| --- | --- |
| Framework preset | Astro |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node version | 22 |

Deployment is Netlify. `netlify.toml` allows the remote image sources used by
the department plates; `public/_headers` sets immutable caching for fonts and
hashed assets plus the usual security headers, and Netlify reads it from the
publish directory.

URLs have no trailing slash (`build.format: 'file'`).

---

## SEO

Every page carries a unique title and description, a canonical URL, OpenGraph
and Twitter metadata and breadcrumbs. `sitemap.xml` is generated from the catalogue at build time, so it never lists a
page that marks itself `noindex`.
`robots.txt` allows all legitimate crawlers, including AI search and answer
engines.

Structured data: `Organization` (with contact point and offered service) and
`WebSite` on every page, `BreadcrumbList` on every page with a trail,
`CollectionPage` + `ItemList` on the catalogue, collections, department and
archive pages, `Product` + `Offer` on genuine object pages, and `Article` on
published journal entries. Specimens appear in an `ItemList` as plain named
items with no offer attached.

`/journal/rss.xml` is a feed of published articles, linked from every page.
`/llms.txt` is a generated plain-language map of the site for AI search and
answer engines; it states explicitly that the shipped catalogue entries are
format specimens, so an answer engine cannot present them as stock.

Department pages carry the bulk of the indexable copy: how the house assesses
material in that field, what is supplied with it, and the questions a buyer
should ask. It lives in the `buying` array in each collection's front matter.

Specimen objects and unpublished journal entries emit `noindex, follow`, are left
out of the sitemap and carry no `Product`/`Article` data, so nothing fictional
enters the index. Remove `specimen: true` and all three are lifted automatically.
