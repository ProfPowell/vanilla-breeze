/**
 * markdown-mermaid-bridge — auto-upgrade mermaid fences inside
 * <markdown-viewer> (and by extension <markdown-editor>) into <diagram-wc>.
 *
 * Wiring: src/main.js conditionally imports this module when any
 * markdown-viewer[data-auto-mermaid] or markdown-editor[data-auto-mermaid]
 * exists on the page. Once loaded the bridge listens globally for
 * markdown-viewer:rendered and walks the rendered subtree, debounced so
 * live editor previews don't thrash Mermaid.
 *
 * Live-edit cache (vanilla-breeze-7r1m): markdown-viewer destroys all
 * .md-content children on every re-render, so the bridge would otherwise
 * wrap a brand-new <diagram-wc> on every keystroke and lose any prior
 * render. We keep a per-viewer position-indexed cache of last-good SVGs
 * and seed each new diagram-wc with the SVG previously rendered at that
 * position. When a typo is introduced mid-source the prior figure stays
 * visible behind the error pill until the source becomes valid again.
 * The cache is cleared on vb:theme-change so theme switches force a
 * fresh render.
 *
 * Manual wiring (no bridge needed) is also documented:
 *   import { enhanceMermaidFences } from 'vanilla-breeze/diagram-wc/enhance.js';
 *   document.addEventListener('markdown-viewer:rendered',
 *     (e) => enhanceMermaidFences(e.detail.node));
 */

import { enhanceMermaidFences } from '../web-components/diagram-wc/enhance.js';

const DEBOUNCE_MS = 250;
const MAX_CACHE_PER_VIEWER = 16;

/** @type {WeakMap<Element, number>} per-viewer debounce timers */
const timers = new WeakMap();
/** @type {WeakMap<Element, string[]>} viewer → last-good SVGs by position */
const svgCache = new WeakMap();

function shouldEnhance(viewer) {
  if (!viewer || !viewer.hasAttribute) return false;
  if (viewer.hasAttribute('data-auto-mermaid')) return true;
  // Also opt-in if the viewer is inside a <markdown-editor data-auto-mermaid>.
  // The editor builds its own internal viewer and discards author markup, so
  // authors set data-auto-mermaid on the editor instead.
  return !!viewer.closest?.('markdown-editor[data-auto-mermaid]');
}

function getCache(viewer) {
  let arr = svgCache.get(viewer);
  if (!arr) { arr = []; svgCache.set(viewer, arr); }
  return arr;
}

function scheduleEnhance(viewer, node) {
  const prior = timers.get(viewer);
  if (prior) clearTimeout(prior);
  const t = setTimeout(() => {
    timers.delete(viewer);
    runEnhance(viewer, node || viewer);
  }, DEBOUNCE_MS);
  timers.set(viewer, t);
}

function runEnhance(viewer, node) {
  const cache = getCache(viewer);
  const created = enhanceMermaidFences(node, { primingSvgs: cache });

  // Tag each diagram-wc with its position so :ready can update the right
  // cache slot. Using a numeric attribute is enough — positions are
  // stable within a single render pass.
  created.forEach((dw, i) => {
    dw.dataset.bridgeIndex = String(i);
  });

  // Trim the cache to fence count so deleted fences free their slot.
  if (cache.length > created.length) cache.length = created.length;
  if (cache.length > MAX_CACHE_PER_VIEWER) cache.length = MAX_CACHE_PER_VIEWER;
}

document.addEventListener('markdown-viewer:rendered', (e) => {
  const viewer = /** @type {Element} */ (e.target);
  if (!shouldEnhance(viewer)) return;
  const node = /** @type {Element|undefined} */ (e.detail?.node) || viewer;
  scheduleEnhance(viewer, node);
});

// Update the per-viewer cache whenever a diagram-wc renders successfully.
// Bubbles up through the viewer thanks to standard DOM event propagation.
document.addEventListener('diagram-wc:ready', (e) => {
  const dw = /** @type {Element} */ (e.target);
  const viewer = dw.closest?.('markdown-viewer');
  if (!viewer) return;
  const idx = parseInt(dw.dataset.bridgeIndex || '', 10);
  if (Number.isNaN(idx)) return;
  const cache = getCache(viewer);
  cache[idx] = e.detail?.svg || cache[idx];
});

// Theme change → tokens change → cached SVGs are stale. Clear all caches
// so the next render produces fresh output.
window.addEventListener('vb:theme-change', () => {
  // WeakMap doesn't expose iteration; we rely on per-viewer renders to
  // overwrite cached entries. To force-discard stale entries between
  // theme changes, prune any viewer reachable via the live DOM.
  for (const viewer of document.querySelectorAll('markdown-viewer')) {
    const cache = svgCache.get(viewer);
    if (cache) cache.length = 0;
  }
});

// On first load, run once over any viewer that already rendered before this
// bridge attached.
const initialSelector = 'markdown-viewer[data-auto-mermaid], markdown-editor[data-auto-mermaid] markdown-viewer';
for (const viewer of document.querySelectorAll(initialSelector)) {
  runEnhance(viewer, viewer);
}
