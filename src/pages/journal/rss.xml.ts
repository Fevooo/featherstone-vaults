import type { APIRoute } from 'astro';
import { SITE } from '../../consts';
import { getPublishedJournal } from '../../lib/catalogue';

/**
 * RSS for the Journal. Only published articles appear; anything still in
 * preparation is left out, exactly as it is left out of the sitemap.
 */

const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c] as string,
  );

export const GET: APIRoute = async () => {
  const articles = await getPublishedJournal();
  const sorted = articles
    .slice()
    .sort((a, b) => (b.data.published?.getTime() ?? 0) - (a.data.published?.getTime() ?? 0));

  const latest = sorted[0]?.data.updated ?? sorted[0]?.data.published;

  const items = sorted
    .map((article) => {
      const url = `${SITE.url}/journal/${article.id}`;
      return [
        '    <item>',
        `      <title>${escape(article.data.title)}</title>`,
        `      <link>${url}</link>`,
        `      <guid isPermaLink="true">${url}</guid>`,
        `      <description>${escape(article.data.standfirst)}</description>`,
        `      <category>${escape(article.data.subject)}</category>`,
        article.data.published
          ? `      <pubDate>${article.data.published.toUTCString()}</pubDate>`
          : '',
        '    </item>',
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n');

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>The Featherstone Vaults Journal</title>
    <link>${SITE.url}/journal</link>
    <atom:link href="${SITE.url}/journal/rss.xml" rel="self" type="application/rss+xml" />
    <description>Writing on collecting, provenance and documentation from Featherstone Vaults, a private dealer and collection house in the Cotswolds.</description>
    <language>en-GB</language>
    <copyright>Featherstone Vaults</copyright>
${latest ? `    <lastBuildDate>${latest.toUTCString()}</lastBuildDate>\n` : ''}${items}
  </channel>
</rss>
`;

  return new Response(body, {
    headers: { 'content-type': 'application/rss+xml; charset=utf-8' },
  });
};
