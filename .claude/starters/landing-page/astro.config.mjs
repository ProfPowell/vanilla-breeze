import { defineConfig } from 'astro/config';

export default defineConfig({
  site: '{{SITE_URL}}',
  compressHTML: true,
  build: {
    inlineStylesheets: 'auto',
  },
});
