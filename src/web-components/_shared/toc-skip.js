/**
 * toc-skip — which headings stay out of generated tables of contents.
 *
 * Shared by <page-toc> (which headings get a ToC entry) and <heading-links>
 * (which headings get an id and an anchor link) so the two never disagree.
 *
 * - SKIP_CONTEXT: a heading inside any of these is skipped by both —
 *   [data-toc-ignore] (on the heading or an ancestor), a <dialog>, and a
 *   <browser-window> demo frame (its light-DOM headings belong to the demo,
 *   not to the page).
 * - isRenderedHeading(): <page-toc> additionally skips headings that are not
 *   rendered (display:none — [hidden], a data-visible variant hidden at this
 *   width…), so scroll-spy never targets an invisible heading. Headings in a
 *   closed <details> or a hidden="until-found" region are kept: following
 *   the ToC link opens them.
 */

export const SKIP_CONTEXT = 'dialog, [data-toc-ignore], browser-window';

/**
 * @param {Element} heading
 * @returns {boolean}
 */
export function isSkippedHeading(heading) {
  return !!heading.closest(SKIP_CONTEXT);
}

/**
 * @param {Element} heading
 * @returns {boolean}
 */
export function isRenderedHeading(heading) {
  if (typeof heading.checkVisibility !== 'function') return true;
  if (heading.checkVisibility()) return true;
  // Collapsed but reachable by fragment navigation.
  const details = heading.closest('details:not([open])');
  if (details?.checkVisibility()) return true;
  const untilFound = heading.closest('[hidden="until-found"]');
  return !!untilFound?.parentElement && (untilFound.parentElement.checkVisibility?.() ?? true);
}
