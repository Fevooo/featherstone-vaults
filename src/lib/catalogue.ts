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
