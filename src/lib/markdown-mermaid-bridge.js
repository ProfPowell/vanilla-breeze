/**
 * markdown-mermaid-bridge — auto-upgrade mermaid fences inside
 * <markdown-viewer> (and by extension <markdown-editor>) into <diagram-wc>.
 *
 * Wiring: src/main.js conditionally imports this module when any
 * markdown-viewer[data-auto-mermaid] exists on the page. Once loaded the
 * bridge listens globally for markdown-viewer:rendered and walks the
 * rendered subtree, debounced so live editor previews don't thrash Mermaid.
 *
 * Manual wiring (no bridge needed) is also documented:
 *   import { enhanceMermaidFences } from 'vanilla-breeze/diagram-wc/enhance.js';
 *   document.addEventListener('markdown-viewer:rendered',
 *     (e) => enhanceMermaidFences(e.detail.node));
 */

import { enhanceMermaidFences } from '../web-components/diagram-wc/enhance.js';

const DEBOUNCE_MS = 250;

/** @type {WeakMap<Element, number>} per-viewer debounce timers */
const timers = new WeakMap();

function shouldEnhance(viewer) {
  if (!viewer || !viewer.hasAttribute) return false;
  if (viewer.hasAttribute('data-auto-mermaid')) return true;
  // Also opt-in if the viewer is inside a <markdown-editor data-auto-mermaid>.
  // The editor builds its own internal viewer and discards author markup, so
  // authors set data-auto-mermaid on the editor instead.
  return !!viewer.closest?.('markdown-editor[data-auto-mermaid]');
}

function scheduleEnhance(viewer, node) {
  const prior = timers.get(viewer);
  if (prior) clearTimeout(prior);
  const t = setTimeout(() => {
    timers.delete(viewer);
    enhanceMermaidFences(node || viewer);
  }, DEBOUNCE_MS);
  timers.set(viewer, t);
}

document.addEventListener('markdown-viewer:rendered', (e) => {
  const viewer = /** @type {Element} */ (e.target);
  if (!shouldEnhance(viewer)) return;
  const node = /** @type {Element|undefined} */ (e.detail?.node) || viewer;
  scheduleEnhance(viewer, node);
});

// On first load, run once over any viewer that already rendered before this
// bridge attached.
const initialSelector = 'markdown-viewer[data-auto-mermaid], markdown-editor[data-auto-mermaid] markdown-viewer';
for (const viewer of document.querySelectorAll(initialSelector)) {
  enhanceMermaidFences(viewer);
}
