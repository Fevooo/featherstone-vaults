import { SITE, PRINCIPAL } from '../consts'

/**
 * Stable @id values for the site's entity graph.
 *
 * Nodes are defined once at their canonical home and referenced by @id
 * everywhere else, so the organisation, the person and the website resolve to
 * one entity each rather than a new copy per page.
 */
export const ORGANISATION_ID = `${SITE.url}/#organization`
export const WEBSITE_ID = `${SITE.url}/#website`
export const PERSON_ID = `${SITE.url}/about#person`

/**
 * The page setting out what the house will and will not claim about an object.
 * Declaring it as publishing principles is a documented trust signal, and it
 * points at a page that genuinely says what it is supposed to.
 */
export const PUBLISHING_PRINCIPLES = `${SITE.url}/provenance-authenticity`

/**
 * The principal as a schema.org Person, with qualifications attached.
 *
 * Emitted in full on /about, which is its canonical home, and on each Journal
 * article, where it carries the byline. The credential nodes record the
 * qualification and its subject only: no level and no awarding body, matching
 * how the diplomas are described on the site.
 */
export function personNode() {
  return {
    '@type': 'Person',
    '@id': PERSON_ID,
    name: PRINCIPAL.name,
    jobTitle: PRINCIPAL.role,
    description: PRINCIPAL.summary,
    url: `${SITE.url}/about`,
    worksFor: { '@id': ORGANISATION_ID },
    knowsAbout: [...PRINCIPAL.knowsAbout],
    hasCredential: PRINCIPAL.credentials.map((credential) => ({
      '@type': 'EducationalOccupationalCredential',
      credentialCategory: 'Diploma',
      name: credential.name,
      about: { '@type': 'Thing', name: credential.subject },
    })),
  }
}
