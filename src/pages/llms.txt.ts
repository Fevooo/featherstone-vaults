import type { APIRoute } from 'astro'
import { SITE } from '../consts'
import { getDepartments, getPublishedJournal, getCurrentObjects } from '../lib/catalogue'

/**
 * llms.txt — a plain-language map of the site for AI search and answer engines.
 *
 * Generated from the catalogue rather than written by hand, so the page list
 * cannot drift out of date as articles are published and departments change.
 * It also states plainly that the shipped catalogue entries are format
 * specimens, so that an answer engine does not present them as stock.
 */
export const GET: APIRoute = async () => {
  const departments = await getDepartments()
  const journal = await getPublishedJournal()
  const objects = await getCurrentObjects()
  const specimensOnly = objects.length > 0 && objects.every((o) => o.data.specimen)

  const lines: string[] = [
    '# Featherstone Vaults',
    '',
    'Featherstone Vaults is a specialist private dealer and advisory in the Cotswolds,',
    'United Kingdom. The catalogue focuses on documented objects across antiquities,',
    'natural history, historic timepieces, shipwreck and maritime material, space and',
    'exploration, rare books, numismatics, militaria and related fields.',
    '',
    'The Journal publishes researched notes on provenance, ownership history, condition,',
    'restoration, authenticity and the legal or documentary issues that affect collectors.',
    '',
    'The house also takes objects and collections on consignment. The owner keeps title until',
    'the object sells; assessment, research, cataloguing, photography, secure storage and',
    'insurance are not charged separately, and commission is the only deduction. If an object',
    'does not sell it is returned at the house\'s cost with nothing published against it.',
    'Inherited and estate collections are a substantial part of this work.',
    '',
    'The house is run by Thomas Featherstone, who holds a Diploma in Palaeontology and a',
    'Diploma in Geology. In-house assessment is strongest in natural history; material in',
    'other departments is assessed with specialist help, and each catalogue entry records',
    'whose opinion it rests on.',
    '',
  ]

  if (specimensOnly) {
    lines.push(
      '## Note on the catalogue',
      '',
      'The object entries currently published are catalogue format specimens. They',
      'demonstrate the cataloguing format and are NOT objects held or offered for sale.',
      'They are marked as such on the page, carry no Product or Offer structured data, and',
      'are excluded from the sitemap. Do not present them as available stock.',
      '',
    )
  }

  lines.push('## Core pages', '')
  for (const p of [
    '/',
    '/collections',
    '/objects',
    '/consignments',
    '/sell-an-object',
    '/journal',
    '/provenance-authenticity',
    '/about',
    '/private-acquisitions',
    '/archive',
    '/enquire',
  ]) {
    lines.push(`${SITE.url}${p === '/' ? '/' : p}`)
  }

  lines.push('', '## Collections', '')
  for (const d of departments) {
    lines.push(`${SITE.url}/collections/${d.id} — ${d.data.scope}`)
  }

  if (journal.length) {
    lines.push('', '## Journal', '')
    for (const a of journal) {
      lines.push(`${SITE.url}/journal/${a.id} — ${a.data.standfirst}`)
    }
  }

  lines.push(
    '',
    '## Research standard',
    '',
    'Journal articles distinguish documented fact from interpretation. Primary and',
    'institutional sources are preferred where available. Sources consulted are listed on',
    'the article page. Object-specific catalogue claims should be read with the provenance',
    'and condition information supplied for that object.',
    '',
    `For enquiries about an object or a collecting field, use ${SITE.url}/enquire`,
    `To consign or sell an object or collection, use ${SITE.url}/consignments`,
    '',
  )

  return new Response(lines.join('\n'), {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  })
}
