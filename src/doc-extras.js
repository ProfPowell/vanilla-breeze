/**
 * Docs-only external components bundle.
 *
 * Keep third-party-style demo components out of the main VB bundles while
 * still generating a stable CDN asset for the docs site.
 *
 * Also starts the component autoloader. Docs layouts load core + extras +
 * packs/ui rather than the autoload bundle (they need core's analytics and
 * sticky manager), and those three bundles leave out ~34 components that
 * only ship as per-component chunks (page-info, time-index, star-rating,
 * pager-wc, …). Without this they never upgrade on the built site
 * (vanilla-breeze-ze67). The autoloader resolves chunks from
 * /cdn/components/manifest.json and skips any tag already defined.
 */

import '@profpowell/browser-window';
import '@profpowell/code-block';
import { initAutoloader } from './lib/autoloader.js';

// Wait until the bundles earlier in the page have defined their components,
// so the autoloader only fetches chunks for tags nothing else provides.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initAutoloader(), { once: true });
} else {
  initAutoloader();
}
