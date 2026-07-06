/**
 * [data-icon] enhancer — sets --vb-icon on every [data-icon] element so the
 * CSS rule in custom-elements/icon-attributes.css can mask the SVG. Does NOT
 * fetch or inject SVG; the browser loads the url as a mask resource.
 * Loaded as a side effect of icon-wc.js (which is in both core.js and index.js).
 */
import { buildIconUrl, resolveIconSet, resolveIconBase } from '../../lib/icon-url.js';

/** @param {Element} el */
function enhance(el) {
  const name = el.getAttribute('data-icon');
  if (!name) { /** @type {HTMLElement} */ (el).style.removeProperty('--vb-icon'); return; }
  const url = buildIconUrl({
    basePath: resolveIconBase(document),
    set: resolveIconSet(el, document),
    name,
  });
  /** @type {HTMLElement} */ (el).style.setProperty('--vb-icon', `url("${url}")`);
}

/** @param {ParentNode} [root] */
function enhanceAll(root = document) {
  for (const el of root.querySelectorAll('[data-icon]')) enhance(el);
}

let started = false;
function start() {
  if (started) return;
  started = true;
  enhanceAll();

  // React to added nodes and data-icon / data-icon-set attribute changes.
  const mo = new MutationObserver((records) => {
    for (const rec of records) {
      if (rec.type === 'attributes') {
        const t = /** @type {Element} */ (rec.target);
        if (t.hasAttribute && t.hasAttribute('data-icon')) enhance(t);
        // An ancestor's data-icon-set changed -> re-resolve its descendants.
        if (rec.attributeName === 'data-icon-set') enhanceAll(t);
      } else {
        for (const node of rec.addedNodes) {
          if (node.nodeType !== 1) continue;
          const el = /** @type {Element} */ (node);
          if (el.hasAttribute('data-icon')) enhance(el);
          enhanceAll(el);
        }
      }
    }
  });
  mo.observe(document.documentElement, {
    subtree: true, childList: true,
    attributes: true, attributeFilter: ['data-icon', 'data-icon-set'],
  });
}

// Modules are deferred, so the DOM is parsed by the time this runs.
if (typeof document !== 'undefined') start();
