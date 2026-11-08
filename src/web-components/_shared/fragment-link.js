/**
 * fragment-link — keep in-page "#id" links on the page under <base href>.
 *
 * A relative `href="#id"` resolves against the document's base URL, so on a
 * page with `<base href="https://cdn.example/">` clicking it navigates to
 * `https://cdn.example/#id` instead of scrolling. Components that generate
 * fragment links keep the relative href (print styles, scroll-spy and author
 * CSS compare `getAttribute('href') === '#id'`) and delegate clicks here.
 *
 * Unmodified primary clicks on `a[href^="#"]` whose target exists in the
 * document are intercepted: `location.hash` is set (resolves against the
 * document URL, updates :target and history), the target is focused for
 * keyboard/AT users, and it is scrolled into view (instant under reduced
 * motion). Enter on a focused link fires click, so keyboard activation is
 * covered too. Anything else (modifier keys, middle click, target=_blank,
 * missing target) is left to the browser.
 *
 * Usage inside a VBElement:
 *   import { fragmentClick } from '../_shared/fragment-link.js';
 *   this.listen(this, 'click', fragmentClick);
 */

const reducedMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Navigate to an in-page element as if its fragment link had been followed.
 * @param {Element} target
 * @param {string} id - the (decoded) id of target
 */
export function goToFragment(target, id) {
  const current = (() => {
    try { return decodeURIComponent(location.hash.slice(1)); } catch { return location.hash.slice(1); }
  })();
  const alreadyThere = current === id;
  // Setting location.hash resolves against the document URL (not <base>),
  // pushes a history entry, updates :target and performs the native scroll.
  if (!alreadyThere) location.hash = id;

  const el = /** @type {HTMLElement} */ (target);
  if (typeof el.focus === 'function') {
    if (el.tabIndex < 0 && !el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });
  }
  // Same hash twice is not a navigation, so no native scroll — do it here.
  if (alreadyThere || !el.matches?.(':target')) {
    el.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
  }
}

/**
 * Delegated click handler. Returns true when it handled the click.
 * @param {Event} event
 * @returns {boolean}
 */
export function fragmentClick(event) {
  const e = /** @type {MouseEvent} */ (event);
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
  const origin = /** @type {Element | null} */ (e.target instanceof Element ? e.target : null);
  const link = /** @type {HTMLAnchorElement | null} */ (origin?.closest('a[href^="#"]'));
  if (!link) return false;
  const tgt = link.getAttribute('target');
  if (tgt && tgt !== '_self') return false;
  if (link.hasAttribute('download')) return false;

  const raw = (link.getAttribute('href') ?? '').slice(1);
  if (!raw) return false;
  let id = raw;
  try { id = decodeURIComponent(raw); } catch { /* keep raw */ }

  const target = link.ownerDocument.getElementById(id);
  if (!target) return false;

  e.preventDefault();
  goToFragment(target, id);
  return true;
}
