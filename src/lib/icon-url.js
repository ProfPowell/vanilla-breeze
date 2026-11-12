/**
 * Icon URL/set resolution shared by icon-wc and the [data-icon] enhancer.
 * Kept DOM-light so it is unit-testable without a browser.
 */

import { getCdnBase } from './theme-loader.js';

/**
 * @param {{basePath:string,set:string,name:string}} p
 * @returns {string}
 */
export function buildIconUrl({ basePath, set, name }) {
  return `${basePath}/${set}/${name}.svg`;
}

/**
 * @param {Element} el
 * @param {Document} [doc]
 * @returns {string} resolved icon set
 */
export function resolveIconSet(el, doc = document) {
  const own = el.getAttribute('data-icon-set');
  if (own) return own;
  const ancSet = el.closest('[data-icon-set]')?.getAttribute('data-icon-set');
  if (ancSet) return ancSet;
  return doc.documentElement.dataset.iconSet || 'lucide';
}

/**
 * Where the icon files live. An explicit `data-icon-path` on <html> wins.
 * Otherwise the icons sit beside the bundle that is running, so a page that
 * loads Vanilla Breeze from a CDN or a subpath asks that location and not its
 * own "/cdn/icons". The derived URL is absolute because the [data-icon]
 * enhancer hands it to CSS, where a relative URL would resolve against the
 * stylesheet.
 *
 * @param {Document} [doc]
 * @returns {string} Icon base URL, no trailing slash.
 */
export function resolveIconBase(doc = document) {
  const own = doc.documentElement.dataset.iconPath;
  if (own) return own;
  const base = `${getCdnBase()}/icons`;
  try {
    return new URL(base, doc.baseURI).href;
  } catch {
    return base;
  }
}
