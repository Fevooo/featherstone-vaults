// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://featherstonevaults.com',
  output: 'static',
  devToolbar: { enabled: false },
  trailingSlash: 'never',
  build: {
    format: 'file',
    // The stylesheet is larger than is worth inlining on every one of the
    // catalogue's pages; served externally it is cached once and reused.
    inlineStylesheets: 'auto',
  },
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
