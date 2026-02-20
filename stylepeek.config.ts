import { defineConfig } from '@stylepeek/core';

export default defineConfig({
  // Target URL(s)
  url: 'https://example.com',

  // Crawling
  maxPages: 20,
  maxDepth: 3,
  workers: 3,
  waitAfterLoad: 1000,

  // Output
  outputDir: './stylepeek-output',
  outputFormats: ['html', 'tailwind', 'css-vars', 'json'],
  downloadAssets: true,

  // URL filtering
  exclude: [],
  include: [],
});
