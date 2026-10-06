import type { APIRoute } from 'astro';
import { execFileSync } from 'node:child_process';
import { SITE } from '../consts';
import { getDepartments, getAllObjects, getJournal } from '../lib/catalogue';

/**
 * Last modification date for a source file, taken from git. Falls back to
 * undefined outside a checkout (some CI images build from a tarball), in which
 * case the entry simply carries no lastmod rather than a invented one.
 */
function gitLastModified(file: string): Date | undefined {
  try {
    const iso = execFileSync('git', ['log', '-1', '--format=%cI', '--', file], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return iso ? new Date(iso) : undefined;
  } catch {
    return undefined;
  }
}

const PAGE_SOURCE: Record<string, string> = {
  '/': 'src/pages/index.astro',
  '/objects': 'src/pages/objects/index.astro',
  '/collections': 'src/pages/collections/index.astro',
  '/archive': 'src/pages/archive.astro',
  '/journal': 'src/pages/journal/index.astro',
  '/private-acquisitions': 'src/pages/private-acquisitions.astro',
  '/sell-an-object': 'src/pages/sell-an-object.astro',
  '/consignments': 'src/pages/consignments.astro',
  '/private-access': 'src/pages/private-access.astro',
  '/provenance-authenticity': 'src/pages/provenance-authenticity.astro',
  '/about': 'src/pages/about.astro',
  '/enquire': 'src/pages/enquire.astro',
  '/shipping': 'src/pages/shipping.astro',
  '/terms': 'src/pages/terms.astro',
  '/privacy': 'src/pages/privacy.astro',
};

/**
 * The sitemap is generated from the catalogue rather than from the build
 * output, so that it never advertises a page the page itself marks noindex.
 * Catalogue specimens and unpublished journal entries are therefore excluded
 * automatically, and appear the moment they become real.
 */

type Entry = { path: string; priority: number; changefreq: string; lastmod?: Date };

const STATIC_PAGES: Array<[string, number, string]> = [
  ['/', 1.0, 'weekly'],
  ['/objects', 0.9, 'weekly'],
  ['/collections', 0.8, 'monthly'],
  ['/archive', 0.6, 'monthly'],
  ['/journal', 0.7, 'monthly'],
  ['/private-acquisitions', 0.8, 'monthly'],
  ['/sell-an-object', 0.7, 'monthly'],
  ['/consignments', 0.6, 'monthly'],
  ['/private-access', 0.7, 'monthly'],
  ['/provenance-authenticity', 0.8, 'monthly'],
  ['/about', 0.7, 'monthly'],
  ['/enquire', 0.6, 'monthly'],
  ['/shipping', 0.4, 'yearly'],
  ['/terms', 0.3, 'yearly'],
  ['/privacy', 0.3, 'yearly'],
];

export const GET: APIRoute = async () => {
  const entries: Entry[] = STATIC_PAGES.map(([path, priority, changefreq]) => ({
    path,
    priority,
    changefreq,
    lastmod: PAGE_SOURCE[path] ? gitLastModified(PAGE_SOURCE[path]) : undefined,
  }));

  for (const department of await getDepartments()) {
    entries.push({
      path: `/collections/${department.id}`,
      priority: 0.8,
      changefreq: 'weekly',
      lastmod: gitLastModified(`src/content/collections/${department.id}.md`),
    });
  }

  for (const object of await getAllObjects()) {
    if (object.data.specimen) continue;
    entries.push({
      path: `/objects/${object.id}`,
      priority: object.data.availability === 'SOLD' ? 0.5 : 0.8,
      changefreq: object.data.availability === 'SOLD' ? 'yearly' : 'weekly',
      lastmod: object.data.soldDate ?? gitLastModified(`src/content/objects/${object.id}.md`),
    });
  }

  for (const article of await getJournal()) {
    if (article.data.inPreparation) continue;
    entries.push({
      path: `/journal/${article.id}`,
      priority: 0.7,
      changefreq: 'yearly',
      lastmod:
        article.data.updated ??
        article.data.published ??
        gitLastModified(`src/content/journal/${article.id}.md`),
    });
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (e) =>
      `  <url>\n` +
      `    <loc>${SITE.url}${e.path === '/' ? '' : e.path}</loc>\n` +
      (e.lastmod ? `    <lastmod>${e.lastmod.toISOString().slice(0, 10)}</lastmod>\n` : '') +
      `    <changefreq>${e.changefreq}</changefreq>\n` +
      `    <priority>${e.priority.toFixed(1)}</priority>\n` +
      `  </url>`,
  )
  .join('\n')}
</urlset>
`;

  return new Response(body, {
    headers: { 'content-type': 'application/xml; charset=utf-8' },
  });
};
