export const SITE = {
  name: 'Featherstone Vaults',
  shortName: 'Featherstone Vaults',
  url: 'https://featherstonevaults.com',
  strapline: 'Exceptional objects. Remarkable histories.',
  description:
    'Featherstone Vaults is a private dealer and collection house for historically, scientifically and culturally significant objects. The Cotswolds, United Kingdom.',
  locality: 'The Cotswolds',
  region: 'Gloucestershire',
  country: 'United Kingdom',
  countryCode: 'GB',
  email: 'enquiries@featherstonevaults.com',
  /**
   * Set to a POST endpoint to make the enquiry forms live.
   * Served by the Netlify Function in netlify/functions/enquiry.mts.
   */
  formEndpoint: '/api/enquiry',
} as const;

/**
 * The person behind the house.
 *
 * A named, qualified author is the strongest credibility signal a one-person
 * dealer has, and it is worth nothing if a search engine cannot see it. This
 * is the single source for the Journal byline, the author note and the Person
 * structured data, so the biography on /about and the markup cannot drift
 * apart.
 *
 * knowsAbout is deliberately narrower than the ten departments: the house
 * states that in-house assessment is strongest in natural history and that
 * other fields are assessed with specialist help. Claiming more here would
 * contradict the site and blur the topical signal.
 */
export const PRINCIPAL = {
  name: 'Thomas Featherstone',
  role: 'Principal',
  summary:
    'Featherstone Vaults is run by Thomas Featherstone, who holds a Diploma in Palaeontology and a Diploma in Geology. In-house assessment is strongest in natural history; material in other departments is assessed with specialist help, and each catalogue entry records whose opinion it rests on.',
  /** Shown on /about and emitted as hasCredential. */
  credentials: [
    {
      name: 'Diploma in Palaeontology',
      subject: 'Palaeontology',
      summary:
        'The fossil record and how it is read: what a specimen is, how it was formed and what can reasonably be claimed about it.',
    },
    {
      name: 'Diploma in Geology',
      subject: 'Geology',
      summary:
        'Origins, plate tectonics, rocks and minerals, volcanism, seismicity, weathering and geological analysis.',
    },
  ],
  knowsAbout: [
    'Palaeontology',
    'Geology',
    'Mineralogy',
    'Natural history specimens',
    'Fossil assessment',
    'Provenance and documentation',
  ],
} as const;

export const NAV_PRIMARY = [
  { label: 'Objects', href: '/objects' },
  { label: 'Collections', href: '/collections' },
  { label: 'Consignment', href: '/consignments' },
  { label: 'Private Sourcing', href: '/private-acquisitions' },
  { label: 'Journal', href: '/journal' },
  { label: 'About', href: '/about' },
] as const;

export const NAV_ACTIONS = [
  { label: 'Enquire', href: '/enquire' },
  { label: 'Private Access', href: '/private-access' },
] as const;

export const FOOTER_NAV = [
  {
    heading: 'Collections',
    links: [
      { label: 'Natural History', href: '/collections/natural-history' },
      { label: 'Antiquities', href: '/collections/antiquities' },
      { label: 'Sacred & Religious', href: '/collections/sacred-religious' },
      { label: 'Rare Books & Manuscripts', href: '/collections/rare-books-manuscripts' },
      { label: 'Timepieces', href: '/collections/timepieces' },
      { label: 'Shipwreck & Maritime', href: '/collections/shipwreck-maritime' },
      { label: 'Space & Exploration', href: '/collections/space-exploration' },
      { label: 'Numismatics', href: '/collections/numismatics' },
    ],
  },
  {
    heading: 'Services',
    links: [
      { label: 'Consignment', href: '/consignments' },
      { label: 'Sell an Object', href: '/sell-an-object' },
      { label: 'Private Acquisitions', href: '/private-acquisitions' },
      { label: 'Private Access', href: '/private-access' },
    ],
  },
  {
    heading: 'Information',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Journal', href: '/journal' },
      { label: 'Provenance & Authenticity', href: '/provenance-authenticity' },
      { label: 'Shipping', href: '/shipping' },
      { label: 'Terms', href: '/terms' },
      { label: 'Privacy', href: '/privacy' },
      { label: 'Contact', href: '/enquire' },
    ],
  },
] as const;

export const COLLECTOR_INTERESTS = [
  'Antiquities',
  'Natural History',
  'Sacred & Religious',
  'Rare Books & Manuscripts',
  'Timepieces',
  'Shipwreck & Maritime',
  'Space & Exploration',
  'Numismatics',
  'Militaria',
  'Scientific & Curious',
] as const;

export const BUDGET_RANGES = [
  '£1,000 – £5,000',
  '£5,000 – £15,000',
  '£15,000 – £50,000',
  '£50,000 – £100,000',
  '£100,000+',
] as const;

/**
 * Catalogue entries shipped with the site are format specimens, not inventory.
 * Set to false once genuine stock has replaced them so that Product/Offer
 * structured data and indexing are enabled.
 */
export const SPECIMEN_NOTICE =
  'This is a catalogue format specimen. It is not an object held or offered by Featherstone Vaults.';
