import { getCollection, type CollectionEntry } from 'astro:content';

export type ObjectEntry = CollectionEntry<'objects'>;
export type DepartmentEntry = CollectionEntry<'collections'>;
export type JournalEntry = CollectionEntry<'journal'>;

const byOrder = <T extends { data: { order: number } }>(a: T, b: T) =>
  a.data.order - b.data.order;

/** Every department, in catalogue order. */
export async function getDepartments(): Promise<DepartmentEntry[]> {
  const all = await getCollection('collections');
  return all.sort(byOrder);
}

export async function getDepartment(id: string): Promise<DepartmentEntry | undefined> {
  const all = await getDepartments();
  return all.find((d) => d.id === id);
}

/** Objects currently offered — everything that has not been sold. */
export async function getCurrentObjects(): Promise<ObjectEntry[]> {
  const all = await getCollection('objects');
  return all.filter((o) => o.data.availability !== 'SOLD').sort(byOrder);
}

/** Objects that have left the catalogue. Kept permanently. */
export async function getArchivedObjects(): Promise<ObjectEntry[]> {
  const all = await getCollection('objects');
  return all
    .filter((o) => o.data.availability === 'SOLD')
    .sort((a, b) => {
      const at = a.data.soldDate?.getTime() ?? 0;
      const bt = b.data.soldDate?.getTime() ?? 0;
      return bt - at;
    });
}

export async function getAllObjects(): Promise<ObjectEntry[]> {
  const all = await getCollection('objects');
  return all.sort(byOrder);
}

export async function getObjectsInDepartment(id: string): Promise<ObjectEntry[]> {
  const all = await getAllObjects();
  return all.filter((o) => o.data.collection === id);
}

/**
 * Genuine objects currently offered in a department, for linking from the
 * Journal. Specimens are left out: they are noindex and describe nothing that
 * can be bought, so a link to one from an article would mislead.
 */
export async function getOfferedInDepartment(id: string, limit = 3): Promise<ObjectEntry[]> {
  const current = await getCurrentObjects();
  return current
    .filter((o) => o.data.collection === id && !o.data.specimen && o.data.availability !== 'PRIVATE')
    .slice(0, limit);
}

export async function getFeaturedObjects(limit = 4): Promise<ObjectEntry[]> {
  const current = await getCurrentObjects();
  const featured = current.filter((o) => o.data.featured);
  return (featured.length ? featured : current).slice(0, limit);
}

export async function getJournal(): Promise<JournalEntry[]> {
  const all = await getCollection('journal');
  return all.sort(byOrder);
}

export async function getPublishedJournal(): Promise<JournalEntry[]> {
  return (await getJournal()).filter((a) => !a.data.inPreparation);
}

/** Published articles written against a department, for its page. */
export async function getJournalForDepartment(id: string): Promise<JournalEntry[]> {
  return (await getPublishedJournal()).filter((a) => a.data.collection === id);
}

/**
 * Further reading for an article: the rest of its department first, then the
 * nearest by shared keyword, then whatever else is published. Ordering by
 * genuine overlap keeps the links useful to a reader rather than making a
 * ring of unrelated ones.
 */
export async function getRelatedJournal(
  article: JournalEntry,
  limit = 3,
): Promise<JournalEntry[]> {
  const all = await getPublishedJournal();
  const here = all.findIndex((a) => a.id === article.id);
  const keywords = new Set(article.data.keywords);

  const score = (a: JournalEntry) =>
    (a.data.collection && a.data.collection === article.data.collection ? 100 : 0) +
    a.data.keywords.filter((k) => keywords.has(k)).length;

  /* Ties are broken by distance around a ring rather than by list order, so
     that an article with no sibling in its department and no shared keyword
     is still reached from its neighbours. Scoring alone left two pieces with
     almost nothing pointing at them. */
  const ring = (i: number) => {
    const forward = (i - here + all.length) % all.length;
    return Math.min(forward, all.length - forward);
  };

  return all
    .map((a, i) => ({ a, s: score(a), r: ring(i) }))
    .filter(({ a }) => a.id !== article.id)
    .sort((x, y) => y.s - x.s || x.r - y.r)
    .slice(0, limit)
    .map(({ a }) => a);
}


/** Shapes an object for ListingSchema, omitting offers for specimens. */
export function listingItem(object: ObjectEntry) {
  const d = object.data;
  return {
    name: d.title,
    url: `/objects/${object.id}`,
    ...(d.specimen
      ? {}
      : {
          offer: {
            price: d.priceOnApplication ? undefined : d.price,
            currency: d.currency,
            availability:
              d.availability === 'AVAILABLE'
                ? 'https://schema.org/InStock'
                : d.availability === 'RESERVED'
                  ? 'https://schema.org/PreOrder'
                  : 'https://schema.org/SoldOut',
          },
        }),
  };
}

/* ------------------------------------------------------------------ */
/* Formatting                                                          */
/* ------------------------------------------------------------------ */

const gbp = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  maximumFractionDigits: 0,
});

/** The single place that decides how a price is presented. */
export function formatPrice(data: ObjectEntry['data']): string {
  if (data.availability === 'SOLD') return 'Sold';
  if (data.priceOnApplication || data.price === undefined) return 'Price on application';
  if (data.currency !== 'GBP') {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: data.currency,
      maximumFractionDigits: 0,
    }).format(data.price);
  }
  return gbp.format(data.price);
}

export const AVAILABILITY_LABEL: Record<string, string> = {
  AVAILABLE: 'Available',
  RESERVED: 'Reserved',
  SOLD: 'Sold',
  PRIVATE: 'Privately offered',
};

export function formatDate(d: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(d);
}

export function formatMonthYear(d: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(d);
}

/** A short classification line: "Roman Empire · c. AD 150–200 · Italy". */
export function classificationLine(data: ObjectEntry['data']): string {
  return [data.period, data.date, data.origin].filter(Boolean).join(' · ');
}
