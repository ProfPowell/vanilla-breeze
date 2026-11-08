/**
 * announce: one shared screen-reader live region per politeness per document.
 *
 * Utilities and components that need to tell assistive tech "Copied",
 * "Spoiler revealed" or "3 items selected" call announce() instead of
 * building their own live region. The region:
 *
 * - is created once per politeness ("polite" / "assertive") per document
 *   and reused, so it already exists in the accessibility tree before any
 *   message is written (regions created with their text set are often not
 *   announced);
 * - is appended to `root` (default document.body), never inside a button
 *   or link, so it does not change the accessible name of a control;
 * - is visually hidden with inline styles, so it works before or without
 *   VB's CSS;
 * - is cleared and then written on a later task, so repeating the same
 *   message ("Copied", "Copied") is announced each time.
 *
 * @example
 * import { announce } from '../lib/announce.js';
 * announce('Copied to clipboard');
 * announce('Upload failed', { politeness: 'assertive' });
 *
 * @example Localised strings: the nearest data-label-<name> wins
 * import { announce, readLabel } from '../lib/announce.js';
 * announce(readLabel(button, 'copied', 'Copied to clipboard'));
 */

/** Delay between clearing and writing (long enough for AT to see a change). */
const WRITE_DELAY = 50;
/** Clear the text afterwards so a virtual-cursor pass does not find stale messages. */
const CLEAR_AFTER = 7000;

const HIDDEN_STYLE = [
  'position:absolute', 'inline-size:1px', 'block-size:1px', 'padding:0',
  'margin:-1px', 'overflow:hidden', 'clip-path:inset(50%)', 'white-space:nowrap', 'border:0',
].join(';');

/** @type {WeakMap<Node, Map<string, { region: HTMLElement, write?: ReturnType<typeof setTimeout>, clear?: ReturnType<typeof setTimeout> }>>} */
const regions = new WeakMap();

/**
 * Find or create the live region for `politeness` inside `root`.
 * @param {'polite' | 'assertive'} politeness
 * @param {Element} root
 */
function regionFor(politeness, root) {
  let byPoliteness = regions.get(root);
  if (!byPoliteness) regions.set(root, byPoliteness = new Map());
  let entry = byPoliteness.get(politeness);
  if (!entry || !entry.region.isConnected) {
    const doc = root.ownerDocument || document;
    const region = doc.createElement('span');
    region.setAttribute('data-vb-announcer', politeness);
    region.setAttribute('role', politeness === 'assertive' ? 'alert' : 'status');
    region.setAttribute('aria-live', politeness);
    region.setAttribute('aria-atomic', 'true');
    region.style.cssText = HIDDEN_STYLE;
    root.appendChild(region);
    entry = { region };
    byPoliteness.set(politeness, entry);
  }
  return entry;
}

/**
 * Announce `message` to screen readers through the shared live region.
 *
 * @param {string} message - Text to announce. Empty strings are ignored.
 * @param {{ politeness?: 'polite' | 'assertive', root?: Element }} [options]
 * @returns {HTMLElement | null} The live region (useful in tests), or null when nothing was announced.
 */
export function announce(message, { politeness = 'polite', root } = {}) {
  const text = String(message ?? '').trim();
  if (!text || typeof document === 'undefined') return null;
  const host = root || document.body;
  if (!host) return null;
  const mode = politeness === 'assertive' ? 'assertive' : 'polite';
  const entry = regionFor(mode, host);
  clearTimeout(entry.write);
  clearTimeout(entry.clear);
  entry.region.textContent = '';
  entry.write = setTimeout(() => {
    entry.region.textContent = text;
    entry.clear = setTimeout(() => { entry.region.textContent = ''; }, CLEAR_AFTER);
  }, WRITE_DELAY);
  return entry.region;
}

/**
 * Read a localisable string: `data-label-<name>` on the element or its
 * nearest ancestor that sets it, else `fallback`. `{token}` placeholders are
 * filled from `values`.
 *
 * @param {Element | null | undefined} el
 * @param {string} name - Label key, e.g. "copied" reads data-label-copied
 * @param {string} fallback - English default
 * @param {Record<string, string | number>} [values]
 * @returns {string}
 */
export function readLabel(el, name, fallback, values) {
  const attr = `data-label-${name}`;
  const owner = el?.closest?.(`[${attr}]`);
  const template = owner?.getAttribute(attr) || fallback;
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (m, k) => (k in values ? String(values[k]) : m));
}
