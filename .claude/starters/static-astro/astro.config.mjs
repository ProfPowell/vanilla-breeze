import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: '{{SITE_URL}}',
  integrations: [sitemap()],
  output: '{{OUTPUT_MODE}}',
  {{#IF_ADAPTER_CLOUDFLARE}}
  adapter: import('@astrojs/cloudflare').then(m => m.default()),
  {{/IF_ADAPTER_CLOUDFLARE}}
  {{#IF_ADAPTER_NODE}}
  adapter: import('@astrojs/node').then(m => m.default({ mode: 'standalone' })),
  {{/IF_ADAPTER_NODE}}
  {{#IF_ADAPTER_NETLIFY}}
  adapter: import('@astrojs/netlify').then(m => m.default()),
  {{/IF_ADAPTER_NETLIFY}}
  {{#IF_ADAPTER_VERCEL}}
  adapter: import('@astrojs/vercel').then(m => m.default()),
  {{/IF_ADAPTER_VERCEL}}
});
