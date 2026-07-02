/**
 * Icon URL/set resolution shared by icon-wc and the [data-icon] enhancer.
 * Kept DOM-light so it is unit-testable without a browser.
 */

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
  const anc = el.closest('[data-icon-set]');
  if (anc) return anc.getAttribute('data-icon-set');
  return doc.documentElement.dataset.iconSet || 'lucide';
}

/** @param {Document} [doc] */
export function resolveIconBase(doc = document) {
  return doc.documentElement.dataset.iconPath || '/cdn/icons';
}
