import type { APIRoute } from 'astro'
import { execFileSync } from 'node:child_process'
import { SITE } from '../consts'
import { getDepartments, getAllObjects, getJournal } from '../lib/catalogue'

/**
 * Last modified date for a source file, read from git. Returns undefined
 * outside a checkout, in which case the entry carries no lastmod rather than
 * an invented one.
 */
function gitLastModified(file: string): Date | undefined {
  try {
    const iso = execFileSync('git', ['log', '-1', '--format=%cI', '--', file], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
    return iso ? new Date(iso) : undefined
  } catch {
    return undefined
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
}

type Entry = {
  path: string
  priority: number
  changefreq: string
  lastmod?: Date
}

const STATIC_PAGES: Array<[string, number, string]> = [
  ['/', 1.0, 'weekly'],
  ['/objects', 0.9, 'weekly'],
  ['/collections', 0.8, 'monthly'],
  ['/archive', 0.6, 'monthly'],
  ['/journal', 0.8, 'weekly'],
  ['/private-acquisitions', 0.8, 'monthly'],
  ['/consignments', 0.9, 'weekly'],
  ['/sell-an-object', 0.8, 'monthly'],
  ['/private-access', 0.7, 'monthly'],
  ['/provenance-authenticity', 0.8, 'monthly'],
  ['/about', 0.7, 'monthly'],
  ['/enquire', 0.6, 'monthly'],
  ['/shipping', 0.4, 'yearly'],
  ['/terms', 0.3, 'yearly'],
  ['/privacy', 0.3, 'yearly'],
]

export const GET: APIRoute = async () => {
  const entries: Entry[] = STATIC_PAGES.map(([path, priority, changefreq]) => ({
    path,
    priority,
    changefreq,
    lastmod: PAGE_SOURCE[path] ? gitLastModified(PAGE_SOURCE[path]) : undefined,
  }))

  for (const department of await getDepartments()) {
    entries.push({
      path: `/collections/${department.id}`,
      priority: 0.8,
      changefreq: 'weekly',
      lastmod: gitLastModified(`src/content/collections/${department.id}.md`),
    })
  }

  for (const object of await getAllObjects()) {
    if (object.data.specimen) continue
    entries.push({
      path: `/objects/${object.id}`,
      priority: object.data.availability === 'SOLD' ? 0.5 : 0.8,
      changefreq: object.data.availability === 'SOLD' ? 'yearly' : 'weekly',
      lastmod: object.data.soldDate ?? gitLastModified(`src/content/objects/${object.id}.md`),
    })
  }

  for (const article of await getJournal()) {
    if (article.data.inPreparation) continue
    entries.push({
      path: `/journal/${article.id}`,
      priority: 0.7,
      changefreq: 'monthly',
      lastmod:
        article.data.updated ??
        article.data.published ??
        gitLastModified(`src/content/journal/${article.id}.md`),
    })
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (entry) =>
      `  <url>\n` +
      `    <loc>${SITE.url}${entry.path === '/' ? '' : entry.path}</loc>\n` +
      (entry.lastmod ? `    <lastmod>${entry.lastmod.toISOString().slice(0, 10)}</lastmod>\n` : '') +
      `    <changefreq>${entry.changefreq}</changefreq>\n` +
      `    <priority>${entry.priority.toFixed(1)}</priority>\n` +
      `  </url>`,
  )
  .join('\n')}
</urlset>
`

  return new Response(body, {
    headers: { 'content-type': 'application/xml' },
  })
}
