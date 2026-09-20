import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

const ORIGIN = 'https://featherstonevaults.com';
const HOST = 'featherstonevaults.com';
const KEY = '8a166efa4e6e33f2018da93bd27c1973';
const KEY_LOCATION = `${ORIGIN}/${KEY}.txt`;
const ENDPOINT = 'https://api.indexnow.org/indexnow';

const isProductionNetlify =
  process.env.NETLIFY === 'true' && process.env.CONTEXT === 'production';
const isForced = process.env.INDEXNOW_FORCE === '1';

function extractSitemapUrls(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
}

function toUrl(path) {
  if (path === '/') return `${ORIGIN}/`;
  return `${ORIGIN}${path.startsWith('/') ? path : `/${path}`}`;
}

function slugFrom(path, prefix) {
  if (!path.startsWith(prefix) || !path.endsWith('.md')) return null;
  return path.slice(prefix.length, -3);
}

function staticRouteFromPage(path) {
  if (!path.startsWith('src/pages/') || !path.endsWith('.astro')) return null;
  const relative = path.slice('src/pages/'.length, -'.astro'.length);
  if (relative === '404' || relative.includes('[')) return null;
  if (relative === 'index') return '/';
  if (relative.endsWith('/index')) return `/${relative.slice(0, -'/index'.length)}`;
  return `/${relative}`;
}

function readChangedFiles() {
  const head = process.env.COMMIT_REF || 'HEAD';
  const base = process.env.CACHED_COMMIT_REF || `${head}^`;

  const output = execFileSync(
    'git',
    ['diff', '--name-status', '--find-renames', base, head],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  ).trim();

  if (!output) return [];

  return output.split('\n').flatMap((line) => {
    const parts = line.split('\t');
    const status = parts[0];

    if (status.startsWith('R') && parts.length >= 3) {
      return [
        { status: 'D', path: parts[1] },
        { status: 'A', path: parts[2] },
      ];
    }

    return [{ status, path: parts.at(-1) }];
  });
}

function selectChangedUrls(changes, sitemapUrls) {
  const sitemapSet = new Set(sitemapUrls);
  const selected = new Set();
  let submitAll = false;

  const add = (path, allowMissing = false) => {
    const url = toUrl(path);
    if (allowMissing || sitemapSet.has(url)) selected.add(url);
  };

  const broadPrefixes = [
    'src/components/',
    'src/layouts/',
    'src/lib/',
    'src/styles/',
  ];
  const broadFiles = new Set([
    'src/consts.ts',
    'src/content.config.ts',
    'astro.config.mjs',
  ]);

  for (const change of changes) {
    const { status, path } = change;
    if (!path) continue;

    if (broadPrefixes.some((prefix) => path.startsWith(prefix)) || broadFiles.has(path)) {
      submitAll = true;
      break;
    }

    const objectSlug = slugFrom(path, 'src/content/objects/');
    if (objectSlug) {
      add(`/objects/${objectSlug}`, status.startsWith('D'));
      add('/objects');
      add('/archive');
      add('/');
      continue;
    }

    const collectionSlug = slugFrom(path, 'src/content/collections/');
    if (collectionSlug) {
      add(`/collections/${collectionSlug}`, status.startsWith('D'));
      add('/collections');
      add('/');
      continue;
    }

    const journalSlug = slugFrom(path, 'src/content/journal/');
    if (journalSlug) {
      add(`/journal/${journalSlug}`, status.startsWith('D'));
      add('/journal');
      add('/');
      continue;
    }

    if (path === 'src/pages/objects/[slug].astro') {
      sitemapUrls
        .filter((url) => url.startsWith(`${ORIGIN}/objects/`))
        .forEach((url) => selected.add(url));
      add('/objects');
      add('/archive');
      continue;
    }

    if (path === 'src/pages/collections/[slug].astro') {
      sitemapUrls
        .filter((url) => url.startsWith(`${ORIGIN}/collections/`))
        .forEach((url) => selected.add(url));
      add('/collections');
      continue;
    }

    if (path === 'src/pages/journal/[slug].astro') {
      sitemapUrls
        .filter((url) => url.startsWith(`${ORIGIN}/journal/`))
        .forEach((url) => selected.add(url));
      add('/journal');
      continue;
    }

    const staticRoute = staticRouteFromPage(path);
    if (staticRoute) {
      add(staticRoute, status.startsWith('D'));
    }
  }

  return submitAll ? sitemapUrls : [...selected];
}

async function submitIndexNow(urlList) {
  if (urlList.length === 0) {
    console.log('IndexNow: no indexable URLs changed; nothing to submit.');
    return;
  }

  for (let i = 0; i < urlList.length; i += 10000) {
    const chunk = urlList.slice(i, i + 10000);
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: HOST,
        key: KEY,
        keyLocation: KEY_LOCATION,
        urlList: chunk,
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`IndexNow returned ${response.status}${detail ? `: ${detail}` : ''}`);
    }
  }

  console.log(
    `IndexNow: submitted ${urlList.length} changed URL${urlList.length === 1 ? '' : 's'}.`,
  );
}

async function main() {
  if (!isProductionNetlify && !isForced) {
    console.log('IndexNow: skipped outside a production Netlify deploy.');
    return;
  }

  const sitemapXml = await readFile(new URL('../dist/sitemap.xml', import.meta.url), 'utf8');
  const sitemapUrls = extractSitemapUrls(sitemapXml);

  let urlsToSubmit;
  try {
    const changes = readChangedFiles();
    urlsToSubmit = changes.length > 0 ? selectChangedUrls(changes, sitemapUrls) : sitemapUrls;
  } catch (error) {
    console.warn(
      `IndexNow: could not calculate changed files (${error.message}); submitting sitemap URLs.`,
    );
    urlsToSubmit = sitemapUrls;
  }

  await submitIndexNow([...new Set(urlsToSubmit)]);
}

main().catch((error) => {
  // Search-engine notification must never block a successful site deployment.
  console.warn(`IndexNow: submission failed: ${error.message}`);
});
