import type { APIRoute } from 'astro'
import { SITE } from '../consts'
import { getDepartments, getAllObjects, getJournal } from '../lib/catalogue'

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
  ['/sell-an-object', 0.7, 'monthly'],
  ['/consignments', 0.6, 'monthly'],
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
  }))

  for (const department of await getDepartments()) {
    entries.push({
      path: `/collections/${department.id}`,
      priority: 0.8,
      changefreq: 'weekly',
    })
  }

  for (const object of await getAllObjects()) {
    if (object.data.specimen) continue
    entries.push({
      path: `/objects/${object.id}`,
      priority: object.data.availability === 'SOLD' ? 0.5 : 0.8,
      changefreq: object.data.availability === 'SOLD' ? 'yearly' : 'weekly',
      lastmod: object.data.soldDate,
    })
  }

  for (const article of await getJournal()) {
    if (article.data.inPreparation) continue
    entries.push({
      path: `/journal/${article.id}`,
      priority: 0.7,
      changefreq: 'monthly',
      lastmod: article.data.updated ?? article.data.published,
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
