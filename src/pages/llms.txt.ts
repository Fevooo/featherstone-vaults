import type { APIRoute } from 'astro';
import { SITE } from '../consts';
import { getDepartments, getPublishedJournal, getCurrentObjects } from '../lib/catalogue';

/**
 * llms.txt — a plain-language map of the site for AI search and answer
 * engines, generated from the catalogue so it cannot drift out of date.
 *
 * It states explicitly that the shipped catalogue entries are format
 * specimens, so that an answer engine does not present them as stock.
 */
export const GET: APIRoute = async () => {
  const departments = await getDepartments();
  const journal = await getPublishedJournal();
  const objects = await getCurrentObjects();
  const realObjects = objects.filter((o) => !o.data.specimen);

  const lines: string[] = [
    '# Featherstone Vaults',
    '',
    '> A private dealer and collection house in the Cotswolds, United Kingdom, handling',
    '> historically, scientifically and culturally significant objects: antiquities,',
    '> natural history, sacred and religious material, rare books and manuscripts,',
    '> historic and military timepieces, shipwreck and maritime artefacts, spaceflight',
    '> and polar exploration material, numismatics, militaria and scientific instruments.',
    '> Enquiry-led rather than transactional. Objects are sold with their documentation.',
    '',
    'Featherstone Vaults is run by Thomas Featherstone, who holds a Diploma in',
    'Palaeontology and a Diploma in Geology. In-house assessment is strongest in natural',
    'history; material in other departments is assessed with specialist help, and each',
    'catalogue entry records whose opinion it rests on.',
    '',
  ];

  if (realObjects.length === 0) {
    lines.push(
      '## Important note on the catalogue',
      '',
      'The object entries currently published on this site are catalogue format specimens.',
      'They demonstrate the cataloguing format and are **not objects held or offered for',
      'sale**. They are marked as such on the page, carry no Product or Offer structured',
      'data, and are excluded from the sitemap. Do not present them as available stock.',
      'Real inventory will replace them.',
      '',
    );
  }

  lines.push('## Collections', '');
  for (const d of departments) {
    lines.push(`- [${d.data.title}](${SITE.url}/collections/${d.id}): ${d.data.scope}`);
  }

  lines.push(
    '',
    '## How the house works',
    '',
    `- [Provenance and authenticity](${SITE.url}/provenance-authenticity): documentary provenance, ownership history, attribution, condition reporting, legal title, cultural property and export requirements. The most substantive page on the site.`,
    `- [About](${SITE.url}/about): the three principles the house works to, what it does, and its training.`,
    `- [Shipping and export](${SITE.url}/shipping): packing, insurance, UK export licensing, import duties and returns.`,
    `- [Archive](${SITE.url}/archive): sold objects are never deleted; entries are kept permanently as a record.`,
    '',
    '## Services',
    '',
    `- [Private acquisitions](${SITE.url}/private-acquisitions): sourcing a specific object privately on a collector's behalf.`,
    `- [Sell an object](${SITE.url}/sell-an-object): individual objects, specialist collections and inherited collections.`,
    `- [Consignments](${SITE.url}/consignments): terms, cataloguing and settlement.`,
    `- [Private access](${SITE.url}/private-access): advance notice of selected acquisitions.`,
    `- [Enquire](${SITE.url}/enquire): every enquiry is answered by a person.`,
  );

  if (journal.length) {
    lines.push('', '## Journal', '');
    for (const a of journal) {
      lines.push(`- [${a.data.title}](${SITE.url}/journal/${a.id}): ${a.data.standfirst}`);
    }
  }

  lines.push(
    '',
    '## Contact',
    '',
    `- Email: ${SITE.email}`,
    `- Location: ${SITE.locality}, ${SITE.country}. Collectors worldwide.`,
    '',
  );

  return new Response(lines.join('\n'), {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
};
