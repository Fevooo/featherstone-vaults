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

export const RETURN_POLICY_ID = `${SITE.url}/shipping#returns`

/**
 * The returns policy exactly as /shipping states it: an object materially not
 * as described may be returned within fourteen days of delivery, and the
 * purchase price and the return shipping are refunded.
 *
 * Only the not-as-described case is marked up. The site makes no promise about
 * returns for a change of mind, so customerRemorseReturnFees is deliberately
 * absent rather than guessed.
 */
export function returnPolicyNode() {
  return {
    '@type': 'MerchantReturnPolicy',
    '@id': RETURN_POLICY_ID,
    name: 'Returns for objects not as described',
    url: `${SITE.url}/shipping`,
    applicableCountry: SITE.countryCode,
    returnPolicyCountry: SITE.countryCode,
    returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
    merchantReturnDays: 14,
    returnMethod: 'https://schema.org/ReturnByMail',
    itemDefectReturnFees: 'https://schema.org/FreeReturn',
    refundType: 'https://schema.org/FullRefund',
  }
}

type WebPageType = 'WebPage' | 'ContactPage' | 'AboutPage' | 'FAQPage' | 'CollectionPage'

/**
 * A page node tied into the site graph: the page belongs to the website, is
 * about (or published by) the house, and is in British English. Pages that
 * describe a single thing pass it as mainEntity.
 */
export function webPageNode(opts: {
  path: string
  name: string
  description: string
  type?: WebPageType
  mainEntity?: Record<string, unknown>
  about?: Record<string, unknown>
}) {
  const url = new URL(opts.path, SITE.url).href.replace(/\/$/, '') || SITE.url
  return {
    '@type': opts.type ?? 'WebPage',
    '@id': `${url}#page`,
    url,
    name: opts.name,
    description: opts.description,
    isPartOf: { '@id': WEBSITE_ID },
    about: opts.about ?? { '@id': ORGANISATION_ID },
    publisher: { '@id': ORGANISATION_ID },
    inLanguage: 'en-GB',
    ...(opts.mainEntity ? { mainEntity: opts.mainEntity } : {}),
  }
}
